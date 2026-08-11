from flask import Blueprint, request, jsonify, session
from datetime import datetime, time, date
from models import db, MacNonAutorisee,Conge,JournalTentativePointage,Client, Responsables, Divisions, Notification,Services ,AutorisationSpeciale,  TypeAutorisation,PeriodeAutorisation
from models.autorisationAbsence import AutorisationAbsence
from models.pointages import Pointage
from models.personnels import Personnels
from flask import send_file
from models.journalPointage import EtapePointage ,StatutPointage,TypePointage
from io import BytesIO
import re
import threading
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
import os
import shutil
from unittest.mock import patch
from sqlalchemy import func, case, select, union_all, literal
from utils.face_utils import verifier_face,update_personnel_embedding ,get_service_rows ,_detect_single_face
from __init__ import socketio
from excel import creer_fiche_presence,creer_fiche_presence_periode
import concurrent.futures
from sqlalchemy import or_ ,and_
import requests
import base64
from api.robotflow_service import get_roboflow_client ,ROBOFLOW_MODEL_ID
from PIL import Image
import traceback
import io
import cv2
import numpy as np
 
 
bp = Blueprint("facial_pointage_api", __name__)
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Réduire la verbosité des logs TensorFlow
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
FACE_DB_DIR = os.path.join(os.getcwd(), "face_db")  # chemin absolu face_db
TEMP_UPLOAD_DIR = os.path.join(os.getcwd(), "temp_upload")  # dossier temporaire

# Créer dossier temp_upload s'il n'existe pas
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)
os.makedirs(FACE_DB_DIR, exist_ok=True)
# now = datetime.combine(date.today(), time(16, 30, 0))


def creer_pointages_vides():
    today = date.today()

    # Empêche la duplication
    if Pointage.query.filter_by(date=today).first():
        print(f"[!] Les pointages du {today} existent déjà.")
        return

    personnels = Personnels.query.all()

    for p in personnels:
        est_autorise = False
        motif = None

        # Vérifie s’il a une autorisation d’absence aujourd’hui
        autorisation = AutorisationAbsence.query.filter_by(
            idpers=p.idpers, date_absence=today
        ).first()
        if autorisation:
            est_autorise = True
            motif = f"Autorisation - {autorisation.motif}"

        # Vérifie s’il est en congé accepté aujourd’hui
        conge = Conge.est_en_conge(p.idpers, today)
        if conge:
            est_autorise = True
            motif = f"Congé - {conge.motif}"

        if est_autorise:
            absence_matin = True
            absence_soir = True
            absence = True
            presence = False
        else:
            absence_matin = None
            absence_soir = None
            absence = False
            presence = True

        pointage = Pointage(
            idpers=p.idpers,
            date=today,
            heure_entree_matin=None,
            heure_sortie_matin=None,
            heure_entree_soir=None,
            heure_sortie_soir=None,
            absence_matin=absence_matin,
            absence_soir=absence_soir,
            absence=absence,
            presence=presence,
            retard_matin=False,
            retard_soir=False,
            retard_total_minutes=0,
            justificatif=motif,
        )

        db.session.add(pointage)

    db.session.commit()
   
   
    print(
        f"[✓] Pointages vides créés pour {len(personnels)} employés à la date {today}."
    )


from datetime import date

from datetime import date


def creer_pointages_vides_par_service(idpers_ref):
    today = date.today()

    # 1️⃣ Personnel de référence
    personnel_ref = Personnels.query.get(idpers_ref)
    if not personnel_ref:
        print("[!] Personnel introuvable.")
        return

    if not personnel_ref.iddiv:
        print("[!] Ce personnel n'est rattaché à aucune division.")
        return

    # 2️⃣ Service via la division
    division = Divisions.query.get(personnel_ref.iddiv)
    if not division:
        print("[!] Division introuvable.")
        return

    idserv = division.idserv

    # 3️⃣ Vérifier s'il existe déjà des pointages pour ce service aujourd’hui
    existe = (
        Pointage.query.join(Personnels, Pointage.idpers == Personnels.idpers)
        .join(Divisions, Personnels.iddiv == Divisions.iddiv)
        .filter(Divisions.idserv == idserv, Pointage.date == today)
        .first()
    )

    if existe:
        print(f"[!] Les pointages du service {idserv} existent déjà pour {today}.")
        return

    # 4️⃣ Tous les personnels du même service
    personnels = (
        Personnels.query.join(Divisions, Personnels.iddiv == Divisions.iddiv)
        .filter(Divisions.idserv == idserv)
        .all()
    )

    for p in personnels:
        est_autorise = False
        motif = None

        autorisation = AutorisationAbsence.query.filter_by(
            idpers=p.idpers, date_absence=today
        ).first()

        if autorisation:
            est_autorise = True
            motif = f"Autorisation - {autorisation.motif}"

        conge = Conge.est_en_conge(p.idpers, today)
        if conge:
            est_autorise = True
            motif = f"Congé - {conge.motif}"

        pointage = Pointage(
            idpers=p.idpers,
            date=today,
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
        )

        db.session.add(pointage)

    db.session.commit()

    print(
        f"[✓] Pointages vides créés pour {len(personnels)} personnels du service {idserv} à la date {today}."
    )


@bp.route("/creer-vides", methods=["POST"])
def creer_pointages_vides_par_responsable():
    data = request.get_json()

    idrh = data.get("idrh")
    date_str = data.get("date")

    if not idrh or not date_str:
        return jsonify({"error": "idrh et date requis"}), 400

    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Format de date invalide (YYYY-MM-DD)"}), 400

    responsable = Responsables.query.get(idrh)
    if not responsable:
        return jsonify({"error": "Responsable introuvable"}), 404

    personnels = Personnels.query.filter_by(idrh=idrh).all()
    if not personnels:
        return jsonify({"message": "Aucun personnel rattaché à ce responsable"}), 200

    cree = 0
    ignores = 0

    for p in personnels:
        # 🔒 NE PAS TOUCHER aux pointages existants
        existe = Pointage.query.filter_by(idpers=p.idpers, date=date_obj).first()

        if existe:
            ignores += 1
            continue

        # ---- Vérifier autorisation / congé ----
        est_autorise = False
        motif = None

        autorisation = AutorisationAbsence.query.filter_by(
            idpers=p.idpers, date_absence=date_obj
        ).first()

        if autorisation:
            est_autorise = True
            motif = f"Autorisation - {autorisation.motif}"

        conge = Conge.est_en_conge(p.idpers, date_obj)
        if conge:
            est_autorise = True
            motif = f"Congé - {conge.motif}"

        # ---- Création pointage vide ----
        pointage = Pointage(
            idpers=p.idpers,
            date=date_obj,
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
        )

        db.session.add(pointage)
        cree += 1

    # 🧠 CAS : tout le monde avait déjà un pointage
    if cree == 0:
        return (
            jsonify(
                {
                    "message": "Tous les personnels possèdent déjà un pointage pour cette date",
                    "date": date_obj.isoformat(),
                    "responsable": f"{responsable.nom} {responsable.prenom}",
                    "pointages_crees": 0,
                    "pointages_existants": ignores,
                }
            ),
            200,
        )

    db.session.commit()
    socketio.emit(
      "pointage_update",
    )
    return (
        jsonify(
            {
                "message": "Création des pointages manquants terminée",
                "date": date_obj.isoformat(),
                "responsable": f"{responsable.nom} {responsable.prenom}",
                "pointages_crees": cree,
                "pointages_existants": ignores,
            }
        ),
        201,
    )


from datetime import date, time, datetime, timedelta


@bp.route("/inserer_pointages_personnalises", methods=["POST"])
def inserer_pointages_personnalises():
    today = date.today()
    count_created = 0

    try:
        personnels = Personnels.query.all()

        for p in personnels:
            # Vérifier si le pointage existe déjà
            pointage_existant = Pointage.query.filter_by(
                idpers=p.idpers, date=today
            ).first()

            if pointage_existant:
                continue

            # Décalage léger
            decalage_minutes = p.idpers % 30

            # Heures
            entree_matin_dt = datetime.combine(today, time(8, 0)) + timedelta(
                minutes=decalage_minutes
            )
            sortie_matin_dt = datetime.combine(today, time(12, 0)) + timedelta(
                minutes=decalage_minutes
            )
            entree_soir_dt = datetime.combine(today, time(13, 30)) + timedelta(
                minutes=decalage_minutes
            )
            sortie_soir_dt = datetime.combine(today, time(17, 30)) + timedelta(
                minutes=decalage_minutes
            )

            # Minutes de retard
            retard_matin_minutes = max(
                0,
                int(
                    (
                        entree_matin_dt - datetime.combine(today, time(8, 10))
                    ).total_seconds()
                    // 60
                ),
            )

            retard_soir_minutes = max(
                0,
                int(
                    (
                        entree_soir_dt - datetime.combine(today, time(14, 0))
                    ).total_seconds()
                    // 60
                ),
            )

            retard_total = retard_matin_minutes + retard_soir_minutes

            pointage = Pointage(
                idpers=p.idpers,
                date=today,
                heure_entree_matin=entree_matin_dt,
                heure_sortie_matin=sortie_matin_dt,
                heure_entree_soir=entree_soir_dt,
                heure_sortie_soir=sortie_soir_dt,
                # ✅ Boolean uniquement
                retard_matin=retard_matin_minutes > 0,
                retard_soir=retard_soir_minutes > 0,
                # ✅ minutes ici
                retard_total_minutes=retard_total,
                absence_matin=False,
                absence_soir=False,
                absence=False,
                presence=True,
                justificatif=None,
                autorisation_id=None,
            )

            db.session.add(pointage)
            count_created += 1

        db.session.commit()

        return (
            jsonify(
                {
                    "message": f"{count_created} pointages personnalisés insérés avec succès.",
                    "date": today.isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route("/mettre_2_personnels_absents", methods=["POST"])
def mettre_2_personnels_absents():
    hier = date.today() - timedelta(days=1)
    ids_personnels = [84, 82]  # 🔴 mets ici les 2 idpers
    count_created = 0

    try:
        for idpers in ids_personnels:
            # Vérifier si le pointage existe déjà
            pointage = Pointage.query.filter_by(idpers=idpers, date=hier).first()

            if pointage:
                # Mettre à jour en absence
                pointage.absence_matin = True
                pointage.absence_soir = True
                pointage.absence = True
                pointage.presence = False
                pointage.retard_matin = False
                pointage.retard_soir = False
                pointage.retard_total_minutes = 0
            else:
                # Créer le pointage absent
                pointage = Pointage(
                    idpers=idpers,
                    date=hier,
                    heure_entree_matin=None,
                    heure_sortie_matin=None,
                    heure_entree_soir=None,
                    heure_sortie_soir=None,
                    absence_matin=True,
                    absence_soir=True,
                    absence=True,
                    presence=False,
                    retard_matin=False,
                    retard_soir=False,
                    retard_total_minutes=0,
                    justificatif=None,
                    autorisation_id=None,
                )
                db.session.add(pointage)
                count_created += 1

        db.session.commit()

        return (
            jsonify(
                {
                    "message": "2 personnels marqués absents avec succès",
                    "date": hier.isoformat(),
                    "ids_personnels": ids_personnels,
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route("/mettre_pointages_hier", methods=["POST"])
def mettre_pointages_hier():
    hier = date.today() - timedelta(days=1)
    ids_absents = [84, 82]  # 🔴 Les 2 personnels absents
    count_absents = 0
    count_presents = 0

    try:
        personnels = Personnels.query.all()

        for p in personnels:
            pointage = Pointage.query.filter_by(idpers=p.idpers, date=hier).first()

            if p.idpers in ids_absents:
                # 🔴 Absent
                if not pointage:
                    pointage = Pointage(
                        idpers=p.idpers,
                        date=hier,
                        heure_entree_matin=None,
                        heure_sortie_matin=None,
                        heure_entree_soir=None,
                        heure_sortie_soir=None,
                        retard_matin=False,
                        retard_soir=False,
                        retard_total_minutes=0,
                        absence_matin=True,
                        absence_soir=True,
                        absence=True,
                        presence=False,
                        justificatif=None,
                        autorisation_id=None,
                    )
                    db.session.add(pointage)
                else:
                    pointage.absence_matin = True
                    pointage.absence_soir = True
                    pointage.absence = True
                    pointage.presence = False
                    pointage.retard_matin = False
                    pointage.retard_soir = False
                    pointage.retard_total_minutes = 0

                count_absents += 1

            else:
                # ✅ Présent
                decalage_minutes = p.idpers % 30
                # Horaires
                entree_matin_dt = datetime.combine(hier, time(7, 0)) + timedelta(
                    minutes=decalage_minutes
                )
                sortie_matin_dt = datetime.combine(hier, time(12, 0)) + timedelta(
                    minutes=decalage_minutes
                )
                entree_soir_dt = datetime.combine(hier, time(13, 10)) + timedelta(
                    minutes=decalage_minutes
                )
                sortie_soir_dt = datetime.combine(hier, time(16, 30)) + timedelta(
                    minutes=decalage_minutes
                )

                # Calcul des retards
                retard_matin_minutes = max(
                    0,
                    int(
                        (
                            entree_matin_dt - datetime.combine(hier, time(8, 10))
                        ).total_seconds()
                        // 60
                    ),
                )
                retard_soir_minutes = max(
                    0,
                    int(
                        (
                            entree_soir_dt - datetime.combine(hier, time(14, 0))
                        ).total_seconds()
                        // 60
                    ),
                )
                retard_total = retard_matin_minutes + retard_soir_minutes

                if not pointage:
                    pointage = Pointage(
                        idpers=p.idpers,
                        date=hier,
                        heure_entree_matin=entree_matin_dt,
                        heure_sortie_matin=sortie_matin_dt,
                        heure_entree_soir=entree_soir_dt,
                        heure_sortie_soir=sortie_soir_dt,
                        retard_matin=retard_matin_minutes > 0,
                        retard_soir=retard_soir_minutes > 0,
                        retard_total_minutes=retard_total,
                        absence_matin=False,
                        absence_soir=False,
                        absence=False,
                        presence=True,
                        justificatif=None,
                        autorisation_id=None,
                    )
                    db.session.add(pointage)
                else:
                    # Mettre à jour les heures et retards
                    pointage.heure_entree_matin = entree_matin_dt
                    pointage.heure_sortie_matin = sortie_matin_dt
                    pointage.heure_entree_soir = entree_soir_dt
                    pointage.heure_sortie_soir = sortie_soir_dt
                    pointage.retard_matin = retard_matin_minutes > 0
                    pointage.retard_soir = retard_soir_minutes > 0
                    pointage.retard_total_minutes = retard_total
                    pointage.absence_matin = False
                    pointage.absence_soir = False
                    pointage.absence = False
                    pointage.presence = True

                count_presents += 1

        db.session.commit()

        return (
            jsonify(
                {
                    "message": f"{count_absents} absents et {count_presents} présents enregistrés pour hier avec heures.",
                    "date": hier.isoformat(),
                    "ids_absents": ids_absents,
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


def marquer_absents_matin_non_pointes():
    today = date.today()
    # Tous les personnels
    personnels = Personnels.query.all()
    for p in personnels:
        pointage = Pointage.query.filter_by(idpers=p.idpers, date=today).first()
        if pointage:
            # Si pas encore pointé le matin et absence_matin non définie
            if pointage.heure_entree_matin is None and (
                pointage.absence_matin is None or not pointage.absence_matin
            ):
                pointage.absence_matin = True
                # Si absence_matin True et absence_soir None => absence globale False pour le moment
                pointage.absence = (
                    pointage.absence_soir and pointage.absence_matin
                    if pointage.absence_soir is not None
                    else False
                )
                pointage.presence = False
                db.session.add(pointage)
    db.session.commit()


def check_absents_matin(idserv):
    today = datetime.now().date()
    if datetime.now().weekday() >= 5:
       return
    # 🔹 uniquement les personnels non-surface du service
    personnels = (
    Personnels.query.join(Divisions)
    .filter(Divisions.idserv == idserv, Personnels.role != "surface")
    .all()
)

    for perso in personnels:
        pointage = Pointage.query.filter_by(idpers=perso.idpers, date=today).first()
        autorisation = AutorisationAbsence.query.filter_by(
            idpers=perso.idpers, date_absence=today
        ).first()
        motif = autorisation.motif if autorisation else None

        if pointage:
            if pointage.heure_entree_matin is None or pointage.heure_sortie_matin is None:
                pointage.absence_matin = True
                pointage.retard_matin = False
                # Absence globale seulement si le soir est aussi absent
                pointage.absence = True if pointage.absence_soir else None
                if pointage.justificatif is None:
                    pointage.justificatif = motif
        else:
            new_pointage = Pointage(
                idpers=perso.idpers,
                date=today,
                absence_matin=True,
                absence_soir=None,
                absence=True,
                retard_matin=False,
                retard_soir=False,
                retard_total_minutes=0,
                heure_entree_matin=None,
                heure_sortie_matin=None,
                heure_entree_soir=None,
                heure_sortie_soir=None,
                justificatif=motif,
            )
            db.session.add(new_pointage)

    db.session.commit()
    socketio.emit("pointage_update")
    print(f"✅ check_absents_matin : absences matin mises à jour pour le service {idserv}")

def check_absents_apres_midi(idserv):
    today = datetime.now().date()
    if datetime.now().weekday() >= 5:
       return
    # Récupérer tous les personnels du service
    personnels = (
    Personnels.query.join(Divisions)
    .filter(Divisions.idserv == idserv)
    .all()
)
    for perso in personnels:
        pointage = Pointage.query.filter_by(idpers=perso.idpers, date=today).first()
        autorisation = AutorisationAbsence.query.filter_by(
            idpers=perso.idpers, date_absence=today
        ).first()
        motif = autorisation.motif if autorisation else None

        if perso.role == "surface":
            # Personnels surface → absence unique
            if pointage:
                if not pointage.heure_entree_unique or not pointage.heure_sortie_unique:
                    pointage.absence_unique = True
                    if pointage.justificatif is None:
                        pointage.justificatif = motif
            else:
                pointage = Pointage(
                    idpers=perso.idpers,
                    date=today,
                    absence_unique=True,
                    heure_entree_unique=None,
                    heure_sortie_unique=None,
                    retard_matin=False,
                    retard_soir=False,
                    retard_total_minutes=0,
                    absence_matin=None,
                    absence_soir=None,
                    absence=None,
                    justificatif=motif,
                )
                db.session.add(pointage)

        else:
            # Personnels non-surface → absence après-midi
            if pointage:
                if pointage.heure_entree_soir is None or pointage.heure_sortie_soir is None:
                    pointage.absence_soir = True
                    pointage.retard_soir = False
                    pointage.absence = pointage.absence_matin or pointage.absence_soir
                    if pointage.justificatif is None:
                        pointage.justificatif = motif
            else:
                pointage = Pointage(
                    idpers=perso.idpers,
                    date=today,
                    absence_soir=True,
                    absence=True,
                    retard_matin=False,
                    retard_soir=False,
                    retard_total_minutes=0,
                    heure_entree_matin=None,
                    heure_sortie_matin=None,
                    heure_entree_soir=None,
                    heure_sortie_soir=None,
                    absence_matin=None,
                    absence_unique=None,
                    justificatif=motif,
                )
                db.session.add(pointage)

    db.session.commit()
    socketio.emit("pointage_update")
    print(f"✅ check_absents_apres_midi : absences après-midi mises à jour pour le service {idserv}")

@bp.route("/cloture/matin/<int:idserv>", methods=["POST"])
def cloture_pointage_matin(idserv):
    try:
        check_absents_matin(idserv)
        return (
            jsonify({"message": "Clôture du pointage matin effectuée avec succès"}),
            200,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/cloture/apres/<int:idserv>", methods=["POST"])
def cloture_pointage_apres(idserv):
    try:
        check_absents_apres_midi(idserv)
        return (
            jsonify(
                {"message": "Clôture du pointage apres-midi effectuée avec succès"}
            ),
            200,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def check_absents_soir():
    now = datetime.now()
    today = date.today()
    if datetime.now().weekday() >= 5:
       return
    if now.time() < time(14, 00):
        print("[INFO] Trop tôt pour vérifier l'absence du soir.")
        return

    pointages = Pointage.query.filter_by(date=today).all()
    for pointage in pointages:
        # Vérifie uniquement si heure_entree_soir est vide
        if pointage.heure_entree_soir is None:
            pointage.absence_soir = True

            # 🔍 Rechercher une autorisation d'absence pour la même personne à la même date
            autorisation = AutorisationAbsence.query.filter_by(
                idpers=pointage.idpers, date_absence=today
            ).first()

            if autorisation:
                pointage.justificatif = autorisation.motif
            else:
                pointage.justificatif = None
        # Sinon ne rien changer à absence_soir ni justification

        # Mettre à jour les champs globaux
        if pointage.absence_matin is not None and pointage.absence_soir is not None:
            pointage.absence = pointage.absence_matin and pointage.absence_soir
            pointage.presence = not pointage.absence
        else:
            pointage.absence = None
            pointage.presence = None

    db.session.commit()
    print("[✓] Absence du soir vérifiée, avec justificatifs pris en compte.")


from flask import request


@bp.route("/notifications/<int:id>", methods=["DELETE"])
def delete_notification(id):
    try:
        notif = Notification.query.get(id)
        if not notif:
            return jsonify({"error": "Notification non trouvée"}), 404

        # Supprimer la notification
        db.session.delete(notif)
        db.session.commit()

        return jsonify({"message": "Notification supprimée avec succès"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route("/notifications", methods=["GET"])
def get_notifications_service():
    # 🔹 Récupérer l'id du service depuis les paramètres GET
    idserv = request.args.get("idserv", type=int)
    if not idserv:
        return jsonify({"error": "Paramètre 'idserv' requis"}), 400

    # 🔹 Récupérer tous les personnels de ce service via la table Divisions
    personnels_ids = [
        p.idpers
        for p in Personnels.query.join(Divisions)
        .filter(Divisions.idserv == idserv)
        .all()
    ]

    if not personnels_ids:
        return jsonify([])  # pas de personnels → pas de notifications

    # 🔹 Récupérer notifications des personnels du service
    notifications = (
        Notification.query.filter(Notification.idpers.in_(personnels_ids))
        .order_by(Notification.created_at.desc())
        .all()
    )

    # 🔹 Retour JSON avec image
    return jsonify(
        [
            {
                "id": n.id,
                "idpointage": n.idpointage,
                "idpers": n.idpers,
                "description": n.description,
                "etat": n.etat,
                "created_at": n.created_at.isoformat(),
                "image": n.personnel.image if n.personnel else None,  # 🔹 ajout image
            }
            for n in notifications
        ]
    )


@bp.route('/metrics/recent-performance', methods=['GET'])
def get_recent_performance_metrics():
    mac_param = request.args.get('mac', type=str)

    query = JournalTentativePointage.query.filter(
    JournalTentativePointage.etape == EtapePointage.ENREGISTREMENT
)
    if mac_param:
        query = query.filter(JournalTentativePointage.mac_address == mac_param)

    recent_logs = (
        query.order_by(JournalTentativePointage.id.desc())
        .limit(15)
        .all()
    )
    recent_logs.reverse()

    total_times = []
    heures = []
    current_mac = mac_param or (recent_logs[-1].mac_address if recent_logs else "Toutes")

    for log in recent_logs:
        detail = {}
        if log.temps_detail:
            try:
                detail = json.loads(str(log.temps_detail))
            except Exception:
                detail = {}

        visual_ms = detail.get("visuel", 0)
        ident_ms = detail.get("identification", 0)
        total_ms = log.temps_ms or (visual_ms + ident_ms)
        total_times.append(round(total_ms, 1))
        heures.append(log.created_at.strftime("%Hh%M"))

    if not total_times:
        total_times = [0]
        heures = ["--"]

    moyenne_actuelle = round(sum(total_times) / len(total_times), 1)

    return jsonify({
        "macAddress": current_mac,
        "vitesseTraitement": {
            "title": "Vitesse de Traitement (Temps Total)",
            "unit": "ms",
            "data": total_times,
            "labels": heures,
            "color": "#38bdf8"
        },
        "moyenne": {
            "title": "Moyenne (15 derniers)",
            "unit": "ms",
            "value": moyenne_actuelle,
            "data": total_times,
            "color": "#7fd8ff"
        }
    })
     
import time

import json

def log_tentative_pointage(etape, statut, message, 
                           idpers=None, role=None,
                           score_face=None, second_score=None, 
                           image_path=None, image_bytes=None,
                           mac_address=None, type_pointage=None,
                           temps_ms=None,
                           temps_detail=None):
    """
    Log une tentative de pointage avec mesures de performance.
    Adapté pour Oracle Database.
    """
    try:
        # Lecture de l'image
        photo_data = None
        print("=" * 60)
        print("image_path :", image_path)
        print("image_bytes:", image_bytes is not None)

        if image_path:
          print("exists :", os.path.exists(image_path))
        if image_bytes is not None:
            photo_data = image_bytes
        elif image_path and os.path.exists(image_path):
            with open(image_path, "rb") as f:
                photo_data = f.read()
        
        # Gestion des enum
        etape_value = etape.value if hasattr(etape, 'value') else etape
        statut_value = statut.value if hasattr(statut, 'value') else statut
        type_value = type_pointage.value if hasattr(type_pointage, 'value') else type_pointage
        
        # 🔧 CONVERTIR temps_detail en JSON string pour Oracle
        temps_detail_json = None
        if temps_detail is not None:
            try:
                temps_detail_json = json.dumps(temps_detail, ensure_ascii=False)
            except Exception as e:
                print(f"[LOG_WARNING] Impossible de sérialiser temps_detail: {e}")
                temps_detail_json = '{"error": "serialization_failed"}'
        
        # Création de l'entrée
        entry = JournalTentativePointage(
            idpers=idpers,
            role=role,
            etape=etape_value,
            statut=statut_value,
            type_pointage=type_value,
            message=str(message)[:4000],  # Oracle VARCHAR2 max
            score_face=score_face,
            second_score=second_score,
            photo=photo_data,
            mac_address=mac_address,
            temps_ms=round(temps_ms, 3) if temps_ms is not None else None,
            temps_detail=temps_detail_json,  # ✅ Stocké en tant que string JSON
            created_at=datetime.now()
        )
        
        db.session.add(entry)
        db.session.commit()
        
        # Log console
        if temps_ms is not None:
            print(f"[PERF] {etape_value} | {statut_value} | {temps_ms:.2f}ms | {message[:50]}")
        
        return entry
        
    except Exception as e:
        print(f"[LOG_ERROR] Impossible d'enregistrer le log: {e}")
        db.session.rollback()
        return None
    
@bp.route("/notifications/<int:idnotif>/read", methods=["POST"])
def mark_notification_read(idnotif):
    notif = Notification.query.get_or_404(idnotif)
    notif.etat = True
    db.session.commit()
    return jsonify({"success": True})


@bp.route("/facial_client_sortie_responsable", methods=["POST"])
def sortie_facial_client_responsable():

    idrh = request.args.get("idrh", type=int)
    if not idrh:
        return jsonify({"error": "Responsable non identifié"}), 400

    if "image" not in request.files:
        return jsonify({"error": "Aucune image envoyée"}), 400

    image_file = request.files["image"]
    image_path = os.path.join(TEMP_UPLOAD_DIR, image_file.filename)
    image_file.save(image_path)

    # ------------------ FONCTION AVEC TIMEOUT ------------------
    def traitement_facial(image_path):

        from api.antispoof_api import predict_spoof

        # 🔹 Anti-spoof
        spoof_result = predict_spoof(image_path)

        if not spoof_result.get("success", False):
            return {"error": "Erreur lors de l'analyse du visage"}, 400

        result_label = spoof_result.get("result", "").lower()
        score = float(spoof_result.get("score", 0))

        if result_label != "real" or score < 0.7:
            return {
                "error": "Visage suspect détecté (spoofing)",
                "score": score,
                "type": result_label
            }, 403

        # 🔹 Vérification faciale
        role, id_value, emb, score_face, second_score = verifier_face(
    image_path,
    threshold=0.48,
    min_gap=0.10,
    top2_check=True
)

        if not role:
             return {"error": "Visage non reconnu"}, 401
 
        return {
    "role": role,
    "id_value": id_value,
    "emb": emb,
    "score": score_face,
    "second_score": second_score
}, 200
        

    try:

        # ⏱️ Timeout 10 secondes
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(traitement_facial, image_path)
            result, status_code = future.result(timeout=10)

        if status_code != 200:
            os.remove(image_path)
            return jsonify(result), status_code

        role = result["role"]
        id_value = result["id_value"]
        emb = result["emb"]
        score_face = result["score"]
        second_score = result["second_score"]

        now = datetime.now()
        heure = now.time()
        heure_str = now.strftime("%Hh:%M")
        today = now.date()

        # -------------------------
        # CAS PERSONNEL
        # -------------------------
        if role == "personnel":

            personnel = Personnels.query.get(id_value)

            if not personnel:
                os.remove(image_path)
                return jsonify({"error": "Personnel introuvable"}), 404

            # 🔒 Vérification stricte du responsable
            if personnel.idrh != int(idrh):
                os.remove(image_path)
                return jsonify({"error": "Sortie non autorisée"}), 403
            # 🔴 Bloquer la sortie pour agent de surface
           
            # ✅ Update embedding adaptatif
            update_personnel_embedding(
    id_value,
    emb,
    score_face,
    second_score,
    alpha=0.15,           # apprentissage lent et stable
    min_score_update=0.65,
    min_gap=0.15
)

            pointage = Pointage.query.filter_by(
                idpers=id_value,
                date=today
            ).first()

            client = Client.query.filter_by(idpers=id_value).first()
            if personnel and personnel.role == "surface":
                if not pointage:
                    os.remove(image_path)
                    return jsonify({"error": "Aucune entrée trouvée aujourd'hui."}), 400

    # ❌ Déjà marqué absent
                if pointage.absence_unique:
                       os.remove(image_path)
                       return jsonify({"error": "Agent déjà marqué absent aujourd'hui."}), 400

    # ❌ Pas d'entrée unique
                if not pointage.heure_entree_unique:
                     os.remove(image_path)
                     return jsonify({"error": "Entrée non trouvée."}), 400

    # ❌ Déjà une sortie enregistrée
                if pointage.heure_sortie_unique:
                      ancienne = pointage.heure_sortie_unique.strftime("%Hh:%M")
                      os.remove(image_path)
                      return jsonify({
            "error": f"Sortie déjà enregistrée à {ancienne}"
        }), 400

    # ⏱ Vérification délai minimum = entrée + 1 heure
                entree_time = pointage.heure_entree_unique
                sortie_autorisee_apres = (
        datetime.combine(today, entree_time) + timedelta(hours=1)
    )

                if now < sortie_autorisee_apres:
                     os.remove(image_path)
                     return jsonify({
            "error": "La sortie n'est pas autorisée "
        }), 400

    # ✅ Enregistrer sortie unique
                pointage.heure_sortie_unique = now

                notif_description = (
        f"Sortie enregistrée (surface) pour {personnel.matricule}"
    )

                notification = Notification(
        idpointage=pointage.id,
        idpers=personnel.idpers,
        description=notif_description,
        etat=False,
    )

                db.session.add(notification)
                db.session.commit()

                socketio.emit(
        "pointage_update",
        {
            "idnotif": notification.id,
            "idpers": personnel.idpers,
            "idpointage": pointage.id,
            "description": notif_description,
            "etat": notification.etat,
            "date": pointage.date.isoformat(),
        },
    )

                os.remove(image_path)
 
            
                return jsonify({
        "message": "Sortie enregistrée avec succès (agent de surface)",
        "personnel": personnel.to_dict(),
        "heure_de_sortie": heure_str,
        "pointage": pointage.to_dict(),
    }), 200

            if not pointage or (
                not pointage.heure_entree_matin and
                not pointage.heure_entree_soir
            ):
                os.remove(image_path)
                return jsonify({
                    "error": "Aucune entrée trouvée aujourd'hui."
                }), 400

            # ---------------- SORTIE MATIN ----------------
            if time(11, 40) <= heure <= time(12, 40):

                if pointage.absence_matin:
                    os.remove(image_path)
                    return jsonify({
                        "error": "Déjà marqué absent le matin."
                    }), 400

                if not pointage.heure_entree_matin:
                    os.remove(image_path)
                    return jsonify({
                        "error": "Entrée du matin non pointée."
                    }), 400

                if pointage.heure_sortie_matin:
                    ancienne = pointage.heure_sortie_matin.strftime("%Hh:%M")
                    os.remove(image_path)
                    return jsonify({
                        "error": f"Sortie du matin déjà pointée à {ancienne}"
                    }), 400

                pointage.heure_sortie_matin = now
                periode = "matin"

            # ---------------- SORTIE APRÈS-MIDI ----------------
            elif time(15, 50) <= heure <= time(23, 0):

                if pointage.absence_soir:
                    os.remove(image_path)
                    return jsonify({
                        "error": "Déjà marqué absent l’après-midi."
                    }), 400

                if not pointage.heure_entree_soir:
                    os.remove(image_path)
                    return jsonify({
                        "error": "Entrée de l'après-midi non pointée."
                    }), 400

                if pointage.heure_sortie_soir:
                    ancienne = pointage.heure_sortie_soir.strftime("%Hh:%M")
                    os.remove(image_path)
                    return jsonify({
                        "error": f"Sortie de l'après-midi déjà pointée à {ancienne}"
                    }), 400

                pointage.heure_sortie_soir = now
                periode = "après-midi"

            else:
                os.remove(image_path)
                return jsonify({
                    "error": "Heure non valide pour pointer une sortie."
                }), 400

            # 🔔 Notification
            notif_description = f"Sortie {periode} enregistrée pour {personnel.matricule}"

            notification = Notification(
                idpointage=pointage.id,
                idpers=personnel.idpers,
                description=notif_description,
                etat=False,
            )

            db.session.add(notification)
            db.session.commit()

            socketio.emit(
                "pointage_update",
                {
                    "idnotif": notification.id,
                    "idpers": personnel.idpers,
                    "idpointage": pointage.id,
                    "description": notif_description,
                    "etat": notification.etat,
                    "date": pointage.date.isoformat(),
                },
            )

            os.remove(image_path)

            return jsonify({
                "message": f"Sortie enregistrée avec succès pour  {personnel.matricule}",
                "personnel": personnel.to_dict(),
                "client": client.to_dict() if client else None,
                "heure_de_sortie": heure_str,
                "pointage": pointage.to_dict(),
            }), 200

        os.remove(image_path)
        return jsonify({"error": "Rôle non autorisé"}), 403

    # ⏱️ TIMEOUT
    except concurrent.futures.TimeoutError:
        if os.path.exists(image_path):
            os.remove(image_path)
        return jsonify({
            "error": "Erreur de connexion, veuillez réessayer"
        }), 504

    except Exception as e:
        if os.path.exists(image_path):
            os.remove(image_path)
        return jsonify({"error": str(e)}), 500

@bp.route("/facial_client_sortie_personnel/step4-enregistrer", methods=["POST"])
def sortie_facial_client_personnel_step4_enregistrer():
    if datetime.now().weekday() >= 5:
        return jsonify({"error": "On est weekend !"}), 400

    data = request.get_json()
    if not data:
        return jsonify({"error": "Corps de requête JSON requis"}), 400

    idpers = data.get("idpers") or request.args.get("idpers", type=int)
    if not idpers:
        return jsonify({"error": "Personnel non identifié"}), 400

    role = data.get("role")
    id_value = data.get("id_value")
    emb_list = data.get("emb")
    score_face = data.get("score_face")
    second_score = data.get("second_score")
    descriptor_list = data.get("face_descriptor")

    if not role or id_value is None:
        return jsonify({"error": "Données de reconnaissance manquantes"}), 400

    import numpy as np

    emb = np.array(emb_list, dtype=np.float32) if emb_list is not None else None
    face_descriptor = (
        np.array(descriptor_list, dtype=np.float32) if descriptor_list else None
    )

    try:
        # 🔒 Sécurité : correspondance idpers
        if role != "personnel" or id_value != idpers:
            return jsonify({"error": "Sortie non autorisée"}), 403

        now = datetime.now()
        heure = now.time()
        heure_str = now.strftime("%Hh:%M")
        today = now.date()

        personnel = Personnels.query.get(id_value)
        if not personnel:
            return jsonify({"error": "Personnel introuvable"}), 404

        horaires = personnel.division.service.horaire
        if not horaires:
            return jsonify({"error": "Horaires non configurés pour ce service"}), 500

        update_personnel_embedding(
            id_value,
            emb,
            score_face,
            second_score,
            alpha=0.15,
            min_score_update=0.65,
            min_gap=0.15
        )

        pointage = Pointage.query.filter_by(
            idpers=id_value,
            date=today
        ).first()

        client = Client.query.filter_by(idpers=id_value).first()

        # 🔴 Cas agent de surface
        if personnel and personnel.role == "surface":
            autorisation_ok_srtuface = a_autorisation_sortie_surface(id_value, today)

            if not pointage:
                return jsonify({"error": "Aucune entrée trouvée aujourd'hui."}), 400

            if pointage.absence_unique:
                return jsonify({"error": "Agent déjà marqué absent aujourd'hui."}), 400

            if not pointage.heure_entree_unique:
                return jsonify({"error": "Entrée non trouvée."}), 400

            if pointage.heure_sortie_unique:
                ancienne = pointage.heure_sortie_unique.strftime("%Hh:%M")
                return jsonify({
                    "error": f"Sortie déjà enregistrée à {ancienne}"
                }), 400

            entree_time = pointage.heure_entree_unique
            if isinstance(entree_time, datetime):
                entree_time = entree_time.time()

            sortie_autorisee_apres = datetime.combine(today, entree_time) + timedelta(hours=1)

            if now < sortie_autorisee_apres:
                if not autorisation_ok_srtuface:
                    return jsonify({
                        "error": "La sortie n'est pas autorisée"
                    }), 403

            pointage.heure_sortie_unique = now

            notif_description = (
                f"Sortie enregistrée (surface) pour {personnel.matricule}"
            )

            notification = Notification(
                idpointage=pointage.id,
                idpers=personnel.idpers,
                description=notif_description,
                etat=False,
            )

            db.session.add(notification)
            db.session.commit()
            if face_descriptor is not None:
                personnel = Personnels.query.get(idpers)
                if personnel:
                    personnel.set_faceapi_descriptor(face_descriptor)
                    db.session.commit()

            socketio.emit(
                "pointage_update",
                {
                    "idnotif": notification.id,
                    "idpers": personnel.idpers,
                    "idpointage": pointage.id,
                    "description": notif_description,
                    "etat": notification.etat,
                    "date": pointage.date.isoformat(),
                },
            )

            return jsonify({
                "message": "Sortie enregistrée avec succès (agent de surface)",
                "speech": "Sortie d'agent de surface enregistré avec succès",
                "personnel": personnel.to_dict(),
                "heure_de_sortie": heure_str,
                "pointage": pointage.to_dict(),
            }), 200

        if not pointage or (
            not pointage.heure_entree_matin and
            not pointage.heure_entree_soir
        ):
            return jsonify({
                "error": "Aucune entrée trouvée aujourd'hui."
            }), 400

        # ---------------- Période "générale" (pour la recherche d'autorisation) ----------------
        if heure < to_time(horaires.entree_soir_debut):
            periode_actuelle = PeriodeAutorisation.matin
        else:
            periode_actuelle = PeriodeAutorisation.apres_midi

        autorisation_ok = a_autorisation_sortie(id_value, today, periode_actuelle)

        # ---------------- SORTIE MATIN ----------------
        if to_time(horaires.sortie_matin_debut) <= heure <= to_time(horaires.sortie_matin_fin):

            if pointage.absence_matin:
                return jsonify({"error": "Déjà marqué absent le matin"}), 400

            if not pointage.heure_entree_matin:
                return jsonify({"error": "Entrée du matin non pointée"}), 400

            if pointage.heure_sortie_matin:
                ancienne = pointage.heure_sortie_matin.strftime("%Hh:%M")
                return jsonify({
                    "error": f"Sortie du matin déjà pointée à {ancienne}"
                }), 400

            pointage.heure_sortie_matin = now

        # ---------------- SORTIE APRÈS-MIDI ----------------
        elif to_time(horaires.sortie_soir_debut) <= heure <= to_time(horaires.sortie_soir_fin):

            if pointage.absence_soir:
                return jsonify({"error": "Déjà marqué absent l'après-midi"}), 400

            if not pointage.heure_entree_soir:
                return jsonify({"error": "Entrée de l'après-midi non pointée"}), 400

            if pointage.heure_sortie_soir:
                ancienne = pointage.heure_sortie_soir.strftime("%Hh:%M")
                return jsonify({
                    "error": f"Sortie de l'après-midi déjà pointée à {ancienne}"
                }), 400

            pointage.heure_sortie_soir = now

        else:
            if autorisation_ok:
                if autorisation_ok.periode == PeriodeAutorisation.matin:
                    if not pointage.heure_sortie_matin:
                        pointage.heure_sortie_matin = now
                        type_sortie = "matin"
                    else:
                        return jsonify({"error": "Sortie matin déjà enregistrée"}), 400

                elif autorisation_ok.periode == PeriodeAutorisation.apres_midi:
                    if not pointage.heure_sortie_soir:
                        pointage.heure_sortie_soir = now
                        type_sortie = "soir"
                    else:
                        return jsonify({"error": "Sortie après-midi déjà enregistrée"}), 400

            else:
                return jsonify({
                    "error": "Heure non valide pour pointer la sortie."
                }), 400

        notif_description = f"Sortie enregistrée pour {personnel.matricule}"

        notification = Notification(
            idpointage=pointage.id,
            idpers=personnel.idpers,
            description=notif_description,
            etat=False,
        )

        db.session.add(notification)
        db.session.commit()

        socketio.emit(
            "pointage_update",
            {
                "idnotif": notification.id,
                "idpers": personnel.idpers,
                "idpointage": pointage.id,
                "description": notif_description,
                "etat": notification.etat,
                "date": pointage.date.isoformat(),
            },
        )

        return jsonify({
            "message": f"Sortie enregistrée avec succès pour  {personnel.matricule}",
            "speech": "Sortie enregistré avec succès",
            "personnel": personnel.to_dict(),
            "client": client.to_dict() if client else None,
            "heure_de_sortie": heure_str,
            "pointage": pointage.to_dict(),
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def a_autorisation_sortie(personnel_id, now_date, periode_actuelle):
    return AutorisationSpeciale.query.filter(
        AutorisationSpeciale.idpers == personnel_id,
        AutorisationSpeciale.type_autorisation == TypeAutorisation.sortie,
        AutorisationSpeciale.periode == periode_actuelle,
        AutorisationSpeciale.date_debut <= now_date,
        or_(
            AutorisationSpeciale.date_fin.is_(None),
            AutorisationSpeciale.date_fin >= now_date
        )
    ).first()


def a_autorisation_sortie_surface(personnel_id, now_date):
    return AutorisationSpeciale.query.filter(
        AutorisationSpeciale.idpers == personnel_id,
        AutorisationSpeciale.type_autorisation == TypeAutorisation.sortie,
        AutorisationSpeciale.date_debut <= now_date,
        or_(
            AutorisationSpeciale.date_fin.is_(None),
            AutorisationSpeciale.date_fin >= now_date
        )
    ).first()


def a_autorisation_retard(personnel_id, now_date, periode_actuelle):
    return AutorisationSpeciale.query.filter(
        AutorisationSpeciale.idpers == personnel_id,
        AutorisationSpeciale.type_autorisation == TypeAutorisation.retard,
        AutorisationSpeciale.periode == periode_actuelle,
        AutorisationSpeciale.date_debut <= now_date,
        or_(
            AutorisationSpeciale.date_fin.is_(None),
            AutorisationSpeciale.date_fin >= now_date
        )
    ).first() is not None

ROBOFLOW_WORKSPACE_NAME = os.environ.get("ROBOFLOW_WORKSPACE_NAME", "seni-ynwa")
ROBOFLOW_WORKFLOW_ID = os.environ.get("ROBOFLOW_WORKFLOW_ID", "general-segmentation-api-21")
ROBOFLOW_CLASSES = os.environ.get("ROBOFLOW_CLASSES", "helmet, mask, face, hat, cap")




def to_time(dt):
    return dt.time()

import uuid

from models.services import ServiceMacAutorisee


def _normalize_mac(mac_address):
    return mac_address.strip().upper() if mac_address else None


def get_service_by_mac(mac_address):
    """Retourne l'objet Services associé à cette MAC, ou None si non autorisée."""
    mac_norm = _normalize_mac(mac_address)
    if not mac_norm:
        return None
    entry = ServiceMacAutorisee.query.filter_by(mac_address=mac_norm).first()
    return entry.service if entry else None


def get_idpers_for_service(idserv):
    """Liste des idpers rattachés aux divisions de ce service (pour restreindre la reconnaissance faciale)."""
    division_ids = [
        row.iddiv for row in Divisions.query.filter_by(idserv=idserv).with_entities(Divisions.iddiv).all()
    ]
    if not division_ids:
        return []
    rows = Personnels.query.filter(Personnels.iddiv.in_(division_ids)).with_entities(Personnels.idpers).all()
    return [row.idpers for row in rows]

def enregistrer_mac_non_autorisee(mac_address):
    """
    Enregistre ou incrémente le compteur de tentatives pour une MAC non autorisée.
    Une seule ligne par MAC (upsert), pas une ligne par tentative.
    """
    if not mac_address:
        return None

    try:
        entry = MacNonAutorisee.query.filter_by(mac_address=mac_address).first()

        if entry:
            entry.nombre_tentatives += 1
            entry.derniere_tentative = datetime.now()
        else:
            entry = MacNonAutorisee(
                mac_address=mac_address,
                nombre_tentatives=1,
            )
            db.session.add(entry)

        db.session.commit()
        return entry

    except Exception as e:
        db.session.rollback()
        print(f"[enregistrer_mac_non_autorisee] Erreur: {e}")
        return None

from time import perf_counter

@bp.route("/facial_client/step1-verify-mac", methods=["POST"])
def facial_client_step1_verify_mac():
    # ⏱️ DÉBUT DU CHRONO
    start = perf_counter()
    
    data = request.get_json() or {}
    mac_address = data.get("mac_address")
    type_pointage_str = data.get("type_pointage")
    type_pointage = TypePointage(type_pointage_str) if type_pointage_str in ("entree", "sortie") else None

    # Mesure du parsing
    t_parse = perf_counter()
    elapsed_parse = (t_parse - start) * 1000

    if not mac_address:
        total = (perf_counter() - start) * 1000
        log_tentative_pointage(
            etape=EtapePointage.VERIFICATION_MAC,
            statut=StatutPointage.ERREUR,
            message="mac_address manquant",
            mac_address=mac_address,
            type_pointage=type_pointage,
            temps_ms=total,
            temps_detail={"parse_ms": elapsed_parse, "total_ms": total}
        )
        return jsonify({"error": "mac_address manquant"}), 400

    # Recherche en base
    t_db = perf_counter()
    service = get_service_by_mac(mac_address)
    elapsed_db = (perf_counter() - t_db) * 1000

    if not service:
        enregistrer_mac_non_autorisee(mac_address)
        total = (perf_counter() - start) * 1000
        
      
        return jsonify({"error": "Ce poste n'est pas autorisé à effectuer un pointage."}), 403

    # Construction de la réponse
    t_response = perf_counter()
    response = {
        "authorized": True,
        "idserv": service.idserv,
        "service_nom": service.nom,
    }
    elapsed_response = (perf_counter() - t_response) * 1000
    
    total = (perf_counter() - start) * 1000
    
   

    # RETOUR AU CLIENT AVEC PERFORMANCE
    response["performance"] = {
        "total_ms": round(total, 3),
        "details": {
            "parse_ms": round(elapsed_parse, 3),
            "db_ms": round(elapsed_db, 3),
            "response_ms": round(elapsed_response, 3)
        }
    }
    
    return jsonify(response), 200

@bp.route("/check-face-covering", methods=["POST"])
def check_face_covering():
    if "image" not in request.files:
        return jsonify({"error": "Aucune image fournie"}), 400

    mac_address = request.form.get("mac_address")
    type_pointage_str = request.form.get("type_pointage")  # <-- ajouté ("entree" / "sortie")
    type_pointage = TypePointage(type_pointage_str) if type_pointage_str in ("entree", "sortie") else None

    image_bytes = None

    try:
        image_file = request.files["image"]
        image_bytes = image_file.read()

        if not image_bytes:
            return jsonify({"error": "Image vide"}), 400

        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        client = get_roboflow_client()

        result = client.run_workflow(
            workspace_name=ROBOFLOW_WORKSPACE_NAME,
            workflow_id=ROBOFLOW_WORKFLOW_ID,
            images={
                "image": pil_image
            },
            parameters={
                "classes": ROBOFLOW_CLASSES
            },
            use_cache=True
        )

        first_result = result[0] if isinstance(result, list) and result else result

        if isinstance(first_result, dict):
            first_result.pop("annotated_image", None)

        predictions = first_result.get("predictions", []) if isinstance(first_result, dict) else []
        is_covered = bool(predictions)

        log_tentative_pointage(
            etape=EtapePointage.COUVERTURE_VISAGE,
            statut=StatutPointage.ERREUR if is_covered else StatutPointage.SUCCES,
            message="Visage masqué détecté" if is_covered else "Aucune couverture détectée",
            image_bytes=image_bytes,
            mac_address=mac_address,
            type_pointage=type_pointage,
        )

        return jsonify(first_result), 200

    except RuntimeError as exc:
        print(f"[check-face-covering] Config manquante : {exc}")
        log_tentative_pointage(
            etape=EtapePointage.COUVERTURE_VISAGE,
            statut=StatutPointage.ERREUR,
            message=str(exc),
            image_bytes=image_bytes,
            mac_address=mac_address,
            type_pointage=type_pointage,
        )
        return jsonify({"error": str(exc)}), 500

    except Exception as exc:
        print("[check-face-covering] Exception non gérée :")
        traceback.print_exc()
        log_tentative_pointage(
            etape=EtapePointage.COUVERTURE_VISAGE,
            statut=StatutPointage.ERREUR,
            message=str(exc),
            image_bytes=image_bytes,
            mac_address=mac_address,
            type_pointage=type_pointage,
        )
        return jsonify({"error": f"Erreur serveur : {exc}"}), 500


def _cleanup_temp_image(image_path):
    if image_path and os.path.exists(image_path):
        try:
            os.remove(image_path)
        except OSError:
            pass

 
# ============================================================
# Pool partagé
#
# L'ancien code faisait "with ThreadPoolExecutor() as executor:" à CHAQUE
# requête : création + destruction d'un pool pour lancer une seule tâche.
# Un pool unique au niveau module supprime ce cog_tût.
# ============================================================
_EXECUTOR = concurrent.futures.ThreadPoolExecutor(
    max_workers=8, thread_name_prefix="pointage"
)
 
# ============================================================
# Stockage temporaire entre step2 et step3
# ============================================================
_PENDING = {}
_PENDING_LOCK = threading.Lock()
_PENDING_TTL = 180.0          # secondes
 
TEMP_ID_RE = re.compile(r"^[0-9a-f]{32}$")
 
 
def _purge_pending():
    """Supprime les entrées expirées (et leurs fichiers temporaires)."""
    import time as times
    now = times.time()
    with _PENDING_LOCK:
        expired = [k for k, v in _PENDING.items() if now - v["ts"] > _PENDING_TTL]
        for k in expired:
            _PENDING.pop(k, None)
 
    for k in expired:
        path = os.path.join(TEMP_UPLOAD_DIR, f"{k}.jpg")  # noqa: F821
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass
 
 
def _store_pending(temp_id, emb=None, error=None):
    import time as times
    with _PENDING_LOCK:
        _PENDING[temp_id] = {"emb": emb, "error": error, "ts": times.time()}
 
 
def _pop_pending(temp_id):
    
    with _PENDING_LOCK:
        return _PENDING.pop(temp_id, None)
 


# ============================================================
# ÉTAPE 2 : anti-spoof + embedding en parallèle
# ============================================================
@bp.route("/facial_client/step2-antispoof", methods=["POST"])
def facial_client_step2_antispoof():
    # ⏱️ DÉBUT DU CHRONO
    start_global = perf_counter()
    
    now = datetime.now()
    if now.weekday() >= 5:
        return jsonify({"error": "On est weekend !"}), 400
 
    if "image" not in request.files:
        return jsonify({"error": "Aucune image envoyée"}), 400
 
    mac_address = request.form.get("mac_address")
    type_pointage_str = request.form.get("type_pointage")
    type_pointage = TypePointage(type_pointage_str) if type_pointage_str in ("entree", "sortie") else None
 
    # Lecture de l'image
    t_read = perf_counter()
    file_bytes = np.frombuffer(request.files["image"].read(), np.uint8)
    image_array = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    elapsed_read = (perf_counter() - t_read) * 1000
 
    if image_array is None:
        return jsonify({"error": "Image invalide ou illisible"}), 400
 
    original_jpg = file_bytes.tobytes()
    temp_id = uuid.uuid4().hex
    image_path = os.path.join(TEMP_UPLOAD_DIR, f"{temp_id}.jpg")
 
    # Dictionnaire des temps
    times = {
        "read_ms": round(elapsed_read, 3),
        "spoof_ms": 0,
        "embedding_ms": 0,
        "write_ms": 0,
        "parallel_setup_ms": 0
    }
    
    def run_antispoof():
        t0 = perf_counter()
        from api.antispoof_api import predict_spoof
        result = predict_spoof(image=image_array)
        times["spoof_ms"] = round((perf_counter() - t0) * 1000, 3)
        return result
 
    def run_embedding():
        t0 = perf_counter()
        try:
            result = _detect_single_face(image_array), None
        except Exception as exc:
            result = None, str(exc)
        times["embedding_ms"] = round((perf_counter() - t0) * 1000, 3)
        return result
 
    def run_write():
        t0 = perf_counter()
        cv2.imwrite(image_path, image_array)
        times["write_ms"] = round((perf_counter() - t0) * 1000, 3)
 
    # Lancement des tâches parallèles
    t_parallel = perf_counter()
    f_spoof = _EXECUTOR.submit(run_antispoof)
    f_emb = _EXECUTOR.submit(run_embedding)
    f_write = _EXECUTOR.submit(run_write)
    times["parallel_setup_ms"] = round((perf_counter() - t_parallel) * 1000, 3)
 
    def _fail(message, status, payload=None, score=None):
        total = (perf_counter() - start_global) * 1000
        times["total_ms"] = round(total, 3)
        
        log_tentative_pointage(
            etape=EtapePointage.ANTISPOOF,
            statut=StatutPointage.ERREUR,
            message=message,
            score_face=score,
            image_bytes=original_jpg,
            mac_address=mac_address,
            type_pointage=type_pointage,
            temps_ms=total,
            temps_detail=times
        )
        f_write.result()
        _cleanup_temp_image(image_path)
        return jsonify(payload or {"error": message}), status
 
    try:
        t_wait = perf_counter()
        spoof_result = f_spoof.result(timeout=10)
        times["wait_spoof_ms"] = round((perf_counter() - t_wait) * 1000, 3)
        
    except concurrent.futures.TimeoutError:
        return _fail("Erreur de connexion, veuillez réessayer (timeout)", 504,
                     {"error": "Erreur de connexion, veuillez réessayer"})
    except Exception as e:
        return _fail(str(e), 500)
 
    if not spoof_result.get("success", False):
        return _fail("Erreur anti-spoof", 400)
 
    result_label = spoof_result.get("result", "").lower()
    score = float(spoof_result.get("score", 0))
 
    if result_label != "real" or score < 0.8:
        return _fail(
            "Visage suspect détecté (spoofing)", 403,
            {"error": "Visage suspect détecté (spoofing)",
             "score": score, "type": result_label},
            score=score,
        )
 
    # Récupération de l'embedding
    t_emb_wait = perf_counter()
    try:
        emb, emb_error = f_emb.result(timeout=10)
        times["embedding_wait_ms"] = round((perf_counter() - t_emb_wait) * 1000, 3)
    except Exception as exc:
        emb, emb_error = None, str(exc)
        times["embedding_wait_ms"] = round((perf_counter() - t_emb_wait) * 1000, 3)
 
    f_write.result()
    _store_pending(temp_id, emb=emb, error=emb_error)
    _purge_pending()
 
    total = (perf_counter() - start_global) * 1000
    times["total_ms"] = round(total, 3)
 
    # LOG SUCCÈS AVEC TEMPS DÉTAILLÉS
    log_tentative_pointage(
        etape=EtapePointage.ANTISPOOF,
        statut=StatutPointage.SUCCES,
        message=f"Antispoof validé (score:{score:.2f})",
        score_face=score,
        image_bytes=original_jpg,
        mac_address=mac_address,
        type_pointage=type_pointage,
        temps_ms=total,
        temps_detail=times
    )
 
    return jsonify({
        "success": True,
        "score": score,
        "temp_id": temp_id,
        "performance": times  # Retour au client
    }), 200
    
 
# ============================================================
# ÉTAPE 3 : matching seul (~1 ms)
# ============================================================
@bp.route("/facial_client/step3-recognition", methods=["POST"])
def facial_client_step3_recognition():
    # ⏱️ DÉBUT DU CHRONO
    start_global = perf_counter()
    
    data = request.get_json() or {}
    temp_id = data.get("temp_id")
    mac_address = data.get("mac_address")
    type_pointage_str = data.get("type_pointage")
    type_pointage = TypePointage(type_pointage_str) if type_pointage_str in ("entree", "sortie") else None
 
    # Validation temp_id
    t_validate = perf_counter()
    if not temp_id or not TEMP_ID_RE.match(str(temp_id)):
        return jsonify({"error": "temp_id invalide"}), 400
    elapsed_validate = (perf_counter() - t_validate) * 1000
 
    image_path = os.path.join(TEMP_UPLOAD_DIR, f"{temp_id}.jpg")
    if not os.path.exists(image_path):
        return jsonify({
            "error": "Image introuvable ou expirée, veuillez recommencer"
        }), 400
 
    # Vérification MAC
    t_mac = perf_counter()
    service = get_service_by_mac(mac_address)
    elapsed_mac = (perf_counter() - t_mac) * 1000
    
    if not service:
        enregistrer_mac_non_autorisee(mac_address)
        _cleanup_temp_image(image_path)
        return jsonify({
            "error": "Ce poste n'est pas autorisé à effectuer un pointage."
        }), 403
 
    # Récupération des employés autorisés
    t_allowed = perf_counter()
    allowed_rows = get_service_rows(
        service.idserv, lambda: get_idpers_for_service(service.idserv)
    )
    elapsed_allowed = (perf_counter() - t_allowed) * 1000
 
    if allowed_rows.size == 0:
        total = (perf_counter() - start_global) * 1000
        log_tentative_pointage(
            etape=EtapePointage.RECOGNITION,
            statut=StatutPointage.ERREUR,
            message=f"Aucun personnel rattaché au service {service.nom}",
            image_path=image_path,
            mac_address=mac_address,
            type_pointage=type_pointage,
            temps_ms=total,
            temps_detail={
                "validate_ms": round(elapsed_validate, 3),
                "mac_ms": round(elapsed_mac, 3),
                "allowed_ms": round(elapsed_allowed, 3),
                "total_ms": round(total, 3)
            }
        )
        _cleanup_temp_image(image_path)
        return jsonify({
            "error": "Aucun personnel n'est rattaché à ce service."
        }), 400
 
    # Récupération de l'embedding
    t_pop = perf_counter()
    entry = _pop_pending(temp_id)
    elapsed_pop = (perf_counter() - t_pop) * 1000
 
    if entry and entry.get("error"):
        total = (perf_counter() - start_global) * 1000
        log_tentative_pointage(
            etape=EtapePointage.RECOGNITION,
            statut=StatutPointage.ERREUR,
            message=entry["error"],
            image_path=image_path,
            mac_address=mac_address,
            type_pointage=type_pointage,
            temps_ms=total,
            temps_detail={
                "validate_ms": round(elapsed_validate, 3),
                "mac_ms": round(elapsed_mac, 3),
                "allowed_ms": round(elapsed_allowed, 3),
                "pop_ms": round(elapsed_pop, 3),
                "total_ms": round(total, 3)
            }
        )
        _cleanup_temp_image(image_path)
        return jsonify({"error": entry["error"]}), 400
 
    # Vérification faciale (matching)
    t_match = perf_counter()
    try:
        if entry and entry.get("emb") is not None:
            role, id_value, emb, score_face, second_score = verifier_face(
                emb=entry["emb"],
                threshold=0.48, min_gap=0.10, top2_check=True,
                allowed_rows=allowed_rows,
            )
        else:
            future = _EXECUTOR.submit(
                verifier_face,
                image_path=image_path,
                threshold=0.48, min_gap=0.10, top2_check=True,
                allowed_rows=allowed_rows,
            )
            role, id_value, emb, score_face, second_score = future.result(timeout=10)
        elapsed_match = (perf_counter() - t_match) * 1000
            
    except concurrent.futures.TimeoutError:
        total = (perf_counter() - start_global) * 1000
        log_tentative_pointage(
            etape=EtapePointage.RECOGNITION,
            statut=StatutPointage.ERREUR,
            message="Timeout reconnaissance",
            image_path=image_path,
            mac_address=mac_address,
            type_pointage=type_pointage,
            temps_ms=total,
            temps_detail={
                "validate_ms": round(elapsed_validate, 3),
                "mac_ms": round(elapsed_mac, 3),
                "allowed_ms": round(elapsed_allowed, 3),
                "pop_ms": round(elapsed_pop, 3),
                "match_ms": round(elapsed_match, 3),
                "total_ms": round(total, 3)
            }
        )
        _cleanup_temp_image(image_path)
        return jsonify({"error": "Erreur de connexion, veuillez réessayer"}), 504
    except Exception as e:
        total = (perf_counter() - start_global) * 1000
        log_tentative_pointage(
            etape=EtapePointage.RECOGNITION,
            statut=StatutPointage.ERREUR,
            message=str(e),
            image_path=image_path,
            mac_address=mac_address,
            type_pointage=type_pointage,
            temps_ms=total
        )
        _cleanup_temp_image(image_path)
        return jsonify({"error": str(e)}), 500
 
    # -----------------------------
# Succès
# -----------------------------
    total = (perf_counter() - start_global) * 1000

    if not role:
      log_tentative_pointage(
        etape=EtapePointage.RECOGNITION,
        statut=StatutPointage.ERREUR,
        message="Visage non reconnu ou ambigu",
        score_face=score_face,
        second_score=second_score,
        image_path=image_path,
        mac_address=mac_address,
        type_pointage=type_pointage,
        temps_ms=total,
        temps_detail={
            "validate_ms": round(elapsed_validate, 3),
            "mac_ms": round(elapsed_mac, 3),
            "allowed_ms": round(elapsed_allowed, 3),
            "pop_ms": round(elapsed_pop, 3),
            "match_ms": round(elapsed_match, 3),
            "total_ms": round(total, 3),
        },
    )

      _cleanup_temp_image(image_path)

      return jsonify({
        "error": "Visage non reconnu ou ambigu"
    }), 401


# ============================================================
# IMPORTANT :
# Ne PAS supprimer l'image ici.
# Elle sera utilisée par step4 pour l'enregistrement du journal.
# Le cleanup sera effectué dans step4.
# ============================================================

    return jsonify({
    "role": role,
    "id_value": id_value,
   "emb": emb.tolist() if emb is not None else None,
    "score_face": float(score_face),
    "second_score": float(second_score) if second_score is not None else -1,
    "temp_id": temp_id,          # <-- AJOUT IMPORTANT
    "performance": {
        "validate_ms": round(elapsed_validate, 3),
        "mac_ms": round(elapsed_mac, 3),
        "allowed_ms": round(elapsed_allowed, 3),
        "pop_ms": round(elapsed_pop, 3),
        "match_ms": round(elapsed_match, 3),
        "total_ms": round(total, 3),
    }
}), 200

# ============================================================
# ÉTAPE 4 : Enregistrement du pointage (ENTRÉE)
# ============================================================
@bp.route("/facial_client/step4-enregistrer", methods=["POST"])
def facial_client_step4_enregistrer():
    # ⏱️ DÉBUT DU CHRONO GLOBAL
    start_global = perf_counter()
    
    # Dictionnaire des temps
    times = {
        "weekend_check_ms": 0,
        "parse_ms": 0,
        "validation_ms": 0,
        "embedding_update_ms": 0,
        "db_queries_ms": 0,
        "pointage_creation_ms": 0,
        "surface_processing_ms": 0,
        "matin_processing_ms": 0,
        "soir_processing_ms": 0,
        "notification_ms": 0,
        "socketio_ms": 0,
        "descriptor_update_ms": 0,
        "cleanup_ms": 0,
        "total_ms": 0
    }

    # 1. Parsing de la requête
    t_parse = perf_counter()
    data = request.get_json()
    if not data:
        return jsonify({"error": "Corps de requête JSON requis"}), 400

    now = datetime.now()
    if now.weekday() >= 5:
        return jsonify({"error": "On est weekend !"}), 400
    times["weekend_check_ms"] = round((perf_counter() - t_parse) * 1000, 3)

    role = data.get("role")
    id_value = data.get("id_value")
    emb_list = data.get("emb")
    score_face = data.get("score_face")
    second_score = data.get("second_score")
    descriptor_list = data.get("face_descriptor")
    mac_address = data.get("mac_address")
    temp_id = data.get("temp_id")
    print("=" * 60)
    print("REQUEST JSON :", data)
    print("temp_id      :", temp_id)
    print("mac_address  :", mac_address)
    type_pointage_str = data.get("type_pointage")
    type_pointage = TypePointage(type_pointage_str) if type_pointage_str in ("entree", "sortie") else None

    if not role or id_value is None:
        return jsonify({"error": "Données de reconnaissance manquantes"}), 400

    import numpy as np

    emb = np.array(emb_list, dtype=np.float32) if emb_list is not None else None
    face_descriptor = (
        np.array(descriptor_list, dtype=np.float32) if descriptor_list else None
    )

    image_path = os.path.join(TEMP_UPLOAD_DIR, f"{temp_id}.jpg") if temp_id else None
    times["parse_ms"] = round((perf_counter() - t_parse) * 1000, 3)

    def _log(statut, message, **kwargs):
        """Wrapper local qui joint systématiquement la photo et les temps."""
        total = (perf_counter() - start_global) * 1000
        times["total_ms"] = round(total, 3)
        return log_tentative_pointage(
            etape=EtapePointage.ENREGISTREMENT,
            statut=statut,
            message=message,
            image_path=image_path,
            mac_address=mac_address,
            type_pointage=type_pointage,
            temps_ms=times["total_ms"],
            temps_detail=times,
            **kwargs,
        )

    try:
        heure = now.time()
        today = now.date()
        heure_str = now.strftime("%Hh:%M")

        # 2. Création des pointages vides
        t_db = perf_counter()
        creer_pointages_vides_par_service(id_value)
        times["db_queries_ms"] = round((perf_counter() - t_db) * 1000, 3)

        # ================= CAS PERSONNEL =================
        if role == "personnel":
            # 3. Mise à jour de l'embedding
            t_embed = perf_counter()
            update_personnel_embedding(
                id_value,
                emb,
                score_face,
                second_score,
                alpha=0.15,
                min_score_update=0.65,
                min_gap=0.15
            )
            times["embedding_update_ms"] = round((perf_counter() - t_embed) * 1000, 3)

            # 4. Requêtes DB
            t_db2 = perf_counter()
            pointage = Pointage.query.filter_by(idpers=id_value, date=today).first()
            personnel = Personnels.query.get(id_value)
            if not personnel:
                _log(StatutPointage.ERREUR, "Personnel introuvable",
                     idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                _cleanup_temp_image(image_path)
                return jsonify({"error": "Personnel introuvable"}), 404

            horaires = personnel.division.service.horaire
            is_surface = personnel and personnel.role == "surface"
            client = Client.query.filter_by(idpers=id_value).first()
            
            if not horaires:
                _log(StatutPointage.ERREUR, "Horaires non configurés pour ce service",
                     idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                _cleanup_temp_image(image_path)
                return jsonify({"error": "Horaires non configurés pour ce service"}), 500

            times["db_queries_ms"] += round((perf_counter() - t_db2) * 1000, 3)

            # 5. Création du pointage si inexistant
            t_pointage = perf_counter()
            if not pointage:
                pointage = Pointage(idpers=id_value, date=today, retard_total_minutes=0)
                db.session.add(pointage)
                db.session.commit()
            times["pointage_creation_ms"] = round((perf_counter() - t_pointage) * 1000, 3)

            # ================= CAS AGENT DE SURFACE =================
            if is_surface:
                t_surface = perf_counter()
                
                if pointage.absence_unique:
                    _log(StatutPointage.ERREUR, "Vous êtes déjà marqué absent aujourd'hui.",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    return jsonify({"error": "Vous êtes déjà marqué absent aujourd'hui."}), 400
                    
                if pointage.heure_entree_unique:
                    ancienne = pointage.heure_entree_unique.strftime("%Hh:%M")
                    _log(StatutPointage.ERREUR, f"Déjà pointé aujourd'hui à {ancienne}",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    return jsonify({"error": f"Déjà pointé aujourd'hui à {ancienne}"}), 400

                # Enregistrement du pointage
                t_surface_save = perf_counter()
                pointage.heure_entree_unique = now
                pointage.retard_matin = False
                pointage.retard_soir = False
                pointage.retard_matin_minutes = 0
                pointage.retard_soir_minutes = 0
                pointage.retard_total_minutes = 0
                pointage.absence = False
                pointage.absence_unique = False
                pointage.presence = True

                db.session.commit()
                times["surface_processing_ms"] = round((perf_counter() - t_surface_save) * 1000, 3)

                # Notification
                t_notif = perf_counter()
                notification = Notification(
                    idpointage=pointage.id,
                    idpers=personnel.idpers,
                    description=f"Pointage surface enregistré pour {personnel.matricule}",
                    etat=False,
                )
                db.session.add(notification)
                db.session.commit()
                times["notification_ms"] = round((perf_counter() - t_notif) * 1000, 3)

                # Mise à jour du descripteur
                if face_descriptor is not None:
                    t_desc = perf_counter()
                    personnel = Personnels.query.get(id_value)
                    if personnel:
                        personnel.set_faceapi_descriptor(face_descriptor)
                        db.session.commit()
                    times["descriptor_update_ms"] = round((perf_counter() - t_desc) * 1000, 3)

                # SocketIO
                t_socket = perf_counter()
                socketio.emit(
                    "pointage_update",
                    {
                        "idnotif": notification.id,
                        "idpers": personnel.idpers,
                        "idpointage": pointage.id,
                        "description": notification.description,
                        "etat": notification.etat,
                        "date": pointage.date.isoformat(),
                    },
                )
                times["socketio_ms"] = round((perf_counter() - t_socket) * 1000, 3)

                # Log succès
                _log(StatutPointage.SUCCES, f"Pointage surface enregistré pour {personnel.matricule}",
                     idpers=id_value, role=role, score_face=score_face, second_score=second_score)

                # Cleanup
                t_cleanup = perf_counter()
                _cleanup_temp_image(image_path)
                times["cleanup_ms"] = round((perf_counter() - t_cleanup) * 1000, 3)

                times["total_ms"] = round((perf_counter() - start_global) * 1000, 3)

                return jsonify({
                    "message": f"Pointage d'agent surface enregistré pour {personnel.matricule}",
                    "speech": "Pointage d'agent surface enregistré avec succès",
                    "personnel": personnel.to_dict(),
                    "client": client.to_dict() if client else None,
                    "heure_de_pointage": heure_str,
                    "pointage": pointage.to_dict(),
                    "performance": times
                }), 200

            # ================= CAS PERSONNEL STANDARD =================
            heure_now = now.time()

            t_horaires = perf_counter()
            if to_time(horaires.entree_matin_debut) <= heure_now <= to_time(horaires.sortie_matin_fin):
                periode = "matin"
            elif to_time(horaires.entree_soir_debut) <= heure_now < to_time(horaires.sortie_soir_debut):
                periode = "soir"
            else:
                _log(StatutPointage.ERREUR, "Heure non valide pour pointer.",
                     idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                _cleanup_temp_image(image_path)
                return jsonify({"error": "Heure non valide pour pointer."}), 400
            times["horaires_ms"] = round((perf_counter() - t_horaires) * 1000, 3)

            # ---------------- MATIN ----------------
            if periode == "matin":
                t_matin = perf_counter()
                
                if pointage.absence_matin:
                    _log(StatutPointage.ERREUR, "Déjà marqué absent le matin.",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({"error": "Déjà marqué absent le matin."}), 400

                if pointage.heure_entree_matin:
                    ancienne = pointage.heure_entree_matin.strftime("%Hh:%M")
                    _log(StatutPointage.ERREUR, f"Déjà pointé le matin à {ancienne}",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({"error": f"Déjà pointé le matin à {ancienne}"}), 400

                t_matin_save = perf_counter()
                pointage.heure_entree_matin = now

                retard_matin = 0
                heure_limite_matin = to_time(horaires.entree_matin_fin)

                if heure > heure_limite_matin:
                    autorisation_retard = a_autorisation_retard(
                        id_value, today, PeriodeAutorisation.matin
                    )
                    if autorisation_retard:
                        retard_matin = 0
                        pointage.retard_matin = False
                    else:
                        retard_matin = int(
                            (
                                datetime.combine(today, heure)
                                - datetime.combine(today, heure_limite_matin)
                            ).total_seconds()
                            / 60
                        )
                        pointage.retard_matin = True
                else:
                    pointage.retard_matin = False

                pointage.retard_matin_minutes = retard_matin
                pointage.retard_total_minutes += retard_matin
                retard_minutes = retard_matin
                pointage.absence_matin = False
                pointage.presence = True
                
                times["matin_processing_ms"] = round((perf_counter() - t_matin_save) * 1000, 3)

            # ---------------- APRÈS-MIDI ----------------
            elif periode == "soir":
                t_soir = perf_counter()
                marquer_absents_matin_non_pointes()

                if pointage.absence_soir:
                    _log(StatutPointage.ERREUR, "Déjà marqué absent l'après-midi.",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({"error": "Déjà marqué absent l'après-midi."}), 400

                if pointage.heure_entree_soir:
                    ancienne = pointage.heure_entree_soir.strftime("%Hh:%M")
                    _log(StatutPointage.ERREUR, f"Déjà pointé l'après-midi à {ancienne}",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({"error": f"Déjà pointé l'après-midi à {ancienne}"}), 400

                t_soir_save = perf_counter()
                pointage.heure_entree_soir = now
                seuil_retard = to_time(horaires.entree_soir_fin)
                delta_minutes = max(0, int(
                    (datetime.combine(today, heure_now)
                     - datetime.combine(today, seuil_retard)
                     ).total_seconds() / 60
                ))
                autorisation_retard = a_autorisation_retard(
                    id_value, today, PeriodeAutorisation.apres_midi
                )

                if delta_minutes > 0:
                    if autorisation_retard:
                        pointage.retard_soir = False
                        pointage.retard_soir_minutes = 0
                    else:
                        pointage.retard_soir = True
                        pointage.retard_soir_minutes = delta_minutes
                else:
                    pointage.retard_soir = False
                    pointage.retard_soir_minutes = 0

                pointage.retard_total_minutes += pointage.retard_soir_minutes
                retard_minutes = pointage.retard_soir_minutes
                pointage.heure_entree_soir = now
                pointage.absence_soir = False
                pointage.presence = True
                
                times["soir_processing_ms"] = round((perf_counter() - t_soir_save) * 1000, 3)

            else:
                _log(StatutPointage.ERREUR, "Heure non valide pour pointer.",
                     idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                _cleanup_temp_image(image_path)
                return jsonify({"error": "Heure non valide pour pointer."}), 400

            pointage.absence = pointage.absence_matin and pointage.absence_soir

            # ---------------- Notification ----------------
            t_notif = perf_counter()
            notification = Notification(
                idpointage=pointage.id,
                idpers=personnel.idpers,
                description=f"Pointage enregistré pour {personnel.matricule}",
                etat=False
            )
            db.session.add(notification)
            db.session.commit()
            times["notification_ms"] = round((perf_counter() - t_notif) * 1000, 3)

            # ---------------- Mise à jour du descripteur ----------------
            if face_descriptor is not None:
                t_desc = perf_counter()
                personnel = Personnels.query.get(id_value)
                if personnel:
                    personnel.set_faceapi_descriptor(face_descriptor)
                    db.session.commit()
                times["descriptor_update_ms"] = round((perf_counter() - t_desc) * 1000, 3)

            # ---------------- SocketIO ----------------
            t_socket = perf_counter()
            socketio.emit(
                "pointage_update",
                {
                    "idnotif": notification.id,
                    "idpers": personnel.idpers,
                    "idpointage": pointage.id,
                    "description": notification.description,
                    "etat": notification.etat,
                    "date": pointage.date.isoformat(),
                },
            )
            times["socketio_ms"] = round((perf_counter() - t_socket) * 1000, 3)

            # ---------------- Cleanup ----------------
            t_cleanup = perf_counter()
            _cleanup_temp_image(image_path)
            times["cleanup_ms"] = round((perf_counter() - t_cleanup) * 1000, 3)

            retard_minutes = retard_minutes if 'retard_minutes' in locals() else 0

            if retard_minutes > 0:
                message = f"Pointage enregistré avec succès pour {personnel.matricule} avec {retard_minutes} minutes de retard"
                speech_msg = f"Pointage enregistré avec {retard_minutes} minutes de retard"
            else:
                message = f"Pointage enregistré avec succès pour {personnel.matricule}"
                speech_msg = "Pointage enregistré avec succès"

            times["total_ms"] = round((perf_counter() - start_global) * 1000, 3)

            _log(StatutPointage.SUCCES, message,
                 idpers=id_value, role=role, score_face=score_face, second_score=second_score)

            return jsonify({
                "message": message,
                "speech": speech_msg,
                "personnel": personnel.to_dict(),
                "client": client.to_dict() if client else None,
                "heure_de_pointage": heure_str,
                "pointage": pointage.to_dict(),
                "performance": times
            }), 200

        _log(StatutPointage.ERREUR, "Rôle non autorisé", idpers=id_value, role=role)
        _cleanup_temp_image(image_path)
        return jsonify({"error": "Rôle non autorisé"}), 403

    except Exception as e:
        times["total_ms"] = round((perf_counter() - start_global) * 1000, 3)
        _log(StatutPointage.ERREUR, str(e), idpers=id_value, role=role)
        _cleanup_temp_image(image_path)
        return jsonify({"error": str(e), "performance": times}), 500

@bp.route("/facial_client_sortie/step4-enregistrer", methods=["POST"])
def facial_client_sortie_step4_enregistrer():
    # ⏱️ DÉBUT DU CHRONO GLOBAL
    start_global = perf_counter()
    
    # Dictionnaire des temps
    times = {
        "weekend_check_ms": 0,
        "parse_ms": 0,
        "validation_ms": 0,
        "embedding_update_ms": 0,
        "db_queries_ms": 0,
        "surface_processing_ms": 0,
        "sortie_matin_ms": 0,
        "sortie_soir_ms": 0,
        "notification_ms": 0,
        "socketio_ms": 0,
        "descriptor_update_ms": 0,
        "cleanup_ms": 0,
        "total_ms": 0
    }

    # 1. Parsing de la requête
    t_parse = perf_counter()
    data = request.get_json()
    if not data:
        return jsonify({"error": "Corps de requête JSON requis"}), 400

    now = datetime.now()
    if now.weekday() >= 5:
        return jsonify({"error": "On est weekend !"}), 400
    times["weekend_check_ms"] = round((perf_counter() - t_parse) * 1000, 3)

    role = data.get("role")
    id_value = data.get("id_value")
    emb_list = data.get("emb")
    score_face = data.get("score_face")
    second_score = data.get("second_score")
    descriptor_list = data.get("face_descriptor")
    mac_address = data.get("mac_address")
    temp_id = data.get("temp_id")
    type_pointage_str = data.get("type_pointage")
    type_pointage = TypePointage(type_pointage_str) if type_pointage_str in ("entree", "sortie") else None

    if not role or id_value is None:
        return jsonify({"error": "Données de reconnaissance manquantes"}), 400

    import numpy as np

    emb = np.array(emb_list, dtype=np.float32) if emb_list is not None else None
    face_descriptor = (
        np.array(descriptor_list, dtype=np.float32) if descriptor_list else None
    )

    image_path = os.path.join(TEMP_UPLOAD_DIR, f"{temp_id}.jpg") if temp_id else None
    times["parse_ms"] = round((perf_counter() - t_parse) * 1000, 3)

    def _log(statut, message, **kwargs):
        """Wrapper local qui joint systématiquement la photo et les temps."""
        total = (perf_counter() - start_global) * 1000
        times["total_ms"] = round(total, 3)
        return log_tentative_pointage(
            etape=EtapePointage.ENREGISTREMENT,
            statut=statut,
            message=message,
            image_path=image_path,
            mac_address=mac_address,
            type_pointage=type_pointage,
            temps_ms=times["total_ms"],
            temps_detail=times,
            **kwargs,
        )

    try:
        heure = now.time()
        heure_str = now.strftime("%Hh:%M")
        today = now.date()

        # -------------------------
        # CAS PERSONNEL
        # -------------------------
        if role == "personnel":
            # 2. Mise à jour de l'embedding
            t_embed = perf_counter()
            update_personnel_embedding(
                id_value,
                emb,
                score_face,
                second_score,
                alpha=0.15,
                min_score_update=0.65,
                min_gap=0.15
            )
            times["embedding_update_ms"] = round((perf_counter() - t_embed) * 1000, 3)

            # 3. Requêtes DB
            t_db = perf_counter()
            pointage = Pointage.query.filter_by(idpers=id_value, date=today).first()
            personnel = Personnels.query.get(id_value)
            client = Client.query.filter_by(idpers=id_value).first()

            if not personnel:
                _log(StatutPointage.ERREUR, "Personnel introuvable",
                     idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                _cleanup_temp_image(image_path)
                return jsonify({"error": "Personnel introuvable"}), 404

            horaires = personnel.division.service.horaire
            if not horaires:
                _log(StatutPointage.ERREUR, "Horaires non configurés pour ce service",
                     idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                _cleanup_temp_image(image_path)
                return jsonify({"error": "Horaires non configurés pour ce service"}), 500

            times["db_queries_ms"] = round((perf_counter() - t_db) * 1000, 3)

            # 🔴 Cas agent de surface
            if personnel.role == "surface":
                t_surface = perf_counter()
                autorisation_ok_srtuface = a_autorisation_sortie_surface(id_value, today)

                if not pointage:
                    _log(StatutPointage.ERREUR, "Aucune entrée trouvée aujourd'hui.",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({"error": "Aucune entrée trouvée aujourd'hui."}), 400

                if pointage.absence_unique:
                    _log(StatutPointage.ERREUR, "Agent déjà marqué absent aujourd'hui.",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({"error": "Agent déjà marqué absent aujourd'hui."}), 400

                if not pointage.heure_entree_unique:
                    _log(StatutPointage.ERREUR, "Entrée non trouvée.",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({"error": "Entrée non trouvée."}), 400

                if pointage.heure_sortie_unique:
                    ancienne = pointage.heure_sortie_unique.strftime("%Hh:%M")
                    _log(StatutPointage.ERREUR, f"Sortie déjà enregistrée à {ancienne}",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({
                        "error": f"Sortie déjà enregistrée à {ancienne}"
                    }), 400

                entree_time = pointage.heure_entree_unique

                if not entree_time:
                    _log(StatutPointage.ERREUR, "Entrée non trouvée.",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({"error": "Entrée non trouvée."}), 400

                if isinstance(entree_time, datetime):
                    entree_time = entree_time.time()

                sortie_autorisee_apres = datetime.combine(today, entree_time) + timedelta(hours=1)

                if now < sortie_autorisee_apres:
                    if not autorisation_ok_srtuface:
                        _log(StatutPointage.ERREUR, "La sortie n'est pas autorisée",
                             idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                        _cleanup_temp_image(image_path)
                        return jsonify({
                            "error": "La sortie n'est pas autorisée"
                        }), 403

                t_surface_save = perf_counter()
                pointage.heure_sortie_unique = now
                times["surface_processing_ms"] = round((perf_counter() - t_surface_save) * 1000, 3)

                notif_description = f"Sortie enregistrée (surface) pour {personnel.matricule}"

                # Notification
                t_notif = perf_counter()
                notification = Notification(
                    idpointage=pointage.id,
                    idpers=personnel.idpers,
                    description=notif_description,
                    etat=False,
                )
                db.session.add(notification)
                db.session.commit()
                times["notification_ms"] = round((perf_counter() - t_notif) * 1000, 3)

                # SocketIO
                t_socket = perf_counter()
                socketio.emit(
                    "pointage_update",
                    {
                        "idnotif": notification.id,
                        "idpers": personnel.idpers,
                        "idpointage": pointage.id,
                        "description": notif_description,
                        "etat": notification.etat,
                        "date": pointage.date.isoformat(),
                    },
                )
                times["socketio_ms"] = round((perf_counter() - t_socket) * 1000, 3)

                # Log succès
                _log(StatutPointage.SUCCES, notif_description,
                     idpers=id_value, role=role, score_face=score_face, second_score=second_score)

                # Cleanup
                t_cleanup = perf_counter()
                _cleanup_temp_image(image_path)
                times["cleanup_ms"] = round((perf_counter() - t_cleanup) * 1000, 3)

                times["total_ms"] = round((perf_counter() - start_global) * 1000, 3)

                return jsonify({
                    "message": "Sortie enregistrée avec succès (agent de surface)",
                    "speech": "Sortie d'agent de surface enregistré avec succès",
                    "personnel": personnel.to_dict(),
                    "heure_de_sortie": heure_str,
                    "pointage": pointage.to_dict(),
                    "performance": times
                }), 200

            if not pointage or (
                not pointage.heure_entree_matin and
                not pointage.heure_entree_soir
            ):
                _log(StatutPointage.ERREUR, "Aucune entrée trouvée aujourd'hui.",
                     idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                _cleanup_temp_image(image_path)
                return jsonify({
                    "error": "Aucune entrée trouvée aujourd'hui."
                }), 400

            heure = now.time()

            # ---------------- Période "générale" (pour la recherche d'autorisation) ----------------
            t_periode = perf_counter()
            if heure < to_time(horaires.entree_soir_debut):
                periode_actuelle = PeriodeAutorisation.matin
            else:
                periode_actuelle = PeriodeAutorisation.apres_midi

            autorisation_ok = a_autorisation_sortie(id_value, today, periode_actuelle)
            times["horaires_ms"] = round((perf_counter() - t_periode) * 1000, 3)

            # ---------------- SORTIE MATIN ----------------
            if to_time(horaires.sortie_matin_debut) <= heure <= to_time(horaires.sortie_matin_fin):
                t_sortie_matin = perf_counter()

                if pointage.absence_matin:
                    _log(StatutPointage.ERREUR, "Déjà marqué absent le matin.",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({
                        "error": "Déjà marqué absent le matin."
                    }), 400

                if not pointage.heure_entree_matin:
                    _log(StatutPointage.ERREUR, "Entrée matin non trouvée.",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({
                        "error": "Entrée matin non trouvée."
                    }), 400

                if pointage.heure_sortie_matin:
                    ancienne = pointage.heure_sortie_matin.strftime("%Hh:%M")
                    _log(StatutPointage.ERREUR, f"Sortie matin déjà pointée à {ancienne}",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({
                        "error": f"Sortie matin déjà pointée à {ancienne}"
                    }), 400

                t_sortie_matin_save = perf_counter()
                pointage.heure_sortie_matin = now
                times["sortie_matin_ms"] = round((perf_counter() - t_sortie_matin_save) * 1000, 3)

            # ---------------- SORTIE APRÈS-MIDI ----------------
            elif to_time(horaires.sortie_soir_debut) <= heure <= to_time(horaires.sortie_soir_fin):
                t_sortie_soir = perf_counter()

                if pointage.absence_soir:
                    _log(StatutPointage.ERREUR, "Déjà marqué absent l'après-midi.",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({
                        "error": "Déjà marqué absent l'après-midi."
                    }), 400

                if not pointage.heure_entree_soir:
                    _log(StatutPointage.ERREUR, "Entrée après-midi non trouvée.",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({
                        "error": "Entrée après-midi non trouvée."
                    }), 400

                if pointage.heure_sortie_soir:
                    ancienne = pointage.heure_sortie_soir.strftime("%Hh:%M")
                    _log(StatutPointage.ERREUR, f"Sortie après-midi déjà pointée à {ancienne}",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({
                        "error": f"Sortie après-midi déjà pointée à {ancienne}"
                    }), 400

                t_sortie_soir_save = perf_counter()
                pointage.heure_sortie_soir = now
                times["sortie_soir_ms"] = round((perf_counter() - t_sortie_soir_save) * 1000, 3)

            else:
                if autorisation_ok:
                    t_autorisation = perf_counter()
                    if autorisation_ok.periode == PeriodeAutorisation.matin:
                        if not pointage.heure_sortie_matin:
                            pointage.heure_sortie_matin = now
                            type_sortie = "matin"
                            times["sortie_matin_ms"] = round((perf_counter() - t_autorisation) * 1000, 3)
                        else:
                            _log(StatutPointage.ERREUR, "Sortie matin déjà enregistrée",
                                 idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                            _cleanup_temp_image(image_path)
                            return jsonify({"error": "Sortie matin déjà enregistrée"}), 400

                    elif autorisation_ok.periode == PeriodeAutorisation.apres_midi:
                        if not pointage.heure_sortie_soir:
                            pointage.heure_sortie_soir = now
                            type_sortie = "soir"
                            times["sortie_soir_ms"] = round((perf_counter() - t_autorisation) * 1000, 3)
                        else:
                            _log(StatutPointage.ERREUR, "Sortie après-midi déjà enregistrée",
                                 idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                            _cleanup_temp_image(image_path)
                            return jsonify({"error": "Sortie après-midi déjà enregistrée"}), 400

                else:
                    _log(StatutPointage.ERREUR, "Heure non valide pour pointer la sortie.",
                         idpers=id_value, role=role, score_face=score_face, second_score=second_score)
                    _cleanup_temp_image(image_path)
                    return jsonify({
                        "error": "Heure non valide pour pointer la sortie."
                    }), 400

            # ---------------- Notification ----------------
            t_notif = perf_counter()
            notif_description = f"Sortie enregistrée pour {personnel.matricule}"

            notification = Notification(
                idpointage=pointage.id,
                idpers=personnel.idpers,
                description=notif_description,
                etat=False,
            )

            db.session.add(notification)
            db.session.commit()
            times["notification_ms"] = round((perf_counter() - t_notif) * 1000, 3)

            # ---------------- Mise à jour du descripteur ----------------
            if face_descriptor is not None:
                t_desc = perf_counter()
                personnel = Personnels.query.get(id_value)
                if personnel:
                    personnel.set_faceapi_descriptor(face_descriptor)
                    db.session.commit()
                times["descriptor_update_ms"] = round((perf_counter() - t_desc) * 1000, 3)

            # ---------------- SocketIO ----------------
            t_socket = perf_counter()
            socketio.emit(
                "pointage_update",
                {
                    "idnotif": notification.id,
                    "idpers": personnel.idpers,
                    "idpointage": pointage.id,
                    "description": notif_description,
                    "etat": notification.etat,
                    "date": pointage.date.isoformat(),
                },
            )
            times["socketio_ms"] = round((perf_counter() - t_socket) * 1000, 3)

            # ---------------- Cleanup ----------------
            t_cleanup = perf_counter()
            _cleanup_temp_image(image_path)
            times["cleanup_ms"] = round((perf_counter() - t_cleanup) * 1000, 3)

            _log(StatutPointage.SUCCES, f"Sortie enregistrée avec succès pour {personnel.matricule}",
                 idpers=id_value, role=role, score_face=score_face, second_score=second_score)

            times["total_ms"] = round((perf_counter() - start_global) * 1000, 3)

            return jsonify({
                "message": f"Sortie enregistrée avec succès pour {personnel.matricule}",
                "speech": "Sortie enregistrée avec succès",
                "personnel": personnel.to_dict(),
                "client": client.to_dict() if client else None,
                "heure_de_sortie": heure_str,
                "pointage": pointage.to_dict(),
                "performance": times
            }), 200

        _log(StatutPointage.ERREUR, "Rôle non autorisé", idpers=id_value, role=role)
        _cleanup_temp_image(image_path)
        return jsonify({"error": "Rôle non autorisé"}), 403

    except Exception as e:
        times["total_ms"] = round((perf_counter() - start_global) * 1000, 3)
        _log(StatutPointage.ERREUR, str(e), idpers=id_value, role=role)
        _cleanup_temp_image(image_path)
        return jsonify({"error": str(e), "performance": times}), 500
    
import logging

# Configure le logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

@bp.route("/facial_client_personnel/step4-enregistrer", methods=["POST"])
def facial_client_personnel_step4_enregistrer():
    if datetime.now().weekday() >= 5:
        return jsonify({"error": "On est weekend !"}), 400
    logging.info("=== Début du pointage facial (étape 4 - personnel) ===")

    data = request.get_json()
    if not data:
        return jsonify({"error": "Corps de requête JSON requis"}), 400

    idpers = data.get("idpers") or request.args.get("idpers", type=int)
    if not idpers:
        return jsonify({"error": "Personnel non identifié"}), 400

    role = data.get("role")
    id_value = data.get("id_value")
    emb_list = data.get("emb")
    score_face = data.get("score_face")
    second_score = data.get("second_score")
    descriptor_list = data.get("face_descriptor")

    if not role or id_value is None:
        return jsonify({"error": "Données de reconnaissance manquantes"}), 400

    import numpy as np

    emb = np.array(emb_list, dtype=np.float32) if emb_list is not None else None
    face_descriptor = (
        np.array(descriptor_list, dtype=np.float32) if descriptor_list else None
    )

    try:
        # 🔒 Vérification stricte (identique à l'origine)
        if role != "personnel" or id_value != idpers:
            return jsonify({"error": "Pointage non autorisé"}), 403

        update_personnel_embedding(
            id_value,
            emb,
            score_face,
            second_score,
            alpha=0.15,
            min_score_update=0.65,
            min_gap=0.15
        )

        now = datetime.now()
        heure = now.time()
        today = now.date()
        heure_str = now.strftime("%Hh:%M")

        creer_pointages_vides_par_service(id_value)

        personnel = Personnels.query.get(id_value)
        if not personnel:
            return jsonify({"error": "Personnel introuvable"}), 404

        horaires = personnel.division.service.horaire
        is_surface = personnel and personnel.role == "surface"

        if not horaires:
            return jsonify({"error": "Horaires non configurés pour ce service"}), 500

        pointage = Pointage.query.filter_by(idpers=id_value, date=today).first()
        if not pointage:
            pointage = Pointage(idpers=id_value, date=today, retard_total_minutes=0)
            db.session.add(pointage)
            db.session.commit()

        if is_surface:
            if pointage.absence_unique:
                return (
                    jsonify({"error": "Vous êtes déjà marqué absent aujourd'hui."}),
                    400,
                )
            if pointage.heure_entree_unique:
                ancienne = pointage.heure_entree_unique.strftime("%Hh:%M")
                return (
                    jsonify({"error": f"Déjà pointé aujourd'hui à {ancienne}"}),
                    400,
                )

            pointage.heure_entree_unique = now
            pointage.retard_matin = False
            pointage.retard_soir = False
            pointage.retard_matin_minutes = 0
            pointage.retard_soir_minutes = 0
            pointage.retard_total_minutes = 0

            pointage.absence = False
            pointage.absence_unique = False
            pointage.presence = True

            db.session.commit()

            notification = Notification(
                idpointage=pointage.id,
                idpers=personnel.idpers,
                description=f"Pointage surface enregistré pour {personnel.matricule}",
                etat=False,
            )
            db.session.add(notification)
            db.session.commit()

            socketio.emit(
                "pointage_update",
                {
                    "idnotif": notification.id,
                    "idpers": personnel.idpers,
                    "idpointage": pointage.id,
                    "description": notification.description,
                    "etat": notification.etat,
                    "date": pointage.date.isoformat(),
                },
            )

            return (
                jsonify(
                    {
                        "message": f"Pointage d'agent surface enregistré pour {personnel.matricule}",
                        "heure_de_pointage": heure_str,
                        "pointage": pointage.to_dict(),
                    }
                ),
                200,
            )

        heure_now = now.time()

        if to_time(horaires.entree_matin_debut) <= heure_now <= to_time(horaires.sortie_matin_fin):
            periode = "matin"
        elif to_time(horaires.entree_soir_debut) <= heure_now < to_time(horaires.sortie_soir_debut):
            periode = "soir"
        else:
            return jsonify({"error": "Heure non valide pour pointer"}), 400

        # ------------------- MATIN -------------------
        if periode == "matin":
            if pointage.absence_matin:
                return jsonify({"error": "Déjà marqué absent le matin"}), 400

            if pointage.heure_entree_matin:
                ancienne = pointage.heure_entree_matin.strftime("%Hh:%M")
                return jsonify({"error": f"Entrée du matin déjà pointée à {ancienne}"}), 400

            pointage.heure_entree_matin = now
            heure_limite_matin = to_time(horaires.entree_matin_fin)
            retard_matin = 0

            if heure > heure_limite_matin:
                autorisation_retard = a_autorisation_retard(
                    id_value, today, PeriodeAutorisation.matin
                )
                if autorisation_retard:
                    retard_matin = 0
                    pointage.retard_matin = False
                else:
                    retard_matin = int(
                        (
                            datetime.combine(today, heure)
                            - datetime.combine(today, heure_limite_matin)
                        ).total_seconds()
                        / 60
                    )
                    pointage.retard_matin = True
            else:
                pointage.retard_matin = False

            pointage.retard_matin_minutes = retard_matin
            retard_minutes = retard_matin
            pointage.retard_total_minutes = (pointage.retard_total_minutes or 0) + retard_matin
            pointage.absence_matin = False
            pointage.presence = True

        # ------------------- APRÈS-MIDI -------------------
        elif periode == "soir":
            if pointage.absence_soir:
                return jsonify({"error": "Déjà marqué absent l'après-midi"}), 400

            if pointage.heure_entree_soir:
                ancienne = pointage.heure_entree_soir.strftime("%Hh:%M")
                return jsonify({"error": f"Entrée après-midi déjà pointée à {ancienne}"}), 400

            if pointage.heure_sortie_matin:
                sortie_matin = pointage.heure_sortie_matin
                heure_min_pointage = sortie_matin + timedelta(hours=1)
                if now < heure_min_pointage:
                    return jsonify({"error": "Pause minimum 1h obligatoire."}), 400
                limite_retard = sortie_matin + timedelta(hours=1, minutes=30)
            else:
                limite_retard = datetime.combine(today, to_time(horaires.entree_soir_fin))

            delta_minutes = int((now - limite_retard).total_seconds() / 60)
            autorisation_retard = a_autorisation_retard(
                id_value, today, PeriodeAutorisation.apres_midi
            )

            if delta_minutes > 0:
                if autorisation_retard:
                    pointage.retard_soir = False
                    pointage.retard_soir_minutes = 0
                else:
                    pointage.retard_soir = True
                    pointage.retard_soir_minutes = delta_minutes
            else:
                pointage.retard_soir = False
                pointage.retard_soir_minutes = 0

            pointage.retard_total_minutes += pointage.retard_soir_minutes
            retard_minutes = pointage.retard_soir_minutes
            pointage.heure_entree_soir = now
            pointage.absence_soir = False
            pointage.presence = True

        pointage.absence = pointage.absence_matin and pointage.absence_soir
        pointage.calcul_retard_total_du_jour()

        notif_description = f"Pointage {periode} enregistré pour {personnel.matricule}"
        notification = Notification(idpointage=pointage.id, idpers=personnel.idpers, description=notif_description, etat=False)
        db.session.add(notification)
        db.session.commit()

        if face_descriptor is not None:
            personnel = Personnels.query.get(idpers)
            if personnel:
                personnel.set_faceapi_descriptor(face_descriptor)
                db.session.commit()

        socketio.emit(
            "pointage_update",
            {
                "idnotif": notification.id,
                "idpers": personnel.idpers,
                "idpointage": pointage.id,
                "description": notif_description,
                "etat": notification.etat,
                "date": pointage.date.isoformat(),
            },
        )

        retard_minutes = retard_minutes if 'retard_minutes' in locals() else 0

        if retard_minutes > 0:
            message = f"Pointage enregistré avec succès pour {personnel.matricule} avec {retard_minutes} minutes de retard"
            speech_msg = f"Pointage enregistré avec {retard_minutes} minutes de retard"
        else:
            message = f"Pointage enregistré avec succès pour {personnel.matricule}"
            speech_msg = "Pointage enregistré avec succès"

        return (
            jsonify(
                {
                    "message": message,
                    "speech": speech_msg,
                    "retard_minutes": retard_minutes,
                    "is_retard": retard_minutes > 0,
                    "personnel": personnel.to_dict(),
                    "heure_de_pointage": heure_str,
                    "pointage": pointage.to_dict(),
                }
            ),
            200,
        )

    except Exception as e:
        logging.exception("Erreur inattendue")
        return jsonify({"error": str(e)}), 500
    

def minutes_to_hhmm(minutes):
    if not minutes or minutes <= 0:
        return "0h 00"
    h = minutes // 60
    m = minutes % 60
    return f"{h}h {m:02d}"


@bp.route("/facial", methods=["GET"])
def get_pointages_complets():
    today = datetime.now().date()
    now_time = datetime.now().time()

    personnels = Personnels.query.all()
    pointages = Pointage.query.filter_by(date=today).all()

    # Dictionnaire pour accès rapide : {idpers: pointage}
    pointages_dict = {p.idpers: p for p in pointages}

    result = []

    for perso in personnels:
        if perso.idpers in pointages_dict:
            pointage = pointages_dict[perso.idpers]
            data = pointage.to_dict()
        else:
            # Personnel n’a pas pointé aujourd’hui => valeurs par défaut
            absence_matin = now_time > time(11, 30)
            absence_soir = now_time > time(18, 0)
            absence_globale = absence_matin and absence_soir

            data = {
                "id": None,
                "date": today.isoformat(),
                "heure_entree_matin": None,
                "heure_sortie_matin": None,
                "heure_entree_soir": None,
                "heure_sortie_soir": None,
                "retard_matin": False,
                "retard_soir": False,
                "retard_total_minutes": 0,
                "absence_matin": absence_matin,
                "absence_soir": absence_soir,
                "absence": absence_globale,
                "justificatif": None,
                "idpers": perso.idpers,
                "personnel": {
                    "nom": perso.nom,
                    "prenom": perso.prenom,
                    "matricule": perso.matricule,
                },
            }

        result.append(data)

    return jsonify(result), 200

# api/facial_pointage/_helpers.py  (ou en haut de ton fichier de routes)
from sqlalchemy import or_, func
from sqlalchemy.orm import joinedload


def escape_like(term: str) -> str:
    """Neutralise les jokers pour que "50%" ne matche pas tout."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def apply_personnel_filters(query, search=None, role=None):
    """
    Filtres qui DOIVENT passer en SQL, avant ORDER BY / LIMIT,
    sinon le curseur renvoie des pages incohérentes (0, 3, 1, 10 lignes...).
    """
    if search:
        like = f"%{escape_like(search.lower())}%"
        query = query.filter(
            or_(
                func.lower(Personnels.nom).like(like, escape="\\"),
                func.lower(Personnels.prenom).like(like, escape="\\"),
                func.lower(Personnels.matricule).like(like, escape="\\"),
            )
        )

    if role == "surface":
        query = query.filter(Personnels.role == "surface")
    elif role == "autres":
        # Sous Oracle, role != 'surface' vaut NULL si role est NULL -> IS NULL explicite
        query = query.filter(
            or_(Personnels.role != "surface", Personnels.role.is_(None))
        )

    return query


def with_eager_loads(query):
    """Supprime le N+1 : sans ça, chaque ligne refait 3 requêtes."""
    return query.options(
        joinedload(Pointage.personnel).joinedload(Personnels.division),
        joinedload(Pointage.autorisation).joinedload(AutorisationAbsence.type_autorisation),
    )


def paginate_by_cursor(query, limit, last_id):
    if last_id is not None:
        query = query.filter(Pointage.id > last_id)

    rows = query.order_by(Pointage.id.asc()).limit(limit + 1).all()

    has_more = len(rows) > limit
    if has_more:
        rows = rows[:limit]

    next_cursor = rows[-1].id if (rows and has_more) else None
    return rows, next_cursor, has_more


def serialize_pointage(pt):
    """Sérialisation commune aux endpoints (surensemble de champs)."""
    personnel = pt.personnel

    absence_matin_abbr = None
    absence_soir_abbr = None
    absence_surface = None
    nomabbr1 = None

    if pt.autorisation and pt.autorisation.type_autorisation:
        abbr = pt.autorisation.type_autorisation.abbreviation
        demi = pt.autorisation.demi_journee
        nomabbr1 = pt.autorisation.type_autorisation.nomtype

        if demi == "matin":
            absence_matin_abbr = abbr
        elif demi == "apres-midi":
            absence_soir_abbr = abbr
        elif demi == "complete":
            if personnel and personnel.role == "surface":
                absence_surface = abbr
            else:
                absence_matin_abbr = abbr
                absence_soir_abbr = abbr

    retard_matin_minutes = pt.retard_matin_minutes or 0
    retard_soir_minutes = pt.retard_soir_minutes or 0

    def hhmm(value):
        return value.strftime("%H:%M") if value else None

    division = personnel.division if personnel else None

    return {
        "id": pt.id,
        "idpers": pt.idpers,
        "date": pt.date.isoformat(),
        "heure_entree_matin": hhmm(pt.heure_entree_matin),
        "heure_sortie_matin": hhmm(pt.heure_sortie_matin),
        "heure_entree_soir": hhmm(pt.heure_entree_soir),
        "heure_sortie_soir": hhmm(pt.heure_sortie_soir),
        "heure_entree_unique": hhmm(pt.heure_entree_unique),
        "heure_sortie_unique": hhmm(pt.heure_sortie_unique),
        "retard_matin_minutes": retard_matin_minutes,
        "retard_soir_minutes": retard_soir_minutes,
        "retard_matin_volume": minutes_to_hhmm(retard_matin_minutes),
        "retard_soir_volume": minutes_to_hhmm(retard_soir_minutes),
        "retard_matin": pt.retard_matin,
        "retard_soir": pt.retard_soir,
        "retard_total_minutes": pt.retard_total_minutes,
        "absence_matin": pt.absence_matin,
        "absence_soir": pt.absence_soir,
        "absence": pt.absence,
        "absence_unique": pt.absence_unique,
        "absence_surface": absence_surface,
        "absence_matin_abbr": absence_matin_abbr,
        "absence_soir_abbr": absence_soir_abbr,
        "nomabbr": nomabbr1,
        "justificatif": pt.justificatif,
        "personnel": {
            "nom": personnel.nom if personnel else None,
            "prenom": personnel.prenom if personnel else None,
            "matricule": personnel.matricule if personnel else None,
            "role": personnel.role if personnel else None,
            "idrh": personnel.idrh if personnel else None,
            "division": {
                "iddiv": division.iddiv if division else None,
                "nom": division.nom if division else None,
            },
        },
    }
    
@bp.route("/facial/par_date_division", methods=["GET"])
def get_pointages_par_date_division_et_service():
    date_str = request.args.get("date")
    iddiv_str = request.args.get("iddiv")
    idserv_str = request.args.get("idserv")
    limit = request.args.get("limit", default=10, type=int)
    last_id = request.args.get("last_id", type=int)
    search = (request.args.get("search") or "").strip()
    role = request.args.get("role")

    if not date_str or not iddiv_str or not idserv_str:
        return jsonify({
            "success": False,
            "message": "Veuillez fournir la date, iddiv et idserv.",
        }), 400

    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({
            "success": False,
            "message": "Format de date invalide. Utilisez YYYY-MM-DD.",
        }), 400

    try:
        iddiv = int(iddiv_str)
        idserv = int(idserv_str)
    except ValueError:
        return jsonify({
            "success": False,
            "message": "iddiv et idserv doivent être des entiers valides.",
        }), 400

    limit = max(1, min(limit, 100))  # borne le limit pour éviter un LIMIT 100000

    query = (
        Pointage.query.filter_by(date=date_obj)
        .join(Personnels)
        .join(Responsables, Personnels.idrh == Responsables.idrh)
        .filter(Personnels.iddiv == iddiv, Responsables.idserv == idserv)
    )
    query = apply_personnel_filters(query, search, role)
    query = with_eager_loads(query)

    pointages, next_cursor, has_more = paginate_by_cursor(query, limit, last_id)

    # Pas de `continue` ici : l'INNER JOIN sur Personnels garantit déjà
    # la présence du personnel. Filtrer après coup casserait le comptage
    # de has_more (le serveur annonce 10, en renvoie 8).
    result = [serialize_pointage(pt) for pt in pointages]

    return jsonify({
        "success": True,
        "message": "Liste des pointages trouvés." if result else "Aucun pointage trouvé.",
        "data": result,
        "next_cursor": next_cursor,
        "has_more": has_more,
    }), 200

from datetime import date
from sqlalchemy import func, case, and_ ,distinct

@bp.route("/stats", methods=["GET"])
def get_stats_service():

    idserv = request.args.get("idserv", type=int)
    iddiv = request.args.get("iddiv", type=int)

    date_str = request.args.get("date")
    date_debut_str = request.args.get("dateDebut")
    date_fin_str = request.args.get("dateFin")

    # =========================
    # SERVICE OBLIGATOIRE
    # =========================
    if not idserv:
        return jsonify({"error": "idserv requis"}), 400

    # =========================
    # PARSING DES DATES
    # =========================
    selected_date = None
    date_debut = None
    date_fin = None

    # ----- Date unique -----
    if date_str:
        try:
            selected_date = datetime.strptime(
                date_str,
                "%Y-%m-%d"
            ).date()
        except ValueError:
            return jsonify({
                "error": "date invalide, format attendu YYYY-MM-DD"
            }), 400

    # ----- Plage de dates -----
    if date_debut_str or date_fin_str:

        if not date_debut_str or not date_fin_str:
            return jsonify({
                "error": "dateDebut et dateFin sont requis ensemble"
            }), 400

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
            return jsonify({
                "error": "dateDebut/dateFin invalides, format attendu YYYY-MM-DD"
            }), 400

        if date_fin < date_debut:
            return jsonify({
                "error": "dateFin doit être supérieure ou égale à dateDebut"
            }), 400

        # La plage est prioritaire
        selected_date = None

    # ----- Aucun filtre de date -----
    if not selected_date and not date_debut:
        selected_date = date.today()

    # =========================
    # REQUETE DE BASE
    # =========================
    query = (
        db.session.query(

            # =========================
            # EFFECTIF
            # =========================
          func.count(
    distinct(Personnels.idpers)
).label("effectif"),

            # =========================
            # PRESENCE
            # =========================
            func.sum(
                case(
                    (
                        Pointage.heure_entree_matin.isnot(None),
                        0.5
                    ),
                    else_=0.0,
                )
                +
                case(
                    (
                        Pointage.heure_entree_soir.isnot(None),
                        0.5
                    ),
                    else_=0.0,
                )
            ).label("presence"),

            # =========================
            # RETARDS
            # =========================
            func.sum(
                case(
                    (Pointage.retard_matin == 1, 0.5),
                    else_=0.0,
                )
                +
                case(
                    (Pointage.retard_soir == 1, 0.5),
                    else_=0.0,
                )
            ).label("retards"),

            # =========================
            # ABSENCES NON JUSTIFIEES
            # =========================
            func.sum(
                case(
                    (
                        and_(
                            Pointage.absence_matin == 1,
                            Pointage.justificatif.is_(None),
                        ),
                        0.5,
                    ),
                    else_=0.0,
                )
                +
                case(
                    (
                        and_(
                            Pointage.absence_soir == 1,
                            Pointage.justificatif.is_(None),
                        ),
                        0.5,
                    ),
                    else_=0.0,
                )
            ).label("absence_non_justifiee"),

            # =========================
            # ABSENCES JUSTIFIEES
            # =========================
            func.sum(
                case(
                    (
                        and_(
                            Pointage.absence_matin == 1,
                            Pointage.justificatif.isnot(None),
                        ),
                        0.5,
                    ),
                    else_=0.0,
                )
                +
                case(
                    (
                        and_(
                            Pointage.absence_soir == 1,
                            Pointage.justificatif.isnot(None),
                        ),
                        0.5,
                    ),
                    else_=0.0,
                )
            ).label("absence_justifiee"),
        )
        .select_from(Personnels)

        # =========================
        # PERSONNELS → RESPONSABLES
        # =========================
        .join(
            Responsables,
            Personnels.idrh == Responsables.idrh
        )

        # =========================
        # PERSONNELS → POINTAGES
        # =========================
        .outerjoin(
            Pointage,
            and_(
                Pointage.idpers == Personnels.idpers,

                # Date unique
                (
                    Pointage.date == selected_date
                    if selected_date
                    else Pointage.date.between(date_debut, date_fin)
                ),
            ),
        )

        # =========================
        # SERVICE
        # =========================
        .filter(
            Responsables.idserv == idserv
        )
    )

    # =========================
    # DIVISION OPTIONNELLE
    # =========================
    if iddiv:
        query = query.filter(
            Personnels.iddiv == iddiv
        )

    stats = query.first()

    # =========================
    # RESULTATS
    # =========================
    effectif = int(stats.effectif or 0)
    presence = float(stats.presence or 0)
    retards = float(stats.retards or 0)

    absence_non_justifiee = float(
        stats.absence_non_justifiee or 0
    )

    absence_justifiee = float(
        stats.absence_justifiee or 0
    )

    # =========================
    # TAUX
    # =========================
    taux_presence = (
        round((presence / effectif) * 100, 1)
        if effectif > 0
        else 0
    )

    # =========================
    # REPONSE
    # =========================
    return jsonify({
        "idserv": idserv,
        "iddiv": iddiv,

        "date": (
            selected_date.isoformat()
            if selected_date
            else None
        ),

        "dateDebut": (
            date_debut.isoformat()
            if date_debut
            else None
        ),

        "dateFin": (
            date_fin.isoformat()
            if date_fin
            else None
        ),

        "effectif": effectif,
        "presence": presence,
        "retards": retards,
        "absence_non_justifiee": absence_non_justifiee,
        "absence_justifiee": absence_justifiee,
        "taux_presence": taux_presence,
    }), 200
    
@bp.route("/faciall/par_date", methods=["GET"])
def get_pointages_par_date_par_service():
    date_str = request.args.get("date")
    idserv_str = request.args.get("idserv")
    limit = request.args.get("limit", default=10, type=int)
    last_id = request.args.get("last_id", type=int)
    search = (request.args.get("search") or "").strip()
    role = request.args.get("role")

    if not date_str:
        return jsonify({"error": "Le paramètre 'date' est requis (format YYYY-MM-DD)"}), 400
    if not idserv_str:
        return jsonify({"error": "Le paramètre 'idserv' est requis"}), 400

    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Format de date invalide. Utilisez YYYY-MM-DD."}), 400

    try:
        idserv = int(idserv_str)
    except ValueError:
        return jsonify({"error": "idserv doit être un entier"}), 400

    limit = max(1, min(limit, 100))

    query = (
        Pointage.query.join(Personnels)
        .join(Responsables, Personnels.idrh == Responsables.idrh)
        .filter(Pointage.date == date_obj, Responsables.idserv == idserv)
    )
    query = apply_personnel_filters(query, search, role)
    query = with_eager_loads(query)

    pointages, next_cursor, has_more = paginate_by_cursor(query, limit, last_id)

    result = [serialize_pointage(pt) for pt in pointages]

    return jsonify({
        "data": result,
        "next_cursor": next_cursor,
        "has_more": has_more,
    }), 200
    
@bp.route("/faciall/par_date_personnel", methods=["GET"])
def get_pointages_personnel_par_date():
    from datetime import datetime
    from models import Pointage, Personnels

    date_str = request.args.get("date")
    idpers_str = request.args.get("idpers")

    if not date_str:
        return jsonify({
            "error": "Le paramètre 'date' est requis (format YYYY-MM-DD)"
        }), 400

    if not idpers_str:
        return jsonify({
            "error": "Le paramètre 'idpers' est requis"
        }), 400

    # Validation date
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({
            "error": "Format de date invalide. Utilisez YYYY-MM-DD."
        }), 400

    # Validation idpers
    try:
        idpers = int(idpers_str)
    except ValueError:
        return jsonify({
            "error": "idpers doit être un entier"
        }), 400

    # Récupération des pointages du personnel pour la date donnée
    pointages = Pointage.query.filter(
        Pointage.date == date_obj,
        Pointage.idpers == idpers
    ).all()

    result = []

    for pt in pointages:
        absence_matin_abbr = None
        absence_soir_abbr = None
        absence_surface = None
        nomabbr1 = None
        if pt.autorisation and pt.autorisation.type_autorisation:
            abbr = pt.autorisation.type_autorisation.abbreviation
            nomabbr = pt.autorisation.type_autorisation.nomtype
            demi = pt.autorisation.demi_journee
            nomabbr1 = nomabbr
            if demi == "matin":
                absence_matin_abbr = abbr
            elif demi == "apres-midi":
                absence_soir_abbr = abbr
            elif demi == "complete":
                if pt.personnel.role == "surface":
                    absence_surface = abbr
                else:
                    absence_matin_abbr = abbr
                    absence_soir_abbr = abbr

        personnel = Personnels.query.get(pt.idpers)

        # ---- Retards : lecture directe des colonnes déjà calculées ----
        retard_matin_minutes = pt.retard_matin_minutes or 0
        retard_soir_minutes = pt.retard_soir_minutes or 0

        if personnel:
            data = {
                "id": pt.id,
                "date": pt.date.isoformat(),
                "heure_entree_matin": (
                    pt.heure_entree_matin.strftime("%H:%M")
                    if pt.heure_entree_matin
                    else None
                ),
                "heure_sortie_matin": (
                    pt.heure_sortie_matin.strftime("%H:%M")
                    if pt.heure_sortie_matin
                    else None
                ),
                "heure_entree_soir": (
                    pt.heure_entree_soir.strftime("%H:%M")
                    if pt.heure_entree_soir
                    else None
                ),
                "heure_sortie_soir": (
                    pt.heure_sortie_soir.strftime("%H:%M")
                    if pt.heure_sortie_soir
                    else None
                ),
                "nomabbr": nomabbr1,
                "retard_matin": pt.retard_matin,
                "retard_soir": pt.retard_soir,
                "retard_total_minutes": pt.retard_total_minutes,
                "absence_matin": pt.absence_matin,
                "absence_soir": pt.absence_soir,
                "absence": pt.absence,
                "heure_entree_unique": (
                    pt.heure_entree_unique.strftime("%H:%M")
                    if pt.heure_entree_unique
                    else None
                ),
                "justificatif": pt.justificatif,
                "idpers": pt.idpers,
                "retard_matin_minutes": retard_matin_minutes,
                "retard_soir_minutes": retard_soir_minutes,
                "retard_matin_volume": minutes_to_hhmm(retard_matin_minutes),
                "retard_soir_volume": minutes_to_hhmm(retard_soir_minutes),
                "absence_matin_abbr": absence_matin_abbr,
                "absence_soir_abbr": absence_soir_abbr,
                "absence_unique": pt.absence_unique,
                "absence_surface": absence_surface,
                "heure_sortie_unique": (
                    pt.heure_sortie_unique.strftime("%H:%M")
                    if pt.heure_sortie_unique
                    else None
                ),
                "personnel": {
                    "nom": personnel.nom,
                    "prenom": personnel.prenom,
                    "matricule": personnel.matricule,
                    "role": personnel.role,
                    "division": {
                        "iddiv": (
                            personnel.division.iddiv if personnel.division else None
                        ),
                        "nom": personnel.division.nom if personnel.division else None,
                    },
                },
            }

            result.append(data)

    return jsonify(result), 200

# api/facial_pointage/_helpers.py  (à ajouter à côté de serialize_pointage)

def serialize_pointage_range(pt):
    """
    Forme aplatie attendue par mapPointageRange côté front.
    NE PAS confondre avec serialize_pointage (forme par_date).
    """
    pers = pt.personnel

    absence_matin_abbr = None
    absence_soir_abbr = None
    absence_surface = None
    nomabbr1 = None

    if pt.autorisation and pt.autorisation.type_autorisation:
        abbr = pt.autorisation.type_autorisation.abbreviation
        demi = pt.autorisation.demi_journee
        nomabbr1 = pt.autorisation.type_autorisation.nomtype

        if demi in ("matin", "complete"):
            if pers.role == "surface":
                absence_surface = abbr
            else:
                absence_matin_abbr = abbr

        if demi in ("apres-midi", "complete"):
            if pers.role == "surface":
                absence_surface = abbr
            else:
                absence_soir_abbr = abbr

    retard_matin_minutes = pt.retard_matin_minutes or 0
    retard_soir_minutes = pt.retard_soir_minutes or 0

    def hhmm(value):
        return value.strftime("%H:%M") if value else None

    return {
        "id": pt.id,
        "idpers": pt.idpers,
        "date": pt.date.isoformat(),
        "nom": f"{pers.nom} {pers.prenom}",
        "matricule": pers.matricule,
        "division": pers.division.nom if pers.division else "—",
        "matin": {
            "entree": hhmm(pt.heure_entree_matin),
            "sortie": hhmm(pt.heure_sortie_matin),
            "retard": pt.retard_matin,
            "absence": pt.absence_matin,
        },
        "apresmidi": {
            "entree": hhmm(pt.heure_entree_soir),
            "sortie": hhmm(pt.heure_sortie_soir),
            "retard": pt.retard_soir,
            "absence": pt.absence_soir,
        },
        "heure_entree_unique": hhmm(pt.heure_entree_unique),
        "heure_sortie_unique": hhmm(pt.heure_sortie_unique),
        "absence_unique": pt.absence_unique,
        "absence_matin": pt.absence_matin,
        "absence_soir": pt.absence_soir,
        "absence_matin_abbr": absence_matin_abbr,
        "absence_soir_abbr": absence_soir_abbr,
        "absence_surface": absence_surface,
        "nomabbr": nomabbr1,
        "retard_matin_minutes": retard_matin_minutes,
        "retard_soir_minutes": retard_soir_minutes,
        "retard_matin_volume": minutes_to_hhmm(retard_matin_minutes),
        "retard_soir_volume": minutes_to_hhmm(retard_soir_minutes),
        "retard_total_minutes": pt.retard_total_minutes,
        "justificatif": pt.justificatif,
        "personnel": {
            "nom": pers.nom,
            "prenom": pers.prenom,
            "matricule": pers.matricule,
            "idrh": pers.idrh,
            "role": pers.role,
            "division": {
                "iddiv": pers.iddiv,
                "nom": pers.division.nom if pers.division else None,
            },
        },
    }

from sqlalchemy import tuple_


def paginate_by_cursor_date(query, limit, last_date, last_id):
    """
    Curseur composite pour les plages : (date, id) > (last_date, last_id).
    Trier sur `id` seul mélangerait les jours dans un ordre d'insertion.
    """
    if last_date is not None and last_id is not None:
        query = query.filter(
            tuple_(Pointage.date, Pointage.id) > (last_date, last_id)
        )

    rows = (
        query.order_by(Pointage.date.asc(), Pointage.id.asc())
        .limit(limit + 1)
        .all()
    )

    has_more = len(rows) > limit
    if has_more:
        rows = rows[:limit]

    if rows and has_more:
        last = rows[-1]
        next_cursor = f"{last.date.isoformat()}_{last.id}"
    else:
        next_cursor = None

    return rows, next_cursor, has_more


def parse_cursor_date(raw):
    """'2026-03-14_482' -> (date(2026,3,14), 482). Renvoie (None, None) si absent/invalide."""
    if not raw:
        return None, None
    try:
        date_part, id_part = raw.rsplit("_", 1)
        return datetime.strptime(date_part, "%Y-%m-%d").date(), int(id_part)
    except (ValueError, AttributeError):
        return None, None
    

@bp.route("/faciall/par_dates", methods=["GET"])
def get_pointages_par_dates_par_service():
    date_debut_str = request.args.get("dateDebut")
    date_fin_str = request.args.get("dateFin")
    idserv_str = request.args.get("idserv")
    iddiv_str = request.args.get("iddiv")
    limit = request.args.get("limit", default=10, type=int)
    last_cursor = request.args.get("last_id")  # format "YYYY-MM-DD_<id>"
    search = (request.args.get("search") or "").strip()
    role = request.args.get("role")

    if not date_debut_str or not date_fin_str or not idserv_str:
        return jsonify({"error": "Paramètres requis manquants"}), 400

    try:
        date_debut = datetime.strptime(date_debut_str, "%Y-%m-%d").date()
        date_fin = datetime.strptime(date_fin_str, "%Y-%m-%d").date()
        idserv = int(idserv_str)
    except ValueError:
        return jsonify({"error": "Format de paramètres invalide"}), 400

    if date_fin < date_debut:
        return jsonify({"error": "La date de fin doit être après la date de début"}), 400

    limit = max(1, min(limit, 100))

    query = (
        Pointage.query.join(Personnels)
        .join(Responsables, Personnels.idrh == Responsables.idrh)
        .filter(
            Pointage.date >= date_debut,
            Pointage.date <= date_fin,
            Responsables.idserv == idserv,
        )
    )

    if iddiv_str:
        try:
            query = query.filter(Personnels.iddiv == int(iddiv_str))
        except ValueError:
            return jsonify({"error": "iddiv doit être un entier valide"}), 400

    # Recherche + rôle en SQL : indispensable pour que le curseur reste cohérent
    query = apply_personnel_filters(query, search, role)
    query = with_eager_loads(query)

    last_date, last_id = parse_cursor_date(last_cursor)
    pointages, next_cursor, has_more = paginate_by_cursor_date(
        query, limit, last_date, last_id
    )

    # Pas de `if not pers: continue` : l'INNER JOIN sur Personnels garantit
    # déjà la présence, et filtrer après coup fausserait has_more.
    result = [serialize_pointage_range(pt) for pt in pointages]

    return jsonify({
        "success": True,
        "data": result,
        "next_cursor": next_cursor,
        "has_more": has_more,
    }), 200
    
@bp.route("/facial/par_dates_personnel", methods=["GET"])
def get_pointages_personnel_par_dates():
    from datetime import datetime
    from models import Pointage, Personnels

    date_debut_str = request.args.get("dateDebut")
    date_fin_str = request.args.get("dateFin")
    idpers_str = request.args.get("idpers")

    if not date_debut_str or not date_fin_str or not idpers_str:
        return jsonify({
            "error": "Les paramètres dateDebut, dateFin et idpers sont requis"
        }), 400

    try:
        date_debut = datetime.strptime(date_debut_str, "%Y-%m-%d").date()
        date_fin = datetime.strptime(date_fin_str, "%Y-%m-%d").date()
        idpers = int(idpers_str)
    except ValueError:
        return jsonify({
            "error": "Format de paramètres invalide"
        }), 400

    # 🔍 Requête filtrée uniquement par idpers + période
    pointages = (
        Pointage.query
        .join(Personnels)
        .filter(
            Pointage.idpers == idpers,
            Pointage.date >= date_debut,
            Pointage.date <= date_fin
        )
        .order_by(Pointage.date.asc())
        .all()
    )

    result = []

    for pt in pointages:
        # 1️⃣ Gestion des abréviations d'absence
        absence_matin_abbr = None
        absence_soir_abbr = None
        absence_surface = None
        nomabbr1 = None
        if pt.autorisation and pt.autorisation.type_autorisation:
            abbr = pt.autorisation.type_autorisation.abbreviation
            demi = pt.autorisation.demi_journee
            nomabbr = pt.autorisation.type_autorisation.nomtype
            nomabbr1 = nomabbr

            if demi in ["matin", "complete"]:
                if pt.personnel.role == "surface":
                    absence_surface = abbr
                else:
                    absence_matin_abbr = abbr

            if demi in ["apres-midi", "complete"]:
                absence_soir_abbr = abbr
                if pt.personnel.role == "surface":
                    absence_surface = abbr
                else:
                    absence_soir_abbr = abbr

        # ---- Retards : lecture directe des colonnes déjà calculées ----
        retard_matin_minutes = pt.retard_matin_minutes or 0
        retard_soir_minutes = pt.retard_soir_minutes or 0

        pers = pt.personnel  # relation SQLAlchemy

        # 2️⃣ Structure IDENTIQUE à ton API existante
        data = {
            "id": pt.id,
            "idpers": pt.idpers,
            "date": pt.date.isoformat(),
            "nom": f"{pers.nom} {pers.prenom}",
            "matricule": pers.matricule,
            "division": pers.division.nom if pers.division else "—",
            "nomabbr": nomabbr1,
            "matin": {
                "entree": (
                    pt.heure_entree_matin.strftime("%H:%M")
                    if pt.heure_entree_matin
                    else None
                ),
                "sortie": (
                    pt.heure_sortie_matin.strftime("%H:%M")
                    if pt.heure_sortie_matin
                    else None
                ),
                "retard": pt.retard_matin,
                "absence": pt.absence_matin,
            },
            "heure_entree_unique": (
                pt.heure_entree_unique.strftime("%H:%M")
                if pt.heure_entree_unique
                else None
            ),
            "apresmidi": {
                "entree": (
                    pt.heure_entree_soir.strftime("%H:%M")
                    if pt.heure_entree_soir
                    else None
                ),
                "sortie": (
                    pt.heure_sortie_soir.strftime("%H:%M")
                    if pt.heure_sortie_soir
                    else None
                ),
                "retard": pt.retard_soir,
                "absence": pt.absence_soir,
            },
            "absence_unique": pt.absence_unique,
            "absence_surface": absence_surface,
            "heure_sortie_unique": (
                pt.heure_sortie_unique.strftime("%H:%M")
                if pt.heure_sortie_unique
                else None
            ),
            "absence_matin": pt.absence_matin,
            "absence_soir": pt.absence_soir,
            "absence_matin_abbr": absence_matin_abbr,
            "absence_soir_abbr": absence_soir_abbr,
            "justificatif": pt.justificatif,
            "retard_total_minutes": pt.retard_total_minutes,
            "retard_matin_minutes": retard_matin_minutes,
            "retard_soir_minutes": retard_soir_minutes,
            "retard_matin_volume": minutes_to_hhmm(retard_matin_minutes),
            "retard_soir_volume": minutes_to_hhmm(retard_soir_minutes),
            "personnel": {
                "nom": pers.nom,
                "prenom": pers.prenom,
                "matricule": pers.matricule,
                "idrh": pers.idrh,
                "division": {
                    "iddiv": pers.iddiv,
                    "nom": pers.division.nom if pers.division else None,
                },
            },
        }

        result.append(data)

    return jsonify(result), 200


@bp.route("/facial/par_dates_personnelles", methods=["GET"])
def get_pointages_personnel_par_datesperso():

    from datetime import datetime
    from models import Pointage, Personnels

    idpers_str = request.args.get("idpers")
    dates_str = request.args.get("dates")

    if not idpers_str or not dates_str:
        return jsonify({
            "error": "Les paramètres idpers et dates sont requis"
        }), 400

    try:
        idpers = int(idpers_str)

        # 🔹 Transformer "2026-02-15,2026-02-16"
        dates_list = [
            datetime.strptime(d.strip(), "%Y-%m-%d").date()
            for d in dates_str.split(",")
        ]

    except ValueError:
        return jsonify({
            "error": "Format date invalide. Utiliser YYYY-MM-DD"
        }), 400

    # 🔎 Récupération pointages pour ces dates
    pointages = (
        Pointage.query
        .join(Personnels)
        .filter(
            Pointage.idpers == idpers,
            Pointage.date.in_(dates_list)
        )
        .order_by(Pointage.date.asc())
        .all()
    )

    result_dict = {}

    for pt in pointages:
        absence_matin_abbr = None
        absence_soir_abbr = None
        absence_surface = None
        nomabbr1 = None
        if pt.autorisation and pt.autorisation.type_autorisation:
            abbr = pt.autorisation.type_autorisation.abbreviation
            demi = pt.autorisation.demi_journee
            nomabbr = pt.autorisation.type_autorisation.nomtype
            nomabbr1 = nomabbr

            if demi in ["matin", "complete"]:
                if pt.personnel.role == "surface":
                    absence_surface = abbr
                else:
                    absence_matin_abbr = abbr

            if demi in ["apres-midi", "complete"]:
                absence_soir_abbr = abbr
                if pt.personnel.role == "surface":
                    absence_surface = abbr
                else:
                    absence_soir_abbr = abbr

        date_key = pt.date.isoformat()
        pers = pt.personnel

        # ---- Retards : lecture directe des colonnes déjà calculées ----
        retard_matin_minutes = pt.retard_matin_minutes or 0
        retard_soir_minutes = pt.retard_soir_minutes or 0

        data = {
            "id": pt.id,
            "idpers": pt.idpers,
            "date": date_key,
            "nom": f"{pers.nom} {pers.prenom}",
            "matricule": pers.matricule,
            "absence_matin_abbr": absence_matin_abbr,
            "absence_soir_abbr": absence_soir_abbr,
            "nomabbr": nomabbr1,
            "heure_sortie_unique": (
                pt.heure_sortie_unique.strftime("%H:%M")
                if pt.heure_sortie_unique
                else None
            ),
            "matin": {
                "entree": (
                    pt.heure_entree_matin.strftime("%H:%M")
                    if pt.heure_entree_matin
                    else None
                ),
                "sortie": (
                    pt.heure_sortie_matin.strftime("%H:%M")
                    if pt.heure_sortie_matin
                    else None
                ),
                "retard": pt.retard_matin,
                "absence": pt.absence_matin,
            },
            "absence_unique": pt.absence_unique,
            "absence_surface": absence_surface,
            "apresmidi": {
                "entree": (
                    pt.heure_entree_soir.strftime("%H:%M")
                    if pt.heure_entree_soir
                    else None
                ),
                "sortie": (
                    pt.heure_sortie_soir.strftime("%H:%M")
                    if pt.heure_sortie_soir
                    else None
                ),
                "retard": pt.retard_soir,
                "absence": pt.absence_soir,
            },
            "heure_entree_unique": (
                pt.heure_entree_unique.strftime("%H:%M")
                if pt.heure_entree_unique
                else None
            ),
            "retard_matin_minutes": retard_matin_minutes,
            "retard_soir_minutes": retard_soir_minutes,
            "retard_total_minutes": retard_matin_minutes + retard_soir_minutes,
        }

        # 🔹 Anti doublons (logique conservée à l'identique)
        if date_key not in result_dict:
            result_dict[date_key] = data
        else:
            existing = result_dict[date_key]

            for periode in ["matin", "apresmidi"]:
                for champ in ["entree", "sortie"]:
                    if not existing[periode][champ] and data[periode][champ]:
                        existing[periode][champ] = data[periode][champ]

            existing["retard_matin_minutes"] = max(
                existing["retard_matin_minutes"],
                data["retard_matin_minutes"]
            )

            existing["retard_soir_minutes"] = max(
                existing["retard_soir_minutes"],
                data["retard_soir_minutes"]
            )

            existing["retard_total_minutes"] = (
                existing["retard_matin_minutes"]
                + existing["retard_soir_minutes"]
            )

    return jsonify(list(result_dict.values())), 200

@bp.route("/all", methods=["GET"])
def get_all_pointage():
    pointages = Pointage.query.all()
    result = []
    for p in pointages:
        result.append(
            {
                "idpers": p.idpers,
                "date": p.date.strftime("%Y-%m-%d") if p.date else None,
                "absence_matin": p.absence_matin,
                "absence_soir": p.absence_soir,
                "absence": p.absence,
                "heure_entree_matin": (
                    p.heure_entree_matin.strftime("%H:%M")
                    if p.heure_entree_matin
                    else None
                ),
                "heure_sortie_matin": (
                    p.heure_sortie_matin.strftime("%H:%M")
                    if p.heure_sortie_matin
                    else None
                ),
                "heure_entree_soir": (
                    p.heure_entree_soir.strftime("%H:%M")
                    if p.heure_entree_soir
                    else None
                ),
                "heure_sortie_soir": (
                    p.heure_sortie_soir.strftime("%H:%M")
                    if p.heure_sortie_soir
                    else None
                ),
                "retard_matin": p.retard_matin,
                "retard_soir": p.retard_soir,
                "retard_total_minutes": p.retard_total_minutes,
                "justificatif": p.justificatif,
            }
        )
    return jsonify(result)


from sqlalchemy import select, union_all, literal, func, case


@bp.route("/facial/resume_par_mois", methods=["GET"])
def resume_pointage_par_mois():
    try:
        idpers = request.args.get("idpers", type=int)
        if not idpers:
            return jsonify({"error": "Paramètre idpers manquant"}), 400

        # Table virtuelle des 12 mois
        mois_tables = union_all(
            *[select(literal(i).label("mois")) for i in range(1, 13)]
        ).subquery()

        # Pointages filtrés par l'année en cours
        pointages_emp = (
            db.session.query(Pointage)
            .filter(
                Pointage.idpers == idpers,
                func.extract("year", Pointage.date)
                == func.extract("year", func.sysdate()),
            )
            .subquery()
        )

        # LEFT JOIN mois -> pointages
        result = (
            db.session.query(
                mois_tables.c.mois,
                func.coalesce(
                    func.extract("year", pointages_emp.c.date),
                    func.extract("year", func.sysdate()),
                ).label("annee"),
                func.coalesce(func.count(pointages_emp.c.id), 0).label(
                    "nb_jours_pointages"
                ),
                func.coalesce(
                    func.sum(case((pointages_emp.c.presence == 1, 1), else_=0)), 0
                ).label("jours_presence"),
                func.coalesce(
                    func.sum(
                        case((pointages_emp.c.absence_matin == 1, 1), else_=0)
                        + case((pointages_emp.c.absence_soir == 1, 1), else_=0)
                    ),
                    0,
                ).label("jours_absence"),
            )
            .outerjoin(
                pointages_emp,
                func.extract("month", pointages_emp.c.date) == mois_tables.c.mois,
            )
            .group_by(mois_tables.c.mois, func.extract("year", pointages_emp.c.date))
            .order_by(mois_tables.c.mois)
            .all()
        )

        data = [
            {
                "mois": int(row.mois),
                "annee": int(row.annee or func.extract("year", func.sysdate())),
                "nb_jours_pointages": int(row.nb_jours_pointages),
                "jours_presence": int(row.jours_presence),
                "jours_absence": int(row.jours_absence),
            }
            for row in result
        ]

        return jsonify(data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


from flask import request, jsonify
from datetime import datetime, time
from sqlalchemy.exc import SQLAlchemyError

@bp.route("/update_pointage_responsable", methods=["PUT"])
def update_pointage_responsable_par_service():
    data = request.get_json()

    idserv = data.get("idserv")
    idpointage = data.get("idpointage")

    if not idserv or not idpointage:
        return jsonify({"error": "idserv et idpointage requis"}), 400

    pointage = Pointage.query.get(idpointage)
    if not pointage:
        return jsonify({"error": "Pointage introuvable"}), 404

    personnel = Personnels.query.get(pointage.idpers)
    if not personnel:
        return jsonify({"error": "Personnel introuvable"}), 404

    # Vérification que le personnel appartient bien à un responsable du idserv
    responsable = Responsables.query.get(personnel.idrh)
    if not responsable or responsable.idserv != int(idserv):
        return jsonify({"error": "Modification non autorisée pour ce service"}), 403

    # =========================
    # Horaires du service (sauf agent de surface, qui n'a pas de contrainte
    # de plage — il utilise heure_entree_unique / heure_sortie_unique, pas
    # les champs matin/soir traités ici)
    # =========================
    is_surface = personnel.role == "surface"

    horaires = None
    if not is_surface:
        horaires = personnel.division.service.horaire if personnel.division and personnel.division.service else None
        if not horaires:
            return jsonify({"error": "Horaires non configurés pour ce service"}), 500

    # =========================
    # Helpers
    # =========================
    def parse_time(value):
        if value is None:
            return None
        return datetime.combine(pointage.date, datetime.strptime(value, "%H:%M").time())

    def dans_plage_matin(heure_saisie):
        return to_time(horaires.entree_matin_debut) <= heure_saisie < to_time(horaires.sortie_matin_debut)

    def dans_plage_soir(heure_saisie):
        return to_time(horaires.entree_soir_debut) <= heure_saisie < to_time(horaires.sortie_soir_debut)

    def calculer_retard(heure_entree_dt, limite_fin_time):
        """
        Retourne (en_retard: bool, minutes: int) en comparant l'heure d'entrée
        saisie à la borne de fin de plage du service (entree_matin_fin /
        entree_soir_fin). Au-delà de cette borne -> retard, avec le nombre
        de minutes de dépassement.
        """
        if not heure_entree_dt:
            return False, 0

        heure_limite_dt = datetime.combine(pointage.date, to_time(limite_fin_time))
        delta_minutes = int((heure_entree_dt - heure_limite_dt).total_seconds() / 60)

        if delta_minutes > 0:
            return True, delta_minutes
        return False, 0

    try:
        # =========================
        # HEURES MATIN / SOIR
        # =========================
        if "heure_entree_matin" in data:
            entree_matin_dt = parse_time(data.get("heure_entree_matin"))
            if entree_matin_dt and not is_surface and not dans_plage_matin(entree_matin_dt.time()):
                return jsonify({"error": "Heure d'entrée matin hors des plages horaires du service"}), 400
            pointage.heure_entree_matin = entree_matin_dt

        if "heure_sortie_matin" in data:
            sortie_matin_dt = parse_time(data.get("heure_sortie_matin"))
            if sortie_matin_dt and not is_surface and not dans_plage_matin(sortie_matin_dt.time()):
                return jsonify({"error": "Heure de sortie matin hors des plages horaires du service"}), 400
            pointage.heure_sortie_matin = sortie_matin_dt

        if "heure_entree_soir" in data:
            entree_soir_dt = parse_time(data.get("heure_entree_soir"))
            if entree_soir_dt and not is_surface and not dans_plage_soir(entree_soir_dt.time()):
                return jsonify({"error": "Heure d'entrée soir hors des plages horaires du service"}), 400
            pointage.heure_entree_soir = entree_soir_dt

        if "heure_sortie_soir" in data:
            sortie_soir_dt = parse_time(data.get("heure_sortie_soir"))
            if sortie_soir_dt and not is_surface and not dans_plage_soir(sortie_soir_dt.time()):
                return jsonify({"error": "Heure de sortie soir hors des plages horaires du service"}), 400
            pointage.heure_sortie_soir = sortie_soir_dt

        # =========================
        # ABSENCES MATIN / SOIR
        # =========================
        if "absence_matin" in data:
            if data["absence_matin"]:
                pointage.absence_matin = True
                pointage.heure_entree_matin = None
                pointage.heure_sortie_matin = None
                pointage.retard_matin = False
                pointage.retard_matin_minutes = 0
            else:
                if not data.get("heure_entree_matin") and not data.get(
                    "heure_sortie_matin"
                ):
                    pointage.absence_matin = None
                else:
                    pointage.absence_matin = False

        if "absence_soir" in data:
            if data["absence_soir"]:
                pointage.absence_soir = True
                pointage.heure_entree_soir = None
                pointage.heure_sortie_soir = None
                pointage.retard_soir = False
                pointage.retard_soir_minutes = 0
            else:
                if not data.get("heure_entree_soir") and not data.get(
                    "heure_sortie_soir"
                ):
                    pointage.absence_soir = None
                else:
                    pointage.absence_soir = False

        # =========================
        # VALIDATIONS
        # =========================
        if pointage.heure_entree_matin and pointage.heure_sortie_matin:
            pointage.absence_matin = False
            if pointage.heure_sortie_matin < pointage.heure_entree_matin:
                return jsonify({"error": "Sortie matin < entrée matin"}), 400

        if pointage.heure_entree_soir and pointage.heure_sortie_soir:
            pointage.absence_soir = False
            if pointage.heure_sortie_soir < pointage.heure_entree_soir:
                return jsonify({"error": "Sortie soir < entrée soir"}), 400

        # =========================
        # RETARDS (basés uniquement sur entree_matin_fin / entree_soir_fin)
        # =========================
        if pointage.heure_entree_matin and not pointage.absence_matin and not is_surface:
            pointage.retard_matin, pointage.retard_matin_minutes = calculer_retard(
                pointage.heure_entree_matin, horaires.entree_matin_fin
            )
        else:
            pointage.retard_matin = False
            pointage.retard_matin_minutes = 0

        if pointage.heure_entree_soir and not pointage.absence_soir and not is_surface:
            pointage.retard_soir, pointage.retard_soir_minutes = calculer_retard(
                pointage.heure_entree_soir, horaires.entree_soir_fin
            )
        else:
            pointage.retard_soir = False
            pointage.retard_soir_minutes = 0

        # Retard total
        pointage.retard_total_minutes = (pointage.retard_matin_minutes or 0) + (
            pointage.retard_soir_minutes or 0
        )

        # Présence / absence
        pointage.absence = bool(pointage.absence_matin and pointage.absence_soir)
        pointage.presence = not pointage.absence

        db.session.commit()
        socketio.emit("pointage_update")

        return (
            jsonify(
                {
                    "message": "Pointage mis à jour avec succès",
                    "pointage": pointage.to_dict(),
                }
            ),
            200,
        )

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Erreur base de données", "details": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@bp.route("/update_pointage_unique", methods=["PUT"])
def update_pointage_unique_par_service():
    data = request.get_json()
    idpointage = data.get("idpointage")
    idserv = data.get("idserv")

    if not idpointage or not idserv:
        return jsonify({"error": "idpointage et idserv requis"}), 400

    pointage = Pointage.query.get(idpointage)
    if not pointage:
        return jsonify({"error": "Pointage introuvable"}), 404

    personnel = Personnels.query.get(pointage.idpers)
    if not personnel:
        return jsonify({"error": "Personnel introuvable"}), 404

    # Vérifier que le personnel appartient à un responsable du idserv
    responsable = Responsables.query.get(personnel.idrh)
    if not responsable or responsable.idserv != int(idserv):
        return jsonify({"error": "Modification non autorisée pour ce service"}), 403

    def parse_time(value):
        if value is None:
            return None
        return datetime.combine(
            pointage.date,
            datetime.strptime(value, "%H:%M").time()
        )

    try:
        # =========================
        # Heure d'entrée unique
        # =========================
        if "heure_entree_unique" in data and data.get("heure_entree_unique"):
            pointage.heure_entree_unique = parse_time(data.get("heure_entree_unique"))
            pointage.absence_unique = False
            pointage.presence = True

        if "heure_sortie_unique" in data and data.get("heure_sortie_unique"):
            pointage.heure_sortie_unique = parse_time(data.get("heure_sortie_unique"))

        # =========================
        # Absence unique
        # =========================
        if "absence_unique" in data:
            if data["absence_unique"]:
                pointage.absence_unique = True
                pointage.heure_entree_unique = None
                pointage.heure_sortie_unique = None
                pointage.presence = False
            else:
                pointage.absence_unique = False
                if pointage.heure_entree_unique and pointage.heure_sortie_unique:
                    pointage.presence = True

        db.session.commit()
        socketio.emit("pointage_update")

        return jsonify({
            "message": "Pointage mis à jour avec succès",
            "pointage": pointage.to_dict()  # to_dict() doit inclure heure_entree_unique et absence_unique
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Erreur base de données", "details": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

def enregistrer_absences_non_pointes():
    now = datetime.now()
    if now.time() < time(18, 0):
        # Pas encore 18h, on ne fait rien
        return

    today = now.date()
    personnels = Personnels.query.all()
    for perso in personnels:
        pointage = Pointage.query.filter_by(idpers=perso.idpers, date=today).first()
        if not pointage:
            # Pas de pointage aujourd'hui, on enregistre une absence globale
            pointage = Pointage(
                idpers=perso.idpers,
                date=today,
                absence_matin=True,
                absence_soir=True,
                absence=True,
                retard_matin=False,
                retard_soir=False,
                retard_total_minutes=0,
                heure_entree_matin=None,
                heure_sortie_matin=None,
                heure_entree_soir=None,
                heure_sortie_soir=None,
                justificatif=None,
            )
            db.session.add(pointage)
    db.session.commit()


@bp.route("/facial/<int:id>", methods=["DELETE"])
def delete_pointage(id):
    div = Pointage.query.get_or_404(id)
    try:
        db.session.delete(div)
        db.session.commit()
        socketio.emit("pointage_update")
 
        return jsonify({"message": "Pointage supprimée"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@bp.route("/facial/pdf/interval", methods=["GET"])
def exporter_pointage_pdf_interval():
    date_debut_str = request.args.get("date_debut")
    date_fin_str = request.args.get("date_fin")
    division = request.args.get("division")
    idrh = request.args.get("idrh", type=int)  # Nouveau filtre

    if not date_debut_str or not date_fin_str:
        return {
            "error": "Les paramètres 'date_debut' et 'date_fin' sont requis (format YYYY-MM-DD)."
        }, 400

    try:
        date_debut = datetime.strptime(date_debut_str, "%Y-%m-%d").date()
        date_fin = datetime.strptime(date_fin_str, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Dates invalides"}, 400

    if date_fin < date_debut:
        return {
            "error": "'date_fin' doit être postérieure ou égale à 'date_debut'"
        }, 400

    pointages = (
        Pointage.query.filter(Pointage.date >= date_debut, Pointage.date <= date_fin)
        .order_by(Pointage.date.asc())
        .all()
    )

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    elements = []
    styles = getSampleStyleSheet()

    title = Paragraph(
        f"<b>Pointage du {date_debut.strftime('%d/%m/%Y')} au {date_fin.strftime('%d/%m/%Y')}</b>",
        styles["Title"],
    )
    elements.append(title)
    elements.append(Spacer(1, 12))

    header1 = [
        "Date",
        "Matricule",
        "Nom",
        "Division",
        "Matin",
        "",
        "",
        "",
        "",
        "Après-midi",
        "",
        "",
        "",
        "",
        "Statut",
        "Justificatif",
    ]
    header2 = [
        "",
        "",
        "",
        "",
        "Entrée",
        "Sortie",
        "Absent",
        "Retard",
        "Présent",
        "Entrée",
        "Sortie",
        "Absent",
        "Retard",
        "Présent",
        "",
        "",
    ]
    data_table = [header1, header2]

    for pt in pointages:
        pers = Personnels.query.get(pt.idpers)
        if not pers:
            continue

        # Filtrage par division si demandé
        if (
            division
            and hasattr(pers, "division")
            and pers.division
            and pers.division.nom != division
        ):
            continue

        # Filtrage par idrh si demandé
        if idrh and pers.idrh != idrh:
            continue

        row = [
            pt.date.strftime("%d/%m/%Y"),
            pers.matricule or "-",
            f"{pers.nom} {pers.prenom}",
            pers.division.nom if hasattr(pers, "division") and pers.division else "-",
            pt.heure_entree_matin.strftime("%H:%M") if pt.heure_entree_matin else "--",
            pt.heure_sortie_matin.strftime("%H:%M") if pt.heure_sortie_matin else "--",
            "Oui" if pt.absence_matin else "Non",
            "Oui" if pt.retard_matin else "Non",
            "Non" if pt.absence_matin else "Oui",
            pt.heure_entree_soir.strftime("%H:%M") if pt.heure_entree_soir else "--",
            pt.heure_sortie_soir.strftime("%H:%M") if pt.heure_sortie_soir else "--",
            "Oui" if pt.absence_soir else "Non",
            "Oui" if pt.retard_soir else "Non",
            "Non" if pt.absence_soir else "Oui",
            "Absent" if pt.absence else "Présent",
            pt.justificatif or "-",
        ]
        data_table.append(row)

    col_widths = [55, 55, 90, 65, 40, 40, 40, 40, 45, 40, 40, 40, 40, 45, 50, 100]

    table = Table(data_table, repeatRows=2, colWidths=col_widths)
    table.setStyle(
        TableStyle(
            [
                ("SPAN", (4, 0), (8, 0)),  # Matin
                ("SPAN", (9, 0), (13, 0)),  # Après-midi
                ("SPAN", (0, 0), (0, 1)),  # Date
                ("SPAN", (1, 0), (1, 1)),  # Matricule
                ("SPAN", (2, 0), (2, 1)),  # Nom
                ("SPAN", (3, 0), (3, 1)),  # Division
                ("SPAN", (14, 0), (14, 1)),  # Statut
                ("SPAN", (15, 0), (15, 1)),  # Justificatif
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
            ]
        )
    )

    elements.append(table)
    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"pointage_{date_debut.strftime('%Y%m%d')}_to_{date_fin.strftime('%Y%m%d')}.pdf",
        mimetype="application/pdf",
    )


@bp.route("/facial/pdf", methods=["GET"])
def exporter_pointage_pdf():
    date_str = request.args.get("date")
    division = request.args.get("division")

    if not date_str:
        return {"error": "Le paramètre 'date' est requis (format YYYY-MM-DD)."}, 400

    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Date invalide"}, 400

    # Si c'est aujourd'hui, vérifier absences
    if date_obj == date.today():
        check_absents_matin()
        check_absents_soir()

    pointages = Pointage.query.filter(Pointage.date == date_obj).all()

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    elements = []
    styles = getSampleStyleSheet()

    # Titre
    title = Paragraph(
        f"<b>Pointage du {date_obj.strftime('%d/%m/%Y')}</b>", styles["Title"]
    )
    elements.append(title)
    elements.append(Spacer(1, 12))

    # En-têtes
    header1 = [
        "Matricule",
        "Nom",
        "Division",
        "Matin",
        "",
        "",
        "",
        "",
        "Après-midi",
        "",
        "",
        "",
        "",
        "Statut",
        "Justificatif",
    ]
    header2 = [
        "",
        "",
        "",
        "Entrée",
        "Sortie",
        "Absent",
        "Retard",
        "Présent",
        "Entrée",
        "Sortie",
        "Absent",
        "Retard",
        "Présent",
        "",
        "",
    ]
    data_table = [header1, header2]

    # Lignes pointages
    for pt in pointages:
        pers = Personnels.query.get(pt.idpers)
        if not pers:
            continue
        if (
            division
            and hasattr(pers, "division")
            and pers.division
            and pers.division.nom != division
        ):
            continue

        row = [
            pers.matricule or "-",
            f"{pers.nom} {pers.prenom}",
            pers.division.nom if hasattr(pers, "division") and pers.division else "-",
            pt.heure_entree_matin.strftime("%H:%M") if pt.heure_entree_matin else "--",
            pt.heure_sortie_matin.strftime("%H:%M") if pt.heure_sortie_matin else "--",
            "Oui" if pt.absence_matin else "Non",
            "Oui" if pt.retard_matin else "Non",
            "Non" if pt.absence_matin else "Oui",
            pt.heure_entree_soir.strftime("%H:%M") if pt.heure_entree_soir else "--",
            pt.heure_sortie_soir.strftime("%H:%M") if pt.heure_sortie_soir else "--",
            "Oui" if pt.absence_soir else "Non",
            "Oui" if pt.retard_soir else "Non",
            "Non" if pt.absence_soir else "Oui",
            "Absent" if pt.absence else "Présent",
            pt.justificatif or "-",
        ]
        data_table.append(row)

    col_widths = [55, 100, 120, 40, 40, 40, 40, 45, 40, 40, 40, 40, 45, 50, 100]
    table = Table(data_table, repeatRows=2, colWidths=col_widths)

    # Style simple : pas de couleur, bordures fines
    table.setStyle(
        TableStyle(
            [
                ("SPAN", (3, 0), (7, 0)),
                ("SPAN", (8, 0), (12, 0)),
                ("SPAN", (0, 0), (0, 1)),
                ("SPAN", (1, 0), (1, 1)),
                ("SPAN", (2, 0), (2, 1)),
                ("SPAN", (13, 0), (13, 1)),
                ("SPAN", (14, 0), (14, 1)),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.black),
            ]
        )
    )

    elements.append(table)
    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"pointage_{date_obj.strftime('%Y%m%d')}.pdf",
        mimetype="application/pdf",
    )


def create_table_style():
    # Style simple : pas de couleur, bordures fines
    return TableStyle(
        [
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.black),
        ]
    )


def format_statut(val):
    """Logique demandée : OUI si True, NON si False, --- si None"""
    if val is None:
        return "---"
    return "OUI" if val else "NON"


@bp.route("/facial/excel/<int:idserv>", methods=["GET"])
def exporter_pointage_excel_par_service(idserv):
    date_str = request.args.get("date")
    type_pointage = request.args.get("type", "all")  # all / bureau / surface

    if not date_str:
        return {"error": "Date manquante"}, 400

    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except:
        return {"error": "Format date invalide"}, 400

    # Récupérer le service et son responsable
    service = Services.query.get_or_404(idserv)
    responsable = service.responsables  # relation 1-1
    if not responsable:
        return {"error": "Service sans responsable"}, 404

    # Filtrer les personnels selon type_pointage
    if type_pointage == "bureau":
        personnels_filtrés = [
            p
            for p in service.divisions
            for p in p.personnels
            if getattr(p, "role", "bureau") == "bureau"
        ]
    elif type_pointage == "surface":
        personnels_filtrés = [
            p
            for p in service.divisions
            for p in p.personnels
            if getattr(p, "role", "bureau") == "surface"
        ]
    else:
        personnels_filtrés = [
            p for div in service.divisions for p in div.personnels
        ]  # all

    structure_divisions = {}
    for pers in personnels_filtrés:
        pt = Pointage.query.filter_by(idpers=pers.idpers, date=date_obj).first()
        aut = AutorisationAbsence.query.filter_by(
            idpers=pers.idpers, date_absence=date_obj
        ).first()

        # Préparation texte de base si autorisation existe
        justif_base = (
            aut.type_autorisation.nomtype if (aut and aut.type_autorisation) else None
        )

        # Logique Matin
        est_absent_matin = pt and pt.absence_matin is True
        a_aut_matin = aut and aut.demi_journee in ["matin", "complete"]
        matin_sortie_manquante = (
            pt and pt.heure_entree_matin and not pt.heure_sortie_matin
        )

        if a_aut_matin:
            justif_matin = justif_base
        elif est_absent_matin:
            if matin_sortie_manquante and not aut:
                justif_matin = "Sortie non enregistrée"
            else:
                justif_matin = "Absence non justifiée"
        else:
            justif_matin = "--"

        # Logique Soir
        est_absent_soir = pt and pt.absence_soir is True
        a_aut_soir = aut and aut.demi_journee in ["apres-midi", "complete"]
        soir_sortie_manquante = pt and pt.heure_entree_soir and not pt.heure_sortie_soir

        if a_aut_soir:
            justif_soir = justif_base
        elif est_absent_soir:
            if soir_sortie_manquante and not aut:
                justif_soir = "Sortie non enregistrée"
            else:
                justif_soir = "Absence non justifiée"
        else:
            justif_soir = "--"

        div_nom = pers.division.nom if pers.division else "SANS DIVISION"
        if div_nom not in structure_divisions:
            structure_divisions[div_nom] = []

        entry = {
            "nom": f"{pers.nom} {pers.prenom}",
            "im": pers.matricule or "--",
            "matin_entree": (
                pt.heure_entree_matin.strftime("%H:%M")
                if (pt and pt.heure_entree_matin)
                else "00:00"
            ),
            "matin_sortie": (
                pt.heure_sortie_matin.strftime("%H:%M")
                if (pt and pt.heure_sortie_matin)
                else "00:00"
            ),
            "matin_retard": format_statut(pt.retard_matin) if pt else "---",
            "matin_absent": format_statut(pt.absence_matin) if pt else "---",
            "soir_entree": (
                pt.heure_entree_soir.strftime("%H:%M")
                if (pt and pt.heure_entree_soir)
                else "00:00"
            ),
            "soir_sortie": (
                pt.heure_sortie_soir.strftime("%H:%M")
                if (pt and pt.heure_sortie_soir)
                else "00:00"
            ),
            "soir_retard": format_statut(pt.retard_soir) if pt else "---",
            "soir_absent": format_statut(pt.absence_soir) if pt else "---",
            "justif_matin": justif_matin,
            "justif_soir": justif_soir,
            "heure_entree_unique": (
                pt.heure_entree_unique.strftime("%H:%M")
                if (pt and pt.heure_entree_unique)
                else None
            ),
            "heure_sortie_unique": (
                pt.heure_sortie_unique.strftime("%H:%M")
                if (pt and pt.heure_sortie_unique)
                else None
            ),
            "absence_unique": (
                "OUI" if pt and pt.absence_unique else "NON" if pt else "---"
            ),
        }

        # Gestion agents surface
        if pt and getattr(pers, "role", None) == "surface":
            if pt.absence_unique and not pt.heure_entree_unique:
                justificatif = justif_base or "Absence non justifiée"
            elif pt.heure_entree_unique and not pt.heure_sortie_unique:
                justificatif = justif_base or "Sortie non enregistrée"
            else:
                justificatif = "--"
            entry["justif_matin"] = justificatif
            entry["justif_soir"] = justificatif

        structure_divisions[div_nom].append(entry)
    
    filepath = creer_fiche_presence(
        nom_service=service.nom,
        date_jour=date_obj.strftime("%d/%m/%Y"),
        sigle_service_adresse=f"{service.sigle or ''} - {service.addresse}",
        structure_divisions=structure_divisions,
    )
    return send_file(filepath, as_attachment=True)


from datetime import timedelta


@bp.route("/facial/excel/periode/<int:idserv>", methods=["GET"])
def exporter_pointage_periode_excel_par_service(idserv):
    date_debut_str = request.args.get("date_debut")
    date_fin_str = request.args.get("date_fin")
    type_pointage = request.args.get("type", "all")  # all / bureau / surface

    if not date_debut_str or not date_fin_str:
        return {"error": "Dates requises"}, 400

    try:
        start_date = datetime.strptime(date_debut_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(date_fin_str, "%Y-%m-%d").date()
    except:
        return {"error": "Format date invalide"}, 400

    service = Services.query.get_or_404(idserv)
    responsable = service.responsables
    if not responsable:
        return {"error": "Service sans responsable"}, 404

    # Filtrer les personnels selon type_pointage et toutes les divisions du service
    if type_pointage == "bureau":
        personnels_filtrés = [
            p for div in service.divisions for p in div.personnels if getattr(p, "role", "bureau") == "bureau"
        ]
    elif type_pointage == "surface":
        personnels_filtrés = [
            p for div in service.divisions for p in div.personnels if getattr(p, "role", "bureau") == "surface"
        ]
    else:  # "all"
        personnels_filtrés = [p for div in service.divisions for p in div.personnels]

    # Générer la liste des jours
    jours_periode = [start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)]

    structure_divisions = {}
    for pers in personnels_filtrés:
        div_nom = pers.division.nom if pers.division else "SANS DIVISION"
        if div_nom not in structure_divisions:
            structure_divisions[div_nom] = []

        for jour in jours_periode:
            pt = Pointage.query.filter_by(idpers=pers.idpers, date=jour).first()
            aut = AutorisationAbsence.query.filter_by(idpers=pers.idpers, date_absence=jour).first()

            justif_base = aut.type_autorisation.nomtype if (aut and aut.type_autorisation) else None

            # --- Logique Matin ---
            est_absent_matin = pt and pt.absence_matin is True
            a_aut_matin = aut and aut.demi_journee in ["matin", "complete"]
            matin_sortie_manquante = pt and pt.heure_entree_matin and not pt.heure_sortie_matin
            if a_aut_matin:
                justif_matin = justif_base
            elif est_absent_matin:
                justif_matin = "Sortie non enregistrée" if matin_sortie_manquante and not aut else "Absence non justifiée"
            else:
                justif_matin = "--"

            # --- Logique Soir ---
            est_absent_soir = pt and pt.absence_soir is True
            a_aut_soir = aut and aut.demi_journee in ["apres-midi", "complete"]
            soir_sortie_manquante = pt and pt.heure_entree_soir and not pt.heure_sortie_soir
            if a_aut_soir:
                justif_soir = justif_base
            elif est_absent_soir:
                justif_soir = "Sortie non enregistrée" if soir_sortie_manquante and not aut else "Absence non justifiée"
            else:
                justif_soir = "--"

            entry = {
                "date": jour.strftime("%d/%m/%Y"),
                "nom": f"{pers.nom} {pers.prenom}",
                "im": pers.matricule or "--",
                "matin_entree": pt.heure_entree_matin.strftime("%H:%M") if (pt and pt.heure_entree_matin) else "00:00",
                "matin_sortie": pt.heure_sortie_matin.strftime("%H:%M") if (pt and pt.heure_sortie_matin) else "00:00",
                "matin_retard": format_statut(pt.retard_matin) if pt else "---",
                "matin_absent": format_statut(pt.absence_matin) if pt else "---",
                "soir_entree": pt.heure_entree_soir.strftime("%H:%M") if (pt and pt.heure_entree_soir) else "00:00",
                "soir_sortie": pt.heure_sortie_soir.strftime("%H:%M") if (pt and pt.heure_sortie_soir) else "00:00",
                "soir_retard": format_statut(pt.retard_soir) if pt else "---",
                "soir_absent": format_statut(pt.absence_soir) if pt else "---",
                "justif_matin": justif_matin,
                "justif_soir": justif_soir,
                "heure_entree_unique": pt.heure_entree_unique.strftime("%H:%M") if (pt and pt.heure_entree_unique) else None,
                "heure_sortie_unique": pt.heure_sortie_unique.strftime("%H:%M") if (pt and pt.heure_sortie_unique) else None,
                "absence_unique": "OUI" if pt and pt.absence_unique else "NON" if pt else "---",
            }

            # Gestion agents surface
            if pt and getattr(pers, "role", None) == "surface":
                if pt.absence_unique and not pt.heure_entree_unique:
                    justificatif = justif_base or "Absence non justifiée"
                elif pt.heure_entree_unique and not pt.heure_sortie_unique:
                    justificatif = justif_base or "Sortie non enregistrée"
                else:
                    justificatif = "--"
                entry["justif_matin"] = justificatif
                entry["justif_soir"] = justificatif

            structure_divisions[div_nom].append(entry)

    filepath = creer_fiche_presence_periode(
        nom_service=service.nom,
        periode_str=f"Du {start_date.strftime('%d/%m/%Y')} Au {end_date.strftime('%d/%m/%Y')}",
        sigle_service_adresse=f"{service.sigle or ''} - {service.addresse}",
        structure_divisions=structure_divisions,
    )

    return send_file(filepath, as_attachment=True)

@bp.route("/facial/excel/personnel/<int:idpers>", methods=["GET"])
def exporter_pointage_personnel_excel(idpers):

    date_str = request.args.get("date")
    if not date_str:
        return {"error": "Date manquante"}, 400

    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except:
        return {"error": "Format date invalide"}, 400

    # 🔹 Récupérer le personnel
    pers = Personnels.query.get_or_404(idpers)

    service = pers.division.service if pers.division else None
    division_nom = pers.division.nom if pers.division else "SANS DIVISION"

    structure_divisions = {division_nom: []}

    pt = Pointage.query.filter_by(idpers=pers.idpers, date=date_obj).first()
    aut = AutorisationAbsence.query.filter_by(
        idpers=pers.idpers,
        date_absence=date_obj
    ).first()

    justif_base = (
        aut.type_autorisation.nomtype
        if (aut and aut.type_autorisation)
        else None
    )

    # ================= MATIN =================
    est_absent_matin = pt and pt.absence_matin is True
    a_aut_matin = aut and aut.demi_journee in ["matin", "complete"]
    matin_sortie_manquante = pt and pt.heure_entree_matin and not pt.heure_sortie_matin

    if a_aut_matin:
        justif_matin = justif_base
    elif est_absent_matin:
        if matin_sortie_manquante and not aut:
            justif_matin = "Sortie non enregistrée"
        else:
            justif_matin = "Absence non justifiée"
    else:
        justif_matin = "--"

    # ================= SOIR =================
    est_absent_soir = pt and pt.absence_soir is True
    a_aut_soir = aut and aut.demi_journee in ["apres-midi", "complete"]
    soir_sortie_manquante = pt and pt.heure_entree_soir and not pt.heure_sortie_soir

    if a_aut_soir:
        justif_soir = justif_base
    elif est_absent_soir:
        if soir_sortie_manquante and not aut:
            justif_soir = "Sortie non enregistrée"
        else:
            justif_soir = "Absence non justifiée"
    else:
        justif_soir = "--"

    entry = {
        "nom": f"{pers.nom} {pers.prenom}",
        "im": pers.matricule or "--",
        "matin_entree": (
            pt.heure_entree_matin.strftime("%H:%M")
            if (pt and pt.heure_entree_matin)
            else "00:00"
        ),
        "matin_sortie": (
            pt.heure_sortie_matin.strftime("%H:%M")
            if (pt and pt.heure_sortie_matin)
            else "00:00"
        ),
        "matin_retard": format_statut(pt.retard_matin) if pt else "---",
        "matin_absent": format_statut(pt.absence_matin) if pt else "---",
        "soir_entree": (
            pt.heure_entree_soir.strftime("%H:%M")
            if (pt and pt.heure_entree_soir)
            else "00:00"
        ),
        "soir_sortie": (
            pt.heure_sortie_soir.strftime("%H:%M")
            if (pt and pt.heure_sortie_soir)
            else "00:00"
        ),
        "soir_retard": format_statut(pt.retard_soir) if pt else "---",
        "soir_absent": format_statut(pt.absence_soir) if pt else "---",
        "justif_matin": justif_matin,
        "justif_soir": justif_soir,
        "heure_entree_unique": (
            pt.heure_entree_unique.strftime("%H:%M")
            if (pt and pt.heure_entree_unique)
            else None
        ),
        "heure_sortie_unique": (
            pt.heure_sortie_unique.strftime("%H:%M")
            if (pt and pt.heure_sortie_unique)
            else None
        ),
          "absence_unique": (
    "OUI" if pt and pt.absence_unique
    else "NON" if pt
    else "---"
),   
    }
    if pt and  getattr(pers, "role", None) == "surface":  # vérifie si l'employé est agent de surface

        print(
                f"Traitement agent de surface : {pers.nom} {pers.prenom} (IM: {pers.matricule})"
            )
        if pt.absence_unique and not pt.heure_entree_unique:

            if justif_base:
                justificatif = justif_base
            else:
                justificatif = "Absence non justifiée"

        elif pt.heure_entree_unique and not pt.heure_sortie_unique:
            if justif_base:
                justificatif = justif_base
            else:
                justificatif = "Sortie non enregistrée"

        else:
            justificatif = "--"

        # On remplace les colonnes 12 et 13
        entry["justif_matin"] = justificatif
        entry["justif_soir"] = justificatif

    structure_divisions[division_nom].append(entry)

    filepath = creer_fiche_presence(
        nom_service=service.nom if service else "",
        date_jour=date_obj.strftime("%d/%m/%Y"),
        sigle_service_adresse=f"{service.sigle or ''} - {service.addresse}" if service else "",
        structure_divisions=structure_divisions,
    )

    return send_file(filepath, as_attachment=True)


@bp.route("/facial/excel/periode/personnel/<int:idpers>", methods=["GET"])
def exporter_pointage_periode_personnel_excel(idpers):
    date_debut_str = request.args.get("date_debut")
    date_fin_str = request.args.get("date_fin")

    if not date_debut_str or not date_fin_str:
        return {"error": "Dates requises"}, 400

    try:
        start_date = datetime.strptime(date_debut_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(date_fin_str, "%Y-%m-%d").date()
    except:
        return {"error": "Format date invalide"}, 400

    # 🔹 Récupérer le personnel
    pers = Personnels.query.get_or_404(idpers)

    service = pers.division.service if pers.division else None
    division_nom = pers.division.nom if pers.division else "SANS DIVISION"

    # 🔹 Liste des jours
    jours_periode = []
    curr = start_date
    while curr <= end_date:
        jours_periode.append(curr)
        curr += timedelta(days=1)

    structure_divisions = {division_nom: []}

    for jour in jours_periode:
        pt = Pointage.query.filter_by(idpers=pers.idpers, date=jour).first()
        aut = AutorisationAbsence.query.filter_by(
            idpers=pers.idpers, date_absence=jour
        ).first()

        justif_base = (
            aut.type_autorisation.nomtype
            if (aut and aut.type_autorisation)
            else None
        )

        # ================= MATIN =================
        est_absent_matin = pt and pt.absence_matin is True
        a_aut_matin = aut and aut.demi_journee in ["matin", "complete"]
        matin_sortie_manquante = pt and pt.heure_entree_matin and not pt.heure_sortie_matin

        if a_aut_matin:
            justif_matin = justif_base
        elif est_absent_matin:
            if matin_sortie_manquante and not aut:
                justif_matin = "Sortie non enregistrée"
            else:
                justif_matin = "Absence non justifiée"
        else:
            justif_matin = "--"

        # ================= SOIR =================
        est_absent_soir = pt and pt.absence_soir is True
        a_aut_soir = aut and aut.demi_journee in ["apres-midi", "complete"]
        soir_sortie_manquante = pt and pt.heure_entree_soir and not pt.heure_sortie_soir

        if a_aut_soir:
            justif_soir = justif_base
        elif est_absent_soir:
            if soir_sortie_manquante and not aut:
                justif_soir = "Sortie non enregistrée"
            else:
                justif_soir = "Absence non justifiée"
        else:
            justif_soir = "--"

        entry = {
            "date": jour.strftime("%d/%m/%Y"),
            "nom": f"{pers.nom} {pers.prenom}",
            "im": pers.matricule or "--",
            "matin_entree": (
                pt.heure_entree_matin.strftime("%H:%M")
                if (pt and pt.heure_entree_matin)
                else "00:00"
            ),
            "matin_sortie": (
                pt.heure_sortie_matin.strftime("%H:%M")
                if (pt and pt.heure_sortie_matin)
                else "00:00"
            ),
            "matin_retard": format_statut(pt.retard_matin) if pt else "---",
            "matin_absent": format_statut(pt.absence_matin) if pt else "---",
            "soir_entree": (
                pt.heure_entree_soir.strftime("%H:%M")
                if (pt and pt.heure_entree_soir)
                else "00:00"
            ),
            "soir_sortie": (
                pt.heure_sortie_soir.strftime("%H:%M")
                if (pt and pt.heure_sortie_soir)
                else "00:00"
            ),
            "soir_retard": format_statut(pt.retard_soir) if pt else "---",
            "soir_absent": format_statut(pt.absence_soir) if pt else "---",
            "justif_matin": justif_matin,
            "justif_soir": justif_soir,
            "heure_entree_unique": (
                pt.heure_entree_unique.strftime("%H:%M")
                if (pt and pt.heure_entree_unique)
                else None
            ),
            "heure_sortie_unique": (
                pt.heure_sortie_unique.strftime("%H:%M")
                if (pt and pt.heure_sortie_unique)
                else None
            ),
            "matin_absent_unique": format_statut(pt.absence_unique) if pt else "---",
            "absence_unique": (
                "OUI" if pt and pt.absence_unique else "NON" if pt else "---"
            ),
        }
        if pt and  getattr(pers, "role", None) == "surface":  # vérifie si l'employé est agent de surface

            print(
                f"Traitement agent de surface : {pers.nom} {pers.prenom} (IM: {pers.matricule})"
            )
            if pt.absence_unique and not pt.heure_entree_unique:

                if justif_base:
                    justificatif = justif_base
                else:
                    justificatif = "Absence non justifiée"

            elif pt.heure_entree_unique and not pt.heure_sortie_unique:
                if justif_base:
                    justificatif = justif_base
                else:
                    justificatif = "Sortie non enregistrée"

            else:
                justificatif = "--"
            # On remplace les colonnes 12 et 13
            entry["justif_matin"] = justificatif
            entry["justif_soir"] = justificatif
        structure_divisions[division_nom].append(entry)

    filepath = creer_fiche_presence_periode(
        nom_service=service.nom if service else "",
        periode_str=f"Du {start_date.strftime('%d/%m/%Y')} Au {end_date.strftime('%d/%m/%Y')}",
        sigle_service_adresse=f"{service.sigle or ''} - {service.addresse}" if service else "",
        structure_divisions=structure_divisions,
    )

    return send_file(filepath, as_attachment=True)

@bp.route("/facial/excel/dates/personnel2/<int:idpers>", methods=["GET"])
def exporter_pointage_dates_personnel_excel2(idpers):
    # 🔹 Récupérer les dates en query param : ?dates=2026-02-14,2026-02-15
    dates_str = request.args.get("dates")
    if not dates_str:
        return {"error": "Au moins une date est requise"}, 400

    try:
        # Split et conversion en date
        dates_list = sorted(
        set(
            datetime.strptime(d.strip(), "%Y-%m-%d").date()
            for d in dates_str.split(",")
            if d.strip()
        )
    )
    except:
        return {"error": "Format date invalide, attendu YYYY-MM-DD"}, 400

    # 🔹 Récupérer le personnel
    pers = Personnels.query.get_or_404(idpers)
    service = pers.division.service if pers.division else None
    division_nom = pers.division.nom if pers.division else "SANS DIVISION"

    structure_divisions = {division_nom: []}

    for jour in dates_list:
        pt = Pointage.query.filter_by(idpers=pers.idpers, date=jour).first()
        aut = AutorisationAbsence.query.filter_by(idpers=pers.idpers, date_absence=jour).first()
        justif_base = aut.type_autorisation.nomtype if aut and aut.type_autorisation else None

        # ================= MATIN =================
        est_absent_matin = pt and pt.absence_matin is True
        a_aut_matin = aut and aut.demi_journee in ["matin", "complete"]
        matin_sortie_manquante = pt and pt.heure_entree_matin and not pt.heure_sortie_matin

        if a_aut_matin:
            justif_matin = justif_base
        elif est_absent_matin:
            if matin_sortie_manquante and not aut:
                justif_matin = "Sortie non enregistrée"
            else:
                justif_matin = "Absence non justifiée"
        else:
            justif_matin = "--"

        # ================= SOIR =================
        est_absent_soir = pt and pt.absence_soir is True
        a_aut_soir = aut and aut.demi_journee in ["apres-midi", "complete"]
        soir_sortie_manquante = pt and pt.heure_entree_soir and not pt.heure_sortie_soir

        if a_aut_soir:
            justif_soir = justif_base
        elif est_absent_soir:
            if soir_sortie_manquante and not aut:
                justif_soir = "Sortie non enregistrée"
            else:
                justif_soir = "Absence non justifiée"
        else:
            justif_soir = "--"

        entry = {
            "date": jour.strftime("%d/%m/%Y"),
            "nom": f"{pers.nom} {pers.prenom}",
            "im": pers.matricule or "--",

            "matin_entree": pt.heure_entree_matin.strftime("%H:%M") if pt and pt.heure_entree_matin else "00:00",
            "matin_sortie": pt.heure_sortie_matin.strftime("%H:%M") if pt and pt.heure_sortie_matin else "00:00",
            "matin_retard": format_statut(pt.retard_matin) if pt else "---",
            "matin_absent": format_statut(pt.absence_matin) if pt else "---",
  "heure_entree_unique": (
                pt.heure_entree_unique.strftime("%H:%M")
                if (pt and pt.heure_entree_unique)
                else None
            ),
             "matin_absent_unique": format_statut(pt.absence_unique) if pt else "---",
           
            "absence_unique": pt.absence_unique if pt else None,
   
      
            "soir_entree": pt.heure_entree_soir.strftime("%H:%M") if pt and pt.heure_entree_soir else "00:00",
            "soir_sortie": pt.heure_sortie_soir.strftime("%H:%M") if pt and pt.heure_sortie_soir else "00:00",
            "soir_retard": format_statut(pt.retard_soir) if pt else "---",
            "soir_absent": format_statut(pt.absence_soir) if pt else "---",

            "justif_matin": justif_matin,
            "justif_soir": justif_soir,
        }
        if pt and  getattr(pers, "role", None) == "surface":  # vérifie si l'employé est agent de surface
             if entry["absence_unique"]:
                if justif_base:  # il y a une autorisation
                    justificatif = justif_base
                else:  # pas d'autorisation
                      justificatif = "Absence non justifiée"
             else:
                 justificatif = "--"

    # On remplace les colonnes 12 et 13
             entry["justif_matin"] = justificatif
             entry["justif_soir"] = justificatif

        structure_divisions[division_nom].append(entry)

    filepath = creer_fiche_presence_periode(
        nom_service=service.nom if service else "",
        periode_str=f"{', '.join([d.strftime('%d/%m/%Y') for d in dates_list])}",
        sigle_service_adresse=f"{service.sigle or ''} - {service.addresse}" if service else "",
        structure_divisions=structure_divisions,
    )

    return send_file(filepath, as_attachment=True)


@bp.route("/facial/pdf/division/", methods=["GET"])
def exporter_pointage_div_pdf():
    date_str = request.args.get("date")
    iddiv = request.args.get("iddiv", type=int)

    if not date_str:
        return {"error": "Le paramètre 'date' est requis (format YYYY-MM-DD)."}, 400

    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Date invalide"}, 400

    if date_obj == date.today():
        check_absents_matin()
        check_absents_soir()

    pointages = Pointage.query.filter(Pointage.date == date_obj).all()

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    elements = []
    styles = getSampleStyleSheet()

    title = Paragraph(
        f"<b>Pointage du {date_obj.strftime('%d/%m/%Y')}</b>", styles["Title"]
    )
    elements.append(title)
    elements.append(Spacer(1, 12))

    header1 = [
        "Matricule",
        "Nom",
        "Division",
        "Matin",
        "",
        "",
        "",
        "",
        "Après-midi",
        "",
        "",
        "",
        "",
        "Statut",
        "Justificatif",
    ]
    header2 = [
        "",
        "",
        "",
        "Entrée",
        "Sortie",
        "Absent",
        "Retard",
        "Présent",
        "Entrée",
        "Sortie",
        "Absent",
        "Retard",
        "Présent",
        "",
        "",
    ]
    data_table = [header1, header2]

    for pt in pointages:
        pers = Personnels.query.get(pt.idpers)
        if not pers:
            continue
        if iddiv is not None:
            if (
                not hasattr(pers, "division")
                or not pers.division
                or pers.division.iddiv != iddiv
            ):
                continue

        row = [
            pers.matricule or "-",
            f"{pers.nom} {pers.prenom}",
            pers.division.nom if hasattr(pers, "division") and pers.division else "-",
            pt.heure_entree_matin.strftime("%H:%M") if pt.heure_entree_matin else "--",
            pt.heure_sortie_matin.strftime("%H:%M") if pt.heure_sortie_matin else "--",
            "Oui" if pt.absence_matin else "Non",
            "Oui" if pt.retard_matin else "Non",
            "Non" if pt.absence_matin else "Oui",
            pt.heure_entree_soir.strftime("%H:%M") if pt.heure_entree_soir else "--",
            pt.heure_sortie_soir.strftime("%H:%M") if pt.heure_sortie_soir else "--",
            "Oui" if pt.absence_soir else "Non",
            "Oui" if pt.retard_soir else "Non",
            "Non" if pt.absence_soir else "Oui",
            "Absent" if pt.absence else "Présent",
            pt.justificatif or "-",
        ]
        data_table.append(row)

    col_widths = [55, 100, 120, 40, 40, 40, 40, 45, 40, 40, 40, 40, 45, 50, 100]

    table = Table(data_table, repeatRows=2, colWidths=col_widths)
    table.setStyle(create_table_style())
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"pointage_{date_obj.strftime('%Y%m%d')}.pdf",
        mimetype="application/pdf",
    )


@bp.route("/facial/pdf/division/interval", methods=["GET"])
def exporter_pointage_div_interval_pdf():
    date_debut_str = request.args.get("date_debut")
    date_fin_str = request.args.get("date_fin")
    iddiv = request.args.get("iddiv", type=int)

    if not date_debut_str or not date_fin_str:
        return {"error": "Les paramètres 'date_debut' et 'date_fin' sont requis."}, 400

    try:
        date_debut = datetime.strptime(date_debut_str, "%Y-%m-%d").date()
        date_fin = datetime.strptime(date_fin_str, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Format de date invalide. Utiliser YYYY-MM-DD."}, 400

    pointages = (
        Pointage.query.filter(Pointage.date >= date_debut, Pointage.date <= date_fin)
        .order_by(Pointage.date)
        .all()
    )

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    elements = []
    styles = getSampleStyleSheet()

    title = Paragraph(
        f"<b>Pointage du {date_debut.strftime('%d/%m/%Y')} au {date_fin.strftime('%d/%m/%Y')}</b>",
        styles["Title"],
    )
    elements.append(title)
    elements.append(Spacer(1, 12))

    header1 = [
        "Date",
        "Matricule",
        "Nom",
        "Division",
        "Matin",
        "",
        "",
        "",
        "",
        "Après-midi",
        "",
        "",
        "",
        "",
        "Statut",
        "Justificatif",
    ]
    header2 = [
        "",
        "",
        "",
        "",
        "Entrée",
        "Sortie",
        "Absent",
        "Retard",
        "Présent",
        "Entrée",
        "Sortie",
        "Absent",
        "Retard",
        "Présent",
        "",
        "",
    ]
    data_table = [header1, header2]

    for pt in pointages:
        pers = Personnels.query.get(pt.idpers)
        if not pers:
            continue
        if iddiv is not None:
            if (
                not hasattr(pers, "division")
                or not pers.division
                or pers.division.iddiv != iddiv
            ):
                continue

        row = [
            pt.date.strftime("%d/%m/%Y"),
            pers.matricule or "-",
            f"{pers.nom} {pers.prenom}",
            pers.division.nom if hasattr(pers, "division") and pers.division else "-",
            pt.heure_entree_matin.strftime("%H:%M") if pt.heure_entree_matin else "--",
            pt.heure_sortie_matin.strftime("%H:%M") if pt.heure_sortie_matin else "--",
            "Oui" if pt.absence_matin else "Non",
            "Oui" if pt.retard_matin else "Non",
            "Non" if pt.absence_matin else "Oui",
            pt.heure_entree_soir.strftime("%H:%M") if pt.heure_entree_soir else "--",
            pt.heure_sortie_soir.strftime("%H:%M") if pt.heure_sortie_soir else "--",
            "Oui" if pt.absence_soir else "Non",
            "Oui" if pt.retard_soir else "Non",
            "Non" if pt.absence_soir else "Oui",
            "Absent" if pt.absence else "Présent",
            pt.justificatif or "-",
        ]
        data_table.append(row)

    col_widths = [55, 100, 120, 40, 40, 40, 40, 45, 40, 40, 40, 40, 45, 50, 100]

    table = Table(data_table, repeatRows=2, colWidths=col_widths)
    table.setStyle(create_table_style())
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"pointage_{date_debut.strftime('%Y%m%d')}_{date_fin.strftime('%Y%m%d')}.pdf",
        mimetype="application/pdf",
    )
