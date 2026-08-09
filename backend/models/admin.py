from . import db

from sqlalchemy import Sequence,Integer
from argon2 import PasswordHasher, exceptions as argon2_exceptions

# Initialiser Argon2
argon2 = PasswordHasher()

class Admin(db.Model):
    __tablename__ = 'admins'
      
    id_seq = Sequence('admins_idadmin_seq', start=1, increment=1)
 
    idadmin = db.Column(
        Integer,
        id_seq,
        primary_key=True,
        server_default=id_seq.next_value()  # 🔹 Auto-incrément Oracle
    )
    matricule = db.Column(db.String(100), unique=True, nullable=False)
    nom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)

    mot_de_passe = db.Column(db.String(255), nullable=False)
    can_change_password = db.Column(db.Boolean, default=True)

    # -------------------------------
    # Hash avec Argon2
    # -------------------------------
    def set_password(self, password):
        self.mot_de_passe = argon2.hash(password)

    def check_password(self, password):
        try:
            return argon2.verify(self.mot_de_passe, password)
        except argon2_exceptions.VerifyMismatchError:
            return False
        except Exception:
            return False

    def to_dict(self):
        return {
            'idadmin': self.idadmin,
            'matricule': self.matricule,
            'nom': self.nom
        }
