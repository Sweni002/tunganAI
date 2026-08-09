from models import db
from sqlalchemy import Sequence
from datetime import datetime


class MacNonAutorisee(db.Model):
    __tablename__ = 'mac_non_autorisees'

    id_seq = Sequence('mac_non_autorisee_id_seq', start=1, increment=1)

    id = db.Column(db.Integer, id_seq, primary_key=True, server_default=id_seq.next_value())

    mac_address = db.Column(db.String(17), nullable=False, unique=True, index=True)
    nombre_tentatives = db.Column(db.Integer, nullable=False, default=1)

    premiere_tentative = db.Column(db.DateTime, nullable=False, default=datetime.now)
    derniere_tentative = db.Column(db.DateTime, nullable=False, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "mac_address": self.mac_address,
            "nombre_tentatives": self.nombre_tentatives,
            "premiere_tentative": self.premiere_tentative.isoformat(),
            "derniere_tentative": self.derniere_tentative.isoformat(),
        }