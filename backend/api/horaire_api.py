from flask import Blueprint, request, jsonify
from models import db
from models.horaire import HorairesService
from models.services import Services
from datetime import datetime

bp = Blueprint("horaires_api", __name__)


def parse_hhmm(value: str) -> datetime:
    """
    "07:10" -> datetime(2000,1,1,7,10)
    """
    try:
        h, m = map(int, value.split(":"))
        return datetime(2000, 1, 1, h, m)
    except Exception:
        raise ValueError(f"Format heure invalide: {value} (attendu HH:MM)")


def validate_order(start, end):
    if start >= end:
        raise ValueError("Une heure de fin doit être après l'heure de début")


def validate_ranges(h):
    validate_order(h["entree_matin_debut"], h["entree_matin_fin"])
    validate_order(h["sortie_matin_debut"], h["sortie_matin_fin"])
    validate_order(h["entree_soir_debut"], h["entree_soir_fin"])
    validate_order(h["sortie_soir_debut"], h["sortie_soir_fin"])

    if h["sortie_matin_fin"] > h["entree_soir_debut"]:
        raise ValueError("Chevauchement entre matin et soir")


@bp.route("", methods=["POST"])
def create_horaires_service():
    data = request.get_json()

    try:
        idserv = data.get("idserv")
        service = Services.query.get(idserv)

        if not service:
            return jsonify({"error": "Service introuvable"}), 404

        # ⚠️ empêcher doublon (1 service = 1 horaire)
        existing = HorairesService.query.filter_by(idserv=idserv).first()
        if existing:
            return jsonify({"error": "Horaires déjà définis pour ce service"}), 400

        # Conversion
        h = {
            "entree_matin_debut": parse_hhmm(data["entree_matin_debut"]),
            "entree_matin_fin": parse_hhmm(data["entree_matin_fin"]),
            "sortie_matin_debut": parse_hhmm(data["sortie_matin_debut"]),
            "sortie_matin_fin": parse_hhmm(data["sortie_matin_fin"]),
            "entree_soir_debut": parse_hhmm(data["entree_soir_debut"]),
            "entree_soir_fin": parse_hhmm(data["entree_soir_fin"]),
            "sortie_soir_debut": parse_hhmm(data["sortie_soir_debut"]),
            "sortie_soir_fin": parse_hhmm(data["sortie_soir_fin"]),
        }

        # Validation
        validate_ranges(h)

        horaires = HorairesService(idserv=idserv, **h)

        db.session.add(horaires)
        db.session.commit()

        return (
            jsonify({"message": "Horaires créés avec succès", "id": horaires.id}),
            201,
        )

    except KeyError as e:
        return jsonify({"error": f"Champ manquant: {str(e)}"}), 400

    except AssertionError:
        return jsonify({"error": "Plages horaires invalides"}), 400

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("", methods=["GET"])
def get_horaires():
    try:
        horaires = (
            db.session.query(HorairesService, Services)
            .join(Services, HorairesService.idserv == Services.idserv)
            .all()
        )

        result = []
        for h, s in horaires:
            result.append(
                {
                    "id": h.id,
                    "idserv": s.idserv,
                    "service_nom": s.nom,
                    "entree_matin_debut": h.entree_matin_debut.strftime("%H:%M"),
                    "entree_matin_fin": h.entree_matin_fin.strftime("%H:%M"),
                    "sortie_matin_debut": h.sortie_matin_debut.strftime("%H:%M"),
                    "sortie_matin_fin": h.sortie_matin_fin.strftime("%H:%M"),
                    "entree_soir_debut": h.entree_soir_debut.strftime("%H:%M"),
                    "entree_soir_fin": h.entree_soir_fin.strftime("%H:%M"),
                    "sortie_soir_debut": h.sortie_soir_debut.strftime("%H:%M"),
                    "sortie_soir_fin": h.sortie_soir_fin.strftime("%H:%M"),
                }
            )

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
