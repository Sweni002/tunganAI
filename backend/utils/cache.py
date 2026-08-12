# utils/cache.py

import os
import hashlib
import functools
import logging
from flask import request, current_app, make_response
from datetime import datetime, date

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
    history_gen = redis.get(HISTORY_GEN_KEY)

    return {
        "global_generation": int(global_gen or 0),
        "metrics_generation": int(metrics_gen or 0),
           "history_generation": int(history_gen or 0)
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

def _build_key_by_date(view_name, date_obj):
    """
    Construit une clé Redis basée sur :
    - génération globale
    - génération du mois
    - tous les paramètres HTTP
    """

    redis = current_app.extensions["redis"]

    global_gen = redis.get(GLOBAL_GEN_KEY)
    month_gen = redis.get(
        _month_gen_key(date_obj.year, date_obj.month)
    )

    global_gen = int(global_gen or 0)
    month_gen = int(month_gen or 0)

    # Tous les paramètres GET participent à la clé
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

def _build_key_stats(view_name, date_debut, date_fin):
    """
    Génère une clé Redis pour /stats.

    La clé dépend :
    - génération globale
    - générations des mois concernés
    - tous les paramètres GET
    """

    redis = current_app.extensions["redis"]

    global_gen = redis.get(GLOBAL_GEN_KEY)
    global_gen = int(global_gen or 0)

    # ==========================================
    # Générations des mois concernés
    # ==========================================

    month_generations = []

    if date_debut and date_fin:

        cur_year = date_debut.year
        cur_month = date_debut.month

        while (cur_year, cur_month) <= (
            date_fin.year,
            date_fin.month
        ):

            month_key = _month_gen_key(
                cur_year,
                cur_month
            )

            month_gen = redis.get(month_key)
            month_gen = int(month_gen or 0)

            month_generations.append(
                f"{cur_year:04d}-{cur_month:02d}.{month_gen}"
            )

            if cur_month == 12:
                cur_year += 1
                cur_month = 1
            else:
                cur_month += 1

    elif date_debut:

        month_key = _month_gen_key(
            date_debut.year,
            date_debut.month
        )

        month_gen = redis.get(month_key)
        month_gen = int(month_gen or 0)

        month_generations.append(
            f"{date_debut.year:04d}-"
            f"{date_debut.month:02d}."
            f"{month_gen}"
        )

    # ==========================================
    # Paramètres GET
    # ==========================================

    args = "&".join(
        f"{k}={v}"
        for k, v in sorted(
            request.args.items(multi=True)
        )
    )

    digest = hashlib.sha1(
        args.encode("utf-8")
    ).hexdigest()[:16]

    generations = "|".join(month_generations)

    return (
        f"{KEY_PREFIX}:"
        f"{view_name}:"
        f"{global_gen}:"
        f"{generations}:"
        f"{digest}"
    )
    
    
def _build_key_by_date_range(view_name, date_debut, date_fin):
    """
    Construit une clé Redis pour une requête couvrant
    une plage de dates.

    La clé dépend :
    - génération globale
    - génération de chaque mois traversé
    - tous les paramètres GET
    """

    redis = current_app.extensions["redis"]

    global_gen = redis.get(GLOBAL_GEN_KEY)
    global_gen = int(global_gen or 0)

    # ==========================================
    # Générations des mois concernés
    # ==========================================

    month_generations = []

    cur_year = date_debut.year
    cur_month = date_debut.month

    while (cur_year, cur_month) <= (
        date_fin.year,
        date_fin.month
    ):
        month_key = _month_gen_key(
            cur_year,
            cur_month
        )

        month_gen = redis.get(month_key)
        month_gen = int(month_gen or 0)

        month_generations.append(
            f"{cur_year:04d}-{cur_month:02d}.{month_gen}"
        )

        if cur_month == 12:
            cur_year += 1
            cur_month = 1
        else:
            cur_month += 1

    generations = "|".join(month_generations)

    # ==========================================
    # Tous les paramètres GET
    # ==========================================

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
        f"{global_gen}:"
        f"{generations}:"
        f"{digest}"
    )

def cached_assiduite_date_range(view):
    """
    Cache Redis pour les routes utilisant :

        ?dateDebut=YYYY-MM-DD
        &dateFin=YYYY-MM-DD
    """

    @functools.wraps(view)
    def wrapper(*args, **kwargs):

        if not _enabled():
            return view(*args, **kwargs)

        date_debut_str = request.args.get("dateDebut")
        date_fin_str = request.args.get("dateFin")

        # Laisser la route gérer les erreurs
        if not date_debut_str or not date_fin_str:
            return view(*args, **kwargs)

        try:
            date_debut = datetime.strptime(
                date_debut_str,
                "%Y-%m-%d"
            ).date()

            date_fin = datetime.strptime(
                date_fin_str,
                "%Y-%m-%d"
            ).date()

        except ValueError:
            return view(*args, **kwargs)

        # Plage invalide → laisser la route gérer
        if date_fin < date_debut:
            return view(*args, **kwargs)

        redis = current_app.extensions["redis"]

        key = _build_key_by_date_range(
            view.__name__,
            date_debut,
            date_fin
        )

        # ==========================================
        # HIT
        # ==========================================

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

        # ==========================================
        # MISS
        # ==========================================

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

def cached_assiduite_stats(view):

    @functools.wraps(view)
    def wrapper(*args, **kwargs):

        if not _enabled():
            return view(*args, **kwargs)

        # ==========================================
        # Récupération des dates
        # ==========================================

        date_str = request.args.get("date")
        date_debut_str = request.args.get("dateDebut")
        date_fin_str = request.args.get("dateFin")

        date_debut = None
        date_fin = None

        # ==========================================
        # Date unique
        # ==========================================

        if date_str:

            try:
                selected_date = datetime.strptime(
                    date_str,
                    "%Y-%m-%d"
                ).date()

                date_debut = selected_date
                date_fin = selected_date

            except ValueError:
                # La route gère l'erreur
                return view(*args, **kwargs)

        # ==========================================
        # Plage
        # ==========================================

        elif date_debut_str or date_fin_str:

            if not date_debut_str or not date_fin_str:
                return view(*args, **kwargs)

            try:
                date_debut = datetime.strptime(
                    date_debut_str,
                    "%Y-%m-%d"
                ).date()

                date_fin = datetime.strptime(
                    date_fin_str,
                    "%Y-%m-%d"
                ).date()

            except ValueError:
                return view(*args, **kwargs)

            if date_fin < date_debut:
                return view(*args, **kwargs)

        # ==========================================
        # Aucune date
        # ==========================================

        else:
            # La route utilise date.today()
            today = date.today()

            date_debut = today
            date_fin = today

        redis = current_app.extensions["redis"]

        key = _build_key_stats(
            view.__name__,
            date_debut,
            date_fin
        )

        # ==========================================
        # HIT
        # ==========================================

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

        # ==========================================
        # MISS
        # ==========================================

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

def cached_assiduite_date(view):
    """
    Cache Redis pour les routes utilisant :
        ?date=YYYY-MM-DD

    Exemple :
        /faciall/par_date?date=2026-08-12&idserv=41
    """

    @functools.wraps(view)
    def wrapper(*args, **kwargs):

        if not _enabled():
            return view(*args, **kwargs)

        date_str = request.args.get("date")

        # Si pas de date, laisser la route gérer l'erreur
        if not date_str:
            return view(*args, **kwargs)

        try:
            from datetime import datetime

            date_obj = datetime.strptime(
                date_str,
                "%Y-%m-%d"
            ).date()

        except ValueError:
            return view(*args, **kwargs)

        redis = current_app.extensions["redis"]

        key = _build_key_by_date(
            view.__name__,
            date_obj
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