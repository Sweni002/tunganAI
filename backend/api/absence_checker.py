# absence_checker.py

from datetime import datetime, date, time
from models import db, Pointage, Personnels,AutorisationAbsence
from api.pointage_faciale import creer_pointages_vides
from models.conge import Conge
from __init__ import socketio

def creer_pointages_vides():
    today = date.today()
    personnels = Personnels.query.all()

    for p in personnels:
        # Vérifie s'il existe déjà un pointage aujourd'hui pour cette personne
        exists = Pointage.query.filter_by(idpers=p.idpers, date=today).first()
        if exists:
            continue

        est_autorise = False
        motif = None

        # Autorisation d'absence
        autorisation = AutorisationAbsence.query.filter_by(idpers=p.idpers, date_absence=today).first()
        if autorisation:
            est_autorise = True
            motif = f"Autorisation - {autorisation.motif}"

        # Congé accepté
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
            absence = None
            presence = None

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
            justificatif=motif
        )

        db.session.add(pointage)

    db.session.commit()
    print(f"[✓] Pointages vides créés pour la date {today}.")


def check_absents_matin():
    now = datetime.now()
    if datetime.now().weekday() >= 5:
       return
    if now.time() < time(9, 0):
        print("[INFO] Trop tôt pour vérifier l'absence du matin.")
        return
    creer_pointages_vides()
    today = now.date()
    personnels = Personnels.query.filter(Personnels.role != "surface").all()

    for perso in personnels:
        pointage = Pointage.query.filter_by(idpers=perso.idpers, date=today).first()

        autorisation = AutorisationAbsence.query.filter_by(
            idpers=perso.idpers,
            date_absence=today
        ).first()

        motif = autorisation.motif if autorisation else None

        if pointage:
            if (
        pointage.heure_entree_matin is None
        or pointage.heure_sortie_matin is None
    ):
                pointage.absence_matin = True
                pointage.retard_matin = False

                # absence globale seulement si le soir est aussi absent
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
                justificatif=motif
            )
            db.session.add(new_pointage)

    db.session.commit()
    socketio.emit(
        "pointage_update",
    )
    print("✅ check_absents_matin : mise à jour des absences matin avec justificatif terminée.")


def check_absents_soir():
    now = datetime.now()
    today = now.date()
    if datetime.now().weekday() >= 5:
       return

    # ⏰ Ne rien faire avant 14h
    if now.time() < time(14, 0):
        print("[INFO] Trop tôt pour vérifier l'absence du soir.")
        return

    # Assure que tous les pointages existent
    creer_pointages_vides()

    personnels = Personnels.query.filter(Personnels.role != "surface").all()

    for perso in personnels:
        pt = Pointage.query.filter_by(idpers=perso.idpers, date=today).first()

        autorisation = AutorisationAbsence.query.filter_by(
            idpers=perso.idpers, date_absence=today
        ).first()

        conge = Conge.est_en_conge(perso.idpers, today)
        motif = (
            f"Autorisation - {autorisation.motif}"
            if autorisation
            else f"Congé - {conge.motif}" if conge else None
        )

        if pt:
            # ❌ ABSENCE SOIR si entrée OU sortie manquante
            if pt.heure_entree_soir is None or pt.heure_sortie_soir is None:
                pt.absence_soir = True
                pt.retard_soir = False

                # absence globale seulement si le matin est aussi absent
                pt.absence = True if pt.absence_matin else None

                if pt.justificatif is None:
                    pt.justificatif = motif
        else:
            # ❌ Aucun pointage → absent soir
            new_pointage = Pointage(
                idpers=perso.idpers,
                date=today,
                absence_matin=None,
                absence_soir=True,
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

    surface_personnels = Personnels.query.filter(
      Personnels.role == "surface"
    ).all()

    for perso in surface_personnels:
        pointage = Pointage.query.filter_by(idpers=perso.idpers, date=today).first()
        autorisation = AutorisationAbsence.query.filter_by(
            idpers=perso.idpers, date_absence=today
        ).first()
        motif = autorisation.motif if autorisation else None

        if pointage:
            if (
                pointage.heure_entree_unique is None
                or pointage.heure_sortie_unique is None
            ):
                pointage.absence_unique = True

            # Pointage existant mais pas d'heure unique → absence unique
            if not pointage.heure_entree_unique or not pointage.heure_sortie_unique:
                pointage.absence_unique = True
                if pointage.justificatif is None:
                    pointage.justificatif = motif
        else:
            # Crée nouveau pointage pour surface
            new_pointage = Pointage(
                idpers=perso.idpers,
                date=today,
                absence_matin=None,
                absence_soir=None,
                absence=None,
                absence_unique=True,
                heure_sortie_unique=None,
                heure_entree_unique=None,
                retard_matin=False,
                retard_soir=False,
                retard_total_minutes=0,
                justificatif=motif,
            )
            db.session.add(new_pointage)

    db.session.commit()
    socketio.emit("pointage_update")
    print(
        "✅ check_absents_soir : absence soir mise à jour (entrée ou sortie manquante)."
    )
