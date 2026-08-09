from models import db
from sqlalchemy import Integer, String, Sequence
from sqlalchemy.orm import relationship

class TypeAutorisations(db.Model):
    __tablename__ = 'types_autorisations'

    id_seq = Sequence('types_id_seq', start=1, increment=1)

    idtype = db.Column( db.Integer,id_seq,
        primary_key=True,
        server_default=id_seq.next_value()
    )
    nomtype = db.Column(String(50), nullable=False)
    abbreviation = db.Column(db.String(10), nullable=True)
    autorisations_absences = relationship(
        "AutorisationAbsence",
        back_populates="type_autorisation",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "idtype": self.idtype,
            "nomtype": self.nomtype,
            "abbreviation": self.abbreviation,  # Ne pas oublier de l'ajouter ici
        }
