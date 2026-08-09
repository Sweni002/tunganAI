from models import db
from sqlalchemy import Integer, String, Date, ForeignKey, Sequence, Enum
from sqlalchemy.orm import relationship, backref
import enum


class TypeAutorisation(enum.Enum):
    
    sortie = "sortie"
    retard = "retard"


class PeriodeAutorisation(enum.Enum):
    matin = "matin"
    apres_midi = "apres_midi"


class AutorisationSpeciale(db.Model):
    __tablename__ = "autorisations_speciales"

    id_seq = Sequence("autorisations_speciales_id_seq", start=1, increment=1)

    id = db.Column(
        Integer, id_seq, primary_key=True, server_default=id_seq.next_value()
    )

    # --- Informations principales ---
    motif = db.Column(String(255), nullable=False)

    type_autorisation = db.Column(
        Enum(TypeAutorisation, name="type_autorisation_enum"), nullable=False
    )

    periode = db.Column(
        Enum(PeriodeAutorisation, name="periode_autorisation_enum"), nullable=False
    )

    date_debut = db.Column(Date, nullable=False, index=True)
    date_fin = db.Column(Date, nullable=True, index=True)

    # --- Relation personnel ---
    idpers = db.Column(
        Integer, ForeignKey("personnels.idpers", ondelete="CASCADE"), nullable=False
    )
    is_single_day = db.Column(db.Boolean, default=False, nullable=False)


    personnel = relationship(
        "Personnels",
        backref=backref("autorisations_speciales", cascade="all, delete-orphan"),
    )
    pointages = relationship("Pointage", back_populates="autorisationsortie")

    # -----------------------------------------------------------
    # Helper
    # -----------------------------------------------------------
    def to_dict(self):
        return {
            "id": self.id,
            "motif": self.motif,
            "type": self.type_autorisation.value if self.type_autorisation else None,
            "periode": self.periode.value if self.periode else None,
            "date": self.date.isoformat() if self.date else None,
            "idpers": self.idpers,
        }


def couvre_date(self, date_cible):
    if not self.date_fin:
        return self.date_debut == date_cible

    return self.date_debut <= date_cible <= self.date_fin



def is_terminee(self):
    if not self.pointages:
        return False

    pointage = self.pointages[0]  # ou filtrer par date si besoin

    if self.periode == PeriodeAutorisation.matin:
        return pointage.heure_sortie_matin is not None

    elif self.periode == PeriodeAutorisation.apres_midi:
        return pointage.heure_sortie_soir is not None

    return False
