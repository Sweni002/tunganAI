from models import db
from sqlalchemy import Sequence, Enum
from datetime import datetime
import enum

class StatutPointage(enum.Enum):
    SUCCES = "succes"
    ERREUR = "erreur"

class EtapePointage(enum.Enum):
    VERIFICATION_MAC = "verification_mac" 
    COUVERTURE_VISAGE = "couverture_visage"
    ANTISPOOF = "antispoof"
    RECOGNITION = "recognition"
    ENREGISTREMENT = "enregistrement"

class TypePointage(enum.Enum):
    ENTREE = "entree"
    SORTIE = "sortie"

class JournalTentativePointage(db.Model):
    __tablename__ = 'journal_tentatives_pointage'

    id_seq = Sequence('journal_tentatives_pointage_id_seq', start=1, increment=1)
    id = db.Column(db.Integer, id_seq, primary_key=True, server_default=id_seq.next_value())

    idpers = db.Column(db.Integer, db.ForeignKey('personnels.idpers', ondelete='SET NULL'), nullable=True)
    role = db.Column(db.String(20), nullable=True)

    etape = db.Column(Enum(EtapePointage, native_enum=False, length=30), nullable=False)
    statut = db.Column(Enum(StatutPointage, native_enum=False, length=20), nullable=False)
    type_pointage = db.Column(Enum(TypePointage, native_enum=False, length=10), nullable=True)  # <-- ajouté
    message = db.Column(db.String(255), nullable=False)

    score_face = db.Column(db.Float, nullable=True)
    second_score = db.Column(db.Float, nullable=True)

    photo = db.Column(db.LargeBinary, nullable=True)
    mac_address = db.Column(db.String(17), nullable=True)
    temps_ms = db.Column(db.Integer, nullable=True)  # Temps total de l'étape
    temps_detail = db.Column(db.JSON, nullable=True)  # Détails des sous-opérations

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now, index=True)

    def to_dict(self, include_photo=False):
        d = {
            "id": self.id,
            "idpers": self.idpers,
            "role": self.role,
            "etape": self.etape.value,
            "statut": self.statut.value,
            "type_pointage": self.type_pointage.value if self.type_pointage else None,
            "message": self.message,
            "score_face": self.score_face,
            "second_score": self.second_score,
            "mac_address": self.mac_address,
             "temps_ms": self.temps_ms,
            "temps_detail": self.temps_detail,
            "date": self.created_at.date().isoformat(),
            "heure": self.created_at.strftime("%Hh:%M"),
            "has_photo": self.photo is not None,
        }
        if include_photo and self.photo:
            import base64
            d["photo_base64"] = base64.b64encode(self.photo).decode("utf-8")
        return d