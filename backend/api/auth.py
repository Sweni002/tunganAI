from flask import Blueprint, request, jsonify, session, make_response
from werkzeug.security import check_password_hash, generate_password_hash
from models import Admin,Responsables,Services,Personnels
from models.client import Client
from models.personnels import Personnels
from models import db ,PasswordReset
from datetime import datetime, timedelta
import random
import smtplib
from email.mime.text import MIMEText
import base64
from flask import current_app, request
import os
bp = Blueprint('auth', __name__)

PUBLIC_ROUTES = {
    "auth.login",
    "auth.create_admin",
    "auth.connexion",
    "auth.send_reset_code",
    "auth.verify_reset_code",
    "auth.reset_password",
    "spoof.detect_face",
    "auth.send_reset_code_responsable",
    "auth.verify_reset_code_responsable",
    "personnels_api.get_personnel_matricule",
    "clients_api.create_client",
    "auth.reset_password_responsable",
    "serve_pki_file",
    "uploaded_file",
    "facial_pointage_api.pointage_facial_client",
    "facial_pointage_api.check_face_covering",
    "facial_pointage_api.sortie_facial_client",
        "facial_pointage_api.facial_client_step2_antispoof",
       "facial_pointage_api.facial_client_step3_recognition",
    "facial_pointage_api.facial_client_step4_enregistrer",
        "facial_pointage_api.facial_client_personnel_step2_antispoof",
           "facial_pointage_api.facial_client_personnel_step3_recognition",
    "facial_pointage_api.facial_client_personnel_step4_enregistrer",
    "facial_pointage_api.facial_client_sortie_step4_enregistrer",
    "facial_pointage_api.sortie_facial_client_personnel_step4_enregistrer",
    "clients_api.get_cls",
    "clients_api.facial_client_history",
    "clients_api.facial_client_history_photo" ,
    "facial_pointage_api.facial_client_step1_verify_mac",
    "admin_bp.verify_matricule",
    "admin_bp.reset_password",
    "auth.check_session",
    "auth.ping",
    "admin_bp.create_admin",
    "auth.login_responsable",
    "auth.login_personnel",
    "facial_pointage_api.pointage_facial_client_responsable",
    "auth.send_reset_code_personnel",
    "auth.verify_reset_code_personnel",
    "auth.reset_password_personnel",
    "facial_pointage_api.sortie_facial_client_responsable",
    "facial_pointage_api.inserer_pointages_personnalises",
    "facial_pointage_api.mettre_2_personnels_absents",
    "facial_pointage_api.mettre_pointages_hier",
    "personnels_api.get_faceapi_descriptors",
}


@bp.route('/ping', methods=['GET'])
def ping():
    """
    Route simple pour tester si le serveur est accessible
    """
    return jsonify({'message': 'pong'}), 200


@bp.before_app_request
def require_login():
    if request.endpoint is None:
        return
    if request.endpoint in PUBLIC_ROUTES:
        return
    if 'admin_id' not in session and 'responsable_id' not in session and 'personnel_id' not in session :
      return jsonify({'error': 'Authentification requise'}), 401


@bp.route('/logins', methods=['POST'])
def logins():
    data = request.get_json()
    matricule = data.get('matricule')
    mot_de_passe = data.get('mot_de_passe')

    if not matricule or not mot_de_passe:
        return jsonify({'error': 'Matricule et mot de passe requis'}), 400

    admin = Admin.query.filter_by(matricule=matricule).first()

    if not admin or not admin.check_password(mot_de_passe):
        return jsonify({'error': 'Identifiants invalides'}), 401

    # Stocker la session
    session.clear()
   
    session['admin_id'] = admin.idadmin
    session['role'] = 'admin'  # 👈 rôle ajouté
    print("SESSION APRÈS LOGIN =", dict(session))
    return jsonify({
        'message': 'Connexion réussie',
        'admin': {
            'idadmin': admin.idadmin,
            'matricule': admin.matricule,
            'nom': admin.nom,
            'role': 'admin'   # 👈 rôle ajouté dans la réponse
        }
    }), 200


@bp.route('/login-responsable', methods=['POST'])
def login_responsable():
    data = request.get_json()
    matricule = data.get('matricule')
    mot_de_passe = data.get('mot_de_passe')

    if not matricule or not mot_de_passe:
        return jsonify({'error': 'Matricule et mot de passe requis'}), 400

    # Chercher le responsable par matricule
    responsable = Responsables.query.filter_by(matricule=matricule).first()

    if not responsable or not responsable.check_password(mot_de_passe):
        return jsonify({'error': 'Identifiants invalides'}), 401

    # Stocker la session
    session.clear()
    session['responsable_id'] = responsable.idrh
    session['role'] = 'responsable'  # rôle ajouté
    print("SESSION APRÈS LOGIN =", dict(session))

    return jsonify({
        'message': 'Connexion réussie',
        'responsable': {
            'idrh': responsable.idrh,
            'matricule': responsable.matricule,
            'nom': responsable.nom,
            'prenom': responsable.prenom,
            'role': 'responsable'  # rôle ajouté dans la réponse
        }
    }), 200


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    matricule = data.get("matricule")
    mot_de_passe = data.get("mot_de_passe")

    if not matricule or not mot_de_passe:
        return jsonify({"error": "Matricule et mot de passe requis"}), 400

    admin = Admin.query.filter_by(matricule=matricule).first()
    responsable = Responsables.query.filter_by(matricule=matricule).first()
    personnel = Personnels.query.filter_by(matricule=matricule).first()

    admin_ok = admin and admin.check_password(mot_de_passe)
    resp_ok = responsable and responsable.check_password(mot_de_passe)
    pers_ok = personnel and personnel.check_password(mot_de_passe)

    valid_roles = []
    users = {}

    if admin_ok:
        valid_roles.append("admin")
        users["admin"] = {
            "id": admin.idadmin,
            "matricule": admin.matricule,
            "nom": admin.nom,
            "role": "admin",
        }

    if resp_ok:
        valid_roles.append("responsable")
        users["responsable"] = {
            "id": responsable.idrh,
            "matricule": responsable.matricule,
            "nom": responsable.nom,
            "idserv": responsable.idserv,
            "prenom": responsable.prenom,
            "role": "responsable",
               "can_change_password": responsable.can_change_password  # 🔥 AJOUT

        }

    if pers_ok:
        valid_roles.append("personnel")
        users["personnel"] = {
            "id": personnel.idpers,
            "matricule": personnel.matricule,
            "nom": personnel.nom,
            "prenom": personnel.prenom,
            "role": "personnel",
              "can_change_password": personnel.can_change_password  # 🔥 AJOUT

        }

    # ❌ Aucun rôle valide
    if not valid_roles:
        return jsonify({"error": "Identifiants invalides"}), 401

    session.clear()
    session.permanent = True

    # ⚠️ CONFLIT : plusieurs rôles
    if len(valid_roles) > 1:
        session["role_conflict"] = True
        session["available_roles"] = valid_roles

        # par défaut : responsable > admin > personnel
        if "responsable" in valid_roles:
            session["role"] = "responsable"
            session["responsable_id"] = responsable.idrh
        elif "admin" in valid_roles:
            session["role"] = "admin"
            session["admin_id"] = admin.idadmin
        else:
            session["role"] = "personnel"
            session["personnel_id"] = personnel.idpers

        # stocker TOUS les ids
        if admin_ok:
            session["admin_id"] = admin.idadmin
        if resp_ok:
            session["responsable_id"] = responsable.idrh
        if pers_ok:
            session["personnel_id"] = personnel.idpers

        return jsonify({
            "conflict": True,
            "message": "Ce compte correspond à plusieurs rôles",
            "available_roles": valid_roles,
            "users": users
        }), 200

    # ✅ UN SEUL RÔLE
    role = valid_roles[0]
    session["role_conflict"] = False
    session["role"] = role

    if role == "admin":
        session["admin_id"] = admin.idadmin
    elif role == "responsable":
        session["responsable_id"] = responsable.idrh
    else:
        session["personnel_id"] = personnel.idpers

    return jsonify({
        "message": "Connexion réussie",
        "user": users[role]
    }), 200


@bp.route('/login-personnel', methods=['POST'])
def login_personnel():
    data = request.get_json()
    matricule = data.get('matricule')
    mot_de_passe = data.get('mot_de_passe')

    if not matricule or not mot_de_passe:
        return jsonify({'error': 'Matricule et mot de passe requis'}), 400
    
    # Chercher le responsable par matricule
    responsable = Personnels.query.filter_by(matricule=matricule).first()
    print("Matricule reçu:", matricule)
    print("Mot de passe reçu:", mot_de_passe)
    print("Responsable trouvé:", responsable)
    if responsable:
      print("Password_hash en DB:", responsable.password_hash)
      print("Check_password result:", responsable.check_password(mot_de_passe))

    if not responsable or not responsable.check_password(mot_de_passe):
        return jsonify({'error': 'Identifiants invalides'}), 401
      #  Stocker la session
    session['personnel_id'] = responsable.idpers
    session['role'] = 'personnel'  # rôle ajouté

    return jsonify({
        'message': 'Connexion réussie',
        'responsable': {
            'idpers': responsable.idpers,
            'matricule': responsable.matricule,
            'nom': responsable.nom,
            'prenom': responsable.prenom,
            'role': 'personnel'  # rôle ajouté dans la réponse
        }
    }), 200


@bp.route('/connexion', methods=['POST'])
def connexion():
    try:
        data = request.get_json()
        matricule = data.get('matricule')
        mdp = data.get('mdp')
        print(data)
        if not matricule or not mdp:
            return jsonify({'message': 'Matricule et mot de passe requis'}), 400

        # Étape 1: Trouver le personnel via matricule
        personnel = Personnels.query.filter_by(matricule=matricule).first()
        if not personnel:
            return jsonify({'message': 'Matricule invalide'}), 404
      
        # Étape 2: Trouver le client lié via idpers
        client = Client.query.filter_by(idpers=personnel.idpers).first()
        if not client:
            return jsonify({'message': 'Aucun compte client lié à ce matricule'}), 404

        # Vérification du mot de passe
        if not client.verify_password(mdp):  # Utilise la méthode du modèle
            return jsonify({'message': 'Mot de passe incorrect'}), 401

        session['admin_id'] = client.idcli
        session['role'] = 'client'
        
        return jsonify({
            'message': 'Connexion réussie',
            'client': client.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'message': 'Erreur lors de la connexion', 'error': str(e)}), 500


import shutil


@bp.route('/logout', methods=['POST'])
def logout():
    session.clear() # Plus propre que de boucler sur les clés
    
    response = make_response(jsonify({'message': 'Déconnexion réussie'}))

    # On récupère le nom du cookie (souvent 'session')
    cookie_name = current_app.config.get("SESSION_COOKIE_NAME", "session")

    response.delete_cookie(
        key=cookie_name,
        path="/",
        # ⚠️ MODIFICATIONS ICI :
        secure=False,   # Car vous êtes en HTTP
        samesite="Lax", # "Lax" est le standard pour le HTTP local
        # domain=None   # À préciser seulement si vous en utilisez un
    )

    return response

def get_user_object():
    role = session.get("role")

    if role == "admin":
        return Admin.query.get(session.get("admin_id"))

    if role == "responsable":
        return Responsables.query.get(session.get("responsable_id"))

    if role == "personnel":
        return Personnels.query.get(session.get("personnel_id"))

    return None

@bp.route('/me', methods=['GET'])
def get_current_user():
    role_conflict = session.get("role_conflict", False)
    available_roles = session.get("available_roles", [])

    role = session.get('role')
    user_id = session.get('admin_id') or session.get('responsable_id') or session.get("personnel_id")
    print("user", user_id,"role", role)
    
    if 'role' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    if not role or not user_id:
        return jsonify({'error': 'Non authentifié'}), 401
    if not session or 'role' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    # ---------- ADMIN ----------
    if role == 'admin':
        admin_id = session.get('admin_id')
        admin = Admin.query.get(admin_id)
        if not admin:
            return jsonify({'error': 'Admin non trouvé'}), 404

        return (
            jsonify(
                {
                    "role": "admin",
                    "admin": {
                        "idadmin": admin.idadmin,
                        "can_change_password": admin.can_change_password,  # 🔥 AJOUT
                    },
                    "idadmin": admin.idadmin,
                    "matricule": admin.matricule,
                    "nom": admin.nom,
                    "email": admin.email,
                    "role_conflict": role_conflict,
                    "available_roles": available_roles,
                }
            ),
            200,
        )

    # ---------- RESPONSABLE ----------
    if role == 'responsable':
        resp_id = session.get('responsable_id')
        resp = Responsables.query.get(resp_id)

        if not resp:
            return jsonify({'error': 'Responsable non trouvé'}), 404

        service = Services.query.get(resp.idserv)

        logo_base64 = None
        if service and service.logo:
            logo_base64 = base64.b64encode(service.logo).decode('utf-8')

        return (
            jsonify(
                {
                    "role": "responsable",
                    "role_conflict": role_conflict,
                    "available_roles": available_roles,
                    "responsable": {
                        "idrh": resp.idrh,
                        "matricule": resp.matricule,
                        "nom": resp.nom,
                        "prenom": resp.prenom,
                        "email": resp.email,
                        "idserv": resp.idserv,
                          "can_change_password": resp.can_change_password,  # 🔥 AJOUT

                        "image": resp.image,
                        "service": {
                            "nom": service.nom if service else None,
                            "sigle": service.sigle if service else None,
                            "logo": logo_base64,
                        },
                    },
                }
            ),
            200,
        )

    # ---------- PERSONNEL ----------
    if role == 'personnel':
        pers_id = session.get('personnel_id')
        pers = Personnels.query.get(pers_id)

    if not pers:
        return jsonify({'error': 'Personnel non trouvé'}), 404

    service = pers.division.service if pers.division else None

    logo_base64 = None
    if service and service.logo:
        logo_base64 = base64.b64encode(service.logo).decode('utf-8')

    return (
        jsonify(
            {
                "role": "personnel",
                "role_conflict": role_conflict,
                "available_roles": available_roles,
                "personnel": {
                    "idpers": pers.idpers,
                    "matricule": pers.matricule,
                    "nom": pers.nom,
                      "can_change_password": pers.can_change_password,  # 🔥 AJOUT

                    "role":pers.role ,
                    "prenom": pers.prenom,
                    "email": pers.email,
                    "iddiv": pers.iddiv,
                    "idrh": pers.idrh,
                    "image": pers.image,
                    "service": {
                        "nom": service.nom if service else None,
                        "sigle": service.sigle if service else None,
                        "logo": logo_base64,
                    },
                },
            }
        ),
        200,
    )

    return jsonify({'error': 'Rôle inconnu'}), 400


@bp.route("/password-popup-seen", methods=["PUT"])
def password_popup_seen():
    user = get_user_object()

    if not user:
        return jsonify({"error": "Utilisateur introuvable"}), 404

    if hasattr(user, "can_change_password"):
        user.can_change_password = False

    db.session.commit()

    return jsonify({"success": True}), 200


@bp.route("/change-password/<int:idpers>", methods=["POST"])
def change_password_global(idpers):
    """
    Changer le mot de passe pour un utilisateur et propager aux comptes existants
    (Personnels, Responsables, Admins) si le matricule, l'email et l'ancien mot de passe correspondent.
    Body attendu: { "current_password": "...", "new_password": "..." }
    """
    data = request.get_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({"error": "Champs requis manquants"}), 400

    if len(new_password) < 5:
        return (
            jsonify(
                {"error": "Le nouveau mot de passe doit contenir au moins 5 caractères"}
            ),
            400,
        )

    # Récupérer le personnel principal
    personnel = Personnels.query.get(idpers)
    if not personnel:
        return jsonify({"error": "Utilisateur introuvable"}), 404

    if not personnel.check_password(current_password):
        return jsonify({"error": "Mot de passe actuel incorrect"}), 401

    matricule = personnel.matricule
    email = personnel.email

    # ---------------------
    # Personnels liés existants
    # ---------------------
    for compte in Personnels.query.filter_by(matricule=matricule, email=email).all():
        if compte.check_password(current_password):
            compte.set_password(new_password)
            compte.can_change_password = False

    # ---------------------
    # Responsables liés existants
    # ---------------------
    for compte in Responsables.query.filter_by(matricule=matricule, email=email).all():
        if compte.check_password(current_password):
            compte.set_password(new_password)
            compte.can_change_password = False

    # ---------------------
    # Admins liés existants
    # ---------------------
    for compte in Admin.query.filter_by(matricule=matricule, email=email).all():
        if compte.check_password(current_password):
            compte.set_password(new_password)
            compte.can_change_password = False

    db.session.commit()

    return (
        jsonify(
            {"message": "Mot de passe changé pour tous les comptes existants liés"}
        ),
        200,
    )


@bp.route("/change-password-responsable/<int:idrh>", methods=["POST"])
def change_password_responsable_global(idrh):
    """
    Changement de mot de passe pour un responsable et propagation aux comptes existants
    (Personnels, Responsables, Admins) si le matricule, l'email et l'ancien mot de passe correspondent.
    Body attendu: { "current_password": "...", "new_password": "..." }
    """
    data = request.get_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({"error": "Champs requis manquants"}), 400

    if len(new_password) < 5:
        return (
            jsonify(
                {"error": "Le nouveau mot de passe doit contenir au moins 5 caractères"}
            ),
            400,
        )

    # Récupérer le responsable principal
    respo = Responsables.query.get(idrh)
    if not respo:
        return jsonify({"error": "Utilisateur introuvable"}), 404

    if not respo.check_password(current_password):
        return jsonify({"error": "Mot de passe actuel incorrect"}), 401

    matricule = respo.matricule
    email = respo.email

    # ---------------------
    # Personnels liés existants
    # ---------------------
    for compte in Personnels.query.filter_by(matricule=matricule, email=email).all():
        if compte.check_password(current_password):
            compte.set_password(new_password)
            compte.can_change_password = False

    # ---------------------
    # Responsables liés existants
    # ---------------------
    for compte in Responsables.query.filter_by(matricule=matricule, email=email).all():
        if compte.check_password(current_password):
            compte.set_password(new_password)
            compte.can_change_password = False

    # ---------------------
    # Admins liés existants
    # ---------------------
    for compte in Admin.query.filter_by(matricule=matricule, email=email).all():
        if compte.check_password(current_password):
            compte.set_password(new_password)
            compte.can_change_password = False

    db.session.commit()

    return (
        jsonify(
            {"message": "Mot de passe changé pour tous les comptes existants liés"}
        ),
        200,
    )


@bp.route("/change-password-admin/<int:idadmin>", methods=["POST"])
def change_password_admin_global(idadmin):
    from werkzeug.security import generate_password_hash

    data = request.get_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({"error": "Champs requis manquants"}), 400

    if len(new_password) < 5:
        return (
            jsonify(
                {"error": "Le nouveau mot de passe doit contenir au moins 5 caractères"}
            ),
            400,
        )

    admin = Admin.query.get(idadmin)
    if not admin:
        return jsonify({"error": "Admin introuvable"}), 404

    if not admin.check_password(current_password):
        return jsonify({"error": "Mot de passe actuel incorrect"}), 401

    matricule = admin.matricule
    email = admin.email

    # ---------------------
    # Personnels liés existants
    # ---------------------
    for compte in Personnels.query.filter_by(matricule=matricule, email=email).all():
        if compte.check_password(current_password):
            compte.set_password(new_password)
            compte.can_change_password = False

    # ---------------------
    # Responsables liés existants
    # ---------------------
    for compte in Responsables.query.filter_by(matricule=matricule, email=email).all():
        if compte.check_password(current_password):
            compte.set_password(new_password)
            compte.can_change_password = False

    # ---------------------
    # Admins liés existants
    # ---------------------
    for compte in Admin.query.filter_by(matricule=matricule, email=email).all():
        if compte.check_password(current_password):
            compte.set_password(new_password)
            compte.can_change_password = False

    db.session.commit()

    return (
        jsonify(
            {"message": "Mot de passe changé pour tous les comptes existants liés"}
        ),
        200,
    )


@bp.route("/switch_role", methods=["POST"])
def switch_role():
    data = request.get_json()
    role = data.get("role")

    # --- LOGS DE DÉBUT ---
    print("\n" + "=" * 30)
    print("🚀 TENTATIVE DE SWITCH")
    print(f"👉 Rôle demandé : {role}")
    print(f"👉 Session complète : {dict(session)}")
    # ---------------------

    if not session.get("role_conflict"):
        print("❌ ÉCHEC : 'role_conflict' est absent ou False dans la session")
        return (
            jsonify({"error": "Changement de rôle non autorisé pour cet utilisateur"}),
            403,
        )

    available_roles = session.get("available_roles", [])
    if role not in available_roles:
        print(f"❌ ÉCHEC : rôle '{role}' non autorisé")
        return jsonify({"error": "Rôle non autorisé pour cet utilisateur"}), 403

    # ---------- ADMIN ----------
    if role == "admin":
        admin_id = session.get("admin_id")
        print(f"🔍 Vérification admin_id : {admin_id}")
        if not admin_id:
            print("❌ ÉCHEC : 'admin_id' est manquant dans la session")
            return jsonify({"error": "ID Admin introuvable dans la session"}), 400

        session["role"] = "admin"
        print("✅ SUCCÈS : Rôle passé à 'admin'")

    # ---------- RESPONSABLE ----------
    elif role == "responsable":
        resp_id = session.get("responsable_id")
        print(f"🔍 Vérification responsable_id : {resp_id}")
        if not resp_id:
            print("❌ ÉCHEC : 'responsable_id' est manquant dans la session")
            return jsonify({"error": "ID Responsable introuvable dans la session"}), 400

        session["role"] = "responsable"
        print("✅ SUCCÈS : Rôle passé à 'responsable'")

    # ---------- PERSONNEL ----------
    elif role == "personnel":
        pers_id = session.get("personnel_id")
        print(f"🔍 Vérification personnel_id : {pers_id}")
        if not pers_id:
            print("❌ ÉCHEC : 'personnel_id' est manquant dans la session")
            return jsonify({"error": "ID Personnel introuvable dans la session"}), 400

        session["role"] = "personnel"
        print("✅ SUCCÈS : Rôle passé à 'personnel'")

    else:
        print(f"❌ ÉCHEC : Le rôle '{role}' est invalide")
        return jsonify({"error": "Rôle invalide"}), 400

    print("=" * 30 + "\n")
    return jsonify({"message": f"Passage au rôle {role} réussi"}), 200


@bp.route('/session', methods=['GET'])
def check_session():
    user_id = session.get('admin_id')
    role = session.get('role')

    if not user_id or not role:
        return jsonify({'error': 'Non authentifié'}), 401

    if role == "admin":
        admin = Admin.query.get(user_id)
        if not admin:
            return jsonify({'error': 'Admin non trouvé'}), 404
        return jsonify({
            'user': {
                'role': 'admin',
                'id': admin.idadmin,
                'matricule': admin.matricule,
                'nom': admin.nom
            }
        }), 200

    if role == "client":
        client = Client.query.get(user_id)
        if not client:
            return jsonify({'error': 'Client non trouvé'}), 404
        return jsonify({
            'user': {
                'role': 'client',
                **client.to_dict()
            }
        }), 200

    return jsonify({'error': 'Rôle inconnu'}), 400


@bp.route('/create_admin', methods=['POST'])
def create_admin():
    data = request.get_json()
    matricule = data.get('matricule')
    nom = data.get('nom')
    mot_de_passe = data.get('mot_de_passe')
    email=data.get('email')

    if not matricule or not nom or not mot_de_passe  or not email:
        return jsonify({'error': 'Matricule, nom ,email et mot de passe requis'}), 400

    existing_admin = Admin.query.filter_by(matricule=matricule).first()
    if existing_admin:
        return jsonify({'error': 'Un admin avec ce matricule existe déjà'}), 409

    admin = Admin(matricule=matricule, nom=nom, email=email, can_change_password=True)
    admin.set_password(mot_de_passe)

    db.session.add(admin)
    db.session.commit()

    return jsonify({
        'message': 'Admin créé avec succès',
        'admin': {
            'idadmin': admin.idadmin,
            'matricule': admin.matricule,
            'nom': admin.nom,
            "email":admin.email
        }
    }), 201


@bp.route('/send-reset-code', methods=['POST'])
def send_reset_code():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email requis'}), 400

    # Vérifier l'email dans les 3 tables
    admin = Admin.query.filter_by(email=email).first()
    responsable = Responsables.query.filter_by(email=email).first()
    personnel = Personnels.query.filter_by(email=email).first()

    # 🔍 LOG DES RÔLES TROUVÉS
    roles_found = []
    if admin:
        roles_found.append("admin")
    if responsable:
        roles_found.append("responsable")
    if personnel:
        roles_found.append("personnel")

    print("📧 Demande reset pour :", email)
    print("✅ Rôles trouvés :", roles_found if roles_found else "Aucun")

    if not roles_found:
        return jsonify({'error': 'Aucun compte lié à cet email'}), 404

    # Générer UN SEUL code
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(hours=1)

    # Supprimer anciens codes
    PasswordReset.query.filter_by(email=email).delete()

    reset_entry = PasswordReset(
        email=email,
        code=code,
        expires_at=expires_at
    )
    db.session.add(reset_entry)
    db.session.commit()

    # Envoi email
    try:
        smtp_host = 'smtp.gmail.com'
        smtp_port = 587
        smtp_user = 'niseynwa@gmail.com'
        smtp_pass = 'yuuf vfrc ukjv gkig'

        msg = MIMEText(
            f"Votre code de réinitialisation est : {code}\n"
            f"Ce code est valable pendant 1 heure."
        )
        msg['Subject'] = 'Code de réinitialisation'
        msg['From'] = smtp_user
        msg['To'] = email

        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()

    except Exception as e:
        print("❌ ERREUR SMTP :", str(e))
        return jsonify({'error': f"Erreur envoi email : {str(e)}"}), 500

    print("✉️ Email envoyé avec succès à", email)
    print("-" * 40)

    return jsonify({
        'message': 'Code de réinitialisation envoyé',
        'expires_at': expires_at.isoformat()
    }), 200


@bp.route('/send-reset-code-responsable', methods=['POST'])
def send_reset_code_responsable():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email requis'}), 400

    # Vérifier si le responsable existe
    responsable = Responsables.query.filter_by(email=email).first()
    if not responsable:
        return jsonify({'error': 'Aucun responsable lié à cet email'}), 404

    # Générer un code à 6 chiffres
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(hours=1)

    # Enregistrer dans la table PasswordReset
    reset_entry = PasswordReset(email=email, code=code, expires_at=expires_at)
    db.session.add(reset_entry)
    db.session.commit()

    # Envoyer le mail
    try:
        smtp_host = 'smtp.gmail.com'
        smtp_port = 587
        smtp_user = 'niseynwa@gmail.com'
        smtp_pass = 'yuuf vfrc ukjv gkig'  # ton mot de passe applicatif

        msg = MIMEText(f"Votre code de réinitialisation est : {code}")
        msg['Subject'] = 'Code de réinitialisation'
        msg['From'] = smtp_user
        msg['To'] = email

        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()

    except Exception as e:
        return jsonify({'error': f"Impossible d’envoyer l’email : {str(e)}"}), 500

    return jsonify({
        'message': 'Code envoyé avec succès',
        'expires_at': expires_at.isoformat()
    }), 200

@bp.route('/send-reset-code-personnel', methods=['POST'])
def send_reset_code_personnel():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email requis'}), 400

    # Vérifier si le responsable existe
    responsable = Personnels.query.filter_by(email=email).first()
    if not responsable:
        return jsonify({'error': 'Aucun personnel lié à cet email'}), 404

    # Générer un code à 6 chiffres
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(hours=1)

    # Enregistrer dans la table PasswordReset
    reset_entry = PasswordReset(email=email, code=code, expires_at=expires_at)
    db.session.add(reset_entry)
    db.session.commit()

    # Envoyer le mail
    try:
        smtp_host = 'smtp.gmail.com'
        smtp_port = 587
        smtp_user = 'niseynwa@gmail.com'
        smtp_pass = 'yuuf vfrc ukjv gkig'  # ton mot de passe applicatif

        msg = MIMEText(f"Votre code de réinitialisation est : {code}")
        msg['Subject'] = 'Code de réinitialisation'
        msg['From'] = smtp_user
        msg['To'] = email

        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()

    except Exception as e:
        return jsonify({'error': f"Impossible d’envoyer l’email : {str(e)}"}), 500

    return jsonify({
        'message': 'Code envoyé avec succès',
        'expires_at': expires_at.isoformat()
    }), 200


@bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
  data = request.get_json()
  email = data.get('email')
  code = data.get('code')

  if not email or not code:
    return jsonify({'error': 'Email et code sont requis'}), 400

# Chercher le code correspondant dans la base
  reset_entry = PasswordReset.query.filter_by(email=email, code=code).first()
  if not reset_entry:
    return jsonify({'error': 'Code invalide'}), 404

# Vérifier si le code a expiré
  if datetime.utcnow() > reset_entry.expires_at:
    return jsonify({'error': 'Code expiré'}), 400

  return jsonify({'message': 'Code valide'})

@bp.route('/verify-reset-code-responsable', methods=['POST'])
def verify_reset_code_responsable():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')

    if not email or not code:
        return jsonify({'error': 'Email et code sont requis'}), 400

    # Vérifier si le responsable existe
    responsable = Responsables.query.filter_by(email=email).first()
    if not responsable:
        return jsonify({'error': 'Aucun responsable lié à cet email'}), 404

    # Chercher le code correspondant dans la table PasswordReset
    reset_entry = PasswordReset.query.filter_by(email=email, code=code).first()
    if not reset_entry:
        return jsonify({'error': 'Code invalide'}), 404

    # Vérifier si le code a expiré
    if datetime.utcnow() > reset_entry.expires_at:
        return jsonify({'error': 'Code expiré'}), 400

    return jsonify({'message': 'Code valide'}), 200

@bp.route('/verify-reset-code-personnel', methods=['POST'])
def verify_reset_code_personnel():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')

    if not email or not code:
        return jsonify({'error': 'Email et code sont requis'}), 400

    # Vérifier si le responsable existe
    responsable = Personnels.query.filter_by(email=email).first()
    if not responsable:
        return jsonify({'error': 'Aucun personnel lié à cet email'}), 404

    # Chercher le code correspondant dans la table PasswordReset
    reset_entry = PasswordReset.query.filter_by(email=email, code=code).first()
    if not reset_entry:
        return jsonify({'error': 'Code invalide'}), 404

    # Vérifier si le code a expiré
    if datetime.utcnow() > reset_entry.expires_at:
        return jsonify({'error': 'Code expiré'}), 400

    return jsonify({'message': 'Code valide'}), 200


@bp.route('/reset-password-responsable', methods=['POST'])
def reset_password_responsable():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')
    new_password = data.get('new_password')

    if not email or not code or not new_password:
        return jsonify({'error': 'Email, code et nouveau mot de passe sont requis'}), 400

    # Vérifier que le responsable existe
    responsable = Responsables.query.filter_by(email=email).first()
    if not responsable:
        return jsonify({'error': 'Aucun responsable trouvé pour cet email'}), 404

    # Vérifier le code
    reset_entry = PasswordReset.query.filter_by(email=email, code=code).first()
    if not reset_entry:
        return jsonify({'error': 'Code invalide'}), 404

    # Vérifier si le code a expiré
    if datetime.utcnow() > reset_entry.expires_at:
        return jsonify({'error': 'Code expiré'}), 400

    # Mettre à jour le mot de passe
    responsable.set_password(new_password)
    db.session.commit()

    # Supprimer le code après utilisation
    db.session.delete(reset_entry)
    db.session.commit()

    return jsonify({'message': 'Mot de passe réinitialisé avec succès'}), 200


@bp.route('/reset-password-personnel', methods=['POST'])
def reset_password_personnel():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')
    new_password = data.get('new_password')

    if not email or not code or not new_password:
        return jsonify({'error': 'Email, code et nouveau mot de passe sont requis'}), 400

    # Vérifier que le responsable existe
    responsable = Personnels.query.filter_by(email=email).first()
    if not responsable:
        return jsonify({'error': 'Aucun personnel trouvé pour cet email'}), 404

    # Vérifier le code
    reset_entry = PasswordReset.query.filter_by(email=email, code=code).first()
    if not reset_entry:
        return jsonify({'error': 'Code invalide'}), 404

    # Vérifier si le code a expiré
    if datetime.utcnow() > reset_entry.expires_at:
        return jsonify({'error': 'Code expiré'}), 400

    # Mettre à jour le mot de passe
    responsable.set_password(new_password)
    db.session.commit()

    # Supprimer le code après utilisation
    db.session.delete(reset_entry)
    db.session.commit()

    return jsonify({'message': 'Mot de passe réinitialisé avec succès'}), 200


@bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')
    new_password = data.get('new_password')

    if not email or not code or not new_password:
        return jsonify({

      'error': 'Email, code et nouveau mot de passe sont requis'
        }), 400

    # Vérifier le code
    reset_entry = PasswordReset.query.filter_by(
        email=email,
        code=code
    ).first()

    if not reset_entry:
        return jsonify({'error': 'Code invalide'}), 404

    if datetime.utcnow() > reset_entry.expires_at:
        return jsonify({'error': 'Code expiré'}), 400

    # Chercher l'email dans les 3 tables
    admins = Admin.query.filter_by(email=email).all()
    responsables = Responsables.query.filter_by(email=email).all()
    personnels = Personnels.query.filter_by(email=email).all()

    if not admins and not responsables and not personnels:
        return jsonify({
            'error': 'Aucun compte lié à cet email'
        }), 404

    # Mettre à jour TOUS les mots de passe trouvés
    for admin in admins:
        admin.set_password(new_password)

    for responsable in responsables:
        responsable.set_password(new_password)

    for personnel in personnels:
        personnel.set_password(new_password)

    # Supprimer le code après usage
    db.session.delete(reset_entry)
    db.session.commit()

    return jsonify({
        'message': 'Mot de passe réinitialisé pour tous les comptes liés à cet email'
    }), 200
