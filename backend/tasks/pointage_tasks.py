# tasks/pointage_tasks.py
"""
Travail sorti de l'étape 4 du pointage.

Chaque tâche = une fonction do_xxx (exécutable aussi en local, dans un contexte
Flask, quand le broker est indisponible) + un wrapper Celery.

Ce module n'importe ni __init__.py ni face_utils (worker léger).
"""

import json
import logging
import os
from datetime import date, datetime

import numpy as np
from flask import current_app
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from celery_app import celery
from models import Conge, Divisions, JournalTentativePointage, Notification, Services, db
from models.autorisationAbsence import AutorisationAbsence
from models.personnels import Personnels
from models.pointages import Pointage
from utils.pointage_redis import delete_image, get_image, once_per_day, reset_once_per_day

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
ORACLE_IN_LIMIT = 900  # Oracle : 1000 éléments max dans un IN

_emitter = None


# ============================================================
# Utilitaires
# ============================================================

def _socketio():
    """
    Instance web : le SocketIO de l'application.
    Worker : émetteur "écriture seule" branché sur la même file Redis.
    """
    sio = current_app.extensions.get("socketio")
    if sio is not None:
        return sio

    global _emitter
    if _emitter is None:
        from flask_socketio import SocketIO
        _emitter = SocketIO(message_queue=REDIS_URL)
    return _emitter


def _chunks(seq, size=ORACLE_IN_LIMIT):
    seq = list(seq)
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def _bump_month(jour):
    try:
        from utils.cache import bump_month
        bump_month(jour.year, jour.month)
    except Exception:
        logger.exception("[Tâche] bump_month impossible")


# ============================================================
# Journal des tentatives (image lue dans Redis, pas dans le message)
# ============================================================

def do_journaliser(log, temp_id=None):
    photo = get_image(temp_id) if temp_id else None

    temps_detail = log.get("temps_detail")
    temps_ms = log.get("temps_ms")

    try:
        entry = JournalTentativePointage(
            idpers=log.get("idpers"),
            role=log.get("role"),
            etape=log.get("etape"),
            statut=log.get("statut"),
            type_pointage=log.get("type_pointage"),
            message=str(log.get("message") or "")[:4000],
            score_face=log.get("score_face"),
            second_score=log.get("second_score"),
            photo=photo,
            mac_address=log.get("mac_address"),
            temps_ms=round(temps_ms, 3) if temps_ms is not None else None,
            temps_detail=json.dumps(temps_detail, ensure_ascii=False) if temps_detail is not None else None,
            created_at=datetime.now(),
        )
        db.session.add(entry)
        db.session.commit()
    except Exception:
        db.session.rollback()
        logger.exception("[Tâche] Journal impossible")
    finally:
        if temp_id:
            delete_image(temp_id)


@celery.task(name="pointage.journaliser")
def journaliser_task(log, temp_id=None):
    do_journaliser(log, temp_id)


# ============================================================
# Après un pointage réussi : notification + descripteur + journal
# ============================================================

def _notifier(payload):
    notification = Notification(
        idpointage=payload["idpointage"],
        idpers=payload["idpers"],
        description=payload["description"],
        etat=False,
    )
    db.session.add(notification)
    db.session.commit()

    _socketio().emit("pointage_update", {
        "idnotif": notification.id,
        "idpers": payload["idpers"],
        "idpointage": payload["idpointage"],
        "description": payload["description"],
        "etat": notification.etat,
        "date": payload["date_iso"],
    })


def _maj_descripteur(idpers, descriptor):
    personnel = Personnels.query.get(idpers)
    if personnel:
        personnel.set_faceapi_descriptor(np.array(descriptor, dtype=np.float32))
        db.session.commit()


def do_apres_pointage(payload):
    try:
        _notifier(payload)
    except Exception:
        db.session.rollback()
        logger.exception("[Tâche] Notification impossible")

    if payload.get("descriptor"):
        try:
            _maj_descripteur(payload["idpers"], payload["descriptor"])
        except Exception:
            db.session.rollback()
            logger.exception("[Tâche] Descripteur impossible")

    if payload.get("log"):
        do_journaliser(payload["log"], payload.get("temp_id"))


@celery.task(name="pointage.apres_pointage")
def apres_pointage_task(payload):
    do_apres_pointage(payload)


# ============================================================
# Apprentissage : écriture en base de l'embedding déjà mis à jour en mémoire
# ============================================================

def do_persister_embedding(idpers, emb_list):
    try:
        personnel = Personnels.query.get(int(idpers))
        if personnel:
            personnel.set_embedding(np.asarray(emb_list, dtype=np.float32))
            db.session.commit()
    except Exception:
        db.session.rollback()
        logger.exception("[Tâche] Embedding non enregistré pour %s", idpers)


@celery.task(name="pointage.persister_embedding")
def persister_embedding_task(idpers, emb_list):
    do_persister_embedding(idpers, emb_list)


# ============================================================
# Pointages vides d'un service (requêtes groupées)
# ============================================================

def do_creer_pointages_vides_service(idserv, jour_iso=None):
    jour = date.fromisoformat(jour_iso) if jour_iso else date.today()

    ids = [
        r.idpers
        for r in db.session.query(Personnels.idpers)
        .join(Divisions, Personnels.iddiv == Divisions.iddiv)
        .filter(Divisions.idserv == idserv)
        .all()
    ]
    if not ids:
        return 0

    existants = set()
    for part in _chunks(ids):
        existants.update(
            r.idpers
            for r in db.session.query(Pointage.idpers)
            .filter(Pointage.date == jour, Pointage.idpers.in_(part))
            .all()
        )

    manquants = [i for i in ids if i not in existants]
    if not manquants:
        return 0

    autorisations = {}
    for part in _chunks(manquants):
        for a in AutorisationAbsence.query.filter(
            AutorisationAbsence.date_absence == jour,
            AutorisationAbsence.idpers.in_(part),
        ).all():
            autorisations[a.idpers] = a.motif

    nouveaux = []
    for idpers in manquants:
        motif = None
        if idpers in autorisations:
            motif = f"Autorisation - {autorisations[idpers]}"
        conge = Conge.est_en_conge(idpers, jour)
        if conge:
            motif = f"Congé - {conge.motif}"
        est_autorise = motif is not None

        nouveaux.append(Pointage(
            idpers=idpers,
            date=jour,
            heure_entree_matin=None,
            heure_sortie_matin=None,
            heure_entree_soir=None,
            heure_sortie_soir=None,
            absence_matin=True if est_autorise else None,
            absence_soir=True if est_autorise else None,
            absence=est_autorise,
            presence=not est_autorise,
            retard_matin=False,
            retard_soir=False,
            retard_total_minutes=0,
            justificatif=motif,
        ))

    try:
        db.session.add_all(nouveaux)
        db.session.commit()
        crees = len(nouveaux)
    except IntegrityError:
        # Un employé a pointé pendant la création (contrainte UNIQUE idpers+date) :
        # les objets redeviennent "transient" après rollback, on repasse ligne par ligne.
        db.session.rollback()
        deja = set()
        for part in _chunks(manquants):
            deja.update(
                r.idpers
                for r in db.session.query(Pointage.idpers)
                .filter(Pointage.date == jour, Pointage.idpers.in_(part))
                .all()
            )
        crees = 0
        for p in nouveaux:
            if p.idpers in deja:
                continue
            try:
                db.session.add(p)
                db.session.commit()
                crees += 1
            except IntegrityError:
                db.session.rollback()

    logger.info("[Tâche] %s pointages vides créés (service %s, %s)", crees, idserv, jour)

    try:
        from utils.pointage_context import warm_personnel_contexts
        warm_personnel_contexts(ids)
    except Exception:
        logger.exception("[Tâche] Préchargement des contextes impossible")

    return crees


@celery.task(name="pointage.creer_pointages_vides", bind=True, max_retries=3, default_retry_delay=5)
def creer_pointages_vides_task(self, idserv, jour_iso=None):
    try:
        return do_creer_pointages_vides_service(idserv, jour_iso)
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            reset_once_per_day("pointages_vides", idserv)  # le prochain pointage relancera
        raise self.retry(exc=exc)


# ============================================================
# Absents du matin (UPDATE groupés au lieu d'une requête par employé)
# ============================================================

def do_marquer_absents_matin(jour_iso=None):
    jour = date.fromisoformat(jour_iso) if jour_iso else date.today()

    non_pointe = [
        Pointage.date == jour,
        Pointage.heure_entree_matin.is_(None),
        or_(Pointage.absence_matin.is_(None), Pointage.absence_matin == False),  # noqa: E712
    ]

    # Services dont le matin est férié (matin ou journée complète) : personne n'y est absent
    from utils.jours_feries import feries_du_jour

    services_feries = [i for i, f in feries_du_jour(jour).items() if f["matin"]]
    if services_feries:
        exclus = (
            db.session.query(Personnels.idpers)
            .join(Divisions, Personnels.iddiv == Divisions.iddiv)
            .filter(Divisions.idserv.in_(services_feries))
            .subquery()
        )
        non_pointe.append(Pointage.idpers.notin_(db.session.query(exclus.c.idpers)))

    # presence=False seulement si pas encore pointé l'après-midi
    # (évite d'écraser un pointage soir arrivé pendant la tâche)
    Pointage.query.filter(*non_pointe, Pointage.heure_entree_soir.is_(None)).update(
        {Pointage.presence: False}, synchronize_session=False
    )
    Pointage.query.filter(*non_pointe, Pointage.absence_soir.is_(None)).update(
        {Pointage.absence_matin: True, Pointage.absence: False}, synchronize_session=False
    )
    Pointage.query.filter(*non_pointe, Pointage.absence_soir.isnot(None)).update(
        {Pointage.absence_matin: True, Pointage.absence: Pointage.absence_soir},
        synchronize_session=False,
    )
    db.session.commit()

    # UPDATE groupé : pas d'after_flush -> invalidation manuelle
    _bump_month(jour)
    try:
        _socketio().emit("pointage_update")
    except Exception:
        pass

    logger.info("[Tâche] Absents du matin marqués (%s)", jour)


@celery.task(name="pointage.marquer_absents_matin", bind=True, max_retries=3, default_retry_delay=5)
def marquer_absents_matin_task(self, jour_iso=None):
    try:
        do_marquer_absents_matin(jour_iso)
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            reset_once_per_day("absents_matin")
        raise self.retry(exc=exc)


# ============================================================
# Tâches planifiées (celery beat)
# ============================================================

@celery.task(name="pointage.preparer_journee")
def preparer_journee_task():
    """05h30 : lignes vides + contextes Redis pour tous les services."""
    if date.today().weekday() >= 5:
        return

    jour_iso = date.today().isoformat()
    for (idserv,) in db.session.query(Services.idserv).all():
        if not once_per_day("pointages_vides", idserv):
            continue
        try:
            do_creer_pointages_vides_service(idserv, jour_iso)
        except Exception:
            db.session.rollback()
            reset_once_per_day("pointages_vides", idserv)
            logger.exception("[Beat] Pointages vides impossibles pour le service %s", idserv)


@celery.task(name="pointage.absents_matin_securite")
def absents_matin_securite_task():
    if date.today().weekday() >= 5:
        return
    if once_per_day("absents_matin"):
        try:
            do_marquer_absents_matin()
        except Exception:
            db.session.rollback()
            reset_once_per_day("absents_matin")
            raise
