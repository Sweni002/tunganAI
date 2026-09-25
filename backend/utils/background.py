# utils/background.py
"""
Tâches de fond compatibles eventlet, avec contexte Flask et session
SQLAlchemy propre (commit/rollback/remove).
"""

import logging

import eventlet
from flask import current_app

from models import db

logger = logging.getLogger(__name__)


def run_in_background(fn, *args, **kwargs):
    app = current_app._get_current_object()

    def _job():
        with app.app_context():
            try:
                fn(*args, **kwargs)
            except Exception:
                logger.exception("[Background] Échec de %s", getattr(fn, "__name__", fn))
                db.session.rollback()
            finally:
                db.session.remove()

    eventlet.spawn_n(_job)
    