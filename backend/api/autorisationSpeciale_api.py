from flask import Blueprint, request, jsonify, session
from models.client import Client
from models.admin import Admin
from models import (
    Personnels,
    AutorisationSpeciale,
    TypeAutorisation,
    PeriodeAutorisation,Divisions,Services,Responsables
)
from models import db
from werkzeug.security import check_password_hash
from datetime import date, datetime

bp = Blueprint("autorisation_speciale", __name__)

from models import Pointage, PeriodeAutorisation
from datetime import datetime
from sqlalchemy import or_ ,and_



@bp.route("/", methods=["POST"])
def create_autorisation_speciale():
    try:
        data = request.get_json()

        # -----------------------------
        # 1. CHAMPS OBLIGATOIRES
        # -----------------------------
        motif = data.get("motif")
        type_autorisation = data.get("type_autorisation")
        periode = data.get("periode")
        date_debut_str = data.get("date_debut")
        date_fin_str = data.get("date_fin")  # optionnel
        idpers = data.get("idpers")

        if not all([motif, type_autorisation, periode, date_debut_str, idpers]):
            return jsonify({"success": False, "error": "Champs obligatoires manquants"}), 400

        # -----------------------------
        # 2. ENUM VALIDATION
        # -----------------------------
        try:
            type_enum = TypeAutorisation(type_autorisation)
        except ValueError:
            return jsonify({"success": False, "error": "type_autorisation invalide"}), 400

        try:
            periode_enum = PeriodeAutorisation(periode)
        except ValueError:
            return jsonify({"success": False, "error": "periode invalide"}), 400

        # -----------------------------
        # 3. PARSE DATES + LOGIQUE SINGLE DAY
        # -----------------------------
        try:
            date_debut = datetime.strptime(date_debut_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"success": False, "error": "date_debut invalide"}), 400

        date_fin = None
        is_single_day = False

        if date_fin_str:
            try:
                date_fin = datetime.strptime(date_fin_str, "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"success": False, "error": "date_fin invalide"}), 400

            if date_fin < date_debut:
                return jsonify({"success": False, "error": "date_fin doit être >= date_debut"}), 400

            # 🔥 pas single day si période
            is_single_day = False

        else:
            # 🔥 CAS IMPORTANT : une seule journée
            is_single_day = True
            date_fin = None

        # -----------------------------
        # 4. VERIFICATION CONFLIT
        # -----------------------------
        n_debut = date_debut
        n_fin = date_fin if date_fin else date_debut

        conflits = AutorisationSpeciale.query.filter(
            AutorisationSpeciale.idpers == idpers,
            AutorisationSpeciale.type_autorisation == type_enum,
            AutorisationSpeciale.periode == periode_enum,
            AutorisationSpeciale.date_debut <= n_fin,
            or_(
                AutorisationSpeciale.date_fin == None,
                AutorisationSpeciale.date_fin >= n_debut,
            ),
        ).first()

        if conflits:
            return jsonify({
                "success": False,
                "error": "autorisation déjà existante pour ce personnel (type + période + dates)"
            }), 409

        # -----------------------------
        # 5. CREATION
        # -----------------------------
        autorisation = AutorisationSpeciale(
            motif=motif,
            type_autorisation=type_enum,
            periode=periode_enum,
            date_debut=date_debut,
            date_fin=date_fin,
            is_single_day=is_single_day,  # 🔥 IMPORTANT
            idpers=idpers,
        )

        db.session.add(autorisation)
        db.session.commit()

        # -----------------------------
        # 6. RESPONSE
        # -----------------------------
        return jsonify({
            "success": True,
            "message": "Autorisation créée avec succès",
            "data": {
                "id": autorisation.id,
                "motif": autorisation.motif,
                "type": autorisation.type_autorisation.value,
                "periode": autorisation.periode.value,
                "is_single_day": autorisation.is_single_day,
                "date_debut": autorisation.date_debut.isoformat(),
                "date_fin": autorisation.date_fin.isoformat() if autorisation.date_fin else None,
                "idpers": autorisation.idpers,
            }
        }), 201

    except Exception as e:
        import traceback
        db.session.rollback()

        return jsonify({
            "success": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }), 500


def _couvre(a, jour):
    return a.date_debut <= jour <= (a.date_fin or a.date_debut)


def _etat_autorisation(a, aujourdhui, pointage_du_jour=None):
    """État d'une autorisation d'après ses dates.

      - dernier jour dépassé          -> terminée
      - premier jour pas encore venu  -> à venir
      - sinon (aujourd'hui compris)   -> en cours, ou terminée si la sortie
        autorisée a déjà été pointée aujourd'hui (pointage_du_jour).
    """
    debut = a.date_debut
    fin = a.date_fin or a.date_debut

    if fin < aujourdhui:
        return "terminée"
    if debut > aujourdhui:
        return "à venir"

    if pointage_du_jour:
        if a.periode == PeriodeAutorisation.matin and pointage_du_jour.heure_sortie_matin is not None:
            return "terminée"
        if a.periode == PeriodeAutorisation.apres_midi and pointage_du_jour.heure_sortie_soir is not None:
            return "terminée"
    return "en cours"


def _serialiser_autorisation(a):
    """Format unique renvoyé par les trois routes de liste (service / plage / jour).

    Le champ `etat` était absent des filtres par dates : la colonne « État » du
    tableau restait vide après un filtrage.
    """
    aujourdhui = date.today()
    pointage = None
    if _couvre(a, aujourdhui):
        pointage = Pointage.query.filter_by(
            idpers=a.idpers, autorisationsortie_id=a.id, date=aujourdhui
        ).first()
    etat = _etat_autorisation(a, aujourdhui, pointage)

    return {
        "id": a.id,
        "motif": a.motif,
        "type_autorisation": a.type_autorisation.value if a.type_autorisation else None,
        "periode": a.periode.value if a.periode else None,
        "is_single_day": a.is_single_day,
        "date_debut": a.date_debut.isoformat() if a.date_debut else None,
        "date_fin": a.date_fin.isoformat() if a.date_fin else None,
        "etat": etat,
        "personnel": {
            "idpers": a.idpers,
            "nom": a.personnel.nom if a.personnel else None,
            "prenom": a.personnel.prenom if a.personnel else None,
            "matricule": a.personnel.matricule if a.personnel else None,
            "iddiv": a.personnel.iddiv if a.personnel else None,
        },
    }


@bp.route("/<int:idserv>", methods=["GET"])
def get_autorisations_by_service(idserv):
    try:
        result = (
            db.session.query(AutorisationSpeciale)
            .join(Personnels, AutorisationSpeciale.idpers == Personnels.idpers)
            .join(Divisions, Personnels.iddiv == Divisions.iddiv)
            .filter(Divisions.idserv == idserv)
            .all()
        )

        data = [_serialiser_autorisation(a) for a in result]

        return jsonify({"success": True, "count": len(data), "data": data}), 200

    except Exception as e:
        return (
            jsonify({"success": False, "error": "Erreur serveur", "details": str(e)}),
            500,
        )



@bp.route("/between_dates/<int:idserv>", methods=["GET"])
def get_autorisations_between_dates(idserv):
    try:
        start = request.args.get("start")
        end = request.args.get("end")

        if not start or not end:
            return jsonify({"success": False, "error": "Dates manquantes"}), 400

        start_date = datetime.strptime(start, "%Y-%m-%d").date()
        end_date = datetime.strptime(end, "%Y-%m-%d").date()
        print("START FILTER BETWEEN DATES")
        print("start:", start_date, "end:", end_date)
        result = (
            db.session.query(AutorisationSpeciale)
            .join(Personnels, AutorisationSpeciale.idpers == Personnels.idpers)
            .join(Divisions, Personnels.iddiv == Divisions.iddiv)
            .filter(Divisions.idserv == idserv)
  .filter(
    or_(
        # jour unique
        and_(
            AutorisationSpeciale.is_single_day == True,
            AutorisationSpeciale.date_debut.between(start_date, end_date)
        ),

        # période
        and_(
            AutorisationSpeciale.is_single_day == False,
            AutorisationSpeciale.date_debut <= end_date,
            or_(
                AutorisationSpeciale.date_fin.is_(None),
                AutorisationSpeciale.date_fin >= start_date
            )
        )
    )
)
            .all()
        )

        data = [_serialiser_autorisation(a) for a in result]
        return jsonify(data), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500



@bp.route("/par-date/<int:idserv>", methods=["GET"])
def get_autorisations_by_date(idserv):
    try:
        date_str = request.args.get("date")

        if not date_str:
            return jsonify({"success": False, "error": "Date manquante"}), 400

        selected_date = datetime.strptime(date_str, "%Y-%m-%d").date()

        result = (
            db.session.query(AutorisationSpeciale)
            .join(Personnels, AutorisationSpeciale.idpers == Personnels.idpers)
            .join(Divisions, Personnels.iddiv == Divisions.iddiv)
            .filter(Divisions.idserv == idserv)

            # 🔥 HYBRIDE LOGIC
            .filter(
                or_(
                    # CAS 1 : JOUR UNIQUE
                    and_(
                        AutorisationSpeciale.is_single_day == True,
                        AutorisationSpeciale.date_debut == selected_date
                    ),

                    # CAS 2 : INTERVALLE
                    and_(
                        AutorisationSpeciale.is_single_day == False,
                        AutorisationSpeciale.date_debut <= selected_date,
                        or_(
                            AutorisationSpeciale.date_fin.is_(None),
                            AutorisationSpeciale.date_fin >= selected_date
                        )
                    )
                )
            )
            .all()
        )

        data = [_serialiser_autorisation(a) for a in result]

        return jsonify({
            "success": True,
            "count": len(data),
            "data": data
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

        
@bp.route("/stats/<int:idserv>", methods=["GET"])
def get_stats_autorisations(idserv):
    """Statistiques des autorisations de sortie d'UN service.

    Paramètres (optionnels, mêmes règles que les routes de liste) :
      - date            : un jour précis (YYYY-MM-DD)
      - start et end    : une plage de dates (YYYY-MM-DD)
      - iddiv           : limiter à une division
    Sans date, toutes les autorisations du service sont comptées.

    Réponse : total, répartition par état (en cours / à venir / terminées),
    par période (matin / après-midi), par type (sortie / retard) et nombre
    d'agents autorisés aujourd'hui.
    """
    try:
        # Un responsable ne consulte que SON service
        if session.get("role") == "responsable":
            responsable = Responsables.query.get(session.get("responsable_id"))
            if not responsable or responsable.idserv != idserv:
                return jsonify({"success": False, "error": "Accès refusé à ce service"}), 403

        date_str = request.args.get("date")
        start = request.args.get("start")
        end = request.args.get("end")
        iddiv = request.args.get("iddiv", type=int)

        query = (
            db.session.query(AutorisationSpeciale)
            .join(Personnels, AutorisationSpeciale.idpers == Personnels.idpers)
            .join(Divisions, Personnels.iddiv == Divisions.iddiv)
            .filter(Divisions.idserv == idserv)
        )
        if iddiv:
            query = query.filter(Personnels.iddiv == iddiv)

        if date_str:
            jour = datetime.strptime(date_str, "%Y-%m-%d").date()
            query = query.filter(
                AutorisationSpeciale.date_debut <= jour,
                or_(AutorisationSpeciale.date_fin.is_(None), AutorisationSpeciale.date_fin >= jour),
            )
        elif start or end:
            if not start or not end:
                return jsonify({"success": False, "error": "start et end sont requis ensemble"}), 400
            debut = datetime.strptime(start, "%Y-%m-%d").date()
            fin = datetime.strptime(end, "%Y-%m-%d").date()
            query = query.filter(
                AutorisationSpeciale.date_debut <= fin,
                or_(AutorisationSpeciale.date_fin.is_(None), AutorisationSpeciale.date_fin >= debut),
            )

        autorisations = query.all()

        # Pointages du jour liés à ces autorisations : UNE requête (pas une par ligne)
        aujourdhui = date.today()
        ids_du_jour = [a.id for a in autorisations if _couvre(a, aujourdhui)]
        pointages_du_jour = {}
        if ids_du_jour:
            for lot in range(0, len(ids_du_jour), 900):  # limite d'un IN Oracle
                for p in Pointage.query.filter(
                    Pointage.date == aujourdhui,
                    Pointage.autorisationsortie_id.in_(ids_du_jour[lot:lot + 900]),
                ).all():
                    pointages_du_jour[p.autorisationsortie_id] = p

        etats = {"en_cours": 0, "a_venir": 0, "terminees": 0}
        periodes = {"matin": 0, "apres_midi": 0}
        types = {"sortie": 0, "retard": 0}
        agents_aujourdhui = set()

        for a in autorisations:
            etat = _etat_autorisation(a, aujourdhui, pointages_du_jour.get(a.id))
            if etat == "terminée":
                etats["terminees"] += 1
            elif etat == "à venir":
                etats["a_venir"] += 1
            else:
                etats["en_cours"] += 1

            if a.periode:
                periodes[a.periode.value] = periodes.get(a.periode.value, 0) + 1
            if a.type_autorisation:
                types[a.type_autorisation.value] = types.get(a.type_autorisation.value, 0) + 1
            if _couvre(a, aujourdhui):
                agents_aujourdhui.add(a.idpers)

        return jsonify({
            "success": True,
            "idserv": idserv,
            "total": len(autorisations),
            "etats": etats,
            "periodes": periodes,
            "types": types,
            "agents_autorises_aujourdhui": len(agents_aujourdhui),
        }), 200

    except ValueError:
        return jsonify({"success": False, "error": "Date invalide, format attendu YYYY-MM-DD"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": "Erreur serveur", "details": str(e)}), 500


@bp.route("/<int:id>", methods=["DELETE"])
def delete_autorisation_speciale(id):
    try:
        autorisation = AutorisationSpeciale.query.get(id)

        if not autorisation:
            return (
                jsonify({"success": False, "error": "Autorisation introuvable"}),
                404,
            )

        # 🔥 suppression
        db.session.delete(autorisation)
        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Autorisation supprimée avec succès",
                    "id": id,
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Erreur lors de la suppression",
                    "details": str(e),
                }
            ),
            500,
        )
