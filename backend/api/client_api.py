from flask import Blueprint, request, jsonify ,session
from models.client import Client
from models.admin import Admin
from models.personnels import Personnels
from models.journalPointage import StatutPointage ,EtapePointage
from models import db ,JournalTentativePointage
from werkzeug.security import check_password_hash
from flask_cors import cross_origin
import json
import hashlib
from flask import current_app
import logging

logger = logging.getLogger(__name__)
 
 
bp = Blueprint('clients_api', __name__)


@bp.route("/history", methods=["GET"])
def facial_client_history():

    mac_address = request.args.get("mac_address")

    if not mac_address:
        return jsonify({
            "error": "mac_address manquant"
        }), 400

    redis = current_app.extensions["redis"]

    # ==========================================
    # GENERATION HISTORY
    # ==========================================

    history_gen = redis.get(
        "assiduite:v1:gen:history"
    )

    history_gen = int(
        history_gen or 0
    )

    # ==========================================
    # HASH MAC
    # ==========================================

    mac_hash = hashlib.sha1(
        mac_address.encode("utf-8")
    ).hexdigest()[:16]

    cache_key = (
        f"assiduite:v1:"
        f"history:"
        f"{history_gen}:"
        f"{mac_hash}"
    )

    # ==========================================
    # CACHE HIT
    # ==========================================

    cached = redis.get(cache_key)

    if cached is not None:

        logger.info(
            "[Redis Cache] HIT %s",
            cache_key
        )

        response = current_app.response_class(
            cached,
            mimetype="application/json"
        )

        response.headers["X-Cache"] = "HIT"

        return response

    # ==========================================
    # CACHE MISS
    # ==========================================

    logger.info(
        "[Redis Cache] MISS %s",
        cache_key
    )

    # ==========================================
    # REQUETE DB
    # ==========================================

    entries = (
        JournalTentativePointage.query
        .filter_by(
            mac_address=mac_address
        )
        .order_by(
            JournalTentativePointage.created_at.desc()
        )
        .limit(15)
        .all()
    )

    def build_status(entry):

        if (
            entry.statut == StatutPointage.SUCCES
            and entry.etape == EtapePointage.ENREGISTREMENT
        ):
            return "Validé"

        return "Erreur"

    def build_photo_url(entry):

        if not entry.photo:
            return None

        return (
            f"/api/clients/history/"
            f"{entry.id}/photo"
        )

    history = []

    for entry in entries:

        personnel = (
            Personnels.query.get(entry.idpers)
            if entry.idpers
            else None
        )

        history.append({
            "id": entry.id,

            "matricule": (
                personnel.matricule
                if personnel
                else None
            ),

            "role": (
                personnel.role
                if personnel
                else entry.role
            ),

            "status": build_status(entry),

            "type_pointage": (
                entry.type_pointage.value
                if entry.type_pointage
                else None
            ),

            "name": (
                f"{personnel.nom} {personnel.prenom}"
                if personnel
                else None
            ),

            "photo": build_photo_url(entry),

            "date": entry.created_at.strftime(
                "%d/%m/%Y"
            ),

            "time": entry.created_at.strftime(
                "%H:%M"
            ),

            "message": entry.message,
        })

    # ==========================================
    # REDIS SET
    # ==========================================

    payload = json.dumps(
        history,
        ensure_ascii=False
    )

    redis.set(
        cache_key,
        payload
    )

    logger.info(
        "[Redis Cache] SET %s",
        cache_key
    )

    # ==========================================
    # RESPONSE
    # ==========================================

    response = current_app.response_class(
        payload,
        mimetype="application/json"
    )

    response.headers["X-Cache"] = "MISS"

    return response

@bp.route("/history/<int:entry_id>/photo", methods=["GET"])
def facial_client_history_photo(entry_id):
    entry = JournalTentativePointage.query.get(entry_id)

    if not entry or not entry.photo:
        return jsonify({"error": "Photo introuvable"}), 404

    from flask import Response
    return Response(entry.photo, mimetype="image/jpeg")


@bp.route('/connexion', methods=['POST'])
def connexion():
    try:
        data = request.get_json()
        matricule = data.get('matricule')
        mdp = data.get('mdp')
 
        if not matricule or not mdp:
            return jsonify({'message': 'Matricule et mot de passe requis'}), 400
        print(mdp)
        print(matricule)
        # Chercher le personnel correspondant au matricule
        personnel = Personnels.query.filter_by(matricule=matricule).first()
        if not personnel:
            return jsonify({'message': 'Matricule invalide'}), 404

        # Vérifier s'il existe un compte client lié à ce personnel
        client = Client.query.filter_by(idpers=personnel.idpers).first()
        if not client:
            return jsonify({'message': 'Aucun compte client lié à ce matricule'}), 404

        # Vérifier le mot de passe (hash comparé)
        if not check_password_hash(client.mdp_hash, mdp):
            return jsonify({'message': 'Mot de passe incorrect'}), 401

        session['admin_id'] = client.idcli
        
        # Connexion réussie
        return jsonify({
            'message': 'Connexion réussie',
            'client': client.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Erreur lors de la connexion',
            'error': str(e)
        }), 500

@bp.route('/', methods=['POST'])
def create_client():
    try:
        data = request.get_json()

        idpers = data.get('idpers')
        mdp = data.get('mdp')

        if not idpers or not mdp:
            return jsonify({'message': 'Champs idpers et mdp requis'}), 400

        personnel = Personnels.query.get(idpers)
        if not personnel:
            return jsonify({'message': f'Aucun personnel avec l\'id {idpers}'}), 404

        # ✅ Vérifie si ce personnel a déjà un compte client
        client_existant = Client.query.filter_by(idpers=idpers).first()
        if client_existant:
            return jsonify({'error': 'Ce personnel a déjà un compte client'}), 409

        # ✅ Création du nouveau client
        nouveau_client = Client(idpers=idpers)
        nouveau_client.mdp = mdp  # mot de passe haché automatiquement
        
        db.session.add(nouveau_client)
        db.session.commit()

        return jsonify({
            'message': 'Client créé avec succès',
            'client': nouveau_client.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erreur lors de la création du client', 'error': str(e)}), 500


# ✅ GET - Tous les congés
@bp.route('/', methods=['GET'])
def get_cls():
    clients = Client.query.all()
    return jsonify([c.to_dict() for c in clients]), 200


@bp.route('/<int:idcli>', methods=['DELETE'])
def deleteCLient(idcli):
    client = Client.query.get_or_404(idcli)
    try:
        db.session.delete(client)
        db.session.commit()
        return jsonify({"message": "Client supprimée"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
