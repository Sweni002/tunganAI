from models import db
from sqlalchemy import Sequence

class Divisions(db.Model):
    __tablename__ = 'divisions'
    
    id_seq = Sequence('divs_iddiv_seq', start=1, increment=1)
 

    iddiv = db.Column(db.Integer,id_seq, primary_key=True, server_default=id_seq.next_value() 
    )
    nom = db.Column(db.String(100), nullable=False)
    
    idserv = db.Column(db.Integer, db.ForeignKey('services.idserv'), nullable=False)  # ✅ division → service
    
    def to_dict(self):
        return {
            'iddiv': self.iddiv,
            'nomdivision': self.nom ,
            'idserv': self.idserv,
            
             }