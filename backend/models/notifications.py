from datetime import datetime
from models import db
from sqlalchemy import Sequence ,LargeBinary

class Notification(db.Model):
    __tablename__ = 'notifications'

    id_seq = Sequence('notif_id_seq', start=1, increment=1)
  
  
    id = db.Column(db.Integer, id_seq,primary_key=True, server_default=id_seq.next_value() )
    idpointage = db.Column(db.Integer, db.ForeignKey('pointages.id'), nullable=True)
    idpers = db.Column(db.Integer, db.ForeignKey('personnels.idpers'), nullable=True)
    description = db.Column(db.String(255), nullable=False)
    etat = db.Column(db.Boolean, default=False)  # False = non lu, True = lu
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    pointage = db.relationship('Pointage', backref='notifications', lazy=True)
    personnel = db.relationship('Personnels', backref='notifications', lazy=True)
