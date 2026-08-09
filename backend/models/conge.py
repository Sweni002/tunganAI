from . import db

from sqlalchemy import Date, Integer, String, ForeignKey, Sequence
from sqlalchemy.orm import relationship
from datetime import timedelta ,date

class Conge(db.Model):
    __tablename__ = 'conges'
    
    id_seq = Sequence('conges_id_seq', start=1, increment=1)
  
    id = db.Column(Integer,   id_seq,
        primary_key=True,
        server_default=id_seq.next_value() 
        )
    
    date_debut = db.Column(Date, nullable=False)
    date_fin = db.Column(Date, nullable=False)
    motif = db.Column(String(50), nullable=False, default="annuel")
    statut = db.Column(String(20), default="accepté")

    idpers = db.Column(Integer, ForeignKey('personnels.idpers'), nullable=False)
    personnel = relationship("Personnels", backref="conges")

    @staticmethod
    def est_en_conge(idpers, jour):
        return Conge.query.filter(
            Conge.idpers == idpers,
            Conge.date_debut <= jour,
            Conge.date_fin >= jour,
            Conge.statut == "accepté"
        ).first()

    @property
    def nbjours(self):
        return (self.date_fin - self.date_debut).days + 1  # +1 pour inclure la date de début

    def to_dict(self):
         today = date.today()
         status_conge = "en cours" if self.date_fin >= today else "terminé"
         return {
            'id': self.id,
            'date_debut': self.date_debut.isoformat(),
            'date_fin': self.date_fin.isoformat(),
            'motif': self.motif,
            'statut': self.statut,
            'nbjours': self.nbjours,
            'idpers': self.idpers,
            'nom': self.personnel.nom if self.personnel else None,
            'prenom': self.personnel.prenom if self.personnel else None,
            'matricule': self.personnel.matricule if self.personnel else None,
            'division': self.personnel.division.nom if self.personnel and self.personnel.division else None,
            'etat': status_conge ,
            'iddiv': self.personnel.division.iddiv if self.personnel and self.personnel.division else None
    
                   }
