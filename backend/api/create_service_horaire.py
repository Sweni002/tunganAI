# api/services_api.py
#
# POST create service + horaires (UN SEUL APPEL, transaction atomique)
# ... (commentaire d'origine conservé)

from flask import Blueprint, request, jsonify, current_app   # ✅ AJOUT current_app
from models import db, ServiceMacAutorisee
from models.horaire import HorairesService
from models.services import Services
from datetime import datetime

bp = Blueprint("services_api", __name__)


# -----------------------------
# Helpers horaires (inchangés)
# -----------------------------
def parse_hhmm(value: str) -> datetime:
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


import re

MAC_ADDRESS_REGEX = re.compile(r"^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$")


def normalize_mac(mac: str) -> str:
    """Uniformise en majuscules pour éviter les doublons du type aa:bb vs AA:BB."""
    return mac.strip().upper()


def validate_mac_format(mac: str):
    if not MAC_ADDRESS_REGEX.match(mac):
        raise ValueError(f"Format d'adresse MAC invalide: {mac} (attendu AA:BB:CC:DD:EE:FF)")


# =========================================================
# ✅ AJOUT — Invalidation du cache MAC côté pointage
# =========================================================
# Deux clés Redis sont concernées (mêmes formats que dans
# api/pointage_faciale.py et utils/pointage_redis.py) :
#
#   pointage:v1:mac_day:{MAC}:{YYYYMMDD}   (positive ou négative "-")
#   pointage:v1:mac:{MAC}                  (cache court de utils.pointage_redis)
#
# Sans cette invalidation, un poste qui a tenté de pointer AVANT l'ajout
# de sa MAC reste bloqué sur "adresse MAC non autorisée" pendant jusqu'à
# 300 s (MAC_NEGATIVE_TTL) même après l'ajout en base.
def _invalidate_mac_cache(mac_address: str) -> None:
    if not mac_address:
        return
    try:
        redis_client = current_app.extensions.get("redis")
        if redis_client is None:
            return

        mac_norm = normalize_mac(mac_address)
        today = datetime.now().strftime("%Y%m%d")

        redis_client.delete(f"pointage:v1:mac_day:{mac_norm}:{today}")
        redis_client.delete(f"pointage:v1:mac:{mac_norm}")

    except Exception as exc:
        # On ne fait JAMAIS échouer l'ajout/suppression à cause du cache.
        print(f"[MAC Cache] Invalidation impossible pour {mac_address}: {exc}")


# =========================================================
# POST — Ajouter une ou plusieurs adresses MAC à un service
# =========================================================
@bp.route("/<int:idserv>/mac-addresses", methods=["POST"])
def add_mac_addresses(idserv):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Corps JSON manquant"}), 400

    service = Services.query.get(idserv)
    if not service:
        return jsonify({"error": "Service introuvable"}), 404

    entries = []
    if "mac_addresses" in data:
        if not isinstance(data["mac_addresses"], list) or not data["mac_addresses"]:
            return jsonify({"error": "mac_addresses doit être une liste non vide"}), 400
        entries = data["mac_addresses"]
    elif "mac_address" in data:
        entries = [{"mac_address": data["mac_address"], "description": data.get("description")}]
    else:
        return jsonify({"error": "mac_address ou mac_addresses requis"}), 400

    try:
        # ---- 1) Validation + normalisation de toutes les entrées ----
        to_create = []
        seen_in_payload = set()

        for entry in entries:
            mac_raw = entry.get("mac_address")
            if not mac_raw:
                raise ValueError("mac_address manquant dans une des entrées")

            mac = normalize_mac(mac_raw)
            validate_mac_format(mac)

            if mac in seen_in_payload:
                raise ValueError(f"Adresse MAC en double dans la requête: {mac}")
            seen_in_payload.add(mac)

            to_create.append({
                "mac_address": mac,
                "description": entry.get("description"),
            })

        # ---- 2) Vérifier qu'aucune n'est déjà utilisée en base ----
        existing_macs = {
            m.mac_address
            for m in ServiceMacAutorisee.query.filter(
                ServiceMacAutorisee.mac_address.in_([e["mac_address"] for e in to_create])
            ).all()
        }
        if existing_macs:
            raise ValueError(
                f"Adresse(s) MAC déjà autorisée(s) ailleurs: {', '.join(sorted(existing_macs))}"
            )

        # ---- 3) Création atomique : toutes ou rien ----
        created = []
        for e in to_create:
            mac_entry = ServiceMacAutorisee(
                idserv=idserv,
                mac_address=e["mac_address"],
                description=e["description"],
            )
            db.session.add(mac_entry)
            created.append(mac_entry)

        db.session.commit()

        # ✅ AJOUT — Invalider le cache APRÈS un commit réussi
        for m in created:
            _invalidate_mac_cache(m.mac_address)

        return (
            jsonify(
                {
                    "message": f"{len(created)} adresse(s) MAC ajoutée(s) avec succès",
                    "mac_addresses": [m.to_dict() for m in created],
                }
            ),
            201,
        )

    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# =========================================================
# GET — Lister les adresses MAC autorisées d'un service
# =========================================================
@bp.route("/<int:idserv>/mac-addresses", methods=["GET"])
def list_mac_addresses(idserv):
    service = Services.query.get(idserv)
    if not service:
        return jsonify({"error": "Service introuvable"}), 404

    mac_addresses = ServiceMacAutorisee.query.filter_by(idserv=idserv).all()
    return jsonify([m.to_dict() for m in mac_addresses]), 200


# =========================================================
# DELETE — Retirer une adresse MAC autorisée
# =========================================================
@bp.route("/<int:idserv>/mac-addresses/<int:mac_id>", methods=["DELETE"])
def delete_mac_address(idserv, mac_id):
    mac_entry = ServiceMacAutorisee.query.filter_by(id=mac_id, idserv=idserv).first()
    if not mac_entry:
        return jsonify({"error": "Adresse MAC introuvable pour ce service"}), 404

    # ✅ AJOUT — Garder la MAC en mémoire : l'objet devient détaché après delete
    mac_to_invalidate = mac_entry.mac_address

    try:
        db.session.delete(mac_entry)
        db.session.commit()

        # ✅ AJOUT — Invalider le cache pour que le poste réponde 403 immédiatement
        _invalidate_mac_cache(mac_to_invalidate)

        return jsonify({"message": "Adresse MAC supprimée avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# -----------------------------
# PUT update horaires d'un service
# -----------------------------
HORAIRE_FIELDS = [
    "entree_matin_debut", "entree_matin_fin",
    "sortie_matin_debut", "sortie_matin_fin",
    "entree_soir_debut", "entree_soir_fin",
    "sortie_soir_debut", "sortie_soir_fin",
]


@bp.route("/<int:idserv>", methods=["PUT"])
def update_horaires_service(idserv):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Corps JSON manquant"}), 400

    try:
        service = Services.query.get(idserv)
        if not service:
            return jsonify({"error": "Service introuvable"}), 404

        missing = [f for f in HORAIRE_FIELDS if not data.get(f)]
        if missing:
            return jsonify({"error": f"Champ manquant: {', '.join(missing)}"}), 400

        h = {field: parse_hhmm(data[field]) for field in HORAIRE_FIELDS}
        validate_ranges(h)

        horaires = HorairesService.query.filter_by(idserv=idserv).first()

        if horaires:
            for field, value in h.items():
                setattr(horaires, field, value)
            action = "mis à jour"
        else:
            horaires = HorairesService(idserv=idserv, **h)
            db.session.add(horaires)
            action = "créés"

        # L'invalidation du contexte de pointage (ctx cache) est déjà gérée
        # par les events SQLAlchemy de utils/pointage_context.py.
        db.session.commit()

        return (
            jsonify(
                {
                    "message": f"Horaires {action} avec succès",
                    "id": horaires.id,
                    "idserv": idserv,
                    "horaires": {
                        f: h[f].strftime("%H:%M") for f in HORAIRE_FIELDS
                    },
                }
            ),
            200,
        )

    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route('/', methods=['POST'])
def create_service_with_horaires():
    # ... (corps inchangé — pas de MAC manipulée ici)
    nom = request.form.get('nom')
    addresse = request.form.get('addresse')
    sigle = request.form.get('sigle')
    logo_file = request.files.get('logo')
    code_service = request.form.get("code_service")

    if not nom:
        return jsonify({'error': 'Le nom du service est requis'}), 400
    if not addresse:
        return jsonify({'error': 'L\'adresse du service est requise'}), 400
    if not code_service:
        return jsonify({"error": "Le code du service est requis"}), 400

    if Services.query.filter_by(addresse=addresse, nom=nom).first():
        return jsonify({'error': 'Un service avec cette adresse existe déjà'}), 409
    if Services.query.filter_by(code_service=code_service).first():
        return jsonify({'error': 'Un service avec ce code existe déjà'}), 409

    try:
        missing = [f for f in HORAIRE_FIELDS if not request.form.get(f)]
        if missing:
            return jsonify({"error": f"Champ manquant: {', '.join(missing)}"}), 400

        h = {field: parse_hhmm(request.form.get(field)) for field in HORAIRE_FIELDS}
        validate_ranges(h)

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    logo_bytes = logo_file.read() if logo_file else None

    try:
        service = Services(
            nom=nom,
            addresse=addresse,
            sigle=sigle,
            logo=logo_bytes,
            code_service=code_service,
        )
        db.session.add(service)
        db.session.flush()

        horaires = HorairesService(idserv=service.idserv, **h)
        db.session.add(horaires)
        db.session.commit()

        return jsonify({
            'message': 'Le service et ses horaires ont été créés avec succès.',
            'service': {
                'idserv': service.idserv,
                'nom': service.nom,
                'addresse': service.addresse,
                'sigle': service.sigle,
                'logo': bool(service.logo),
                'code_service': service.code_service,
            },
            'horaires': {
                'id': horaires.id,
                **{f: h[f].strftime("%H:%M") for f in HORAIRE_FIELDS},
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': f'Une erreur est survenue lors de la création du service : {str(e)}'
        }), 500