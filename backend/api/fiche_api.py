from flask import Blueprint, request, jsonify, send_file
from sqlalchemy import extract, DateTime, Date
from sqlalchemy.orm import joinedload
from models import db, TypeAutorisations, Responsables, Services
from models.pointages import Pointage
from models.autorisationAbsence import AutorisationAbsence
from models.personnels import Personnels
from models.divisions import Divisions
from datetime import date, timedelta
from models.conge import Conge
from calendar import monthrange
from collections import defaultdict
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from io import BytesIO
from reportlab.pdfbase.pdfmetrics import stringWidth
import datetime
import logging
import traceback
import os

from utils.cache import cached_assiduite

bp = Blueprint('fiches_assiduite_api', __name__)
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# ---------------------------------------------------------------------------
# Formatage
# ---------------------------------------------------------------------------

# Remplace locale.setlocale(LC_TIME, "fr_FR.UTF-8") : cette locale n'existe pas
# forcément sur le serveur, et setlocale est un réglage global non thread-safe
# alors que SocketIO tourne en async_mode="threading".
MOIS_FR = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]


def nom_mois_fr(mois):
    return MOIS_FR[mois - 1]


def format_dates_list(dates):
    return "\n".join(dates) if dates else "-"


def format_autorisations(autorisations):
    if not autorisations:
        return "-"
    return "\n".join(f"{a['motif']} ({a['date']})" for a in autorisations)


def format_minutes_to_hms(total_minutes):
    heures = total_minutes // 60
    minutes = total_minutes % 60
    secondes = 0
    return f"{heures:02d}:{minutes:02d}:{secondes:02d}"


# ---------------------------------------------------------------------------
# PRÉCHARGEMENT — suppression du N+1
#
# Le code d'origine exécutait, pour CHAQUE personnel, une requête autorisations,
# une requête pointages et une requête division, plus un lazy-load à chaque
# accès à pt.autorisation et a.type_autorisation dans les boucles de calcul.
# Pour 300 personnels cela représentait plus de 900 allers-retours SQL.
#
# Ici : 3 requêtes au total, quel que soit l'effectif.
# ---------------------------------------------------------------------------

# Oracle plafonne la liste d'un IN à 1000 éléments.
_TAILLE_LOT = 900


def _lots(sequence, taille=_TAILLE_LOT):
    for i in range(0, len(sequence), taille):
        yield sequence[i:i + taille]


def precharger_donnees_mois(personnel_ids, mois, annee):
    """Charge autorisations et pointages du mois pour un ensemble de personnels.

    Retourne (autorisations_par_pers, pointages_par_pers), deux defaultdict(list)
    indexés par idpers.
    """
    autorisations_par_pers = defaultdict(list)
    pointages_par_pers = defaultdict(list)

    ids = list(personnel_ids)
    if not ids:
        return autorisations_par_pers, pointages_par_pers

    for lot in _lots(ids):
        autorisations = (
            AutorisationAbsence.query
            .options(joinedload(AutorisationAbsence.type_autorisation))
            .filter(
                AutorisationAbsence.idpers.in_(lot),
                extract("month", AutorisationAbsence.date_absence) == mois,
                extract("year", AutorisationAbsence.date_absence) == annee,
            )
            .all()
        )
        for a in autorisations:
            autorisations_par_pers[a.idpers].append(a)

        pointages = (
            Pointage.query
            .options(joinedload(Pointage.autorisation))
            .filter(
                Pointage.idpers.in_(lot),
                extract("month", Pointage.date) == mois,
                extract("year", Pointage.date) == annee,
            )
            .all()
        )
        for pt in pointages:
            pointages_par_pers[pt.idpers].append(pt)

    return autorisations_par_pers, pointages_par_pers


def precharger_conges(personnel_ids, date_debut, date_fin):
    """Congés acceptés chevauchant la période, indexés par idpers."""
    conges_par_pers = defaultdict(list)
    ids = list(personnel_ids)
    if not ids:
        return conges_par_pers

    for lot in _lots(ids):
        conges = Conge.query.filter(
            Conge.idpers.in_(lot),
            Conge.date_debut <= date_fin,
            Conge.date_fin >= date_debut,
            Conge.statut == "accepté",
        ).all()
        for c in conges:
            conges_par_pers[c.idpers].append(c)

    return conges_par_pers


# ---------------------------------------------------------------------------
# CALCULS — logique factorisée, identique aux cinq copies d'origine
# ---------------------------------------------------------------------------

def calculer_absences_par_type(autorisations):
    par_type = {}
    for a in autorisations:
        if not a.idtype:
            continue
        if a.idtype not in par_type:
            par_type[a.idtype] = {
                "idtype": a.idtype,
                "abbreviation": (
                    a.type_autorisation.abbreviation if a.type_autorisation else None
                ),
                "nombre": 0,
                "dates": [],
            }
        jour = a.date_absence.strftime("%d/%m/%Y")
        if a.demi_journee == "complete":
            par_type[a.idtype]["nombre"] += 1
            par_type[a.idtype]["dates"].append(f"{jour} complète")
        else:
            par_type[a.idtype]["nombre"] += 0.5
            suffixe = " matin" if a.demi_journee == "matin" else " après-midi"
            par_type[a.idtype]["dates"].append(jour + suffixe)
    return list(par_type.values())


def calculer_retards(pointages):
    """Retourne ({"nombre", "dates"}, total_minutes)."""
    total = 0
    dates = []
    minutes = 0
    for pt in pointages:
        detail = ""
        if pt.retard_matin and not pt.absence_matin:
            total += 0.5
            detail += " matin"
            minutes += pt.retard_matin_minutes or 0
        if pt.retard_soir and not pt.absence_soir:
            total += 0.5
            detail += " après-midi"
            minutes += pt.retard_soir_minutes or 0
        if detail:
            dates.append(pt.date.strftime("%d/%m/%Y") + detail)
    return {"nombre": total, "dates": dates}, minutes


def calculer_absences(pointages, role):
    """Absences justifiées / non justifiées, en demi-journées.

    Le cas `absence_unique` des agents de surface compte toujours une journée
    entière et court-circuite la logique en demi-journées.
    """
    just_count = 0
    non_just_count = 0
    just_dates = []
    non_just_dates = []

    for pt in pointages:
        jour = pt.date.strftime("%d/%m/%Y")
        autorisation = pt.autorisation if pt.autorisation_id else None
        demi = autorisation.demi_journee if autorisation else None

        if role == "surface" and pt.absence_unique:
            if pt.autorisation_id:
                just_count += 1
                just_dates.append(f"{jour} complète")
            else:
                non_just_count += 1
                non_just_dates.append(f"{jour} complète")
            continue

        if pt.absence_matin and pt.absence_soir:
            if demi == "complete":
                just_count += 1
                just_dates.append(f"{jour} complète")
            else:
                if demi not in ("matin", "complete"):
                    non_just_count += 0.5
                    non_just_dates.append(f"{jour} matin")
                if demi not in ("apres-midi", "complete"):
                    non_just_count += 0.5
                    non_just_dates.append(f"{jour} après-midi")
        elif pt.absence_matin:
            if demi in ("matin", "complete"):
                just_count += 0.5
                just_dates.append(f"{jour} matin")
            else:
                non_just_count += 0.5
                non_just_dates.append(f"{jour} matin")
        elif pt.absence_soir:
            if demi in ("apres-midi", "complete"):
                just_count += 0.5
                just_dates.append(f"{jour} après-midi")
            else:
                non_just_count += 0.5
                non_just_dates.append(f"{jour} après-midi")

    return {
        "justifiees": {"nombre": just_count, "dates": just_dates},
        "non_justifiees": {"nombre": non_just_count, "dates": non_just_dates},
    }


def separer_motifs(autorisations):
    """Répartit les autorisations en repos / missions / autres."""
    repos, missions, autres = [], [], []
    for a in autorisations:
        motif = (a.motif or "").lower()
        jour = a.date_absence.strftime("%d/%m/%Y")
        if motif == "repos":
            repos.append(jour)
        elif motif == "mission":
            missions.append(jour)
        elif motif not in ("absence justifiée",):
            autres.append({"motif": a.motif, "date": jour})
    return repos, missions, autres


def dates_de_conges(conges, date_debut, date_fin):
    jours = []
    for c in conges:
        jour = c.date_debut
        while jour <= c.date_fin:
            if date_debut <= jour <= date_fin:
                jours.append(jour.strftime("%d/%m/%Y"))
            jour += timedelta(days=1)
    return jours


def construire_fiche(pers, div_nom, autorisations, pointages, conge_dates=None):
    """Assemble le dictionnaire de fiche renvoyé par les endpoints JSON."""
    absences_par_type = calculer_absences_par_type(autorisations)
    repos_dates, mission_dates, autres_autorisations = separer_motifs(autorisations)
    absences = calculer_absences(pointages, pers.role)
    retards, total_retard_minutes = calculer_retards(pointages)
    total_retard_hms = format_minutes_to_hms(total_retard_minutes)

    fiche = {
        "division": div_nom,
        "matricule": pers.matricule or "-",
        "nom": pers.nom or "-",
        "prenom": pers.prenom or "-",
        "permissions_absence": {
            "nombre": len(autorisations),
            "dates": [a.date_absence.strftime("%d/%m/%Y") for a in autorisations],
        },
        "absences_par_type": absences_par_type,
        "retards": dict(retards, total_minutes=total_retard_hms),
        "retard_matin_minutes": sum(pt.retard_matin_minutes or 0 for pt in pointages),
        "retard_soir_minutes": sum(pt.retard_soir_minutes or 0 for pt in pointages),
        "repos": {"nombre": len(repos_dates), "dates": repos_dates},
        "missions": {"nombre": len(mission_dates), "dates": mission_dates},
        "absences": {
            "justifiees": absences["justifiees"],
            "non_justifiees": absences["non_justifiees"],
            "autres": autres_autorisations,
        },
        "presences": sum(1 for pt in pointages if pt.presence),
        "total_absences": (
            absences["justifiees"]["nombre"]
            + absences["non_justifiees"]["nombre"]
            + len(autres_autorisations)
        ),
        "total_retard_minutes": total_retard_hms,
    }

    if conge_dates is not None:
        fiche["conges"] = {"nombre": len(conge_dates), "dates": conge_dates}

    return fiche


def construire_ligne_excel(pers, autorisations, pointages):
    """Structure attendue par excel.creer_fiche_assiduite()."""
    absences = calculer_absences(pointages, pers.role)
    retards, total_retard_minutes = calculer_retards(pointages)

    return {
        "n": pers.idpers,
        "nom": f"{pers.nom} {pers.prenom}",
        "im": pers.matricule,
        "nombre_retards": retards["nombre"],
        "volume_retards": total_retard_minutes,
        "retards": retards,
        "nombre_ja_non_justifiees": absences["non_justifiees"]["nombre"],
        "absences_non_justifiees_dates": absences["non_justifiees"]["dates"],
        "absences_par_type": calculer_absences_par_type(autorisations),
        "permissions_absence": {
            "nombre": len(autorisations),
            "dates": [a.date_absence.strftime("%d/%m/%Y") for a in autorisations],
        },
    }


def types_absences_ou_defaut():
    types_absences = [t.to_dict() for t in TypeAutorisations.query.all()]
    if not types_absences:
        types_absences = [
            {"idtype": 1, "nomtype": "Repos annuel", "abbreviation": "RAM"},
            {"idtype": 2, "nomtype": "Congé payé", "abbreviation": "CP"},
            {"idtype": 3, "nomtype": "Mission", "abbreviation": "MA"},
        ]
    return types_absences


def _tri_matricule_numerique(p):
    return int(p.matricule) if p.matricule and p.matricule.isdigit() else float("inf")


# ===========================================================================
# EXPORTS EXCEL — non cachés (send_file), mais préchargés
# ===========================================================================

@bp.route("/generer-excel-rh", methods=["GET"])
def generer_excel_rh():
    logger.info("===== Début génération Excel RH =====")

    try:
        idserv = request.args.get("idserv", type=int)
        mois = request.args.get("mois", type=int)
        annee = request.args.get("annee", type=int)
        type_pointage = request.args.get("type", "all")  # bureau / surface / all

        if not idserv or not mois or not annee:
            return (
                jsonify({"error": "Paramètres 'idserv', 'mois' et 'annee' requis."}),
                400,
            )

        service = Services.query.get(idserv)
        if not service:
            return jsonify({"error": f"Service avec id {idserv} introuvable."}), 404

        nom_service = service.nom
        sigle_service_adresse = service.sigle if service.sigle else "Non défini"
        addresse_service = service.addresse if service.addresse else "Non défini"

        tous_personnels = (
            Personnels.query
            .options(joinedload(Personnels.division))
            .join(Responsables, Personnels.idrh == Responsables.idrh)
            .filter(Responsables.idserv == idserv)
            .all()
        )

        if type_pointage == "bureau":
            personnels = [
                p for p in tous_personnels if getattr(p, "role", "bureau") == "bureau"
            ]
        elif type_pointage == "surface":
            personnels = [
                p for p in tous_personnels if getattr(p, "role", "bureau") == "surface"
            ]
        else:
            personnels = tous_personnels

        types_absences = types_absences_ou_defaut()

        date_debut_mois = datetime.date(annee, mois, 1)
        date_fin_mois = datetime.date(annee, mois, monthrange(annee, mois)[1])

        autorisations_par_pers, pointages_par_pers = precharger_donnees_mois(
            [p.idpers for p in personnels], mois, annee
        )

        structure_divisions = {}

        for pers in personnels:
            div_nom = pers.division.nom if pers.division else "Sans division"
            structure_divisions.setdefault(div_nom, [])
            structure_divisions[div_nom].append(
                construire_ligne_excel(
                    pers,
                    autorisations_par_pers.get(pers.idpers, []),
                    pointages_par_pers.get(pers.idpers, []),
                )
            )

        from excel import creer_fiche_assiduite

        chemin = creer_fiche_assiduite(
            nom_service=nom_service,
            mois=nom_mois_fr(mois),
            annee=annee,
            sigle_service_adresse=f"{sigle_service_adresse} - {addresse_service}",
            date_debut=date_debut_mois.strftime("%d/%m/%Y"),
            date_fin=date_fin_mois.strftime("%d/%m/%Y"),
            structure_divisions=structure_divisions,
            types_absences=types_absences,
        )

        if not chemin or not os.path.exists(chemin):
            return jsonify({"error": "Fichier Excel introuvable"}), 500

        return send_file(chemin, as_attachment=True)

    except Exception as e:
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@bp.route("/generer-excel-rh_personnel", methods=["GET"])
def generer_excel_rh_perso():
    logger.info("===== Début génération Excel RH personnel =====")

    try:
        idpers = request.args.get("idpers", type=int)
        mois = request.args.get("mois", type=int)
        annee = request.args.get("annee", type=int)

        if not idpers or not mois or not annee:
            return (
                jsonify({"error": "Paramètres 'idpers', 'mois' et 'annee' requis."}),
                400,
            )

        pers = (
            Personnels.query
            .options(joinedload(Personnels.division))
            .filter_by(idpers=idpers)
            .first()
        )
        if not pers:
            return jsonify({"error": f"Personnel avec id {idpers} introuvable."}), 404

        div = pers.division
        service = div.service if div else None

        nom_service = div.nom if div else "Sans division"
        sigle_service_adresse = (
            f"{service.sigle} - {service.addresse}" if service else "Non défini"
        )

        types_absences = types_absences_ou_defaut()

        date_debut_mois = datetime.date(annee, mois, 1)
        date_fin_mois = datetime.date(annee, mois, monthrange(annee, mois)[1])

        autorisations_par_pers, pointages_par_pers = precharger_donnees_mois(
            [pers.idpers], mois, annee
        )

        div_nom = div.nom if div else "Sans division"
        structure_divisions = {
            div_nom: [
                construire_ligne_excel(
                    pers,
                    autorisations_par_pers.get(pers.idpers, []),
                    pointages_par_pers.get(pers.idpers, []),
                )
            ]
        }

        from excel import creer_fiche_assiduite

        chemin = creer_fiche_assiduite(
            nom_service=nom_service,
            mois=nom_mois_fr(mois),
            annee=annee,
            sigle_service_adresse=sigle_service_adresse,
            date_debut=date_debut_mois.strftime("%d/%m/%Y"),
            date_fin=date_fin_mois.strftime("%d/%m/%Y"),
            structure_divisions=structure_divisions,
            types_absences=types_absences,
        )

        if not chemin or not os.path.exists(chemin):
            return jsonify({"error": "Fichier Excel introuvable"}), 500

        return send_file(chemin, as_attachment=True)

    except Exception as e:
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


# ===========================================================================
# ENDPOINTS JSON — cachés
# ===========================================================================

@bp.route("/all", methods=["GET"])
@cached_assiduite
def fiche_assiduite_json():
    mois = request.args.get("mois", type=int)
    annee = request.args.get("annee", type=int)
    idserv = request.args.get("idserv", type=int)

    if not mois or not annee:
        return jsonify({"error": "Paramètres 'mois' et 'annee' requis."}), 400

    query = Personnels.query.options(joinedload(Personnels.division))

    if idserv is not None:
        query = query.join(Responsables, Personnels.idrh == Responsables.idrh).filter(
            Responsables.idserv == idserv
        )

    personnels = sorted(query.all(), key=_tri_matricule_numerique)

    autorisations_par_pers, pointages_par_pers = precharger_donnees_mois(
        [p.idpers for p in personnels], mois, annee
    )

    result = [
        construire_fiche(
            pers,
            pers.division.nom if pers.division else "",
            autorisations_par_pers.get(pers.idpers, []),
            pointages_par_pers.get(pers.idpers, []),
        )
        for pers in personnels
    ]

    return jsonify({"mois": mois, "annee": annee, "data": result})


@bp.route("/all_personnel", methods=["GET"])
@cached_assiduite
def fiche_assiduite_personnel_json():
    mois = request.args.get("mois", type=int)
    annee = request.args.get("annee", type=int)
    idpers = request.args.get("idpers", type=int)

    if not mois or not annee or not idpers:
        return jsonify({"error": "Paramètres 'mois', 'annee' et 'idpers' requis."}), 400

    pers = (
        Personnels.query
        .options(joinedload(Personnels.division))
        .filter_by(idpers=idpers)
        .first()
    )
    if not pers:
        return jsonify({"error": "Personnel introuvable"}), 404

    autorisations_par_pers, pointages_par_pers = precharger_donnees_mois(
        [pers.idpers], mois, annee
    )

    result = construire_fiche(
        pers,
        pers.division.nom if pers.division else "",
        autorisations_par_pers.get(pers.idpers, []),
        pointages_par_pers.get(pers.idpers, []),
    )

    return jsonify({"mois": mois, "annee": annee, "data": [result]})


@bp.route("/all_by_matricule", methods=["GET"])
@cached_assiduite
def fiche_assiduite_json_by_matricule():
    mois = request.args.get("mois", type=int)
    annee = request.args.get("annee", type=int)
    matricule = request.args.get("matricule", default="", type=str).strip()
    idserv = request.args.get("idserv", type=int)

    if not mois or not annee:
        return jsonify({"error": "Paramètres 'mois' et 'annee' requis."}), 400

    query = Personnels.query.options(joinedload(Personnels.division))

    if idserv:
        query = query.join(Responsables, Personnels.idrh == Responsables.idrh).filter(
            Responsables.idserv == idserv
        )

    # Recherche partielle : filtrée en base plutôt qu'en Python, pour ne pas
    # charger tout l'effectif du service à chaque frappe.
    if matricule:
        query = query.filter(Personnels.matricule.ilike(f"%{matricule}%"))

    personnels = sorted(
        query.all(), key=lambda p: p.matricule if p.matricule else ""
    )

    autorisations_par_pers, pointages_par_pers = precharger_donnees_mois(
        [p.idpers for p in personnels], mois, annee
    )

    result = [
        construire_fiche(
            pers,
            pers.division.nom if pers.division else "",
            autorisations_par_pers.get(pers.idpers, []),
            pointages_par_pers.get(pers.idpers, []),
        )
        for pers in personnels
    ]

    return jsonify({"mois": mois, "annee": annee, "data": result})


@bp.route("/by_division", methods=["GET"])
@cached_assiduite
def fiche_assiduite_par_division():
    mois = request.args.get("mois", type=int)
    annee = request.args.get("annee", type=int)
    iddiv = request.args.get("iddiv", type=int, default=None)
    idserv = request.args.get("idserv", type=int, default=None)

    if not mois or not annee:
        return jsonify({"error": "Paramètres 'mois' et 'annee' requis."}), 400

    date_debut_mois = date(annee, mois, 1)
    date_fin_mois = date(annee, mois, monthrange(annee, mois)[1])

    query = Personnels.query.options(joinedload(Personnels.division))

    if iddiv:
        query = query.filter(Personnels.iddiv == iddiv)

    if idserv:
        query = query.join(Responsables, Personnels.idrh == Responsables.idrh).filter(
            Responsables.idserv == idserv
        )

    personnels = sorted(
        query.all(),
        key=lambda p: p.division.nom if p.division else "",
    )

    ids = [p.idpers for p in personnels]
    autorisations_par_pers, pointages_par_pers = precharger_donnees_mois(
        ids, mois, annee
    )
    conges_par_pers = precharger_conges(ids, date_debut_mois, date_fin_mois)

    result = []
    for pers in personnels:
        conge_dates = dates_de_conges(
            conges_par_pers.get(pers.idpers, []), date_debut_mois, date_fin_mois
        )
        result.append(
            construire_fiche(
                pers,
                pers.division.nom if pers.division else "Sans division",
                autorisations_par_pers.get(pers.idpers, []),
                pointages_par_pers.get(pers.idpers, []),
                conge_dates=conge_dates,
            )
        )

    return jsonify({
        "mois": mois,
        "annee": annee,
        "iddiv_filtre": iddiv,
        "idserv_filtre": idserv,
        "data": result,
    })


@bp.route('/personnel', methods=['GET'])
@cached_assiduite
def fiche_assiduite_personnel():
    """⚠️ Logique historique conservée à l'identique.

    Cet endpoint s'appuie sur `pt.absence` et `pt.justificatif`, alors que tous
    les autres utilisent `absence_matin` / `absence_soir` / `autorisation_id`.
    Les chiffres produits ici peuvent donc différer de ceux de /all_personnel
    pour le même personnel. Rien n'a été modifié : à arbitrer séparément.
    """
    idpers = request.args.get('idpers', type=int)
    mois = request.args.get('mois', type=int)
    annee = request.args.get('annee', type=int)

    if not idpers or not mois or not annee:
        return jsonify({"error": "Paramètres 'idpers', 'mois' et 'annee' requis."}), 400

    pers = (
        Personnels.query
        .options(joinedload(Personnels.division))
        .filter_by(idpers=idpers)
        .first()
    )
    if not pers:
        return jsonify({"error": "Personnel introuvable."}), 404

    div_nom = pers.division.nom if pers.division else ""

    date_debut_mois = date(annee, mois, 1)
    date_fin_mois = date(annee, mois, monthrange(annee, mois)[1])

    autorisations_par_pers, pointages_par_pers = precharger_donnees_mois(
        [idpers], mois, annee
    )
    autorisations = autorisations_par_pers.get(idpers, [])
    pointages = pointages_par_pers.get(idpers, [])

    repos_dates, mission_dates, autres_autorisations = separer_motifs(autorisations)

    retards_dates = [
        pt.date.strftime("%d/%m/%Y")
        for pt in pointages
        if (pt.retard_matin or pt.retard_soir)
        and not (pt.absence_matin or pt.absence_soir)
    ]
    retards = {"nombre": len(retards_dates), "dates": retards_dates}

    absences_justifiees_dates = [
        pt.date.strftime('%d/%m/%Y')
        for pt in pointages
        if pt.absence and pt.justificatif
    ]
    absences_non_justifiees_dates = [
        pt.date.strftime('%d/%m/%Y')
        for pt in pointages
        if pt.absence and not pt.justificatif
    ]
    presences = sum(1 for pt in pointages if pt.presence)
    total_absences = (
        len(absences_justifiees_dates)
        + len(absences_non_justifiees_dates)
        + len(autres_autorisations)
    )

    conges = precharger_conges([idpers], date_debut_mois, date_fin_mois).get(idpers, [])
    conge_dates = dates_de_conges(conges, date_debut_mois, date_fin_mois)

    fiche = {
        "division": div_nom,
        "matricule": pers.matricule or "-",
        "nom": pers.nom or "-",
        "prenom": pers.prenom or "-",
        "conges": {"nombre": len(conge_dates), "dates": conge_dates},
        "repos": {"nombre": len(repos_dates), "dates": repos_dates},
        "missions": {"nombre": len(mission_dates), "dates": mission_dates},
        "absences": {
            "justifiees": {
                "nombre": len(absences_justifiees_dates),
                "dates": absences_justifiees_dates,
            },
            "non_justifiees": {
                "nombre": len(absences_non_justifiees_dates),
                "dates": absences_non_justifiees_dates,
            },
            "autres": autres_autorisations,
        },
        "retards": retards,
        "presences": presences,
        "total_absences": total_absences,
    }

    return jsonify({"mois": mois, "annee": annee, "data": fiche})


# ===========================================================================
# EXPORTS PDF — non cachés (send_file), mais préchargés
#
# ⚠️ Ces deux routes s'appuient elles aussi sur `pt.absence` / `pt.justificatif`
# pour /pdf/division. Logique conservée telle quelle.
# ===========================================================================

@bp.route('/pdf/division', methods=['GET'])
def exporter_fiche_assiduite_pdf_division():
    mois = request.args.get('mois', type=int)
    annee = request.args.get('annee', type=int)
    iddiv = request.args.get('iddiv', type=int)
    idrh = request.args.get('idrh', type=int)

    if not mois or not annee or not iddiv or not idrh:
        return jsonify({"error": "Paramètres 'mois', 'annee', 'iddiv' et 'idrh' requis."}), 400

    division = Divisions.query.get(iddiv)
    if not division:
        return jsonify({"error": f"Division id {iddiv} introuvable."}), 404

    personnels = Personnels.query.filter_by(iddiv=iddiv, idrh=idrh).all()

    autorisations_par_pers, pointages_par_pers = precharger_donnees_mois(
        [p.idpers for p in personnels], mois, annee
    )

    data_table = []

    header_main = [
        "Matricule", "Nom", "Prénom",
        "Permissions d'absence", "",
        "Absences", "",
        "Retards"
    ]
    header_sub = [
        "", "", "",
        "Nbre", "Dates",
        "Justifiées", "Non Justifiées",
        "Nbre"
    ]

    data_table.append(header_main)
    data_table.append(header_sub)

    for pers in personnels:
        autorisations = autorisations_par_pers.get(pers.idpers, [])
        pointages = pointages_par_pers.get(pers.idpers, [])

        permissions_dates = [a.date_absence.strftime('%d/%m/%Y') for a in autorisations]
        permissions_nombre = len(autorisations)

        abs_just = [
            pt.date.strftime('%d/%m/%Y')
            for pt in pointages if pt.absence and pt.justificatif
        ]
        abs_non_just = [
            pt.date.strftime('%d/%m/%Y')
            for pt in pointages if pt.absence and not pt.justificatif
        ]
        retards = sum(1 for pt in pointages if pt.retard_matin or pt.retard_soir)

        data_table.append([
            pers.matricule or "-", pers.nom or "-", pers.prenom or "-",
            str(permissions_nombre), format_dates_list(permissions_dates),
            format_dates_list(abs_just), format_dates_list(abs_non_just),
            str(retards)
        ])

    font_name = 'Helvetica'
    font_size = 8
    max_nom = max(stringWidth(str(row[1]), font_name, font_size) for row in data_table) + 6
    max_prenom = max(stringWidth(str(row[2]), font_name, font_size) for row in data_table) + 6

    col_widths = [50, max_nom, max_prenom, 35, 80, 80, 80, 45]

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                            rightMargin=40, leftMargin=40, topMargin=25, bottomMargin=15)
    elements = []
    styles = getSampleStyleSheet()
    elements.append(Paragraph(
        f"<b>Fiche d'assiduité - Division {division.nom} - {mois}/{annee}</b>",
        styles['Title']
    ))
    elements.append(Spacer(1, 12))

    table = Table(data_table, repeatRows=2, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('SPAN', (3, 0), (4, 0)),
        ('SPAN', (5, 0), (6, 0)),
        ('BACKGROUND', (0, 0), (-1, 1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(table)
    doc.build(elements)

    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"fiche_assiduite_division_{division.nom}_{mois}_{annee}.pdf",
        mimetype='application/pdf'
    )


@bp.route('/pdf', methods=['GET'])
def exporter_fiche_assiduite_pdf():
    mois = request.args.get('mois', type=int)
    annee = request.args.get('annee', type=int)
    idrh = request.args.get('idrh', type=int)
    if not mois or not annee or not idrh:
        return jsonify({"error": "Paramètres 'mois', 'annee' et 'idrh' requis."}), 400

    personnels = (
        Personnels.query
        .options(joinedload(Personnels.division))
        .filter_by(idrh=idrh)
        .all()
    )

    personnels = sorted(
        personnels, key=lambda p: p.division.nom if p.division else ""
    )

    autorisations_par_pers, pointages_par_pers = precharger_donnees_mois(
        [p.idpers for p in personnels], mois, annee
    )

    data_table = []

    header_main = ["Matricule", "Nom", "Prénom", "Permissions", "", "Absences", "", "Retards"]
    header_sub = ["", "", "", "Nbre", "Dates", "Justifiées", "Non Justifiées", "Nbre"]
    data_table.append(header_main)
    data_table.append(header_sub)

    styles = getSampleStyleSheet()
    current_division = None

    for pers in personnels:
        div_nom = pers.division.nom if pers.division else ""
        if div_nom != current_division:
            current_division = div_nom
            data_table.append(
                [Paragraph(f"<b>{current_division}</b>", styles['Heading3'])] + [""] * 7
            )

        autorisations = autorisations_par_pers.get(pers.idpers, [])
        pointages = pointages_par_pers.get(pers.idpers, [])

        permission_dates = [a.date_absence.strftime('%d/%m/%Y') for a in autorisations]
        permission_count = len(autorisations)

        absences_justifiees_dates = [
            pt.date.strftime('%d/%m/%Y')
            for pt in pointages
            if (pt.absence_soir or pt.absence_matin) and pt.autorisation_id
        ]
        absences_non_justifiees_dates = [
            pt.date.strftime('%d/%m/%Y')
            for pt in pointages
            if (pt.absence_soir or pt.absence_matin) and not pt.autorisation_id
        ]

        retards = sum(1 for pt in pointages if pt.retard_matin or pt.retard_soir)

        data_table.append([
            pers.matricule or "-", pers.nom or "-", pers.prenom or "-",
            str(permission_count), format_dates_list(permission_dates),
            format_dates_list(absences_justifiees_dates),
            format_dates_list(absences_non_justifiees_dates),
            str(retards)
        ])

    font_name = 'Helvetica'
    font_size = 8
    max_nom = max(
        stringWidth(str(row[1]), font_name, font_size)
        for row in data_table if not isinstance(row[1], Paragraph)
    ) + 6
    max_prenom = max(
        stringWidth(str(row[2]), font_name, font_size)
        for row in data_table if not isinstance(row[2], Paragraph)
    ) + 6

    col_widths = [50, max_nom, max_prenom, 30, 60, 50, 60, 35]

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                            rightMargin=40, leftMargin=40, topMargin=25, bottomMargin=15)
    elements = []
    elements.append(Paragraph(
        f"<b>Fiche d'assiduité - Tous personnels - {mois}/{annee}</b>", styles['Title']
    ))
    elements.append(Spacer(1, 12))

    table = Table(data_table, repeatRows=2, colWidths=col_widths)
    style = TableStyle([
        ('SPAN', (3, 0), (4, 0)), ('SPAN', (5, 0), (6, 0)),
        ('BACKGROUND', (0, 0), (-1, 1), colors.white),
        ('TEXTCOLOR', (0, 0), (-1, 1), colors.black),
        ('FONTNAME', (0, 0), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ])

    for i, row in enumerate(data_table):
        if isinstance(row[0], Paragraph):
            style.add('SPAN', (0, i), (-1, i))
            style.add('FONTNAME', (0, i), (-1, i), 'Helvetica-Bold')
            style.add('ALIGN', (0, i), (-1, i), 'LEFT')
            style.add('VALIGN', (0, i), (-1, i), 'MIDDLE')
            style.add('LINEBELOW', (0, i), (-1, i), 1, colors.black)

    table.setStyle(style)
    elements.append(table)
    doc.build(elements)

    buffer.seek(0)
    return send_file(
        buffer, as_attachment=True,
        download_name=f"fiche_assiduite_tous_personnels_idrh_{idrh}_{mois}_{annee}.pdf",
        mimetype='application/pdf'
    )