from flask import Blueprint, request, jsonify, current_app
from models.personnels import Personnels
from models import Divisions, Responsables, db, Services
import uuid
import base64
import os
from sqlalchemy import cast, Integer
import shutil
from utils.face_utils import (
    get_embeddings,
    PERSONNELS_EMB,
    emb_lock,
    load_embeddings,
    preload_embeddings_threadsafe,
    combined_score,
    _normalize_embedding,
)
from utils import face_utils
from __init__ import socketio
import numpy as np
import json

bp = Blueprint('personnels_api', __name__)


def save_base64_image(base64_str, filename):
    # Si la chaîne contient un préfixe data:image/png;base64,... on le retire
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]

    # Nettoyage : retirer espaces, retours à la ligne
    base64_str = base64_str.strip().replace('\n', '').replace('\r', '').replace(' ', '')

    # Compléter le padding si nécessaire (base64 doit être multiple de 4)
    missing_padding = len(base64_str) % 4
    if missing_padding:
        base64_str += '=' * (4 - missing_padding)

    # Décoder la chaîne base64 en bytes
    img_data = base64.b64decode(base64_str)

    # Préparer dossier uploads (dans app/uploads)
    uploads_dir = os.path.join(current_app.root_path, 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)

    filepath = os.path.join(uploads_dir, filename)
    with open(filepath, 'wb') as f:
        f.write(img_data)

    return filename


def embedding_to_list(emb):
    """Convertit un embedding en liste pour JSON."""
    if emb is None:
        return None
    if isinstance(emb, bytes):
        emb = np.frombuffer(emb, dtype=np.float32)
    return emb.tolist()


def parse_faceapi_descriptor(raw):
    """Parse le descripteur envoyé par le front.

    Le champ est OPTIONNEL : absent, vide ou malformé, on retourne None
    sans faire échouer la requête. Il n'intervient dans aucune décision
    d'identification — celle-ci repose sur `embedding`, calculé serveur.
    """
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
        if not isinstance(parsed, (list, tuple)) or len(parsed) == 0:
            current_app.logger.warning("faceapi_descriptor ignoré : format inattendu")
            return None
        return np.array(parsed, dtype=np.float32)
    except (ValueError, TypeError) as e:
        current_app.logger.warning(f"faceapi_descriptor ignoré (invalide) : {e}")
        return None


@bp.route("/faceapi-descriptors", methods=["GET"])
def get_faceapi_descriptors():
    """⚠️ Route héritée : plus aucun client ne la consomme depuis le retrait
    du FaceMatcher côté front. Supprimable après vérification."""
    try:
        personnels = Personnels.query.all()

        data = []

        for p in personnels:
            desc = p.get_faceapi_descriptor()
            desc_list = desc.tolist() if desc is not None else None

            data.append(
                {
                    "idpers": p.idpers,
                    "nom": p.nom,
                    "prenom": p.prenom,
                    "descriptor": desc_list,
                }
            )

        return jsonify({"success": True, "personnels": data})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/', methods=['POST'])
def create_personnels():
    matricule = request.form.get('matricule')
    nom = request.form.get('nom')
    prenom = request.form.get('prenom')
    email = request.form.get('email')
    numtel = request.form.get('numtel')
    iddiv = request.form.get('iddiv')
    idrh = request.form.get('idrh')
    role = request.form.get("role")
    image_file = request.files.get('image')
    # OPTIONNEL — peut être absent, le front migré ne l'envoie plus
    faceapi_descriptor = request.form.get("faceapi_descriptor")
    password = request.form.get('mot_de_passe')

    # -------------------------------
    # 1) VALIDATION
    # -------------------------------
    if not password:
        return jsonify({'error': 'Mot de passe requis.'}), 400
    if not matricule or not nom or not prenom or not iddiv or not idrh or not role:
        return jsonify({'error': 'Champs obligatoires.'}), 400

    if Personnels.query.filter_by(matricule=matricule).first():
        return jsonify({'error': 'Matricule déjà utilisé.'}), 400
    if email and Personnels.query.filter_by(email=email).first():
        return jsonify({'error': 'Email déjà utilisé.'}), 400

    image_filename = None
    image_path = None

    try:
        emb = None

        # -------------------------------
        # 2) Sauvegarde de l'image uploadée (si fournie)
        # -------------------------------
        if image_file:
            image_filename = f"{uuid.uuid4()}.jpg"
            uploads_dir = os.path.join(current_app.root_path, "uploads")
            os.makedirs(uploads_dir, exist_ok=True)

            image_path = os.path.join(uploads_dir, image_filename)
            image_file.save(image_path)

            # -------------------------------
            # 3) Extraction des embeddings
            # -------------------------------
            embeddings = get_embeddings(image_path)
            if not embeddings:
                os.remove(image_path)
                return jsonify({'error': 'Aucun visage détecté sur l’image'}), 400

            if len(embeddings) > 1:
                os.remove(image_path)
                return jsonify({'error': 'Plusieurs visages détectés, une seule personne attendue.'}), 400

            emb = embeddings[0]

            # -------------------------------
            # 3b) Vérifier si ce visage existe déjà
            # -------------------------------
            face_utils.load_embeddings()

            existing_personnels = Personnels.query.filter(Personnels.embedding != None).all()

            for p in existing_personnels:
                p_emb = p.get_embedding()
                if p_emb is not None:
                    # Score combiné (cos + euclidien) pour la précision
                    score = combined_score(emb, _normalize_embedding(p_emb))
                    if score > 0.48:  # seuil à ajuster selon précision du modèle
                        os.remove(image_path)
                        return jsonify({
                            'error': "Ce visage existe déjà pour le personnel"
                        }), 400

        # -------------------------------
        # 4) Enregistrement en base
        # -------------------------------
        new_pers = Personnels(
            matricule=matricule,
            nom=nom,
            prenom=prenom,
            email=email,
            numtel=numtel,
            iddiv=iddiv,
            idrh=idrh,
            role=role,
            image=image_filename,
            can_change_password=True,
        )
        new_pers.set_password(password)

        # Descripteur optionnel : ignoré s'il est absent ou invalide
        desc_array = parse_faceapi_descriptor(faceapi_descriptor)
        if desc_array is not None:
            new_pers.set_faceapi_descriptor(desc_array)

        if emb is not None:
            new_pers.set_embedding(emb)

        db.session.add(new_pers)
        db.session.commit()

        # -------------------------------
        # 5) Ajouter dans le cache en RAM
        # -------------------------------
        if emb is not None:
            with emb_lock:
                PERSONNELS_EMB[new_pers.idpers] = emb

        # -------------------------------
        # 6) Copier dans face_db1 si image fournie
        # -------------------------------
        if image_filename:
            load_embeddings()
            preload_embeddings_threadsafe()
            root_project = os.path.abspath(os.path.join(current_app.root_path, '..'))
            face_db_dir = os.path.join(root_project, 'face_db1')
            os.makedirs(face_db_dir, exist_ok=True)

            dst_temp = os.path.join(face_db_dir, image_filename)
            shutil.copyfile(image_path, dst_temp)
            final_path = os.path.join(face_db_dir, f"{new_pers.idpers}.jpg")
            os.rename(dst_temp, final_path)

        socketio.emit("personnel_update")

        return jsonify({
            'message': 'Personnel créé avec succès',
            'personnel': new_pers.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        if image_filename:
            p = os.path.join(current_app.root_path, 'uploads', image_filename)
            if os.path.exists(p):
                os.remove(p)
        return jsonify({'error': str(e)}), 400


@bp.route('/<int:idrh>', methods=['GET'])
def get_personnels_by_responsable(idrh):
    resp = Responsables.query.get(idrh)
    if not resp:
        return jsonify({'error': 'Responsable non trouvé'}), 404

    matricules_param = request.args.get('matricules')  # "123,124,125"
    matricules_list = []
    if matricules_param:
        matricules_list = [m.strip() for m in matricules_param.split(",") if m.strip()]

    query = db.session.query(
        Personnels,
        Divisions.nom.label('nomdivision')
    ).join(
        Divisions, Personnels.iddiv == Divisions.iddiv
    ).filter(
        Personnels.idrh == idrh
    )

    if matricules_list:
        query = query.filter(Personnels.matricule.in_(matricules_list))

    query = query.order_by(cast(Personnels.matricule, Integer))

    results = query.all()

    personnels_list = []
    for pers, nomdiv in results:
        pers_dict = pers.to_dict()
        pers_dict['nomdivision'] = nomdiv
        personnels_list.append(pers_dict)

    return jsonify(personnels_list), 200


@bp.route("/service/<int:idserv>", methods=["GET"])
def get_personnels_by_service(idserv):
    from models import Personnels, Divisions, Services

    service = Services.query.get(idserv)
    if not service:
        return jsonify({"error": "Service non trouvé"}), 404

    matricules_param = request.args.get("matricules")
    matricules_list = []

    if matricules_param:
        matricules_list = [m.strip() for m in matricules_param.split(",") if m.strip()]

    divisions_ids = [d.iddiv for d in service.divisions]

    query = (
        db.session.query(Personnels, Divisions.nom.label("nomdivision"))
        .join(Divisions, Personnels.iddiv == Divisions.iddiv)
        .filter(Personnels.iddiv.in_(divisions_ids))
    )

    if matricules_list:
        query = query.filter(Personnels.matricule.in_(matricules_list))

    query = query.order_by(cast(Personnels.matricule, Integer))

    results = query.all()

    personnels_list = []
    for pers, nomdiv in results:
        pers_dict = pers.to_dict()
        pers_dict["nomdivision"] = nomdiv
        personnels_list.append(pers_dict)

    return jsonify(personnels_list), 200


@bp.route('/<int:idpers>', methods=['GET'])
def get_personnel(idpers):
    pers = Personnels.query.get_or_404(idpers)
    return jsonify(pers.to_dict())


@bp.route("/by_personnel/<int:idpers>", methods=["GET"])
def get_personnels_by_personnel(idpers):
    pers_ref = Personnels.query.get(idpers)
    if not pers_ref:
        return jsonify({"error": "Personnel non trouvé"}), 404

    division = pers_ref.division
    if not division:
        return jsonify({"error": "Division du personnel non trouvée"}), 404

    matricules_param = request.args.get("matricules")  # "123,124,125"
    matricules_list = []
    if matricules_param:
        matricules_list = [m.strip() for m in matricules_param.split(",") if m.strip()]

    query = (
        db.session.query(Personnels, Divisions.nom.label("nomdivision"))
        .join(Divisions, Personnels.iddiv == Divisions.iddiv)
        .filter(Personnels.idpers == idpers)
    )

    if matricules_list:
        query = query.filter(Personnels.matricule.in_(matricules_list))

    query = query.order_by(cast(Personnels.matricule, Integer))

    results = query.all()

    personnels_list = []
    for pers, nomdiv in results:
        pers_dict = pers.to_dict()
        pers_dict["nomdivision"] = nomdiv
        personnels_list.append(pers_dict)

    return jsonify(personnels_list), 200


@bp.route('/matricule/<string:matricule>', methods=['GET'])
def get_personnel_matricule(matricule):
    pers = Personnels.query.filter_by(matricule=matricule).first()
    if pers:
        return jsonify([pers.to_dict()])
    else:
        return jsonify({"error": "Matricule invalide"}), 400


@bp.route("/<int:idpers>", methods=["PUT"])
def update_personnel(idpers):
    pers = Personnels.query.get(idpers)
    if not pers:
        return jsonify({"error": "Personnel non trouvé"}), 404

    matricule = request.form.get("matricule")
    nom = request.form.get("nom")
    prenom = request.form.get("prenom")
    email = request.form.get("email")
    numtel = request.form.get("numtel")
    iddiv = request.form.get("iddiv")
    idrh = request.form.get("idrh")
    image_file = request.files.get("image")  # optionnelle
    role = request.form.get("role")
    # OPTIONNEL — peut être absent, le front migré ne l'envoie plus
    faceapi_descriptor_json = request.form.get("faceapi_descriptor")

    if not matricule or not nom or not prenom or not iddiv or not idrh:
        return jsonify({"error": "Champs obligatoires manquants."}), 400

    existing = Personnels.query.filter_by(matricule=matricule).first()
    if existing and existing.idpers != idpers:
        return jsonify({"error": "Matricule déjà utilisé."}), 400
    existing_email = Personnels.query.filter_by(email=email).first()
    if email and existing_email and existing_email.idpers != idpers:
        return jsonify({"error": "Email déjà utilisé."}), 400

    try:
        # Mise à jour des champs texte
        pers.matricule = matricule
        pers.nom = nom
        pers.prenom = prenom
        pers.email = email
        pers.numtel = numtel
        pers.iddiv = iddiv
        pers.idrh = idrh
        pers.role = role

        # -------------------------------
        # Si nouvelle image fournie
        # -------------------------------
        if image_file:
            # 🐛 Corrigé : l'ancienne image n'était jamais supprimée,
            # chaque modification laissait un orphelin dans uploads/.
            ancienne_image = pers.image

            image_filename = f"{uuid.uuid4()}.jpg"
            uploads_dir = os.path.join(current_app.root_path, "uploads")
            os.makedirs(uploads_dir, exist_ok=True)
            image_path = os.path.join(uploads_dir, image_filename)
            image_file.save(image_path)

            # Extraction embeddings
            embeddings = get_embeddings(image_path)
            if not embeddings:
                os.remove(image_path)
                return jsonify({'error': 'Aucun visage détecté sur l’image'}), 400

            if len(embeddings) > 1:
                os.remove(image_path)
                return jsonify({"error": "Plusieurs visages détectés."}), 400

            emb = embeddings[0]

            # Parcours des embeddings existants
            face_utils.load_embeddings()

            with emb_lock:
                for id_existing, db_emb in face_utils.PERSONNELS_EMB.items():
                    if id_existing == pers.idpers:
                        continue  # ignorer le personnel actuel
                    score = combined_score(emb, db_emb)

                    if score > 0.48:  # seuil identique à verifier_face
                        os.remove(image_path)
                        return jsonify({
                            "error": "Ce visage existe déjà pour un autre personnel",
                            "score": float(score)
                        }), 400

            pers.image = image_filename
            pers.set_embedding(emb)

            # Copier dans face_db1
            root_project = os.path.abspath(os.path.join(current_app.root_path, ".."))
            face_db_dir = os.path.join(root_project, "face_db1")
            os.makedirs(face_db_dir, exist_ok=True)

            dst_temp = os.path.join(face_db_dir, image_filename)
            shutil.copyfile(image_path, dst_temp)
            final_path = os.path.join(face_db_dir, f"{pers.idpers}.jpg")
            if os.path.exists(final_path):
                os.remove(final_path)
            os.rename(dst_temp, final_path)

            # Nettoyage de l'ancienne image
            if ancienne_image and ancienne_image != image_filename:
                ancien_path = os.path.join(uploads_dir, ancienne_image)
                if os.path.exists(ancien_path):
                    os.remove(ancien_path)

            # Mettre à jour le cache en RAM
            with emb_lock:
                PERSONNELS_EMB[pers.idpers] = emb

        # Descripteur optionnel : ignoré s'il est absent ou invalide.
        # Un descripteur existant n'est jamais écrasé par une valeur vide.
        descriptor_array = parse_faceapi_descriptor(faceapi_descriptor_json)
        if descriptor_array is not None:
            pers.set_faceapi_descriptor(descriptor_array)

        db.session.commit()
        load_embeddings()
        preload_embeddings_threadsafe()
        socketio.emit("personnel_update", pers.to_dict())

        return (
            jsonify(
                {
                    "message": "Personnel mis à jour avec succès",
                    "personnel": pers.to_dict(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        if image_file and pers.image:
            p = os.path.join(current_app.root_path, "uploads", pers.image)
            if os.path.exists(p):
                os.remove(p)
        return jsonify({"error": str(e)}), 400


@bp.route('/<int:idpers>', methods=['DELETE'])
def delete_personnel(idpers):
    pers = Personnels.query.get_or_404(idpers)

    try:
        root_project = os.path.abspath(os.path.join(current_app.root_path, '..'))

        # 🐛 Corrigé : POST et PUT écrivent dans face_db1, la suppression
        # ciblait face_db — les images n'étaient jamais nettoyées.
        face_db_dir = os.path.join(root_project, 'face_db1')
        image_path = os.path.join(face_db_dir, f"{pers.idpers}.jpg")
        if os.path.exists(image_path):
            os.remove(image_path)

        # Image dans uploads/
        if pers.image:
            upload_path = os.path.join(current_app.root_path, 'uploads', pers.image)
            if os.path.exists(upload_path):
                os.remove(upload_path)

        # Suppression du personnel (Oracle supprimera les pointages automatiquement)
        db.session.delete(pers)
        db.session.commit()

        # Recharger les embeddings mémoire
        load_embeddings()
        preload_embeddings_threadsafe()

        with emb_lock:
            PERSONNELS_EMB.pop(idpers, None)

        socketio.emit("personnel_update")

        return jsonify({"message": "Supprimé avec succès"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400