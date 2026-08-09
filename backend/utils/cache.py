"""
utils/cache.py — Cache en mémoire pour les fiches d'assiduité.

Aucune dépendance externe, aucun service à installer.

QUAND CETTE VERSION SUFFIT
--------------------------
Un seul processus Flask (c'est le cas avec async_mode="threading" et un
serveur unique). Le cache vit dans la RAM du processus, protégé par un verrou.

QUAND IL FAUDRA PASSER À REDIS
------------------------------
  - plusieurs workers (gunicorn -w 4, uWSGI, plusieurs conteneurs)
  - plusieurs serveurs derrière un répartiteur de charge
  - besoin de conserver le cache au redémarrage de l'application

Dans ces cas chaque processus aurait son propre cache : incohérences
d'affichage entre deux requêtes consécutives, et invalidation qui ne
toucherait qu'un seul worker. La bascule est simple, l'API publique de ce
module est identique à celle de la version Redis.

Variables d'environnement (.env) :
    CACHE_ENABLED=1
    CACHE_MAX_ENTREES=500
"""

import os
import time
import hashlib
import functools
import logging
import datetime
import threading
from collections import OrderedDict

from flask import request, current_app, make_response

logger = logging.getLogger(__name__)

KEY_PREFIX = "assiduite:v1"
GLOBAL_GEN_KEY = f"{KEY_PREFIX}:gen:global"

# TTL en secondes.
# Les pointages arrivent en continu la journée : un TTL court sur le mois en
# cours borne la fraîcheur sans vider le cache en permanence. Les mois passés
# ne bougent qu'en cas de correction manuelle, et là c'est la génération qui
# invalide immédiatement.
TTL_MOIS_COURANT = 60
TTL_MOIS_PASSE = 6 * 3600

MAX_ENTREES = int(os.getenv("CACHE_MAX_ENTREES", "500"))

# _store : clé -> (expiration_monotonic, payload)
# OrderedDict pour évincer la plus ancienne entrée quand la limite est atteinte.
_store = OrderedDict()
_generations = {}
_verrou = threading.RLock()


def _enabled():
    return os.getenv("CACHE_ENABLED", "1") not in ("0", "false", "False")


# ---------------------------------------------------------------------------
# Accès bas niveau
# ---------------------------------------------------------------------------

def _safe_get(key):
    with _verrou:
        entree = _store.get(key)
        if entree is None:
            return None
        expiration, payload = entree
        if time.monotonic() >= expiration:
            del _store[key]
            return None
        _store.move_to_end(key)  # récemment utilisé
        return payload


def _safe_set(key, value, ttl):
    with _verrou:
        _store[key] = (time.monotonic() + ttl, value)
        _store.move_to_end(key)
        while len(_store) > MAX_ENTREES:
            _store.popitem(last=False)


def _purger_expirees():
    """Retire les entrées périmées. Appelée à l'occasion, pas à chaque requête."""
    maintenant = time.monotonic()
    with _verrou:
        mortes = [k for k, (exp, _) in _store.items() if maintenant >= exp]
        for k in mortes:
            del _store[k]
    return len(mortes)


def _safe_incr(key):
    with _verrou:
        _generations[key] = _generations.get(key, 0) + 1


def _lire_generation(key):
    with _verrou:
        return _generations.get(key, 0)


# ---------------------------------------------------------------------------
# Générations
# ---------------------------------------------------------------------------

def _month_gen_key(annee, mois):
    return f"{KEY_PREFIX}:gen:{annee:04d}-{mois:02d}"


def bump_global():
    """Invalide tout : personnels, divisions, services, types d'absence."""
    _safe_incr(GLOBAL_GEN_KEY)


def bump_month(annee, mois):
    """Invalide un mois : pointages, autorisations."""
    _safe_incr(_month_gen_key(annee, mois))


def bump_period(date_obj):
    if date_obj is None:
        return
    bump_month(date_obj.year, date_obj.month)


def invalidate_all():
    """Purge complète. Ici on peut vraiment vider, contrairement à Redis."""
    with _verrou:
        _store.clear()
    bump_global()


def stats():
    """Diagnostic : à exposer sur une route admin si besoin."""
    with _verrou:
        return {
            "entrees": len(_store),
            "max_entrees": MAX_ENTREES,
            "generations": dict(_generations),
        }


# ---------------------------------------------------------------------------
# Décorateur
# ---------------------------------------------------------------------------

def _ttl_for(annee, mois):
    today = datetime.date.today()
    if (annee, mois) >= (today.year, today.month):
        return TTL_MOIS_COURANT
    return TTL_MOIS_PASSE


def _build_key(view_name, annee, mois):
    gen_global = _lire_generation(GLOBAL_GEN_KEY)
    gen_month = _lire_generation(_month_gen_key(annee, mois))

    # Tous les paramètres comptent : idserv, iddiv, matricule, type, idpers…
    # En oublier un ferait servir la fiche d'un autre service.
    args = "&".join(f"{k}={v}" for k, v in sorted(request.args.items(multi=True)))
    digest = hashlib.sha1(args.encode("utf-8")).hexdigest()[:16]

    return f"{KEY_PREFIX}:{view_name}:{gen_global}.{gen_month}:{digest}"


_compteur_requetes = 0
_PURGE_TOUS_LES = 100


def cached_assiduite(view):
    """Met en cache la réponse JSON d'une vue paramétrée par `mois` et `annee`.

    Seules les réponses 200 de type application/json sont mises en cache :
    les erreurs de validation et les `send_file` passent au travers.
    """

    @functools.wraps(view)
    def wrapper(*args, **kwargs):
        global _compteur_requetes

        if not _enabled():
            return view(*args, **kwargs)

        mois = request.args.get("mois", type=int)
        annee = request.args.get("annee", type=int)

        # Paramètres absents ou aberrants : on laisse la vue répondre son 400.
        if not mois or not annee or not (1 <= mois <= 12) or not (2000 <= annee <= 2100):
            return view(*args, **kwargs)

        _compteur_requetes += 1
        if _compteur_requetes % _PURGE_TOUS_LES == 0:
            _purger_expirees()

        key = _build_key(view.__name__, annee, mois)

        payload = _safe_get(key)
        if payload is not None:
            resp = current_app.response_class(payload, mimetype="application/json")
            resp.headers["X-Cache"] = "HIT"
            return resp

        resp = make_response(view(*args, **kwargs))

        if resp.status_code == 200 and resp.mimetype == "application/json":
            _safe_set(key, resp.get_data(as_text=True), _ttl_for(annee, mois))

        resp.headers["X-Cache"] = "MISS"
        return resp

    return wrapper


# ---------------------------------------------------------------------------
# Invalidation automatique via les événements SQLAlchemy
# ---------------------------------------------------------------------------

def register_cache_invalidation(db):
    """Branche l'invalidation sur les commits SQLAlchemy.

    Évite d'avoir à penser au cache dans chaque route : toute écriture sur
    Pointage, AutorisationAbsence, Personnels… invalide ce qu'il faut.

    À appeler une fois dans create_app(), après db.init_app(app).
    """
    from sqlalchemy import event

    def _periodes_touchees(obj):
        """Retourne une liste de (annee, mois), ou None pour 'invalider tout'."""
        nom = type(obj).__name__

        if nom == "Pointage":
            d = getattr(obj, "date", None)
            return [(d.year, d.month)] if d else None

        if nom == "AutorisationAbsence":
            d = getattr(obj, "date_absence", None)
            return [(d.year, d.month)] if d else None

        if nom == "Conge":
            debut = getattr(obj, "date_debut", None)
            fin = getattr(obj, "date_fin", None)
            if not debut or not fin:
                return None
            periodes, cur = [], (debut.year, debut.month)
            limite = (fin.year, fin.month)
            while cur <= limite and len(periodes) < 36:
                periodes.append(cur)
                annee, mois = cur
                cur = (annee + 1, 1) if mois == 12 else (annee, mois + 1)
            return periodes

        # Impossible de cibler un mois pour ces modèles : on invalide tout.
        if nom in (
            "Personnels", "Divisions", "Services",
            "TypeAutorisations", "Responsables", "Horaires",
        ):
            return None

        return []  # modèle non concerné par les fiches

    @event.listens_for(db.session, "after_flush")
    def _collecter(session, flush_context):
        # Les objets sont encore chargés ici ; après commit ils sont expirés
        # et lire pt.date déclencherait un rechargement.
        mois_touches = session.info.setdefault("_cache_mois", set())
        tout = session.info.get("_cache_global", False)

        for obj in list(session.new) + list(session.dirty) + list(session.deleted):
            periodes = _periodes_touchees(obj)
            if periodes is None:
                tout = True
            elif periodes:
                mois_touches.update(periodes)

        session.info["_cache_global"] = tout

    @event.listens_for(db.session, "after_commit")
    def _invalider(session):
        mois_touches = session.info.pop("_cache_mois", set())
        tout = session.info.pop("_cache_global", False)

        if tout:
            bump_global()
        for annee, mois in mois_touches:
            bump_month(annee, mois)

    @event.listens_for(db.session, "after_rollback")
    def _oublier(session):
        session.info.pop("_cache_mois", None)
        session.info.pop("_cache_global", None)

    logger.info("[cache] invalidation automatique branchée sur SQLAlchemy")