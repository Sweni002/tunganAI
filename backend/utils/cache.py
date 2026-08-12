# utils/cache.py

import os
import hashlib
import functools
import logging
from flask import request, current_app, make_response

logger = logging.getLogger(__name__)

KEY_PREFIX = "assiduite:v1"
GLOBAL_GEN_KEY = f"{KEY_PREFIX}:gen:global"
HISTORY_GEN_KEY = f"{KEY_PREFIX}:gen:history"


from sqlalchemy import event


def register_cache_invalidation(db):

    def _periodes_touchees(obj):

        nom = type(obj).__name__
        
        if nom == "JournalTentativePointage":
              return "METRICS"

        # -------------------------
        # POINTAGE
        # -------------------------

        if nom == "Pointage":

            d = getattr(obj, "date", None)

            if d:
                return [(d.year, d.month)]

            return None

        # -------------------------
        # AUTORISATION
        # -------------------------

        if nom == "AutorisationAbsence":

            d = getattr(obj, "date_absence", None)

            if d:
                return [(d.year, d.month)]

            return None

        # -------------------------
        # CONGE
        # -------------------------

        if nom == "Conge":

            debut = getattr(
                obj,
                "date_debut",
                None
            )

            fin = getattr(
                obj,
                "date_fin",
                None
            )

            if not debut or not fin:
                return None

            periodes = []

            cur_year = debut.year
            cur_month = debut.month

            while (
                (cur_year, cur_month)
                <= (fin.year, fin.month)
            ):

                periodes.append(
                    (cur_year, cur_month)
                )

                if cur_month == 12:
                    cur_year += 1
                    cur_month = 1
                else:
                    cur_month += 1

                if len(periodes) >= 36:
                    break

            return periodes

        # -------------------------
        # DONNÉES STRUCTURELLES
        # -------------------------

        if nom in (
            "Personnels",
            "Divisions",
            "Services",
            "TypeAutorisations",
            "Responsables",
            "Horaires",
        ):
            return None

        # Modèle non concerné
        return []

    # ======================================================
    # AFTER FLUSH
    # ======================================================

    @event.listens_for(db.session, "after_flush")
    def _collecter(session, flush_context):

     mois_touches = session.info.setdefault(
        "_cache_mois",
        set()
    )

     tout = session.info.get(
        "_cache_global",
        False
    )

     metrics = session.info.get(
        "_cache_metrics",
        False
    )
     history = session.info.get(
        "_cache_history",
        False
    )

     objets = (
        list(session.new)
        + list(session.dirty)
        + list(session.deleted)
    )

     for obj in objets:

        nom = type(obj).__name__

        # ==========================================
        # JOURNAL DES TENTATIVES
        # ==========================================

        if nom == "JournalTentativePointage":
            metrics = True
            history = True
            continue

        # ==========================================
        # AUTRES MODELES
        # ==========================================

        periodes = _periodes_touchees(obj)

        if periodes is None:

            tout = True

        elif periodes:

            mois_touches.update(periodes)

     session.info["_cache_global"] = tout
     session.info["_cache_metrics"] = metrics
     session.info["_cache_history"] = history
    

    # ======================================================
    # AFTER COMMIT
    # ======================================================

    @event.listens_for(db.session, "after_commit")
    def _invalider(session):

     mois_touches = session.info.pop(
        "_cache_mois",
        set()
    )

     tout = session.info.pop(
        "_cache_global",
        False
    )

     metrics = session.info.pop(
        "_cache_metrics",
        False
    )
     history = session.info.pop(
        "_cache_history",
        False
    )

    
 
     if tout:
        bump_global()

     for annee, mois in mois_touches:
        bump_month(
            annee,
            mois
        )

     if metrics:
        bump_metrics()

   
     if history:
        bump_history()
    
      
     logger.info(
        "[Redis Cache] Invalidation terminée : "
        "mois=%s metrics=%s history=%s",
        mois_touches,
        metrics,
        history
    )

    
    # ======================================================
    # AFTER ROLLBACK
    # ======================================================

    @event.listens_for(db.session, "after_rollback")
    def _oublier(session):

        session.info.pop(
            "_cache_mois",
            None
        )

        session.info.pop(
            "_cache_global",
            None
        )
        session.info.pop(
        "_cache_metrics",
        None
    ) 
        session.info.pop("_cache_history", None)

    logger.info(
        "[Redis Cache] Invalidation SQLAlchemy activée"
    )
    
def _enabled():
    return os.getenv("CACHE_ENABLED", "1") not in ("0", "false", "False")


def _month_gen_key(annee, mois):
    return f"{KEY_PREFIX}:gen:{annee:04d}-{mois:02d}"


def bump_global():
    """
    Invalide toutes les fiches d'assiduité.
    """
    redis = current_app.extensions["redis"]

    redis.incr(GLOBAL_GEN_KEY)

    logger.info("[Redis Cache] GLOBAL invalidé")

def bump_history():
    """
    Invalide le cache de l'historique facial.
    """
    redis = current_app.extensions["redis"]

    generation = redis.incr(HISTORY_GEN_KEY)

    logger.info(
        "[Redis Cache] HISTORY invalidé → génération=%s",
        generation
    )
    
def bump_month(annee, mois):
    """
    Invalide uniquement le cache du mois concerné.

    Aucun TTL.
    """
    redis = current_app.extensions["redis"]

    key = _month_gen_key(annee, mois)
    redis.incr(key)

    logger.info(
        "[Redis Cache] Mois invalidé : %04d-%02d",
        annee,
        mois
    )

METRICS_GEN_KEY = f"{KEY_PREFIX}:gen:metrics"


def bump_metrics():
    """
    Invalide le cache des métriques de performance.
    """
    redis = current_app.extensions["redis"]

    generation = redis.incr(METRICS_GEN_KEY)

    logger.info(
        "[Redis Cache] METRICS invalidé → génération=%s",
        generation
    )
    
def invalidate_all():
    """
    Invalidation logique globale.
    On ne supprime pas physiquement toutes les clés.
    """
    bump_global()


def stats():
    redis = current_app.extensions["redis"]

    global_gen = redis.get(GLOBAL_GEN_KEY)
    
    metrics_gen = redis.get(METRICS_GEN_KEY)

    return {
        "global_generation": int(global_gen or 0),
        "metrics_generation": int(metrics_gen or 0)
    }


def _build_key(view_name, annee, mois):
    redis = current_app.extensions["redis"]

    global_gen = redis.get(GLOBAL_GEN_KEY)
    month_gen = redis.get(
        _month_gen_key(annee, mois)
    )

    global_gen = int(global_gen or 0)
    month_gen = int(month_gen or 0)

    # Tous les paramètres HTTP participent à la clé.
    args = "&".join(
        f"{k}={v}"
        for k, v in sorted(
            request.args.items(multi=True)
        )
    )

    digest = hashlib.sha1(
        args.encode("utf-8")
    ).hexdigest()[:16]

    return (
        f"{KEY_PREFIX}:"
        f"{view_name}:"
        f"{global_gen}."
        f"{month_gen}:"
        f"{digest}"
    )


def cached_assiduite(view):

    @functools.wraps(view)
    def wrapper(*args, **kwargs):

        if not _enabled():
            return view(*args, **kwargs)

        mois = request.args.get("mois", type=int)
        annee = request.args.get("annee", type=int)

        # Laisser la route gérer ses erreurs.
        if (
            not mois
            or not annee
            or not (1 <= mois <= 12)
            or not (2000 <= annee <= 2100)
        ):
            return view(*args, **kwargs)

        redis = current_app.extensions["redis"]

        key = _build_key(
            view.__name__,
            annee,
            mois
        )

        # ==========================
        # CACHE HIT
        # ==========================

        cached = redis.get(key)

        if cached is not None:

            logger.info(
                "[Redis Cache] HIT %s",
                key
            )

            resp = current_app.response_class(
                cached,
                mimetype="application/json"
            )

            resp.headers["X-Cache"] = "HIT"

            return resp

        # ==========================
        # CACHE MISS
        # ==========================

        logger.info(
            "[Redis Cache] MISS %s",
            key
        )

        resp = make_response(
            view(*args, **kwargs)
        )

        if (
            resp.status_code == 200
            and resp.mimetype == "application/json"
        ):

            # Aucun expiration.
            redis.set(
                key,
                resp.get_data(as_text=True)
            )

            logger.info(
                "[Redis Cache] SET %s",
                key
            )

        resp.headers["X-Cache"] = "MISS"

        return resp

    return wrapper