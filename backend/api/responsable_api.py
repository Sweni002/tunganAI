from flask import Blueprint, request, jsonify, current_app 
from models import Personnels ,db

from models import Divisions ,Responsables
import uuid
import base64
import os
import shutil
from utils.face_utils import get_embeddings  ,emb_lock,combined_score,_normalize_embedding,load_embeddings,preload_embeddings_threadsafe
from utils import face_utils 
from __init__ import socketio
import numpy as np
import json


bp = Blueprint('responsabless_api', __name__)

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


@bp.route("/", methods=["POST"])
def create_responsables():
    matricule = request.form.get("matricule")
    nom = request.form.get("nom")
    prenom = request.form.get("prenom")
    email = request.form.get("email")
    idserv = request.form.get("idserv")
    iddiv = request.form.get("iddiv")
    mot_de_passe = request.form.get("mot_de_passe")
    image_file = request.files.get("image")
    faceapi_descriptor = request.form.get("faceapi_descriptor")  # array JSON string
    # -------------------------------
    # 1) VALIDATION
    # -------------------------------
    if not mot_de_passe:
        return jsonify({'error': 'Mot de passe requis.'}), 400

    # -------------------------------
    # 1) VALIDATION
    # -------------------------------
    if not matricule or not nom or not prenom or not email or not idserv or not iddiv:
        return jsonify({"error": "Tous les champs sont requis"}), 400

    if Responsables.query.filter_by(matricule=matricule).first():
        return jsonify({"error": "Matricule déjà utilisé"}), 400

    if Responsables.query.filter_by(email=email).first():
        return jsonify({"error": "Email déjà utilisé"}), 400

    count = Responsables.query.filter_by(idserv=idserv).count()
    if count >= 2:
        return jsonify({"error": "Ce service a déjà 2 responsables"}), 400

    if not image_file:
        return jsonify({"error": "Une image est obligatoire"}), 400

    try:
        # -------------------------------
        # 2) Sauvegarde image temporaire
        # -------------------------------
        image_filename = f"{uuid.uuid4()}.jpg"
        uploads_dir = os.path.join(current_app.root_path, "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        image_path = os.path.join(uploads_dir, image_filename)
        image_file.save(image_path)

        # -------------------------------
        # 3) Extraction embeddings
        # -------------------------------
        embeddings = get_embeddings(image_path)

        if not embeddings:
            os.remove(image_path)
            return jsonify({"error": "Aucun visage détecté"}), 400
        if len(embeddings) > 1:
            os.remove(image_path)
            return jsonify({"error": "Plusieurs visages détectés"}), 400

        emb = embeddings[0]

        # -------------------------------
        # 4) Vérifier si visage existe déjà (personnel)
        # -------------------------------
        face_utils.load_embeddings()
        existing_personnels = Personnels.query.filter(
            Personnels.embedding != None
        ).all()

        visage_existe = False
        for p in existing_personnels:
            p_emb = p.get_embedding()
            if p_emb is not None:
                score = combined_score(emb, _normalize_embedding(p_emb))
                if score > 0.48:  # seuil ajustable
                    visage_existe = True
                    break  # on sait déjà qu'un visage existe

        # -------------------------------
        # 5) Création du Responsable (toujours)
        # -------------------------------
        responsable = Responsables(
            matricule=matricule,
            nom=nom,
            prenom=prenom,
            email=email,
            idserv=idserv,
            image=image_filename,
               can_change_password=True  # 🔥 important

        )
        if mot_de_passe:
            responsable.set_password(mot_de_passe)

        db.session.add(responsable)
        db.session.commit()  # commit pour récupérer idrh

        # -------------------------------
        # 6) Création du Personnel lié seulement si visage NON reconnu
        # -------------------------------
        personnel = None
        if not visage_existe:
            personnel = Personnels(
                matricule=matricule,
                nom=nom,
                prenom=prenom,
                email=email,
                iddiv=iddiv,
                idrh=responsable.idrh,
                image=image_filename,
                can_change_password=True,  # 🔥 important
            )

            personnel.set_embedding(emb)
            personnel.set_password(mot_de_passe)
            personnel.can_change_password=True
            if faceapi_descriptor:
                desc_array = np.array(json.loads(faceapi_descriptor), dtype=np.float32)
                personnel.set_faceapi_descriptor(desc_array)

            db.session.add(personnel)
            db.session.commit()

            # Copier image dans face_db1
            root_project = os.path.abspath(os.path.join(current_app.root_path, ".."))
            face_db_dir = os.path.join(root_project, "face_db1")
            os.makedirs(face_db_dir, exist_ok=True)
            final_path = os.path.join(face_db_dir, f"{personnel.idpers}.jpg")
            shutil.copyfile(image_path, final_path)

        # -------------------------------
        # 7) Retour
        # -------------------------------
        msg = "Responsable créé avec succès"
        if personnel:
            msg += " et Personnel créé"

        return (
            jsonify(
                {
                    "message": msg,
                    "responsable": responsable.to_dict(),
                    "personnel": personnel.to_dict() if personnel else None,
                    "avertissement": (
                        "Le visage correspond déjà à un personnel existant"
                        if visage_existe
                        else None
                    ),
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        if "image_path" in locals() and os.path.exists(image_path):
            os.remove(image_path)
        return jsonify({"error": str(e)}), 400


@bp.route('/<int:idrh>', methods=['PUT'])
def update_responsable(idrh):
    try:
        responsable = Responsables.query.get(idrh)
        if not responsable:
            return jsonify({'error': 'Responsable introuvable'}), 404

        matricule = request.form.get('matricule')
        nom = request.form.get('nom')
        prenom = request.form.get('prenom')
        email = request.form.get('email')
        idserv = request.form.get('idserv')
        mot_de_passe = request.form.get('mot_de_passe')
        new_image_file = request.files.get('image')  # optionnelle
        faceapi_descriptor = request.form.get("faceapi_descriptor")  # array JSON string

        if not idserv:
          return jsonify({'error': 'Service requis'}), 400
        
        if not idrh:
          return jsonify({'error': 'Service requis'}), 400

        idserv = int(idserv)  # ✅ IMPORTANT
        # Validation des champs obligatoires
        if not matricule or not nom or not prenom or not email or not idserv:
            return jsonify({'error': 'Tous les champs obligatoires doivent être fournis'}), 400

        # Vérifier unicité (sauf pour lui-même)
        if Responsables.query.filter(Responsables.matricule == matricule, Responsables.idrh != idrh).first():
            return jsonify({'error': 'Matricule déjà utilisé'}), 400

        if Responsables.query.filter(Responsables.email == email, Responsables.idrh != idrh).first():
            return jsonify({'error': 'Email déjà utilisé'}), 400

        if idserv != responsable.idserv:
          if Responsables.query.filter(
        Responsables.idserv == idserv,
        Responsables.idrh != idrh
    ).first():
              return jsonify({'error': 'Ce service a déjà un responsable'}), 400
        # --- Traitement image (optionnel) ---
        image_filename = responsable.image  # garder l’ancienne par défaut

        if new_image_file:
            # Générer nom
            image_filename = f"{uuid.uuid4()}.jpg"
            uploads_dir = os.path.join(current_app.root_path, "uploads")
            os.makedirs(uploads_dir, exist_ok=True)
            image_path = os.path.join(uploads_dir, image_filename)
            new_image_file.save(image_path)
            print("Nouvelle image uploadée ===", image_filename)

            # Vérif visage
            embeddings = get_embeddings(image_path)
            if not embeddings:
                os.remove(image_path)
                return jsonify({'error': 'Aucun visage détecté dans la nouvelle image.'}), 400
            elif len(embeddings) > 1:
                os.remove(image_path)
                return jsonify({'error': 'Plusieurs visages détectés.'}), 400

            # Supprimer ancienne image si elle existe
            old_path = os.path.join(uploads_dir, responsable.image)
            if os.path.exists(old_path):
                os.remove(old_path)

            # Copier dans face_db1
            root_project = os.path.abspath(os.path.join(current_app.root_path, '..'))
            face_db_dir = os.path.join(root_project, 'face_db1')
            os.makedirs(face_db_dir, exist_ok=True)
            dst = os.path.join(face_db_dir, f"{responsable.idrh}.jpg")
            shutil.copyfile(image_path, dst)

        # --- Mise à jour DB ---
        responsable.matricule = matricule
        responsable.nom = nom
        responsable.prenom = prenom
        responsable.email = email
        responsable.idserv = idserv
        responsable.image = image_filename

        if mot_de_passe:
            responsable.set_password(mot_de_passe)

        db.session.commit()

        return jsonify({
            'message': 'Responsable mis à jour avec succès',
            'responsable': responsable.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@bp.route("/<int:idrh>", methods=["DELETE"])
def delete_responsables(idrh):
    responsables = Responsables.query.get_or_404(idrh)

    try:
        root_project = os.path.abspath(os.path.join(current_app.root_path, ".."))
        face_db_dir_personnel = os.path.join(root_project, "face_db1")

        # 🔍 Vérifier s'il reste d'autres responsables dans ce service
        autres_rh = Responsables.query.filter(
            Responsables.idserv == responsables.idserv, Responsables.idrh != idrh
        ).count()

        # 🔥 Supprimer tous les personnels du service seulement s'il n'y a plus de RH
        if autres_rh == 0:
            # Tous les personnels liés au service via leur division
            personnels = (
                Personnels.query.join(Divisions)
                .filter(Divisions.idserv == responsables.idserv)
                .all()
            )

            for pers in personnels:
                # Supprimer image de reconnaissance faciale
                pers_image_path = os.path.join(
                    face_db_dir_personnel, f"{pers.idpers}.jpg"
                )
                if os.path.exists(pers_image_path):
                    os.remove(pers_image_path)

                db.session.delete(pers)

        # 🔥 Supprimer l'image du responsable
        if responsables.image:
            uploads_dir = os.path.join(current_app.root_path, "uploads")
            img_path = os.path.join(uploads_dir, responsables.image)
            if os.path.exists(img_path):
                os.remove(img_path)

        # Supprimer image faciale du responsable
        face_img_path = os.path.join(face_db_dir_personnel, f"{responsables.idrh}.jpg")
        if os.path.exists(face_img_path):
            os.remove(face_img_path)

        # 🔥 Supprimer le responsable
        db.session.delete(responsables)
        db.session.commit()

        # ⚡ reload embeddings et notifier front
        load_embeddings()
        preload_embeddings_threadsafe()
        socketio.emit("personnel_update")

        return jsonify({"message": "Responsable supprimé avec succès"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@bp.route('/', methods=['GET'])
def get_responsables():
    try:
        responsables = Responsables.query.all()
        # Transformer en dictionnaire
        result = [resp.to_dict() for resp in responsables]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
