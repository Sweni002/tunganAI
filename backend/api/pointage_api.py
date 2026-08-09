from flask import Blueprint, request, jsonify
from datetime import datetime, time
from deepface import DeepFace
from app.models import db
from app.models.personnels import Personnels
from app.models.pointages import Pointage
import os

bp = Blueprint('pointage_faciale_api', __name__)
UPLOAD_DIR = 'temp_upload'
FACE_DB_DIR = 'face_db'

@bp.route('/facial', methods=['POST'])
def pointage_facial():
    if 'image' not in request.files:
        return jsonify({"error": "Aucune image envoyée"}), 400

    image_file = request.files['image']
    filename = image_file.filename
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    image_path = os.path.join(UPLOAD_DIR, filename)
    image_file.save(image_path)

    try:
        # Comparaison du visage avec la base de visages (face_db)
        for fichier_ref in os.listdir(FACE_DB_DIR):
            if not fichier_ref.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue

            ref_path = os.path.join(FACE_DB_DIR, fichier_ref)
            result = DeepFace.verify(img1_path=image_path, img2_path=ref_path, enforce_detection=False)

            if result.get("verified"):
                idpers = int(os.path.splitext(fichier_ref)[0])
                now = datetime.now()
                today = now.date()
                heure = now.time()

                pointage = Pointage.query.filter_by(idpers=idpers, date=today).first()
                if not pointage:
                    pointage = Pointage(idpers=idpers, date=today)
                    db.session.add(pointage)

                # Détection du type de pointage : matin ou après-midi
                if time(6, 0) <= heure <= time(11, 0):
                    if not pointage.heure_entree_matin:
                        pointage.heure_entree_matin = now
                        pointage.retard_matin = heure > time(8, 0) and heure <= time(10, 0)
                        pointage.absence_matin = heure > time(10, 0)
                elif time(13, 40) <= heure <= time(17, 0):
                    if not pointage.heure_entree_soir:
                        pointage.heure_entree_soir = now
                        pointage.retard_soir = heure > time(14, 0) and heure <= time(14, 30)
                        pointage.absence_soir = heure > time(14, 30)

                # Calcul global
                pointage.absence = pointage.absence_matin and pointage.absence_soir
                pointage.retard_total_minutes = (
                    (pointage.retard_matin * 1 + pointage.retard_soir * 1) * 30
                )

                db.session.commit()

                os.remove(image_path)
                return jsonify({
                    "message": "Pointage effectué avec succès",
                    "personnel": idpers,
                    "pointage": pointage.to_dict()
                }), 200

        os.remove(image_path)
        return jsonify({"error": "Visage non reconnu"}), 401

    except Exception as e:
        if os.path.exists(image_path):
            os.remove(image_path)
        return jsonify({"error": str(e)}), 500
