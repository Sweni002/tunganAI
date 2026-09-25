# utils/pointage_redis.py
"""
Données du pointage stockées dans Redis (partagées entre instances) :
- step2 -> step3 -> step4 : embedding + image
- cache MAC -> service
- tâches exécutées une seule fois par jour
- verrou anti-double pointage + "déjà pointé" instantané

Si Redis est indisponible : repli mémoire (pending) ou comportement
d'origine (caches et verrous ignorés).
"""

import json
import logging
import threading
import time
from datetime import datetime, timedelta

import numpy as np
import redis
from flask import current_app

logger = logging.getLogger(__name__)

KEY_PREFIX = "pointage:v1"
PENDING_TTL = 180      # s
MAC_CACHE_TTL = 300    # s
LOCK_TTL = 10          # s


def _r():
    return current_app.extensions["redis"]


def _day():
    return datetime.now().strftime("%Y%m%d")


def seconds_until_midnight():
    now = datetime.now()
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return max(60, int((midnight - now).total_seconds()))


# ============================================================
# Repli mémoire (Redis indisponible)
# ============================================================

_MEM = {}
_MEM_LOCK = threading.Lock()


def _mem_set(key, value, ttl):
    with _MEM_LOCK:
        _MEM[key] = (value, time.time() + ttl)


def _mem_get(key, pop=False):
    with _MEM_LOCK:
        item = _MEM.pop(key, None) if pop else _MEM.get(key)
    if not item:
        return None
    value, exp = item
    if time.time() > exp:
        with _MEM_LOCK:
            _MEM.pop(key, None)
        return None
    return value


def _mem_delete(key):
    with _MEM_LOCK:
        _MEM.pop(key, None)


# ============================================================
# step2 -> step3 -> step4
# ============================================================

def _pending_key(temp_id):
    return f"{KEY_PREFIX}:pending:{temp_id}"


def _img_key(temp_id):
    return f"{KEY_PREFIX}:img:{temp_id}"


def store_pending(temp_id, emb=None, error=None, image_jpg=None):
    data = {}
    if emb is not None:
        data["emb"] = np.asarray(emb, dtype=np.float32).tobytes()
    if error:
        data["error"] = str(error).encode()
    if not data:
        data["_"] = b"1"

    try:
        pipe = _r().pipeline()
        pipe.hset(_pending_key(temp_id), mapping=data)
        pipe.expire(_pending_key(temp_id), PENDING_TTL)
        if image_jpg is not None:
            pipe.setex(_img_key(temp_id), PENDING_TTL, image_jpg)
        pipe.execute()
    except redis.RedisError as exc:
        logger.warning("[Pointage Redis] store_pending en mémoire : %s", exc)
        _mem_set(_pending_key(temp_id), data, PENDING_TTL)
        if image_jpg is not None:
            _mem_set(_img_key(temp_id), image_jpg, PENDING_TTL)


def pop_pending(temp_id):
    raw = None
    try:
        pipe = _r().pipeline()
        pipe.hgetall(_pending_key(temp_id))
        pipe.delete(_pending_key(temp_id))
        result, _ = pipe.execute()
        if result:
            raw = {k.decode() if isinstance(k, bytes) else k: v for k, v in result.items()}
    except redis.RedisError as exc:
        logger.warning("[Pointage Redis] pop_pending : %s", exc)

    if not raw:
        raw = _mem_get(_pending_key(temp_id), pop=True)
    if not raw:
        return None

    return {
        "emb": np.frombuffer(raw["emb"], dtype=np.float32).copy() if "emb" in raw else None,
        "error": raw["error"].decode() if "error" in raw else None,
    }


def has_image(temp_id):
    if not temp_id:
        return False
    try:
        if _r().exists(_img_key(temp_id)):
            return True
    except redis.RedisError:
        pass
    return _mem_get(_img_key(temp_id)) is not None


def get_image(temp_id):
    if not temp_id:
        return None
    try:
        img = _r().get(_img_key(temp_id))
        if img is not None:
            return img
    except redis.RedisError:
        pass
    return _mem_get(_img_key(temp_id))


def delete_image(temp_id):
    if not temp_id:
        return
    try:
        _r().delete(_img_key(temp_id))
    except redis.RedisError:
        pass
    _mem_delete(_img_key(temp_id))


# ============================================================
# Cache MAC -> service
# ============================================================

def _mac_key(mac_address):
    return f"{KEY_PREFIX}:mac:{mac_address}"


def get_service_info_by_mac(mac_address, loader):
    """
    Renvoie {"idserv": ..., "nom": ...} ou None.
    loader : get_service_by_mac (fonction d'origine).
    """
    try:
        cached = _r().get(_mac_key(mac_address))
        if cached is not None:
            return None if cached == b"-" else json.loads(cached)
    except redis.RedisError:
        pass

    service = loader(mac_address)
    info = {"idserv": service.idserv, "nom": service.nom} if service else None

    try:
        _r().setex(_mac_key(mac_address), MAC_CACHE_TTL, json.dumps(info) if info else "-")
    except redis.RedisError:
        pass

    return info


def invalidate_mac(mac_address):
    """À appeler quand un admin ajoute/retire une MAC autorisée."""
    try:
        _r().delete(_mac_key(mac_address))
    except redis.RedisError:
        pass


# ============================================================
# Une seule exécution par jour
# ============================================================

def _once_key(name, scope):
    return f"{KEY_PREFIX}:once:{name}:{scope}:{_day()}"


def once_per_day(name, scope=""):
    """True la première fois de la journée (toutes instances confondues)."""
    try:
        return bool(_r().set(_once_key(name, scope), 1, nx=True, ex=seconds_until_midnight()))
    except redis.RedisError:
        return True  # sans Redis : comportement d'origine


def reset_once_per_day(name, scope=""):
    try:
        _r().delete(_once_key(name, scope))
    except redis.RedisError:
        pass


# ============================================================
# Verrou anti-double pointage + "déjà pointé"
# ============================================================

def _lock_key(idpers, type_pointage):
    return f"{KEY_PREFIX}:lock:{idpers}:{type_pointage}"


def _done_key(idpers, type_pointage, periode):
    return f"{KEY_PREFIX}:done:{idpers}:{_day()}:{type_pointage}:{periode}"


def acquire_lock(idpers, type_pointage):
    try:
        return bool(_r().set(_lock_key(idpers, type_pointage), 1, nx=True, ex=LOCK_TTL))
    except redis.RedisError:
        return True


def release_lock(idpers, type_pointage):
    try:
        _r().delete(_lock_key(idpers, type_pointage))
    except redis.RedisError:
        pass


def mark_done(idpers, type_pointage, periode, heure_str):
    try:
        _r().setex(_done_key(idpers, type_pointage, periode), seconds_until_midnight(), heure_str)
    except redis.RedisError:
        pass


def already_done(idpers, type_pointage, periode):
    try:
        v = _r().get(_done_key(idpers, type_pointage, periode))
        return v.decode() if v else None
    except redis.RedisError:
        return None


def clear_done_today(idpers):
    """À appeler si un admin corrige/supprime un pointage du jour."""
    try:
        for key in _r().scan_iter(f"{KEY_PREFIX}:done:{idpers}:{_day()}:*"):
            _r().delete(key)
    except redis.RedisError:
        pass