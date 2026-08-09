from models import db
from sqlalchemy import DateTime, Integer, ForeignKey, Sequence
from sqlalchemy.orm import relationship


class HorairesService(db.Model):
    __tablename__ = "horaires_services"

    id_seq = Sequence("horaires_services_seq", start=1, increment=1)

    id = db.Column(Integer,id_seq, primary_key=True,server_default=id_seq.next_value())

    idserv = db.Column(
        Integer, ForeignKey("services.idserv", ondelete="CASCADE"), nullable=False
    )
 
    service = relationship(
        "Services",
        backref=db.backref(
            "horaire",
            uselist=False,
            cascade="all, delete-orphan",
            passive_deletes=True,
        ),
    )

    # ---------------------------
    # MATIN
    # ---------------------------
    entree_matin_debut = db.Column(DateTime, nullable=False)  # ex: 07:10
    entree_matin_fin = db.Column(DateTime, nullable=False)  # ex: 08:00

    sortie_matin_debut = db.Column(DateTime, nullable=False)  # ex: 11:30
    sortie_matin_fin = db.Column(DateTime, nullable=False)  # ex: 12:30

    # ---------------------------
    # SOIR
    # ---------------------------
    entree_soir_debut = db.Column(DateTime, nullable=False)  # ex: 13:30
    entree_soir_fin = db.Column(DateTime, nullable=False)  # ex: 14:00

    sortie_soir_debut = db.Column(DateTime, nullable=False)  # ex: 15:50
    sortie_soir_fin = db.Column(DateTime, nullable=False)  # ex: 18:00
