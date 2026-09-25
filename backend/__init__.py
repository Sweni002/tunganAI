from flask import Flask, request
from flask_cors import CORS
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_session import Session
from flask_apscheduler import APScheduler
from flask_socketio import SocketIO
from models import db, Personnels
from api.task import creer_pointages_vides
from utils import face_utils
from datetime import timedelta

from dotenv import load_dotenv
from datetime import date
import os
import redis

load_dotenv()

SOCKET_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

for i in range(1, 255):
    SOCKET_ALLOWED_ORIGINS.append(f"http://192.168.88.{i}")
    SOCKET_ALLOWED_ORIGINS.append(f"https://192.168.88.{i}")

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")

socketio = SocketIO(
    cors_allowed_origins=SOCKET_ALLOWED_ORIGINS,
async_mode="threading",  
    message_queue=REDIS_URL,
)

scheduler = APScheduler()
migrate = Migrate()
login_manager = LoginManager()

SECRET_KEY = os.getenv("SECRET_KEY", "devsecret123")

ENABLE_SCHEDULER = os.getenv("ENABLE_SCHEDULER", "false").lower() == "true"


def create_app():
    app = Flask(__name__)

    app.config.from_object('config.Config')

    # --- Redis (avant les sessions) ---
    redis_client = redis.from_url(
        REDIS_URL,
        decode_responses=False,
        socket_timeout=2,
        socket_connect_timeout=2,
        health_check_interval=30,
    )

    try:
        redis_client.ping()
        print("✅ Redis connecté")
    except Exception as e:
        print(f"❌ Redis indisponible : {e}")

    app.extensions["redis"] = redis_client

    # --- Sessions partagées via Redis ---
    app.config.update(
        SESSION_TYPE="redis",
        SESSION_REDIS=redis_client,
        SESSION_PERMANENT=True,
        SESSION_USE_SIGNER=True,
        SECRET_KEY=SECRET_KEY,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=False,
        SESSION_COOKIE_SAMESITE="Lax",
        PERMANENT_SESSION_LIFETIME=timedelta(minutes=15),
        SESSION_REFRESH_EACH_REQUEST=True,
    )

    db.init_app(app)

    from utils.cache import register_cache_invalidation
    register_cache_invalidation(db)

    migrate.init_app(app, db)
    socketio.init_app(app, message_queue=REDIS_URL)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    Session(app)

    CORS(
        app,
        supports_credentials=True,
        origins=[
            r"^https?://192\.168\.88\.[0-9]{1,3}(?::[0-9]+)?$",
            r"^http://127\.0\.0\.1:5173$",
            r"^http://localhost:5173$",
        ],
    )

    @app.before_request
    def bypass_options():
        if request.method == 'OPTIONS':
            return app.make_default_options_response()

    # --- Blueprints ---
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

    # --- Scheduler (une seule instance) ---
    if ENABLE_SCHEDULER:
        scheduler.init_app(app)

        @scheduler.task('cron', id='check_absents_matin_task', hour=12, minute=43)
        def scheduled_absence_check():
            with app.app_context():
                from api.absence_checker import check_absents_matin
                check_absents_matin()
                print("[Scheduler] check_absents_matin() exécuté")

        @scheduler.task('cron', id='check_absents_soir_task', hour=17, minute=30)
        def scheduled_absence_check_soir():
            with app.app_context():
                from api.absence_checker import check_absents_soir
                check_absents_soir()
                print("[Scheduler] check_absents_soir() exécuté")

        scheduler.start()
        print("🕒 Scheduler activé sur cette instance")
    else:
        print("⏸️ Scheduler désactivé sur cette instance (ENABLE_SCHEDULER=false)")

    # --- Embeddings + synchronisation entre instances ---
    with app.app_context():
        face_utils.preload_embeddings_threadsafe()

    face_utils.init_face_sync(app)

    return app