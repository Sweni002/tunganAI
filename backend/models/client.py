from . import db

from sqlalchemy import Sequence, String, Integer, ForeignKey 
from sqlalchemy.orm import relationship ,backref
from werkzeug.security import generate_password_hash, check_password_hash

class Client(db.Model):
    __tablename__ = 'client'
    

    id_seq = Sequence('clients_idcli_seq', start=1, increment=1)
 
    idcli = db.Column(db.Integer, 
                        id_seq,
        primary_key=True,
        server_default=id_seq.next_value()  # 🔹 Auto-incrément Oracle
  )
    idpers = db.Column(Integer, ForeignKey('personnels.idpers' ,ondelete="CASCADE"), nullable=False)
    mdp_hash = db.Column(String(250), nullable=False)  # ✅ changer "mdp" en "mdp_hash"
     
    personnel = relationship(
    "Personnels",
    backref=backref("client", cascade="all, delete-orphan"),
    passive_deletes=True
)


    @property
    def mdp(self):
        raise AttributeError("Accès interdit au mot de passe brut")

    @mdp.setter
    def mdp(self, password):
        self.mdp_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.mdp_hash, password)

    def to_dict(self):
        return {
            "idcli": self.idcli,
            "idpers": self.idpers,
            "mdp_hash" :self.mdp_hash ,
            # Ne jamais exposer le hash ou le mot de passe
            "personnel": self.personnel.to_dict() if self.personnel else None
        }
