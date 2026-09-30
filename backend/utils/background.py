# utils/background.py
"""
Tâches de fond (threads) avec contexte Flask et session SQLAlchemy propre.
Compatible async_mode="threading".
"""

import logging
from concurrent.futures import ThreadPoolExecutor

from flask import current_app

from models import db

logger = logging.getLogger(__name__)

_EXECUTOR = ThreadPoolExecutor(max_workers=8, thread_name_prefix="bg")


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

    _EXECUTOR.submit(_job)