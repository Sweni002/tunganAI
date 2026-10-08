"""Jours fériés d'un service : lecture (avec cache Redis) et règles de blocage.

Un jour férié peut porter sur le matin, le soir ou la journée complète (= matin ET soir).
Il bloque :
  - le pointage facial (étapes 2, 3 et 4) pendant la période concernée ;
  - la modification manuelle d'un pointage (page responsable) sur cette période ;
  - le contrôle des absences (absence_checker, tâches Celery).

Cache : clé  ferie:v1:{idserv}:{AAAAMMJJ}  -> JSON ou "-" (aucun jour férié).
Invalidé à chaque création / modification / suppression (invalider()).
Redis indisponible -> lecture directe en base.
"""
import json
import logging
from datetime import date, datetime, time, timedelta

import redis
from flask import current_app

logger = logging.getLogger(__name__)

KEY_PREFIX = "ferie:v1"
CACHE_TTL = 3600
CUTOFF_PAR_DEFAUT = time(13, 0)   # frontière matin / après-midi si le service n'a pas d'horaires


def _r():
    return current_app.extensions.get("redis")


def _cle(idserv, jour):
    return f"{KEY_PREFIX}:{int(idserv)}:{jour:%Y%m%d}"


def _cutoff_du_service(idserv):
    """Heure à partir de laquelle on est « l'après-midi » (début d'entrée du soir)."""
    from models.horaire import HorairesService

    horaire = HorairesService.query.filter_by(idserv=idserv).first()
    valeur = getattr(horaire, "entree_soir_debut", None)
    if isinstance(valeur, datetime):
        return valeur.time()
    if isinstance(valeur, time):
        return valeur
    return CUTOFF_PAR_DEFAUT


def _charger(idserv, jour):
    from models import JourFerie

    lignes = JourFerie.query.filter_by(idserv=idserv, date=jour).all()
    if not lignes:
        return None

    data = {"matin": False, "soir": False, "motif": None, "cutoff": None}
    for ligne in lignes:
        if ligne.periode in ("matin", "complete"):
            data["matin"] = True
        if ligne.periode in ("soir", "complete"):
            data["soir"] = True
        data["motif"] = data["motif"] or ligne.motif

    # La frontière matin / après-midi ne sert que si UNE SEULE moitié est fériée
    if data["matin"] != data["soir"]:
        data["cutoff"] = _cutoff_du_service(idserv).strftime("%H:%M")
    return data


def get_ferie(idserv, jour):
    """{"matin": bool, "soir": bool, "motif": str, "cutoff": "HH:MM"|None} ou None si jour normal."""
    if not idserv:
        return None

    client = _r()
    cle = _cle(idserv, jour)

    if client is not None:
        try:
            brut = client.get(cle)
            if brut is not None:
                return None if brut in (b"-", "-") else json.loads(brut)
        except redis.RedisError:
            client = None

    data = _charger(idserv, jour)

    if client is not None:
        try:
            client.setex(cle, CACHE_TTL, json.dumps(data) if data else "-")
        except redis.RedisError:
            pass
    return data


def invalider(idserv, jours):
    """À appeler après toute modification des jours fériés d'un service."""
    client = _r()
    if client is None:
        return
    try:
        for jour in jours:
            client.delete(_cle(idserv, jour))
    except redis.RedisError:
        pass


def feries_du_jour(jour):
    """{idserv: {"matin": bool, "soir": bool}} pour TOUS les services (une requête) : traitements de masse."""
    from models import JourFerie

    resultat = {}
    for ligne in JourFerie.query.filter_by(date=jour).all():
        entree = resultat.setdefault(ligne.idserv, {"matin": False, "soir": False})
        if ligne.periode in ("matin", "complete"):
            entree["matin"] = True
        if ligne.periode in ("soir", "complete"):
            entree["soir"] = True
    return resultat


def _libelle(periode):
    return {"matin": "ce matin", "soir": "cet après-midi", "complete": "aujourd'hui"}[periode]


def ferie_bloquant(idserv, maintenant=None, cutoff=None):
    """Si le pointage est interdit MAINTENANT pour ce service, renvoie
    {"periode", "motif", "message"} ; sinon None.

    cutoff : heure (time) de début de l'après-midi, si l'appelant la connaît déjà.
    """
    maintenant = maintenant or datetime.now()
    ferie = get_ferie(idserv, maintenant.date())
    if not ferie:
        return None

    if ferie["matin"] and ferie["soir"]:
        periode = "complete"
    else:
        if cutoff is None:
            texte = ferie.get("cutoff")
            cutoff = time.fromisoformat(texte) if texte else CUTOFF_PAR_DEFAUT
        courante = "matin" if maintenant.time() < cutoff else "soir"
        if not ferie[courante]:
            return None
        periode = courante

    motif = ferie.get("motif")
    message = f"Jour férié{f' : {motif}' if motif else ''}. Aucun pointage n'est possible {_libelle(periode)}."
    return {"periode": periode, "motif": motif, "message": message}


def ferie_pour_modification(idserv, jour):
    """Pour la modification manuelle d'un pointage : {"matin": bool, "soir": bool, "motif": str} ou None."""
    return get_ferie(idserv, jour)
