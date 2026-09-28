# utils/pointage_context.py
"""
Cache Redis du "contexte de pointage" utilisé par l'étape 4 :

- personnel (role, matricule, to_dict), service, horaires, client
  -> clé  pointage:v1:ctx:{gen}:{idpers}       (TTL 6 h)
- autorisations spéciales valables aujourd'hui
  -> clé  pointage:v1:auth:{gen}:{jour}:{idpers} (TTL jusqu'à minuit)

Invalidation par génération (INCR) après chaque commit SQLAlchemy qui touche
Personnels / Client / Divisions / Services / Horaire(s) / AutorisationSpeciale.
Les commits qui ne modifient QUE l'embedding / le descripteur facial
(apprentissage à chaque pointage) sont ignorés, sinon le cache ne servirait à rien.

Redis indisponible -> lecture directe en base (comportement d'origine).
"""

import logging
from datetime import date, datetime, time, timedelta

import redis
from flask import current_app
from sqlalchemy import event, inspect, or_

logger = logging.getLogger(__name__)

KEY_PREFIX = "pointage:v1"
CTX_GEN_KEY = f"{KEY_PREFIX}:gen:ctx"
AUTH_GEN_KEY = f"{KEY_PREFIX}:gen:auth"
CTX_TTL = 6 * 3600

HORAIRE_FIELDS = (
    "entree_matin_debut",
    "entree_matin_fin",
    "sortie_matin_debut",
    "sortie_matin_fin",
    "entree_soir_debut",
    "entree_soir_fin",
    "sortie_soir_debut",
    "sortie_soir_fin",
)

_CTX_MODELS = {"Personnels", "Client", "Divisions", "Services", "Horaire", "Horaires","horaires_services"}
_AUTH_MODELS = {"AutorisationSpeciale"}
_LEARNING_TOKENS = ("embedding", "descriptor")


# ============================================================
# Utilitaires
# ============================================================

def _r():
    return current_app.extensions.get("redis")


def _seconds_until_midnight():
    now = datetime.now()
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return max(60, int((midnight - now).total_seconds()))


def _generation(key):
    """Génération courante, ou None si Redis est indisponible."""
    client = _r()
    if client is None:
        return None
    try:
        return int(client.get(key) or 0)
    except redis.RedisError:
        return None


def _enum_name(value):
    return getattr(value, "name", value)


def _fmt_time(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        value = value.time()
    return value.strftime("%H:%M:%S")


def _to_json(obj):
    # Même sérialisation que jsonify : réponse identique en HIT et en MISS
    return current_app.json.dumps(obj)


def _from_json(raw):
    return current_app.json.loads(raw)


def parse_horaires(horaires):
    """{"entree_matin_debut": "08:00:00", ...} -> {"entree_matin_debut": time(8, 0), ...}"""
    if not horaires:
        return None
    out = {}
    for field in HORAIRE_FIELDS:
        v = horaires.get(field)
        out[field] = time.fromisoformat(v) if v else None
    if any(v is None for v in out.values()):
        return None
    return out


# ============================================================
# Contexte personnel
# ============================================================

def _load_context(idpers):
    from models.personnels import Personnels
    from models import Client

    personnel = Personnels.query.get(idpers)
    if not personnel:
        return None

    division = getattr(personnel, "division", None)
    service = getattr(division, "service", None) if division else None
    horaire = getattr(service, "horaire", None) if service else None
    client = Client.query.filter_by(idpers=idpers).first()

    ctx = {
        "idpers": int(personnel.idpers),
        "role": personnel.role,
        "matricule": personnel.matricule,
        "idserv": service.idserv if service else None,
        "horaires": {f: _fmt_time(getattr(horaire, f, None)) for f in HORAIRE_FIELDS} if horaire else None,
        "personnel": personnel.to_dict(),
        "client": client.to_dict() if client else None,
    }
    # Normalisation (dates -> chaînes) pour que HIT et MISS renvoient la même chose
    return _from_json(_to_json(ctx))


def get_personnel_context(idpers):
    idpers = int(idpers)
    gen = _generation(CTX_GEN_KEY)
    key = f"{KEY_PREFIX}:ctx:{gen}:{idpers}" if gen is not None else None

    if key:
        try:
            raw = _r().get(key)
            if raw is not None:
                return _from_json(raw)
        except redis.RedisError:
            key = None

    ctx = _load_context(idpers)

    if ctx and key:
        try:
            _r().setex(key, CTX_TTL, _to_json(ctx))
        except redis.RedisError:
            pass

    return ctx


def warm_personnel_contexts(idpers_list):
    """Préchargement (tâche Celery du matin) : le 1er pointage de chacun est déjà en cache."""
    n = 0
    for idpers in idpers_list:
        try:
            if get_personnel_context(idpers):
                n += 1
        except Exception:
            logger.exception("[Pointage ctx] Préchargement impossible pour %s", idpers)
    return n


# ============================================================
# Autorisations spéciales du jour
# ============================================================

def _load_autorisations(idpers, jour):
    from models import AutorisationSpeciale

    rows = AutorisationSpeciale.query.filter(
        AutorisationSpeciale.idpers == idpers,
        AutorisationSpeciale.date_debut <= jour,
        or_(
            AutorisationSpeciale.date_fin.is_(None),
            AutorisationSpeciale.date_fin >= jour,
        ),
    ).all()

    return [
        {
            "id": getattr(r, "id", None),
            "type": _enum_name(r.type_autorisation),
            "periode": _enum_name(r.periode),
        }
        for r in rows
    ]


def get_autorisations_today(idpers):
    idpers = int(idpers)
    jour = date.today()
    gen = _generation(AUTH_GEN_KEY)
    key = f"{KEY_PREFIX}:auth:{gen}:{jour:%Y%m%d}:{idpers}" if gen is not None else None

    if key:
        try:
            raw = _r().get(key)
            if raw is not None:
                return _from_json(raw)
        except redis.RedisError:
            key = None

    data = _load_autorisations(idpers, jour)

    if key:
        try:
            _r().setex(key, _seconds_until_midnight(), _to_json(data))
        except redis.RedisError:
            pass

    return data


def find_autorisation(idpers, type_name, periode_name=None):
    """
    type_name : "sortie" | "retard"
    periode_name : "matin" | "apres_midi" | None (toutes périodes)
    Renvoie le dict de l'autorisation trouvée ou None.
    """
    for a in get_autorisations_today(idpers):
        if a.get("type") != type_name:
            continue
        if periode_name is not None and a.get("periode") != periode_name:
            continue
        return a
    return None


# ============================================================
# Invalidation automatique (SQLAlchemy)
# ============================================================

def _only_learning_changes(obj):
    """True si l'objet modifié ne touche que des colonnes d'apprentissage facial."""
    try:
        state = inspect(obj)
        changed = [a.key for a in state.attrs if a.history.has_changes()]
    except Exception:
        return False
    return bool(changed) and all(
        any(tok in key.lower() for tok in _LEARNING_TOKENS) for key in changed
    )


def is_learning_only_update(obj, session):
    return obj in session.dirty and obj not in session.new and _only_learning_changes(obj)


def bump_context():
    try:
        _r().incr(CTX_GEN_KEY)
    except Exception:
        pass


def bump_autorisations():
    try:
        _r().incr(AUTH_GEN_KEY)
    except Exception:
        pass


def register_context_invalidation(db):

    @event.listens_for(db.session, "after_flush")
    def _collect(session, flush_context):
        ctx = session.info.get("_ptg_ctx", False)
        auth = session.info.get("_ptg_auth", False)

        for obj in list(session.new) + list(session.dirty) + list(session.deleted):
            name = type(obj).__name__

            if name in _AUTH_MODELS:
                auth = True
            elif name in _CTX_MODELS:
                if name == "Personnels" and is_learning_only_update(obj, session):
                    continue
                ctx = True

        session.info["_ptg_ctx"] = ctx
        session.info["_ptg_auth"] = auth

    @event.listens_for(db.session, "after_commit")
    def _apply(session):
        if session.info.pop("_ptg_ctx", False):
            bump_context()
        if session.info.pop("_ptg_auth", False):
            bump_autorisations()

    @event.listens_for(db.session, "after_rollback")
    def _forget(session):
        session.info.pop("_ptg_ctx", None)
        session.info.pop("_ptg_auth", None)

    logger.info("[Pointage ctx] Invalidation du contexte de pointage activée")
