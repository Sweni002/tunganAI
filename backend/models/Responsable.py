from werkzeug.security import generate_password_hash, check_password_hash
from . import db
from sqlalchemy import Date, DateTime, Boolean, Integer, String, ForeignKey, Sequence, LargeBinary
from sqlalchemy.orm import relationship, backref
import numpy as np

class Responsables(db.Model):
    __tablename__ = 'responsables'
    
    id_seq = Sequence('responsables_idrh_seq', start=1, increment=1)
 
    idrh = db.Column(db.Integer,id_seq, primary_key=True,server_default=id_seq.next_value())
    matricule = db.Column(db.String(100), unique=True, nullable=False)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    mot_de_passe = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(100), nullable=False,unique=True, )
    image = db.Column(db.Text)
    can_change_password = db.Column(db.Boolean, default=True)
 
    idserv = db.Column(db.Integer, db.ForeignKey('services.idserv'), nullable=False)

    # Relation : un responsable → plusieurs personnels
    personnels = db.relationship('Personnels', backref='responsable', lazy=True)

    # Définir le mot de passe (hash)
    def set_password(self, password):
        self.mot_de_passe = generate_password_hash(password)

    # Vérifier le mot de passe
    def check_password(self, password):
        if not self.mot_de_passe:
            return False
        return check_password_hash(self.mot_de_passe, password)
       # Transformer en dictionnaire
    def to_dict(self):
        return {
            'idrh': self.idrh,
            'matricule': self.matricule,
            'prenom': self.prenom,
            'nom': self.nom,
            'idserv': self.idserv,
            'email': self.email,
            'nomservice': self.service.nom if self.service else None,

            'image': self.image,
        }
