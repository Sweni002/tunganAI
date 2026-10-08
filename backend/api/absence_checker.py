# absence_checker.py

from datetime import datetime, date, time

from sqlalchemy import or_
from sqlalchemy.orm import joinedload

from models import db, Pointage, Personnels, AutorisationAbsence, Divisions
from models.conge import Conge
from models.horaire import HorairesService
from __init__ import socketio
from utils.jours_feries import feries_du_jour


# ============================================================
# Helpers — lecture dynamique des horaires du service
# ============================================================

def _horaire_time(horaire, field, fallback):
    """
    Extrait une `time` depuis HorairesService.<field>.

    Le modèle stocke des DateTime (2000-01-01 HH:MM:00) — on ne garde que
    la partie heure. Si le champ est absent/None, on retourne `fallback`
    (valeur historique codée en dur).
    """
    if horaire is None:
        return fallback
    value = getattr(horaire, field, None)
    if value is None:
        return fallback
    if isinstance(value, datetime):
        return value.time()
    if isinstance(value, time):
        return value
    return fallback


def _preload_horaires():
    """{idserv: HorairesService} chargé en une seule requête (évite le N+1)."""
    return {h.idserv: h for h in HorairesService.query.all()}


def _deadline_for(horaires_map, perso, field, fallback):
    """
    Renvoie la `time` limite du service du personnel pour `field`.

    Retourne `fallback` si :
      - personnel sans division
      - division sans service
      - service sans HorairesService
      - champ NULL
    """
    if perso.division is None:
        return fallback
    service = perso.division.service
    if service is None:
        return fallback
    horaire = horaires_map.get(service.idserv)
    return _horaire_time(horaire, field, fallback)


def _ferie_de(feries, perso):
    """Jours fériés du jour pour le service du personnel : {"matin": bool, "soir": bool} (vide si aucun)."""
    division = perso.division
    service = division.service if division is not None else None
    if service is None:
        return {}
    return feries.get(service.idserv, {})


# ============================================================
# Création des pointages vides (inchangé)
# ============================================================

def creer_pointages_vides():
    today = date.today()
    personnels = Personnels.query.all()

    for p in personnels:
        exists = Pointage.query.filter_by(idpers=p.idpers, date=today).first()
        if exists:
            continue

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

        db.session.add(Pointage(
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
        ))

    db.session.commit()
    print(f"[✓] Pointages vides créés pour la date {today}.")


# ============================================================
# CHECK MATIN
# ============================================================
# Le scheduler appelle cette fonction régulièrement (ex. toutes les 15 min).
# Chaque service est traité dès que son `sortie_matin_fin` est dépassé.
# Les services dont le matin n'est pas terminé sont ignorés.

def check_absents_matin():
    now = datetime.now()
    if now.weekday() >= 5:
        return

    today = now.date()
    heure_now = now.time()

    creer_pointages_vides()

    # Chargement unique des horaires + personnels (avec division + service)
    horaires_map = _preload_horaires()

    # Jours fériés du jour par service : pas de contrôle d'absence sur une période fériée
    feries = feries_du_jour(today)

    personnels = (
        Personnels.query
        .options(joinedload(Personnels.division).joinedload(Divisions.service))
        .filter(or_(Personnels.role != "surface", Personnels.role.is_(None)))
        .all()
    )

    for perso in personnels:
        if _ferie_de(feries, perso).get("matin"):
            continue  # matin férié (ou journée complète) : jamais absent

        # ⏱ Fin de la fenêtre de sortie matin DU SERVICE de l'employé.
        # Tant qu'on n'y est pas, la matinée n'est pas terminée pour lui :
        # sa sortie peut encore arriver.
        deadline = _deadline_for(
            horaires_map, perso, "sortie_matin_fin", time(12, 30)
        )
        if heure_now < deadline:
            continue

        pointage = Pointage.query.filter_by(idpers=perso.idpers, date=today).first()
        if not pointage:
            continue

        # Idempotence : si déjà marqué absent matin, ne rien refaire.
        if pointage.absence_matin is True:
            continue

        autorisation = AutorisationAbsence.query.filter_by(
            idpers=perso.idpers, date_absence=today
        ).first()
        motif = autorisation.motif if autorisation else None

        if pointage.heure_entree_matin is None or pointage.heure_sortie_matin is None:
            pointage.absence_matin = True
            pointage.retard_matin = False
            # Absence globale seulement si le soir est AUSSI absent
            pointage.absence = True if pointage.absence_soir else None

            if pointage.justificatif is None:
                pointage.justificatif = motif

    db.session.commit()
    socketio.emit("pointage_update")
    print("✅ check_absents_matin : absences matin mises à jour.")


# ============================================================
# CHECK SOIR
# ============================================================
# Même principe que le matin : le scheduler appelle régulièrement,
# chaque service est traité dès que son `sortie_soir_fin` est dépassé.

def check_absents_soir():
    now = datetime.now()
    if now.weekday() >= 5:
        return

    today = now.date()
    heure_now = now.time()

    creer_pointages_vides()

    horaires_map = _preload_horaires()
    feries = feries_du_jour(today)

    # ---------- 1) Employés standard (matin / soir) ----------
    personnels_std = (
        Personnels.query
        .options(joinedload(Personnels.division).joinedload(Divisions.service))
        .filter(or_(Personnels.role != "surface", Personnels.role.is_(None)))
        .all()
    )

    for perso in personnels_std:
        if _ferie_de(feries, perso).get("soir"):
            continue  # après-midi férié (ou journée complète) : jamais absent

        # ⏱ Fin de la fenêtre de sortie soir du service
        deadline = _deadline_for(
            horaires_map, perso, "sortie_soir_fin", time(18, 0)
        )
        if heure_now < deadline:
            continue

        pt = Pointage.query.filter_by(idpers=perso.idpers, date=today).first()
        if not pt:
            continue

        if pt.absence_soir is True:
            continue  # déjà traité

        autorisation = AutorisationAbsence.query.filter_by(
            idpers=perso.idpers, date_absence=today
        ).first()
        conge = Conge.est_en_conge(perso.idpers, today)
        motif = (
            f"Autorisation - {autorisation.motif}" if autorisation
            else f"Congé - {conge.motif}" if conge
            else None
        )

        if pt.heure_entree_soir is None or pt.heure_sortie_soir is None:
            pt.absence_soir = True
            pt.retard_soir = False
            pt.absence = True if pt.absence_matin else None

            if pt.justificatif is None:
                pt.justificatif = motif

    # ---------- 2) Agents de surface (journée unique) ----------
    personnels_surface = (
        Personnels.query
        .options(joinedload(Personnels.division).joinedload(Divisions.service))
        .filter(Personnels.role == "surface")
        .all()
    )

    for perso in personnels_surface:
        ferie = _ferie_de(feries, perso)
        if ferie.get("matin") and ferie.get("soir"):
            continue  # journée entièrement fériée

        # Pour un agent surface, la « fin de journée » = sortie soir du service
        deadline = _deadline_for(
            horaires_map, perso, "sortie_soir_fin", time(18, 0)
        )
        if heure_now < deadline:
            continue

        pointage = Pointage.query.filter_by(idpers=perso.idpers, date=today).first()
        if not pointage:
            continue

        if pointage.absence_unique is True:
            continue

        autorisation = AutorisationAbsence.query.filter_by(
            idpers=perso.idpers, date_absence=today
        ).first()
        motif = autorisation.motif if autorisation else None

        if (
            pointage.heure_entree_unique is None
            or pointage.heure_sortie_unique is None
        ):
            pointage.absence_unique = True
            if pointage.justificatif is None:
                pointage.justificatif = motif

    db.session.commit()
    socketio.emit("pointage_update")
    print("✅ check_absents_soir : absences soir mises à jour.")