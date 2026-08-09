from flask import Blueprint, request, jsonify, session
from models.client import Client
from models.admin import Admin
from models import (
    Personnels,
    AutorisationSpeciale,
    TypeAutorisation,
    PeriodeAutorisation,Divisions,Services
)
from models import db
from werkzeug.security import check_password_hash
from datetime import datetime

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

        data = []

        for a in result:

            # 🔎 pointage correspondant (si tu veux garder l’état)
            pointage = Pointage.query.filter_by(
                idpers=a.idpers, autorisationsortie_id=a.id
            ).first()

            terminee = False

            if pointage:
                if a.periode == PeriodeAutorisation.matin:
                    terminee = pointage.heure_sortie_matin is not None
                elif a.periode == PeriodeAutorisation.apres_midi:
                    terminee = pointage.heure_sortie_soir is not None

            data.append(
                {
                    "id": a.id,
                    "motif": a.motif,
                    "type_autorisation": (
                        a.type_autorisation.value if a.type_autorisation else None
                    ),
                    "periode": a.periode.value if a.periode else None,
                    # 🔥 IMPORTANT : affichage des dates correctes
                    "date_debut": a.date_debut.isoformat() if a.date_debut else None,
                    "date_fin": a.date_fin.isoformat() if a.date_fin else None,
                    "etat": "terminée" if terminee else "en cours",
                    "personnel": {
                        "idpers": a.idpers,
                        "nom": a.personnel.nom if a.personnel else None,
                        "prenom": a.personnel.prenom if a.personnel else None,
                        "matricule": a.personnel.matricule if a.personnel else None,
                        "iddiv": a.personnel.iddiv if a.personnel else None,
                    },
                }
            )

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

        data = []
        for a in result:
            data.append({
                "id": a.id,
                "motif": a.motif,
                "type_autorisation": a.type_autorisation.value,
                "periode": a.periode.value,
                "date_debut": a.date_debut.isoformat(),
                "date_fin": a.date_fin.isoformat() if a.date_fin else None,
                "personnel": {
                    "idpers": a.personnel.idpers,
                    "nom": a.personnel.nom,
                    "prenom": a.personnel.prenom,
                    "matricule": a.personnel.matricule,
                },
            })
        print("Resultàt =" , data)
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

        data = []
        for a in result:
            data.append({
                "id": a.id,
                "motif": a.motif,
                "type_autorisation": a.type_autorisation.value,
                "periode": a.periode.value,
                "is_single_day": a.is_single_day,
                "date_debut": a.date_debut.isoformat(),
                "date_fin": a.date_fin.isoformat() if a.date_fin else None,
                "personnel": {
                    "idpers": a.personnel.idpers,
                    "nom": a.personnel.nom,
                    "prenom": a.personnel.prenom,
                    "matricule": a.personnel.matricule,
                },
            })

        return jsonify({
            "success": True,
            "count": len(data),
            "data": data
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

        
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
