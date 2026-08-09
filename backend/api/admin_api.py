from flask import Blueprint, request, jsonify
from models import db
from models.admin import Admin  # adapte selon ton architecture

bp = Blueprint('admin_bp', __name__)

@bp.route('/', methods=['POST'])
def create_admin():
    data = request.get_json()
    
    matricule = data.get('matricule')
    nom = data.get('nom')
    email = data.get('email')
    mot_de_passe = data.get('mot_de_passe')
    
    # Vérification des champs obligatoires
    if not matricule or not nom or not email or not mot_de_passe:
        return jsonify({'error': 'Champs requis : matricule, nom, email, mot_de_passe'}), 400

    # Vérifier si le matricule existe déjà
    if Admin.query.filter_by(matricule=matricule).first():
        return jsonify({'error': 'Un admin avec ce matricule existe déjà'}), 409

    # Vérifier si l’email existe déjà
    if Admin.query.filter_by(email=email).first():
        return jsonify({'error': 'Un admin avec cet email existe déjà'}), 409

    try:
        # Création admin
        new_admin = Admin(
            matricule=matricule,
            nom=nom,
            email=email,
            can_change_password=True
        )

        # 🔐 Hash Argon2
        new_admin.set_password(mot_de_passe)

        db.session.add(new_admin)
        db.session.commit()

        return jsonify({
            'message': 'Admin créé avec succès',
            'admin': new_admin.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route("/verify/<string:matricule>", methods=["GET"])
def verify_matricule(matricule):
    try:
        admin = Admin.query.filter_by(matricule=matricule).first()
        if not admin:
            return jsonify({"exists": False, "error": "Matricule non trouvé"}), 404
        return jsonify({"exists": True}), 200
    except Exception as e:
        # Gestion d'erreur serveur
        return jsonify({"exists": False, "error": f"Erreur serveur: {str(e)}"}), 500

@bp.route('/reset_password', methods=['POST'])
def reset_password():
    """
    Réinitialise le mot de passe d'un admin en fonction de son matricule.
    JSON attendu: { "matricule": "...", "mot_de_passe": "..." }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Données JSON manquantes'}), 400

    matricule = data.get('matricule')
    mot_de_passe = data.get('mot_de_passe')

    if not matricule or not mot_de_passe:
        return jsonify({'error': 'Champs requis : matricule et mot_de_passe'}), 400

    # Vérifier si l'admin existe
    admin = Admin.query.filter_by(matricule=matricule).first()
    if not admin:
        return jsonify({'error': 'Admin introuvable avec ce matricule'}), 404

    try:
        # Utiliser la méthode du modèle pour sécuriser le mot de passe
        admin.set_password(mot_de_passe)
        db.session.commit()
        return jsonify({'message': 'Mot de passe réinitialisé avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur serveur: {str(e)}"}), 50