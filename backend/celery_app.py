# celery_app.py
import os
import sys                          # ✅ AJOUT

import redis
from celery import Celery, Task
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

# ✅ AJOUT — dossier backend toujours dans sys.path,
# y compris pour les imports paresseux faits dans un thread de worker.
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://127.0.0.1:6379/1")
CELERY_TIMEZONE = os.getenv("CELERY_TIMEZONE", "Indian/Antananarivo")

_flask_app = None


def get_flask_app():
    """Application Flask minimale pour le worker (créée une seule fois)."""
    global _flask_app
    if _flask_app is not None:
        return _flask_app

    from flask import Flask
    from models import db

    app = Flask("pointage_worker")
    app.config.from_object("config.Config")

    app.extensions["redis"] = redis.from_url(
        REDIS_URL,
        decode_responses=False,
        socket_timeout=2,
        socket_connect_timeout=2,
        health_check_interval=30,
    )

    db.init_app(app)

    from utils.cache import register_cache_invalidation
    from utils.pointage_context import register_context_invalidation

    register_cache_invalidation(db)
    register_context_invalidation(db)

    _flask_app = app
    return app


class FlaskTask(Task):
    def __call__(self, *args, **kwargs):
        from flask import has_app_context

        if has_app_context():
            return self.run(*args, **kwargs)

        from models import db

        with get_flask_app().app_context():
            try:
                return self.run(*args, **kwargs)
            except Exception:
                db.session.rollback()
                raise
            finally:
                db.session.remove()


celery = Celery(
    "pointage",
    broker=CELERY_BROKER_URL,
    include=["tasks.pointage_tasks"],
    task_cls=FlaskTask,
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    task_ignore_result=True,
    timezone=CELERY_TIMEZONE,
    enable_utc=True,

    # Fiabilité : un message n'est acquitté qu'une fois la tâche terminée
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=4,

    # Côté web : échouer vite si Redis/broker ne répond pas (repli local)
    broker_connection_retry_on_startup=True,
    broker_connection_timeout=1,
    broker_transport_options={
        "socket_connect_timeout": 1,
        "socket_timeout": 3,
        "visibility_timeout": 3600,
    },

    task_default_queue="pointage",
    task_routes={
        "pointage.creer_pointages_vides": {"queue": "pointage_lourd"},
        "pointage.marquer_absents_matin": {"queue": "pointage_lourd"},
        "pointage.preparer_journee": {"queue": "pointage_lourd"},
        "pointage.absents_matin_securite": {"queue": "pointage_lourd"},
    },

    beat_schedule={
        # Lignes vides + contextes Redis prêts avant l'arrivée du personnel
        "preparer-journee": {
            "task": "pointage.preparer_journee",
            "schedule": crontab(hour=5, minute=30, day_of_week="mon-fri"),
        },
        # Filet de sécurité si personne n'a pointé l'après-midi
        "absents-matin-securite": {
            "task": "pointage.absents_matin_securite",
            "schedule": crontab(hour=14, minute=30, day_of_week="mon-fri"),
        },
    },
)
