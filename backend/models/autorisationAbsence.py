from . import db

from sqlalchemy import Date, Integer, String, ForeignKey, Sequence
from sqlalchemy.orm import relationship
from datetime import date

class AutorisationAbsence(db.Model):
    __tablename__ = 'autorisations_absences'

    id_seq = Sequence('autorisations_absences_id_seq', start=1, increment=1)

    id = db.Column(
        db.Integer,
        id_seq,
        primary_key=True,
        server_default=id_seq.next_value()  # 🔹 auto-incrément Oracle
    )  
    date_absence = db.Column(Date, nullable=False)
    motif = db.Column(String(100), nullable=False)
    demi_journee = db.Column(String(10), default="complete")

    idpers = db.Column(db.Integer, ForeignKey('personnels.idpers', ondelete='CASCADE'), nullable=False)
    personnel = relationship("Personnels")

    idtype = db.Column(db.Integer, ForeignKey('types_autorisations.idtype', ondelete='SET NULL'))
    type_autorisation = relationship("TypeAutorisations", back_populates="autorisations_absences")

    pointages = relationship("Pointage", back_populates="autorisation")

    def to_dict(self):
        etat = "terminée" if self.date_absence < date.today() else "en cours"
        return {
            "id": self.id,
            "date_absence": self.date_absence.isoformat(),
            "motif": self.motif,
            "demi_journee": self.demi_journee,  # 🔹 bien affiché
            "role": self.personnel.role if self.personnel else None,
            "idpers": self.idpers,
            "nom": self.personnel.nom if self.personnel else None,
            "prenom": self.personnel.prenom if self.personnel else None,
            "matricule": self.personnel.matricule if self.personnel else None,
            "etat": etat,
            "demi_journee": self.demi_journee,
            "idtype": self.idtype,
            "nomtype": (
                self.type_autorisation.nomtype if self.type_autorisation else None
            ),
        }
