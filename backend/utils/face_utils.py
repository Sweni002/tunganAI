import base64
import json
import os
import threading
import time
import uuid

import cv2
import eventlet
import numpy as np
from insightface.app import FaceAnalysis
from sqlalchemy.exc import SQLAlchemyError

from models import db
from models.personnels import Personnels

# -------------------------------
# ArcFace initialization
# -------------------------------
app_arcface = FaceAnalysis(allowed_modules=['detection', 'recognition'])
app_arcface.prepare(ctx_id=0, det_size=(640, 640))

# -------------------------------
# Cache vectorisé thread-safe
# -------------------------------
_lock = threading.RLock()

_MATRIX = np.empty((0, 512), dtype=np.float32)
_IDS = np.empty(0, dtype=np.int64)
_ROW_OF = {}
PERSONNELS_META = {}

# Cache des lignes autorisées par service : idserv -> (version, timestamp, rows)
_SERVICE_ROWS = {}
_SERVICE_TTL = 60.0
_VERSION = 0

# -------------------------------
# Synchronisation multi-instances (Redis Pub/Sub)
# -------------------------------
FACE_SYNC_CHANNEL = "face:emb:sync:v1"
_INSTANCE_ID = uuid.uuid4().hex
_SYNC_REDIS = None


# -------------------------------
# Utilitaires
# -------------------------------
def _to_array(emb):
    if isinstance(emb, bytes):
        return np.frombuffer(emb, dtype=np.float32)
    return np.asarray(emb, dtype=np.float32)


def _normalize_embedding(emb):
    emb = _to_array(emb)
    norm = np.linalg.norm(emb)
    return emb / (norm + 1e-10)


def image_quality_check(img):
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    if np.mean(gray) < 60:
        print("[face_utils] Image trop sombre.")
        return False

    if cv2.Laplacian(gray, cv2.CV_64F).var() < 100:
        print("[face_utils] Image trop floue.")
        return False

    return True


# ============================================================
# Pub/Sub : diffusion des changements aux autres instances
# ============================================================
def _publish(op, idpers=None, vec=None, meta=None):
    if _SYNC_REDIS is None:
        return
    payload = {"src": _INSTANCE_ID, "op": op}
    if idpers is not None:
        payload["idpers"] = int(idpers)
    if vec is not None:
        payload["emb"] = base64.b64encode(
            np.asarray(vec, dtype=np.float32).tobytes()
        ).decode()
    if meta:
        payload["meta"] = meta
    try:
        _SYNC_REDIS.publish(FACE_SYNC_CHANNEL, json.dumps(payload))
    except Exception as e:
        print(f"[face_utils] Publication sync impossible : {e}")


def _handle_sync_message(app, raw):
    try:
        msg = json.loads(raw)
    except Exception:
        return

    if msg.get("src") == _INSTANCE_ID:
        return  # notre propre message

    op = msg.get("op")
    idpers = msg.get("idpers")
    vec = (
        np.frombuffer(base64.b64decode(msg["emb"]), dtype=np.float32).copy()
        if "emb" in msg else None
    )

    if op == "update" and idpers is not None and vec is not None:
        with _lock:
            row = _ROW_OF.get(int(idpers))
            if row is not None:
                _MATRIX[row] = vec

    elif op == "upsert" and idpers is not None and vec is not None:
        upsert_embedding(idpers, vec, meta=msg.get("meta"), _broadcast=False)

    elif op == "remove" and idpers is not None:
        remove_embedding(idpers, _broadcast=False)

    elif op == "reload":
        with app.app_context():
            load_embeddings()
            db.session.remove()


def init_face_sync(app):
    """
    Démarre l'écoute Redis Pub/Sub (greenlet eventlet) : chaque instance
    applique les mises à jour d'embeddings faites par les autres.
    """
    global _SYNC_REDIS

    if os.getenv("FACE_SYNC_ENABLED", "1") in ("0", "false", "False"):
        print("[face_utils] Synchronisation multi-instances désactivée")
        return

    redis_client = app.extensions.get("redis")
    if redis_client is None:
        return

    _SYNC_REDIS = redis_client

    def _listen():
        while True:
            try:
                pubsub = redis_client.pubsub(ignore_subscribe_messages=True)
                pubsub.subscribe(FACE_SYNC_CHANNEL)
                print(f"[face_utils] Sync embeddings active (instance {_INSTANCE_ID[:8]})")
                for message in pubsub.listen():
                    if message and message.get("type") == "message":
                        _handle_sync_message(app, message["data"])
            except Exception as e:
                print(f"[face_utils] Sync interrompue, reconnexion : {e}")
                eventlet.sleep(2)

    eventlet.spawn_n(_listen)


# -------------------------------
# Chargement des embeddings
# -------------------------------
def load_embeddings():
    global _MATRIX, _IDS, _ROW_OF, PERSONNELS_META, _VERSION

    ids, embs, meta = [], [], {}

    try:
        for pers in Personnels.query.all():
            emb = pers.get_embedding()
            if emb is None:
                continue
            ids.append(int(pers.idpers))
            embs.append(_normalize_embedding(emb))
            meta[int(pers.idpers)] = f"{pers.nom} {pers.prenom}"
    except SQLAlchemyError as e:
        print(f"[face_utils] Erreur chargement embeddings: {e}")
        return

    if embs:
        matrix = np.ascontiguousarray(np.vstack(embs), dtype=np.float32)
    else:
        matrix = np.empty((0, 512), dtype=np.float32)

    with _lock:
        _MATRIX = matrix
        _IDS = np.asarray(ids, dtype=np.int64)
        _ROW_OF = {pid: row for row, pid in enumerate(ids)}
        PERSONNELS_META = meta
        _VERSION += 1
        _SERVICE_ROWS.clear()

    print(f"[face_utils] {len(ids)} embeddings chargés (matrice {matrix.shape}).")


def reload_all_instances():
    """Recharge localement puis demande aux autres instances de recharger."""
    load_embeddings()
    _publish("reload")


def preload_embeddings_threadsafe():
    try:
        load_embeddings()
    except Exception as e:
        print(f"[face_utils] Impossible de précharger: {e}")


def invalidate_service_cache(idserv=None):
    with _lock:
        if idserv is None:
            _SERVICE_ROWS.clear()
        else:
            _SERVICE_ROWS.pop(idserv, None)


# -------------------------------
# Résolution des lignes autorisées
# -------------------------------
def _rows_for_ids(allowed_idpers):
    rows = [_ROW_OF[int(i)] for i in allowed_idpers if int(i) in _ROW_OF]
    return np.asarray(rows, dtype=np.int64)


def get_service_rows(idserv, id_provider):
    now = time.time()
    with _lock:
        cached = _SERVICE_ROWS.get(idserv)
        if cached is not None:
            version, ts, rows = cached
            if version == _VERSION and (now - ts) < _SERVICE_TTL:
                return rows

    ids = id_provider() or []

    with _lock:
        rows = _rows_for_ids(ids)
        _SERVICE_ROWS[idserv] = (_VERSION, now, rows)
        return rows


# -------------------------------
# Scores
# -------------------------------
def cosine(a, b):
    return float(np.dot(a, b))


def euclidean_distance(a, b):
    return float(np.linalg.norm(a - b))


def _combined_from_cosine(c):
    c = np.clip(c, -1.0, 1.0)
    d = np.sqrt(np.maximum(0.0, 2.0 - 2.0 * c))
    return 0.8 * c + 0.2 * (1.0 - d / 2.0)


def combined_score(a, b):
    return float(_combined_from_cosine(np.dot(a, b)))


# -------------------------------
# Extraction embedding
# -------------------------------
def _detect_single_face(img_bgr, max_side=1280):
    h, w = img_bgr.shape[:2]
    if max(h, w) > max_side:
        scale = max_side / max(h, w)
        img_bgr = cv2.resize(
            img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA
        )

    img = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    faces = app_arcface.get(img)

    if not faces:
        raise ValueError("Aucun visage détecté.")
    if len(faces) > 1:
        raise ValueError(f"{len(faces)} visages détectés. Image non valide.")

    return _normalize_embedding(faces[0].embedding)


def get_embeddings(image_path):
    img = cv2.imread(image_path)
    if img is None:
        print(f"[face_utils] Erreur: impossible de lire l'image {image_path}")
        return []

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    faces = app_arcface.get(img)

    if not faces:
        return []
    if len(faces) > 1:
        print(f"[face_utils] Warning: {len(faces)} visages détectés.")

    return [_normalize_embedding(f.embedding) for f in faces]


# -------------------------------
# Vérification du visage
# -------------------------------
def verifier_face(image_path=None,
                  image=None,
                  emb=None,
                  threshold=0.48,
                  min_gap=0.10,
                  top2_check=True,
                  allowed_idpers=None,
                  allowed_rows=None,
                  solo_threshold=None):
    NO_MATCH = (None, None, None, None, None)

    if emb is None:
        if image is None:
            if image_path is None:
                raise ValueError("image_path, image ou emb requis.")
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError("Impossible de lire l'image.")
        emb = _detect_single_face(image)
    else:
        emb = _normalize_embedding(emb)

    with _lock:
        matrix = _MATRIX
        ids = _IDS
        if allowed_rows is None and allowed_idpers is not None:
            allowed_rows = _rows_for_ids(allowed_idpers)

    if allowed_rows is not None:
        if allowed_rows.size and allowed_rows.max() >= matrix.shape[0]:
            allowed_rows = allowed_rows[allowed_rows < matrix.shape[0]]
        if allowed_rows.size == 0:
            return NO_MATCH
        sub_matrix = matrix[allowed_rows]
        sub_ids = ids[allowed_rows]
    else:
        sub_matrix = matrix
        sub_ids = ids

    n = sub_matrix.shape[0]
    if n == 0:
        return NO_MATCH

    cos = sub_matrix @ emb

    if n == 1:
        best_score = float(_combined_from_cosine(cos[0]))
        second_score = -1.0

        seuil = solo_threshold if solo_threshold is not None else threshold + 0.05
        if best_score < seuil:
            return NO_MATCH
        return "personnel", int(sub_ids[0]), emb, best_score, second_score

    idx = np.argpartition(cos, -2)[-2:]
    idx = idx[np.argsort(cos[idx])[::-1]]
    best_idx, second_idx = int(idx[0]), int(idx[1])

    best_score = float(_combined_from_cosine(cos[best_idx]))
    second_score = float(_combined_from_cosine(cos[second_idx]))

    if best_score < threshold:
        return NO_MATCH

    if top2_check and (best_score - second_score) < min_gap:
        return NO_MATCH

    return "personnel", int(sub_ids[best_idx]), emb, best_score, second_score


def find_best_match(emb, allowed_rows=None):
    with _lock:
        matrix, ids = _MATRIX, _IDS

    if allowed_rows is not None:
        if allowed_rows.size == 0:
            return None, -1.0, -1.0
        matrix, ids = matrix[allowed_rows], ids[allowed_rows]

    if matrix.shape[0] == 0:
        return None, -1.0, -1.0

    scores = matrix @ _normalize_embedding(emb)
    best_idx = int(np.argmax(scores))
    best = float(scores[best_idx])
    second = float(np.sort(scores)[-2]) if scores.size > 1 else -1.0

    return int(ids[best_idx]), best, second


# -------------------------------
# Apprentissage incrémental (+ diffusion aux autres instances)
# -------------------------------
def update_personnel_embedding(idpers, new_embedding, score,
                               second_score,
                               alpha=0.15,
                               min_score_update=0.65,
                               min_gap=0.15):
    if score is None or new_embedding is None:
        return

    if score < min_score_update:
        print("[face_utils] Score trop faible → pas d'apprentissage")
        return

    if second_score is not None and (score - second_score) < min_gap:
        print("[face_utils] Ecart trop faible → risque confusion")
        return

    idpers = int(idpers)

    try:
        new_emb = _normalize_embedding(new_embedding)

        with _lock:
            row = _ROW_OF.get(idpers)
            if row is None:
                print(f"[face_utils] ID {idpers} absent du cache")
                return

            updated = (1 - alpha) * _MATRIX[row] + alpha * new_emb
            updated = _normalize_embedding(updated)
            _MATRIX[row] = updated

        personnel = Personnels.query.get(idpers)
        if personnel:
            personnel.set_embedding(updated)
            db.session.commit()

        _publish("update", idpers=idpers, vec=updated)
        print(f"[face_utils] Apprentissage OK pour ID {idpers}")

    except Exception as e:
        db.session.rollback()
        print(f"[face_utils] Erreur apprentissage: {e}")


# ============================================================
# Ajout / suppression unitaire (+ diffusion)
# ============================================================
def upsert_embedding(idpers, emb, meta=None, _broadcast=True):
    global _MATRIX, _IDS, _VERSION

    idpers = int(idpers)
    vec = _normalize_embedding(emb)

    with _lock:
        row = _ROW_OF.get(idpers)
        if row is not None:
            _MATRIX[row] = vec
        else:
            if _MATRIX.shape[0] == 0:
                _MATRIX = np.ascontiguousarray(vec.reshape(1, -1), dtype=np.float32)
            else:
                _MATRIX = np.ascontiguousarray(
                    np.vstack([_MATRIX, vec]), dtype=np.float32
                )
            _IDS = np.append(_IDS, np.int64(idpers))
            _ROW_OF[idpers] = _MATRIX.shape[0] - 1
            _VERSION += 1
            _SERVICE_ROWS.clear()

        if meta:
            PERSONNELS_META[idpers] = meta

    if _broadcast:
        _publish("upsert", idpers=idpers, vec=vec, meta=meta)

    return True


def remove_embedding(idpers, _broadcast=True):
    global _MATRIX, _IDS, _ROW_OF, _VERSION

    idpers = int(idpers)

    with _lock:
        row = _ROW_OF.get(idpers)
        if row is None:
            return False

        _MATRIX = np.ascontiguousarray(np.delete(_MATRIX, row, axis=0))
        _IDS = np.delete(_IDS, row)
        _ROW_OF = {int(pid): i for i, pid in enumerate(_IDS)}
        PERSONNELS_META.pop(idpers, None)
        _VERSION += 1
        _SERVICE_ROWS.clear()

    if _broadcast:
        _publish("remove", idpers=idpers)

    return True


# ============================================================
# Compatibilité ascendante (PERSONNELS_EMB / emb_lock)
# ============================================================
from collections.abc import MutableMapping  # noqa: E402


class _EmbeddingsProxy(MutableMapping):

    def __getitem__(self, idpers):
        with _lock:
            row = _ROW_OF.get(int(idpers))
            if row is None:
                raise KeyError(idpers)
            return _MATRIX[row].copy()

    def __setitem__(self, idpers, emb):
        upsert_embedding(idpers, emb)

    def __delitem__(self, idpers):
        if not remove_embedding(idpers):
            raise KeyError(idpers)

    def __contains__(self, idpers):
        with _lock:
            try:
                return int(idpers) in _ROW_OF
            except (TypeError, ValueError):
                return False

    def __iter__(self):
        with _lock:
            return iter(list(_ROW_OF.keys()))

    def __len__(self):
        with _lock:
            return len(_ROW_OF)

    def keys(self):
        with _lock:
            return list(_ROW_OF.keys())

    def values(self):
        with _lock:
            return [_MATRIX[row].copy() for row in _ROW_OF.values()]

    def items(self):
        with _lock:
            return [(pid, _MATRIX[row].copy()) for pid, row in _ROW_OF.items()]

    def get(self, idpers, default=None):
        try:
            return self[idpers]
        except KeyError:
            return default

    def __repr__(self):
        with _lock:
            dim = _MATRIX.shape[1] if _MATRIX.shape[0] else 0
            return f"<PERSONNELS_EMB: {len(_ROW_OF)} embeddings, dim={dim}>"


PERSONNELS_EMB = _EmbeddingsProxy()
emb_lock = _lock


def check_duplicate_face(emb, exclude_idpers=None, threshold=0.48):
    with _lock:
        matrix, ids = _MATRIX, _IDS

    if matrix.shape[0] == 0:
        return None, -1.0

    vec = _normalize_embedding(emb)
    scores = _combined_from_cosine(matrix @ vec)

    if exclude_idpers is not None:
        mask = ids != int(exclude_idpers)
        if not mask.any():
            return None, -1.0
        scores, ids = scores[mask], ids[mask]

    best = int(np.argmax(scores))
    best_score = float(scores[best])

    if best_score >= threshold:
        return int(ids[best]), best_score
    return None, best_score