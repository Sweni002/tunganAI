from flask import Flask, request
from flask_cors import CORS
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_session import Session
from flask_apscheduler import APScheduler
from flask_socketio import SocketIO
from models import db,Personnels
from api.task import creer_pointages_vides
from utils import face_utils
from datetime import timedelta

from dotenv import load_dotenv
from datetime import date
import os
import redis

load_dotenv()
socketio = SocketIO(
    cors_allowed_origins=[
        "http://localhost:5173",
        "http://192.168.43.73:5173",
        "http://127.0.0.1:5173",
    ],
    async_mode="threading",
)

# Instances globales
scheduler = APScheduler()
migrate = Migrate()
login_manager = LoginManager()

SECRET_KEY = os.getenv("SECRET_KEY", "devsecret123")


def create_app():
    app = Flask(__name__)

    # Dossier pour les sessions
    app.config['SESSION_FILE_DIR'] = './flask_session/'
    os.makedirs(app.config['SESSION_FILE_DIR'], exist_ok=True)

    # Config de base
    app.config.from_object('config.Config')

    # Sécurité cookies
    app.config.update(
    SESSION_TYPE="filesystem",
    SECRET_KEY=SECRET_KEY,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=15),
    SESSION_REFRESH_EACH_REQUEST=True,
)

    # Initialisation
    db.init_app(app)
    
    
    redis_url = os.getenv(
        "REDIS_URL",
        "redis://127.0.0.1:6379/0"
    )

    redis_client = redis.from_url(
        redis_url,
        decode_responses=False
    )


    try:
      redis_client.ping()
      print("✅ Redis connecté")
    except Exception as e:
      print(f"❌ Redis indisponible : {e}")
      
    app.extensions["redis"] = redis_client
    
    from utils.cache import register_cache_invalidation

    register_cache_invalidation(db)
    migrate.init_app(app, db)
    socketio.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    Session(app)

    # CORS pour React
    CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://192.168.43.73:5173",
    ],
)

    # Autoriser OPTIONS pour les requêtes préflight
    @app.before_request
    def bypass_options():
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            return response

    # Enregistrement des Blueprints (API)
    from api.personnels_api import bp as personnels_bp
    app.register_blueprint(personnels_bp, url_prefix='/api/personnels')

    from api.divisions_api import bp as divisions_bp
    app.register_blueprint(divisions_bp, url_prefix='/api/divisions')

    from api.conges_api import bp as conges_bp
    app.register_blueprint(conges_bp, url_prefix='/api/conges')

    from api.fiche_api import bp as fiches_bp
    app.register_blueprint(fiches_bp, url_prefix='/api/fiches_assiduite')

    from api.pointage_faciale import bp as pointage_bp
    app.register_blueprint(pointage_bp, url_prefix='/api/pointage')

    from api.auth import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    from api.admin_api import bp as admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admins')

    from api.autorisation_absence_api import bp as autorisation_bp
    app.register_blueprint(autorisation_bp, url_prefix='/api/autorisations')

    from api.autorisationSpeciale_api import bp as autorisation_bp2
    app.register_blueprint(autorisation_bp2, url_prefix="/api/autorisations_speciales")

    from api.client_api import bp as client_bp
    app.register_blueprint(client_bp, url_prefix='/api/clients')

    from api.horaire_api import bp as horaire_bp
    app.register_blueprint(horaire_bp, url_prefix='/api/horaires')


    from api.service_api import bp as service_bp
    app.register_blueprint(service_bp, url_prefix='/api/services')

    from api.type_api import bp as type_bp
    app.register_blueprint(type_bp, url_prefix='/api/types')

    from api.responsable_api import bp as responsable_bp
    app.register_blueprint(responsable_bp, url_prefix='/api/responsables')
    
    from api.create_service_horaire import bp as create_service_horaire_bp
    app.register_blueprint(create_service_horaire_bp, url_prefix='/api/services-horaires')

    # Scheduler
    scheduler.init_app(app)

    @scheduler.task('cron', id='check_absents_matin_task', hour=12, minute=43)
    def scheduled_absence_check():
        with app.app_context():
            from api.absence_checker import check_absents_matin
            check_absents_matin()
            print("[Scheduler] check_absents_matin() exécuté à 13h00")

    @scheduler.task('cron', id='check_absents_soir_task', hour=17, minute=30)
    def scheduled_absence_check_soir():
        with app.app_context():
            from api.absence_checker import check_absents_soir
            check_absents_soir()
            print("[Scheduler] check_absents_soir() exécuté à 16h01")

    scheduler.start()

    # Chargement embeddings pour la reconnaissance faciale
    with app.app_context():
        
        print("✅ Toutes les tables SQLAlchemy ont été créées si elles n'existaient pas !")
        face_utils.preload_embeddings_threadsafe()
        return app
