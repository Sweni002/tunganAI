"""Detail d'UN pointage (modale de la page Presences).

  GET /api/pointage/detail/<idpointage>

Renvoie en un seul appel : l'agent, son service / sa division, le pointage du jour
(matin / apres-midi / unique), les horaires du service, les autorisations qui
couvrent ce jour et un petit recapitulatif du mois.
Un responsable ne peut consulter que les pointages de SON service.
"""
from calendar import monthrange
from datetime import date, datetime

from flask import Blueprint, jsonify, request, session
from sqlalchemy import and_, case, func, or_

from models import (
    AutorisationSpeciale,
    Divisions,
    Personnels,
    Pointage,
    Responsables,
    Services,
)
from models.autorisationAbsence import AutorisationAbsence

bp = Blueprint("pointage_detail_api", __name__)

_HORAIRE_CHAMPS = (
    "entree_matin_debut", "entree_matin_fin", "sortie_matin_debut", "sortie_matin_fin",
    "entree_soir_debut", "entree_soir_fin", "sortie_soir_debut", "sortie_soir_fin",
)


def _couvre_jour(jour):
    """Autorisation spéciale valable ce jour-là : sans date_fin = JOUR UNIQUE (date_debut),
    avec date_fin = plage [date_debut, date_fin]."""
    return or_(
        and_(AutorisationSpeciale.date_fin.is_(None), AutorisationSpeciale.date_debut == jour),
        and_(
            AutorisationSpeciale.date_fin.isnot(None),
            AutorisationSpeciale.date_debut <= jour,
            AutorisationSpeciale.date_fin >= jour,
        ),
    )


def _hhmm(dt):
    return dt.strftime("%H:%M") if dt else None


def _minutes(debut, fin):
    if not debut or not fin or fin < debut:
        return 0
    return int((fin - debut).total_seconds() // 60)


def _demi_journee(entree, sortie, retard, retard_min, absence):
    """Resume d'une demi-journee : statut + heures + duree travaillee."""
    if absence:
        statut = "absent"
    elif entree:
        statut = "retard" if retard else "present"
    else:
        statut = "non_pointe"
    return {
        "statut": statut,
        "entree": _hhmm(entree),
        "sortie": _hhmm(sortie),
        "retard": bool(retard),
        "retard_minutes": int(retard_min or 0) if retard else 0,
        "absence": bool(absence),
        "duree_minutes": _minutes(entree, sortie),
    }


@bp.route("/detail/<int:idpointage>", methods=["GET"])
def detail_pointage(idpointage):
    role_session = session.get("role")
    if role_session not in ("responsable", "admin"):
        return jsonify({"error": "Accès refusé"}), 403

    pointage = Pointage.query.get(idpointage)
    if not pointage:
        return jsonify({"error": "Pointage introuvable"}), 404

    personnel = Personnels.query.get(pointage.idpers)
    if not personnel:
        return jsonify({"error": "Personnel introuvable"}), 404

    division = Divisions.query.get(personnel.iddiv)
    service = Services.query.get(division.idserv) if division else None

    # Un responsable ne voit que les pointages de son service
    if role_session == "responsable":
        responsable = Responsables.query.get(session.get("responsable_id"))
        if not responsable or not service or responsable.idserv != service.idserv:
            return jsonify({"error": "Accès refusé à ce service"}), 403

    jour = pointage.date
    is_surface = personnel.role == "surface"

    # ---------- Pointage ----------
    matin = _demi_journee(
        pointage.heure_entree_matin, pointage.heure_sortie_matin,
        pointage.retard_matin, pointage.retard_matin_minutes, pointage.absence_matin,
    )
    apres_midi = _demi_journee(
        pointage.heure_entree_soir, pointage.heure_sortie_soir,
        pointage.retard_soir, pointage.retard_soir_minutes, pointage.absence_soir,
    )
    unique = {
        "statut": (
            "absent" if pointage.absence_unique
            else "present" if pointage.heure_entree_unique
            else "non_pointe"
        ),
        "entree": _hhmm(pointage.heure_entree_unique),
        "sortie": _hhmm(pointage.heure_sortie_unique),
        "absence": bool(pointage.absence_unique),
        "duree_minutes": _minutes(pointage.heure_entree_unique, pointage.heure_sortie_unique),
    }

    if is_surface:
        absent = bool(pointage.absence_unique)
        a_pointe = bool(pointage.heure_entree_unique)
        duree = unique["duree_minutes"]
        retard_total = 0
    else:
        absent = bool(pointage.absence)
        a_pointe = bool(pointage.heure_entree_matin or pointage.heure_entree_soir)
        duree = matin["duree_minutes"] + apres_midi["duree_minutes"]
        retard_total = (pointage.retard_matin_minutes or 0) + (pointage.retard_soir_minutes or 0)

    if absent:
        statut = "absent"
    elif not a_pointe:
        statut = "non_pointe"
    elif retard_total > 0:
        statut = "retard"
    else:
        statut = "present"

    # ---------- Horaires du service ----------
    horaire = getattr(service, "horaire", None) if service else None
    horaires = (
        {c: _hhmm(getattr(horaire, c, None)) for c in _HORAIRE_CHAMPS} if horaire else None
    )

    # ---------- Autorisations qui couvrent ce jour ----------
    speciales = AutorisationSpeciale.query.filter(
        AutorisationSpeciale.idpers == personnel.idpers,
        _couvre_jour(jour),
    ).all()

    absences = AutorisationAbsence.query.filter(
        AutorisationAbsence.idpers == personnel.idpers,
        AutorisationAbsence.date_absence == jour,
    ).all()

    # ---------- Recapitulatif du mois ----------
    debut_mois = date(jour.year, jour.month, 1)
    fin_mois = date(jour.year, jour.month, monthrange(jour.year, jour.month)[1])
    lignes_mois = Pointage.query.filter(
        Pointage.idpers == personnel.idpers,
        Pointage.date >= debut_mois,
        Pointage.date <= fin_mois,
    ).all()
    recap = {
        "mois": jour.month,
        "annee": jour.year,
        "jours_pointes": len(lignes_mois),
        "retard_minutes": sum(p.retard_total_minutes or 0 for p in lignes_mois),
        "jours_retard": sum(1 for p in lignes_mois if (p.retard_total_minutes or 0) > 0),
        "jours_absence": sum(
            1 for p in lignes_mois
            if (p.absence_unique if is_surface else p.absence)
        ),
    }

    return jsonify({
        "personnel": {
            "idpers": personnel.idpers,
            "matricule": personnel.matricule,
            "nom": personnel.nom,
            "prenom": personnel.prenom,
            "email": personnel.email,
            "numtel": personnel.numtel,
            "role": personnel.role,
            "image": personnel.image,
            "division": division.nom if division else None,
            "iddiv": personnel.iddiv,
            "service": service.nom if service else None,
            "sigle": service.sigle if service else None,
        },
        "pointage": {
            "id": pointage.id,
            "date": jour.isoformat(),
            "statut": statut,
            "role": personnel.role,
            "matin": matin,
            "apres_midi": apres_midi,
            "unique": unique,
            "retard_total_minutes": retard_total,
            "duree_travaillee_minutes": duree,
            "justificatif": pointage.justificatif,
        },
        "horaires": horaires,
        "autorisations": {
            "speciales": [
                {
                    "id": a.id,
                    "type": a.type_autorisation.value if a.type_autorisation else None,
                    "periode": a.periode.value if a.periode else None,
                    "motif": a.motif,
                    "date_debut": a.date_debut.isoformat() if a.date_debut else None,
                    "date_fin": a.date_fin.isoformat() if a.date_fin else None,
                }
                for a in speciales
            ],
            "absences": [
                {
                    "id": a.id,
                    "motif": a.motif,
                    "demi_journee": a.demi_journee,
                    "type": a.type_autorisation.nomtype if a.type_autorisation else None,
                }
                for a in absences
            ],
        },
        "recap_mois": recap,
    }), 200


# ===========================================================================
# PAGES « PERSONNEL » : statistiques matin / soir + autorisations du jour
# ===========================================================================

def _acces_personnel(idpers):
    """Retourne (personnel, erreur_response). Un agent voit ses propres données,
    un responsable celles des agents de SON service, un admin tout."""
    personnel = Personnels.query.get(idpers)
    if not personnel:
        return None, (jsonify({"error": "Personnel introuvable"}), 404)

    if session.get("personnel_id") == idpers or session.get("role") == "admin":
        return personnel, None

    if session.get("role") == "responsable":
        responsable = Responsables.query.get(session.get("responsable_id"))
        division = Divisions.query.get(personnel.iddiv)
        if responsable and division and division.idserv == responsable.idserv:
            return personnel, None

    return None, (jsonify({"error": "Accès refusé"}), 403)


def _parse_jour(valeur):
    return datetime.strptime(valeur, "%Y-%m-%d").date() if valeur else None


@bp.route("/personnel/stats", methods=["GET"])
def stats_personnel():
    """Compteurs ENTIERS d'un agent sur une période, séparés matin / soir.

    Paramètres : idpers (requis) ; date  OU  dateDebut + dateFin (sinon : aujourd'hui).
    Réponse : matin / soir / unique (agents de surface) avec presence, retards,
    absence_non_justifiee, absence_justifiee ; jours = nombre de fiches de pointage.
    Mêmes définitions que /api/pointage/stats (page Présences).
    """
    idpers = request.args.get("idpers", type=int)
    if not idpers:
        return jsonify({"error": "idpers requis"}), 400

    personnel, erreur = _acces_personnel(idpers)
    if erreur:
        return erreur

    try:
        jour = _parse_jour(request.args.get("date"))
        debut = _parse_jour(request.args.get("dateDebut"))
        fin = _parse_jour(request.args.get("dateFin"))
    except ValueError:
        return jsonify({"error": "Date invalide, format attendu YYYY-MM-DD"}), 400

    if debut or fin:
        if not debut or not fin:
            return jsonify({"error": "dateDebut et dateFin sont requis ensemble"}), 400
        if fin < debut:
            return jsonify({"error": "dateFin doit être supérieure ou égale à dateDebut"}), 400
    elif not jour:
        jour = date.today()
        debut = fin = jour
    else:
        debut = fin = jour

    P = Pointage

    def somme(condition):
        return func.sum(case((condition, 1), else_=0))

    sans_justif = P.justificatif.is_(None)
    ligne = (
        Pointage.query.with_entities(
            func.count(P.id),
            somme(P.heure_entree_matin.isnot(None)),
            somme(P.heure_entree_soir.isnot(None)),
            somme(P.retard_matin == 1),
            somme(P.retard_soir == 1),
            somme((P.absence_matin == 1) & sans_justif),
            somme((P.absence_soir == 1) & sans_justif),
            somme((P.absence_matin == 1) & ~sans_justif),
            somme((P.absence_soir == 1) & ~sans_justif),
            somme(P.heure_entree_unique.isnot(None)),
            somme((P.absence_unique == 1) & sans_justif),
            somme((P.absence_unique == 1) & ~sans_justif),
        )
        .filter(P.idpers == idpers, P.date >= debut, P.date <= fin)
        .one()
    )
    v = [int(x or 0) for x in ligne]

    return jsonify({
        "idpers": idpers,
        "role": personnel.role,
        "dateDebut": debut.isoformat(),
        "dateFin": fin.isoformat(),
        "jours": v[0],
        "matin": {
            "presence": v[1], "retards": v[3],
            "absence_non_justifiee": v[5], "absence_justifiee": v[7],
        },
        "soir": {
            "presence": v[2], "retards": v[4],
            "absence_non_justifiee": v[6], "absence_justifiee": v[8],
        },
        "unique": {
            "presence": v[9], "absence_non_justifiee": v[10], "absence_justifiee": v[11],
        },
    }), 200


@bp.route("/personnel/autorisations-jour", methods=["GET"])
def autorisations_du_jour_personnel():
    """Autorisations d'un agent valables AUJOURD'HUI : autorisations spéciales
    (sortie / retard, par période) et autorisation d'absence du jour."""
    idpers = request.args.get("idpers", type=int)
    if not idpers:
        return jsonify({"error": "idpers requis"}), 400

    _, erreur = _acces_personnel(idpers)
    if erreur:
        return erreur

    aujourdhui = date.today()

    speciales = AutorisationSpeciale.query.filter(
        AutorisationSpeciale.idpers == idpers,
        _couvre_jour(aujourdhui),
    ).all()

    absences = AutorisationAbsence.query.filter(
        AutorisationAbsence.idpers == idpers,
        AutorisationAbsence.date_absence == aujourdhui,
    ).all()

    return jsonify({
        "date": aujourdhui.isoformat(),
        "speciales": [
            {
                "id": a.id,
                "type": a.type_autorisation.value if a.type_autorisation else None,
                "periode": a.periode.value if a.periode else None,
                "motif": a.motif,
                "date_debut": a.date_debut.isoformat() if a.date_debut else None,
                "date_fin": a.date_fin.isoformat() if a.date_fin else None,
            }
            for a in speciales
        ],
        "absences": [
            {
                "id": a.id,
                "motif": a.motif,
                "demi_journee": a.demi_journee,
                "type": a.type_autorisation.nomtype if a.type_autorisation else None,
            }
            for a in absences
        ],
    }), 200
