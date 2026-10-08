"""CRUD des jours fériés d'un service.

  GET    /api/jours_feries/<idserv>   liste paginée (page, per_page <= 100, q, periode, annee) + résumé
  POST   /api/jours_feries/           ajout d'un ou PLUSIEURS jours (date_debut -> date_fin)
  PUT    /api/jours_feries/<id>       modification (date, période, motif)
  DELETE /api/jours_feries/<id>       suppression

Règles d'ajout (par date, pour un même service) :
  - « complete » est refusé s'il existe déjà un jour férié (matin, soir ou complete) ce jour-là ;
  - « matin »    est refusé s'il existe déjà « matin » ou « complete » ;
  - « soir »     est refusé s'il existe déjà « soir » ou « complete » ;
  - « matin » + « soir » sur la même date sont compatibles (ensemble = la journée).
Un responsable ne gère que les jours fériés de SON service.
"""
from datetime import date, datetime, timedelta

from flask import Blueprint, jsonify, request, session
from sqlalchemy import func

from models import JourFerie, Responsables, Services, db
from models.jourFerie import PERIODES
from utils.jours_feries import invalider

bp = Blueprint("jours_feries_api", __name__)

_PER_PAGE_MAX = 100
_JOURS_MAX = 366            # taille maximale d'une plage ajoutée en une fois
_LIBELLES = {"matin": "matin", "soir": "après-midi", "complete": "journée complète"}


# ===========================================================================
# OUTILS
# ===========================================================================

def _acces_service(idserv):
    """None si l'accès est autorisé, sinon (réponse, code)."""
    role = session.get("role")
    if role == "admin":
        return None
    if role == "responsable":
        responsable = Responsables.query.get(session.get("responsable_id"))
        if responsable and responsable.idserv == idserv:
            return None
    return jsonify({"error": "Accès refusé à ce service"}), 403


def _parse_date(valeur, nom):
    try:
        return datetime.strptime(valeur, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise ValueError(f"{nom} invalide (format attendu AAAA-MM-JJ)")


def _conflit(existants, periode):
    """Ligne existante qui empêche d'ajouter `periode` ce jour-là, ou None."""
    for ligne in existants:
        if periode == "complete":
            return ligne
        if ligne.periode == "complete" or ligne.periode == periode:
            return ligne
    return None


def _raison(ligne, jour):
    return (
        f"{jour:%d/%m/%Y} : un jour férié « {_LIBELLES.get(ligne.periode, ligne.periode)} » "
        f"existe déjà (« {ligne.motif} »)"
    )


def _etat(jour, aujourdhui):
    if jour < aujourdhui:
        return "passe"
    if jour > aujourdhui:
        return "a_venir"
    return "aujourdhui"


def _serialiser(ligne, aujourdhui):
    data = ligne.to_dict()
    data["etat"] = _etat(ligne.date, aujourdhui)
    return data


# ===========================================================================
# LISTE
# ===========================================================================

@bp.route("/<int:idserv>", methods=["GET"])
def liste_jours_feries(idserv):
    erreur = _acces_service(idserv)
    if erreur:
        return erreur
    if not Services.query.get(idserv):
        return jsonify({"error": "Service introuvable"}), 404

    aujourdhui = date.today()
    base = JourFerie.query.filter(JourFerie.idserv == idserv)

    # ---- Résumé du service (indépendant des filtres de la liste) ----
    resume = {
        "total": base.count(),
        "a_venir": base.filter(JourFerie.date > aujourdhui).count(),
        "aujourd_hui": base.filter(JourFerie.date == aujourdhui).count(),
        "passes": base.filter(JourFerie.date < aujourdhui).count(),
    }

    # ---- Filtres de la liste ----
    query = base
    q = (request.args.get("q") or "").strip().lower()
    if q:
        query = query.filter(func.lower(JourFerie.motif).like(f"%{q}%"))

    periode = request.args.get("periode")
    if periode in PERIODES:
        query = query.filter(JourFerie.periode == periode)

    annee = request.args.get("annee", type=int)
    if annee:
        query = query.filter(
            JourFerie.date >= date(annee, 1, 1), JourFerie.date <= date(annee, 12, 31)
        )

    query = query.order_by(JourFerie.date.desc(), JourFerie.id.desc())

    page = max(request.args.get("page", default=1, type=int) or 1, 1)
    per_page = max(1, min(request.args.get("per_page", default=10, type=int) or 10, _PER_PAGE_MAX))

    total = query.order_by(None).count()
    lignes = query.limit(per_page).offset((page - 1) * per_page).all()

    return jsonify({
        "data": [_serialiser(l, aujourdhui) for l in lignes],
        "total": total,
        "page": page,
        "per_page": per_page,
        "resume": resume,
    }), 200


# ===========================================================================
# AJOUT (un ou plusieurs jours)
# ===========================================================================

@bp.route("/", methods=["POST"])
def ajouter_jours_feries():
    data = request.get_json(silent=True) or {}

    idserv = data.get("idserv")
    try:
        idserv = int(idserv)
    except (TypeError, ValueError):
        return jsonify({"error": "idserv requis"}), 400

    erreur = _acces_service(idserv)
    if erreur:
        return erreur
    if not Services.query.get(idserv):
        return jsonify({"error": "Service introuvable"}), 404

    periode = data.get("periode") or "complete"
    if periode not in PERIODES:
        return jsonify({"error": "periode doit valoir matin, soir ou complete"}), 400

    motif = (data.get("motif") or "").strip()
    if not motif:
        return jsonify({"error": "Le motif est requis"}), 400
    if len(motif) > 255:
        return jsonify({"error": "Le motif est trop long (255 caractères maximum)"}), 400

    try:
        debut = _parse_date(data.get("date_debut"), "date_debut")
        fin = _parse_date(data.get("date_fin"), "date_fin") if data.get("date_fin") else debut
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if fin < debut:
        return jsonify({"error": "date_fin doit être postérieure ou égale à date_debut"}), 400
    if (fin - debut).days + 1 > _JOURS_MAX:
        return jsonify({"error": f"La plage ne peut pas dépasser {_JOURS_MAX} jours"}), 400

    inclure_weekends = bool(data.get("inclure_weekends"))

    # Existants sur la plage, en UNE requête
    existants = {}
    for ligne in JourFerie.query.filter(
        JourFerie.idserv == idserv, JourFerie.date >= debut, JourFerie.date <= fin
    ).all():
        existants.setdefault(ligne.date, []).append(ligne)

    crees, ignores = [], []
    jour = debut
    while jour <= fin:
        if jour.weekday() >= 5 and not inclure_weekends:
            ignores.append({"date": jour.isoformat(), "raison": f"{jour:%d/%m/%Y} : week-end (déjà non travaillé)"})
        else:
            ligne_conflit = _conflit(existants.get(jour, []), periode)
            if ligne_conflit:
                ignores.append({"date": jour.isoformat(), "raison": _raison(ligne_conflit, jour)})
            else:
                nouveau = JourFerie(idserv=idserv, date=jour, periode=periode, motif=motif)
                db.session.add(nouveau)
                crees.append(nouveau)
        jour += timedelta(days=1)

    if not crees:
        db.session.rollback()
        return jsonify({
            "error": "Aucun jour férié ajouté",
            "ignores": ignores,
        }), 409

    try:
        db.session.commit()
    except Exception as exc:  # contrainte d'unicité : ajout concurrent
        db.session.rollback()
        return jsonify({"error": "Ajout impossible", "details": str(exc)}), 409

    invalider(idserv, [l.date for l in crees])

    n = len(crees)
    message = f"{n} jour{'s' if n > 1 else ''} férié{'s' if n > 1 else ''} ajouté{'s' if n > 1 else ''}"
    if ignores:
        message += f" ({len(ignores)} ignoré{'s' if len(ignores) > 1 else ''})"

    return jsonify({
        "message": message,
        "crees": [l.to_dict() for l in crees],
        "ignores": ignores,
    }), 201


# ===========================================================================
# MODIFICATION
# ===========================================================================

@bp.route("/<int:id>", methods=["PUT"])
def modifier_jour_ferie(id):
    ligne = JourFerie.query.get(id)
    if not ligne:
        return jsonify({"error": "Jour férié introuvable"}), 404

    erreur = _acces_service(ligne.idserv)
    if erreur:
        return erreur

    data = request.get_json(silent=True) or {}
    ancien_jour = ligne.date

    try:
        nouveau_jour = _parse_date(data["date"], "date") if data.get("date") else ligne.date
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    nouvelle_periode = data.get("periode") or ligne.periode
    if nouvelle_periode not in PERIODES:
        return jsonify({"error": "periode doit valoir matin, soir ou complete"}), 400

    nouveau_motif = (data.get("motif") if "motif" in data else ligne.motif) or ""
    nouveau_motif = nouveau_motif.strip()
    if not nouveau_motif:
        return jsonify({"error": "Le motif est requis"}), 400
    if len(nouveau_motif) > 255:
        return jsonify({"error": "Le motif est trop long (255 caractères maximum)"}), 400

    # Mêmes règles qu'à l'ajout, en ignorant la ligne modifiée
    autres = JourFerie.query.filter(
        JourFerie.idserv == ligne.idserv,
        JourFerie.date == nouveau_jour,
        JourFerie.id != ligne.id,
    ).all()
    ligne_conflit = _conflit(autres, nouvelle_periode)
    if ligne_conflit:
        return jsonify({"error": _raison(ligne_conflit, nouveau_jour)}), 409

    ligne.date = nouveau_jour
    ligne.periode = nouvelle_periode
    ligne.motif = nouveau_motif

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": "Modification impossible", "details": str(exc)}), 409

    invalider(ligne.idserv, {ancien_jour, nouveau_jour})
    return jsonify({"message": "Jour férié modifié", "data": _serialiser(ligne, date.today())}), 200


# ===========================================================================
# SUPPRESSION
# ===========================================================================

@bp.route("/<int:id>", methods=["DELETE"])
def supprimer_jour_ferie(id):
    ligne = JourFerie.query.get(id)
    if not ligne:
        return jsonify({"error": "Jour férié introuvable"}), 404

    erreur = _acces_service(ligne.idserv)
    if erreur:
        return erreur

    idserv, jour = ligne.idserv, ligne.date
    db.session.delete(ligne)
    db.session.commit()
    invalider(idserv, [jour])

    return jsonify({"message": "Jour férié supprimé"}), 200
