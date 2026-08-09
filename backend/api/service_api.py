from flask import Blueprint, request, jsonify ,current_app
from models import db, Services,Personnels,Responsables,Divisions
import base64
import os
from utils.face_utils import (
    get_embeddings,
    emb_lock,
    combined_score,
    _normalize_embedding,
    load_embeddings,
    preload_embeddings_threadsafe,
)
from __init__ import socketio

bp = Blueprint('services', __name__)

# --- imports à ajouter en haut de service_api.py ---
from models.horaire import HorairesService


def fmt(dt):
    """datetime(2000,1,1,7,10) -> '07:10'"""
    return dt.strftime("%H:%M") if dt else None


# -----------------------------
# GET all services (avec horaires matin / soir)
# -----------------------------
@bp.route('/', methods=['GET'])
def get_services():
    try:
        services = Services.query.all()

        # Un seul SELECT pour tous les horaires, indexés par idserv
        horaires_map = {h.idserv: h for h in HorairesService.query.all()}

        services_list = []
        for s in services:
            h = horaires_map.get(s.idserv)

            services_list.append(
                {
                    "idserv": s.idserv,
                    "nom": s.nom,
                    "sigle": s.sigle,
                    "addresse": s.addresse,
                    "logo": (
                        base64.b64encode(s.logo).decode("utf-8") if s.logo else None
                    ),
                    "code_service": s.code_service,
                    # ---- Horaires (None si pas encore définis) ----
                    "horaires": (
                        {
                            "entree_matin": f"{fmt(h.entree_matin_debut)} - {fmt(h.entree_matin_fin)}",
                            "sortie_matin": f"{fmt(h.sortie_matin_debut)} - {fmt(h.sortie_matin_fin)}",
                            "entree_soir": f"{fmt(h.entree_soir_debut)} - {fmt(h.entree_soir_fin)}",
                            "sortie_soir": f"{fmt(h.sortie_soir_debut)} - {fmt(h.sortie_soir_fin)}",
                        }
                        if h
                        else None
                    ),
                }
            )
        return jsonify(services_list), 200
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des services : {str(e)}'}), 500

# -----------------------------
# GET service by ID
# -----------------------------
@bp.route('/<int:idserv>', methods=['GET'])
def get_service(idserv):
    service = Services.query.get(idserv)
    if not service:
        return jsonify({'error': 'Service non trouvé'}), 404
    return (
        jsonify(
            {
                "idserv": service.idserv,
                "nom": service.nom,
                "code_service": service.code_service,
            }
        ),
        200,
    )

# -----------------------------
# POST create service
# -----------------------------
@bp.route('/', methods=['POST'])
def create_service():
    nom = request.form.get('nom')
    addresse = request.form.get('addresse')
    sigle = request.form.get('sigle')  # Nouveau champ
    logo_file = request.files.get('logo')
    code_service=request.form.get("code_service")
    # Validation
    if not nom:
        return jsonify({'error': 'Le nom du service est requis'}), 400
    if not addresse:
        return jsonify({'error': 'L\'adresse du service est requise'}), 400
    if not code_service:
        return jsonify({"error": "Le code du service est requis"}), 400
    # Vérifier doublons
    if Services.query.filter_by(addresse=addresse,nom=nom).first():
        return jsonify({'error': 'Un service avec cette adresse existe déjà'}), 409
    if Services.query.filter_by(code_service=code_service).first():
        return jsonify({'error': 'Un service avec ce code existe déjà'}), 409

    # Lire le logo en bytes
    logo_bytes = logo_file.read() if logo_file else None

    try:
        service = Services(nom=nom, addresse=addresse, sigle=sigle, logo=logo_bytes,code_service=code_service)
        db.session.add(service)
        db.session.commit()
        return jsonify({
            'message': 'Le service a été créé avec succès.',
            'service': {
                'idserv': service.idserv,
                'nom': service.nom,
                'addresse': service.addresse,
                'sigle': service.sigle,
                'logo': bool(service.logo),
                'code_service' :service.code_service
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Une erreur est survenue lors de la création du service : {str(e)}'}), 500

# -----------------------------
# PUT update service
# -----------------------------
@bp.route('/<int:idserv>', methods=['PUT'])
def update_service(idserv):
    service = Services.query.get(idserv)
    if not service:
        return jsonify({'error': 'Service introuvable'}), 404

    nom = request.form.get('nom')
    addresse = request.form.get('addresse')
    sigle = request.form.get('sigle')
    logo_file = request.files.get('logo')
    code_service=request.form.get("code_service")
    # Validation
    if not nom:
        return jsonify({'error': 'Le nom du service est requis'}), 400
    if not addresse:
        return jsonify({'error': 'L\'adresse du service est requise'}), 400
    if not code_service:
        return jsonify({"error": "Le code du service est requis"}), 400

    # Vérifier doublons (sauf pour le service actuel)
    if Services.query.filter(Services.addresse == addresse, Services.nom == nom ,Services.idserv != idserv).first():
        return jsonify({'error': 'Un service avec cette adresse existe déjà'}), 409
    if Services.query.filter(Services.code_service == code_service, Services.idserv != idserv).first():
        return jsonify({'error': 'Un service avec ce code existe déjà'}), 409

    # Mettre à jour les champs
    service.nom = nom
    service.addresse = addresse
    service.sigle = sigle
    service.code_service=code_service
    # Si un nouveau logo est fourni, remplacer l'ancien
    if logo_file:
        service.logo = logo_file.read()

    try:
        db.session.commit()
        return (
            jsonify(
                {
                    "message": "Le service a été mis à jour avec succès.",
                    "service": {
                        "idserv": service.idserv,
                        "nom": service.nom,
                        "addresse": service.addresse,
                        "sigle": service.sigle,
                        "logo": bool(service.logo),
                        "code_service": service.code_service,
                    },
                }
            ),
            200,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la mise à jour : {str(e)}'}), 500


# -----------------------------
# DELETE service
# -----------------------------
@bp.route("/<int:idserv>", methods=["DELETE"])
def delete_service(idserv):
    service = Services.query.get(idserv)
    if not service:
        return jsonify({"error": "Service non trouvé"}), 404

    try:
        # --- 🔹 Supprimer tous les responsables liés au service ---
        responsables = Responsables.query.filter_by(idserv=idserv).all()
        root_project = os.path.abspath(os.path.join(current_app.root_path, ".."))
        face_db_dir = os.path.join(root_project, "face_db1")

        for respo in responsables:
            # Supprimer tous les personnels liés à ce responsable
            personnels = Personnels.query.filter_by(idrh=respo.idrh).all()
            for pers in personnels:
                # Supprimer l'image dans face_db1
                pers_image_path = os.path.join(face_db_dir, f"{pers.idpers}.jpg")
                if os.path.exists(pers_image_path):
                    os.remove(pers_image_path)

                db.session.delete(pers)  # Supprimer le personnel

            # Supprimer l'image du responsable
            if respo.image:
                uploads_dir = os.path.join(current_app.root_path, "uploads")
                respo_img_path = os.path.join(uploads_dir, respo.image)
                if os.path.exists(respo_img_path):
                    os.remove(respo_img_path)

            face_respo_path = os.path.join(face_db_dir, f"{respo.idrh}.jpg")
            if os.path.exists(face_respo_path):
                os.remove(face_respo_path)
            divisions = Divisions.query.filter_by(idserv=idserv).all()
            for div in divisions:
                 db.session.delete(div)   

            db.session.delete(respo)  # Supprimer le responsable

        # --- 🔹 Supprimer le service lui-même ---
        db.session.delete(service)
        db.session.commit()

        # --- 🔹 Recharger embeddings et notifier le front ---
        load_embeddings()
        preload_embeddings_threadsafe()
        socketio.emit("personnel_update")

        return (
            jsonify(
                {
                    "message": "Service, responsables et personnels associés supprimés avec succès"
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
