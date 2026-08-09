from models import db
from sqlalchemy import Date, Integer, String, ForeignKey, Sequence, LargeBinary, UniqueConstraint
from sqlalchemy.orm import relationship, backref
from datetime import date


class Services(db.Model):
    __tablename__ = 'services'

    id_seq = Sequence('service_id_seq', start=1, increment=1)

    idserv = db.Column(db.Integer, id_seq, primary_key=True, server_default=id_seq.next_value())
    nom = db.Column(db.String(100), nullable=False)
    logo = db.Column(db.LargeBinary, nullable=True)  # Oracle → type BLOB
    addresse = db.Column(db.String(100), nullable=False)
    sigle = db.Column(db.String(20), nullable=True)
    code_service = db.Column(db.String(20), nullable=True)

    # ✅ un service a plusieurs divisions
    divisions = db.relationship('Divisions', backref='service', lazy=True)

    responsables = db.relationship('Responsables', backref='service', lazy=True)

    def to_dict(self):
        return {
            "idserv": self.idserv,
            "nom": self.nom,
            "addresse": self.addresse,
            "sigle": self.sigle,
            "code_service": self.code_service,
            "mac_autorisees": [m.to_dict() for m in self.mac_autorisees],
        }


class ServiceMacAutorisee(db.Model):
    __tablename__ = 'services_mac_autorisees'

    id_seq = Sequence('service_mac_autorisee_id_seq', start=1, increment=1)

    id = db.Column(db.Integer, id_seq, primary_key=True, server_default=id_seq.next_value())

    idserv = db.Column(
        db.Integer,
        db.ForeignKey('services.idserv', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    mac_address = db.Column(db.String(17), nullable=False)  # format AA:BB:CC:DD:EE:FF
    description = db.Column(db.String(100), nullable=True)  # ex: "Poste accueil", "PC bureau 2"

    service = relationship(
        'Services',
        backref=backref('mac_autorisees', cascade="all, delete-orphan"),
    )

    __table_args__ = (
        # Une même adresse MAC ne peut être autorisée que pour un seul service à la fois.
        # Retire cette contrainte si tu veux permettre le partage d'une MAC entre plusieurs services.
        UniqueConstraint('mac_address', name='uq_mac_address'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "idserv": self.idserv,
            "mac_address": self.mac_address,
            "description": self.description,
        }