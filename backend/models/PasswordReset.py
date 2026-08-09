from . import db

from sqlalchemy import Sequence,Integer

class PasswordReset(db.Model):
   tablename = 'password_resets'

   id_seq = Sequence('resets_id_seq', start=1, increment=1)
   
   id = db.Column(db.Integer, id_seq,primary_key=True,server_default=id_seq.next_value())
   email = db.Column(db.String(100), nullable=False)
   code = db.Column(db.String(6), nullable=False)
   expires_at = db.Column(db.DateTime, nullable=False)