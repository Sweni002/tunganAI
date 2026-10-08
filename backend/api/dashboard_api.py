"""Tableau de bord du responsable : suivi de l'assiduité / des présences d'un service.

Deux routes, toutes limitées à UN service (idserv) :

  GET /api/dashboard/overview   période (dateDebut/dateFin) : KPIs + tendance vs période
                                précédente, courbe jour par jour, répartition par division,
                                agents à surveiller.
  GET /api/dashboard/today      photo du jour (présents / retards / absents / pas encore pointés).

Les définitions (présence, retard, absence justifiée ou non) sont celles de
/api/pointage/stats, pour que les chiffres concordent avec la page Présences.
"""
import functools
from datetime import date, datetime, timedelta

from flask import Blueprint, jsonify, request, session
from sqlalchemy import and_, case, distinct, func, or_

from models import db, Divisions, Personnels, Pointage, Responsables
from utils.cache import cached_assiduite_stats

bp = Blueprint("dashboard_api", __name__)

_MAX_JOURS = 366          # borne la période (taille de la courbe et coût des requêtes)
_TOP = 5                  # taille des classements « agents à surveiller »


# ===========================================================================
# ACCÈS : un responsable ne voit que SON service
# ===========================================================================

def _idserv_autorise():
    """idserv demandé, contrôlé par rapport à la session. Retourne (idserv, erreur_response)."""
    demande = request.args.get("idserv", type=int)
    if not demande:
        return None, (jsonify({"error": "idserv requis"}), 400)

    if session.get("role") == "responsable":
        responsable = Responsables.query.get(session.get("responsable_id"))
        if not responsable or responsable.idserv != demande:
            return None, (jsonify({"error": "Accès refusé à ce service"}), 403)

    return demande, None


def service_requis(view):
    """À placer AU-DESSUS du cache : le contrôle doit s'exécuter même sur un HIT."""
    @functools.wraps(view)
    def wrapper(*args, **kwargs):
        _, erreur = _idserv_autorise()
        if erreur:
            return erreur
        return view(*args, **kwargs)
    return wrapper


# ===========================================================================
# OUTILS
# ===========================================================================

def _parse_date(valeur, defaut=None):
    if not valeur:
        return defaut
    return datetime.strptime(valeur, "%Y-%m-%d").date()


def _periode():
    """(debut, fin) ; par défaut : du 1er du mois jusqu'à aujourd'hui."""
    aujourd_hui = date.today()
    debut = _parse_date(request.args.get("dateDebut"), aujourd_hui.replace(day=1))
    fin = _parse_date(request.args.get("dateFin"), aujourd_hui)
    return debut, fin


def _arrondi(valeur, nd=1):
    return round(float(valeur or 0), nd)


def _taux(num, den):
    return round(100.0 * num / den, 1) if den else None


def _colonnes():
    """Expressions d'agrégat communes (mêmes définitions que /stats), en JOURS."""
    def demi(cond):
        return case((cond, 0.5), else_=0.0)

    presence = (
        demi(Pointage.heure_entree_matin.isnot(None))
        + demi(Pointage.heure_entree_soir.isnot(None))
        # agents de surface : un seul pointage pour la journée
        + case((Pointage.heure_entree_unique.isnot(None), 1.0), else_=0.0)
    )
    retards = demi(Pointage.retard_matin == 1) + demi(Pointage.retard_soir == 1)

    sans_justif = Pointage.justificatif.is_(None)
    abs_nj = (
        demi(and_(Pointage.absence_matin == 1, sans_justif))
        + demi(and_(Pointage.absence_soir == 1, sans_justif))
        + case((and_(Pointage.absence_unique == 1, sans_justif), 1.0), else_=0.0)
    )
    abs_j = (
        demi(and_(Pointage.absence_matin == 1, ~sans_justif))
        + demi(and_(Pointage.absence_soir == 1, ~sans_justif))
        + case((and_(Pointage.absence_unique == 1, ~sans_justif), 1.0), else_=0.0)
    )
    minutes = func.coalesce(Pointage.retard_matin_minutes, 0) + func.coalesce(
        Pointage.retard_soir_minutes, 0
    )

    return {
        "presence": func.coalesce(func.sum(presence), 0).label("presence"),
        "retards": func.coalesce(func.sum(retards), 0).label("retards"),
        "minutes": func.coalesce(func.sum(minutes), 0).label("minutes"),
        "abs_nj": func.coalesce(func.sum(abs_nj), 0).label("abs_nj"),
        "abs_j": func.coalesce(func.sum(abs_j), 0).label("abs_j"),
    }


def _base(idserv, debut, fin, iddiv=None, role=None):
    """Pointage ⨝ Personnels ⨝ Responsables, limité au service et à la période."""
    cols = _colonnes()
    base_filters = [
        Responsables.idserv == idserv,
        Pointage.date.between(debut, fin),
    ]
    if iddiv:
        base_filters.append(Personnels.iddiv == iddiv)
    if role:
        base_filters.append(Personnels.role == role)
    return cols, base_filters


def _query(cols, filtres, *groupes):
    q = (
        db.session.query(*groupes, *cols.values())
        .select_from(Pointage)
        .join(Personnels, Pointage.idpers == Personnels.idpers)
        .join(Responsables, Personnels.idrh == Responsables.idrh)
        .filter(*filtres)
    )
    if groupes:
        q = q.group_by(*groupes)
    return q


def _totaux(idserv, debut, fin, iddiv, role):
    cols, filtres = _base(idserv, debut, fin, iddiv, role)
    ligne = _query(cols, filtres).one()
    presence, retards, abs_nj, abs_j = ligne.presence, ligne.retards, ligne.abs_nj, ligne.abs_j
    attendus = float(presence) + float(abs_nj) + float(abs_j)
    return {
        "presence": _arrondi(presence),
        "retards": _arrondi(retards),
        "minutes_retard": int(ligne.minutes or 0),
        "absences_non_justifiees": _arrondi(abs_nj),
        "absences_justifiees": _arrondi(abs_j),
        "taux_presence": _taux(float(presence), attendus),
        "taux_ponctualite": (
            round(100.0 * (1 - min(float(retards) / float(presence), 1)), 1)
            if float(presence)
            else None
        ),
        # Part des présences avec retard (= 100 - ponctualité) et part des jours attendus
        # en absence non justifiée : mêmes dénominateurs que la présence et la ponctualité
        "taux_retard": (
            round(100.0 * min(float(retards) / float(presence), 1), 1) if float(presence) else None
        ),
        "taux_absences_non_justifiees": _taux(float(abs_nj), attendus),
    }


def _effectif(idserv, iddiv, role):
    q = (
        db.session.query(func.count(distinct(Personnels.idpers)))
        .join(Responsables, Personnels.idrh == Responsables.idrh)
        .filter(Responsables.idserv == idserv)
    )
    if iddiv:
        q = q.filter(Personnels.iddiv == iddiv)
    if role:
        q = q.filter(Personnels.role == role)
    return q.scalar() or 0


def _tendance(actuel, precedent):
    """Écart en points ou en % selon l'indicateur ; None si pas de base de comparaison."""
    if precedent in (None, 0):
        return None
    return round(100.0 * (actuel - precedent) / precedent, 1)


# ===========================================================================
# GET /overview
# ===========================================================================

@bp.route("/overview", methods=["GET"])
@service_requis
@cached_assiduite_stats
def overview():
    idserv = request.args.get("idserv", type=int)
    iddiv = request.args.get("iddiv", type=int)
    role = request.args.get("role")
    if role not in (None, "", "bureau", "surface"):
        return jsonify({"error": "role invalide (bureau | surface)"}), 400
    role = role or None

    try:
        debut, fin = _periode()
    except ValueError:
        return jsonify({"error": "dateDebut/dateFin invalides, format YYYY-MM-DD"}), 400

    if fin < debut:
        return jsonify({"error": "dateFin doit être postérieure ou égale à dateDebut"}), 400
    nb_jours = (fin - debut).days + 1
    if nb_jours > _MAX_JOURS:
        return jsonify({"error": f"Période limitée à {_MAX_JOURS} jours"}), 400

    # --- KPIs + comparaison avec la période précédente de même durée ---
    actuel = _totaux(idserv, debut, fin, iddiv, role)
    prec_fin = debut - timedelta(days=1)
    prec_debut = prec_fin - timedelta(days=nb_jours - 1)
    precedent = _totaux(idserv, prec_debut, prec_fin, iddiv, role)

    tendances = {
        "retards": _tendance(actuel["retards"], precedent["retards"]),
        "absences_non_justifiees": _tendance(
            actuel["absences_non_justifiees"], precedent["absences_non_justifiees"]
        ),
        "minutes_retard": _tendance(actuel["minutes_retard"], precedent["minutes_retard"]),
        # pour les taux, l'écart est en points de pourcentage
        "taux_presence": (
            round(actuel["taux_presence"] - precedent["taux_presence"], 1)
            if actuel["taux_presence"] is not None and precedent["taux_presence"] is not None
            else None
        ),
        "taux_ponctualite": (
            round(actuel["taux_ponctualite"] - precedent["taux_ponctualite"], 1)
            if actuel["taux_ponctualite"] is not None and precedent["taux_ponctualite"] is not None
            else None
        ),
        "taux_retard": (
            round(actuel["taux_retard"] - precedent["taux_retard"], 1)
            if actuel["taux_retard"] is not None and precedent["taux_retard"] is not None
            else None
        ),
        "taux_absences_non_justifiees": (
            round(actuel["taux_absences_non_justifiees"] - precedent["taux_absences_non_justifiees"], 1)
            if actuel["taux_absences_non_justifiees"] is not None
            and precedent["taux_absences_non_justifiees"] is not None
            else None
        ),
    }

    # --- Courbe jour par jour ---
    cols, filtres = _base(idserv, debut, fin, iddiv, role)
    jours = {}
    for l in _query(cols, filtres, Pointage.date).order_by(Pointage.date).all():
        jours[l.date] = {
            "date": l.date.isoformat(),
            "presence": _arrondi(l.presence),
            "retards": _arrondi(l.retards),
            "absences_non_justifiees": _arrondi(l.abs_nj),
            "absences_justifiees": _arrondi(l.abs_j),
        }
    # jours sans aucun pointage (week-ends, fériés) : points à zéro, pour une courbe continue
    serie = []
    for i in range(nb_jours):
        d = debut + timedelta(days=i)
        serie.append(
            jours.get(d)
            or {"date": d.isoformat(), "presence": 0, "retards": 0,
                "absences_non_justifiees": 0, "absences_justifiees": 0}
        )

    # --- Répartition par division ---
    cols, filtres = _base(idserv, debut, fin, iddiv, role)
    divisions = []
    q_div = (
        _query(cols, filtres, Divisions.iddiv, Divisions.nom)
        .join(Divisions, Personnels.iddiv == Divisions.iddiv)
    )
    effectifs_div = dict(
        db.session.query(Personnels.iddiv, func.count(distinct(Personnels.idpers)))
        .join(Responsables, Personnels.idrh == Responsables.idrh)
        .filter(Responsables.idserv == idserv)
        .group_by(Personnels.iddiv)
        .all()
    )
    for l in q_div.all():
        attendus = float(l.presence) + float(l.abs_nj) + float(l.abs_j)
        divisions.append({
            "iddiv": l.iddiv,
            "nom": l.nom,
            "effectif": effectifs_div.get(l.iddiv, 0),
            "presence": _arrondi(l.presence),
            "retards": _arrondi(l.retards),
            "absences_non_justifiees": _arrondi(l.abs_nj),
            "absences_justifiees": _arrondi(l.abs_j),
            "taux_presence": _taux(float(l.presence), attendus),
        })
    divisions.sort(key=lambda d: (d["taux_presence"] is None, d["taux_presence"] or 0))

    # --- Agents à surveiller (classements) ---
    def classement(ordre, filtre_non_nul):
        cols_p, filtres_p = _base(idserv, debut, fin, iddiv, role)
        q = (
            _query(
                cols_p, filtres_p,
                Personnels.idpers, Personnels.matricule, Personnels.nom, Personnels.prenom,
                Personnels.iddiv,
            )
            .having(filtre_non_nul(cols_p))
            .order_by(ordre(cols_p).desc(), Personnels.matricule)
            .limit(_TOP)
        )
        noms_div = {d["iddiv"]: d["nom"] for d in divisions}
        return [
            {
                "idpers": l.idpers,
                "matricule": l.matricule,
                "nom": f"{l.nom} {l.prenom}".strip(),
                "division": noms_div.get(l.iddiv),
                "retards": _arrondi(l.retards),
                "minutes_retard": int(l.minutes or 0),
                "absences_non_justifiees": _arrondi(l.abs_nj),
            }
            for l in q.all()
        ]

    plus_en_retard = classement(
        lambda c: func.sum(func.coalesce(Pointage.retard_matin_minutes, 0)
                           + func.coalesce(Pointage.retard_soir_minutes, 0)),
        lambda c: func.sum(func.coalesce(Pointage.retard_matin_minutes, 0)
                           + func.coalesce(Pointage.retard_soir_minutes, 0)) > 0,
    )
    plus_absents = classement(
        lambda c: c["abs_nj"].element,
        lambda c: c["abs_nj"].element > 0,
    )

    return jsonify({
        "periode": {"debut": debut.isoformat(), "fin": fin.isoformat(), "jours": nb_jours},
        "periode_precedente": {"debut": prec_debut.isoformat(), "fin": prec_fin.isoformat()},
        "effectif": _effectif(idserv, iddiv, role),
        "kpis": actuel,
        "precedent": precedent,
        "tendances": tendances,
        "serie": serie,
        "divisions": divisions,
        "a_surveiller": {"retards": plus_en_retard, "absences": plus_absents},
    })


# ===========================================================================
# GET /today
# ===========================================================================

@bp.route("/today", methods=["GET"])
@service_requis
def today():
    """Photo du jour. Non mise en cache : les pointages arrivent en continu."""
    idserv = request.args.get("idserv", type=int)
    iddiv = request.args.get("iddiv", type=int)
    role = request.args.get("role") or None
    if role not in (None, "bureau", "surface"):
        return jsonify({"error": "role invalide (bureau | surface)"}), 400

    jour = date.today()
    effectif = _effectif(idserv, iddiv, role)

    # Un agent compte comme « présent » dès qu'il a au moins un pointage d'entrée aujourd'hui
    a_pointe = or_(
        Pointage.heure_entree_matin.isnot(None),
        Pointage.heure_entree_soir.isnot(None),
        Pointage.heure_entree_unique.isnot(None),
    )
    en_retard = or_(Pointage.retard_matin == 1, Pointage.retard_soir == 1)
    absent = or_(
        Pointage.absence == 1, Pointage.absence_matin == 1,
        Pointage.absence_soir == 1, Pointage.absence_unique == 1,
    )

    q = (
        db.session.query(
            func.count(distinct(case((a_pointe, Pointage.idpers)))).label("presents"),
            func.count(distinct(case((and_(a_pointe, en_retard), Pointage.idpers)))).label("retards"),
            func.count(distinct(case((and_(~a_pointe, absent), Pointage.idpers)))).label("absents"),
        )
        .select_from(Pointage)
        .join(Personnels, Pointage.idpers == Personnels.idpers)
        .join(Responsables, Personnels.idrh == Responsables.idrh)
        .filter(Responsables.idserv == idserv, Pointage.date == jour)
    )
    if iddiv:
        q = q.filter(Personnels.iddiv == iddiv)
    if role:
        q = q.filter(Personnels.role == role)
    l = q.one()

    presents, retards, absents = int(l.presents or 0), int(l.retards or 0), int(l.absents or 0)
    return jsonify({
        "date": jour.isoformat(),
        "effectif": effectif,
        "presents": presents,
        "retards": retards,
        "absents": absents,
        "pas_encore_pointes": max(effectif - presents - absents, 0),
        "taux_presence": _taux(presents, effectif),
    })
