from models import db
from sqlalchemy import Sequence, LargeBinary
import numpy as np
from werkzeug.security import generate_password_hash, check_password_hash


class Personnels(db.Model):
    __tablename__ = 'personnels'

    id_seq = Sequence('pers_idpers_seq', start=1, increment=1)

    idpers = db.Column(db.Integer, id_seq, primary_key=True, server_default=id_seq.next_value())
    matricule = db.Column(db.String(50), unique=True, nullable=False)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120))
    numtel = db.Column(db.String(20))
    image = db.Column(db.Text, nullable=True)
    embedding = db.Column(db.LargeBinary, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    iddiv = db.Column(db.Integer, db.ForeignKey('divisions.iddiv'), nullable=False)
    idrh = db.Column(db.Integer, db.ForeignKey('responsables.idrh'))
    division = db.relationship('Divisions', backref='personnels')
    role = db.Column(db.String(20), nullable=False, default="bureau")
    faceapi_descriptor = db.Column(LargeBinary, nullable=True)  # optionnel
    can_change_password = db.Column(db.Boolean, default=True)
    # type_pointage = db.Column(db.String(20), default="standard", nullable=False)

    # ------------------------------------------------------------------
    # Mot de passe
    # ------------------------------------------------------------------

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    # ------------------------------------------------------------------
    # Embedding de reconnaissance (calculé serveur par get_embeddings)
    # ------------------------------------------------------------------

    @staticmethod
    def _to_float32_bytes(value, field_name):
        """Sérialise un vecteur en float32. Retourne None si `value` est vide."""
        if value is None:
            return None
        if isinstance(value, np.ndarray):
            if value.size == 0:
                return None
            return value.astype(np.float32).tobytes()
        if isinstance(value, (list, tuple)):
            if len(value) == 0:
                return None
            return np.array(value, dtype=np.float32).tobytes()
        if isinstance(value, bytes):
            return value or None
        raise TypeError(f"Type inconnu pour {field_name}: {type(value)}")

    def set_embedding(self, emb_array):
        """Convertit le vecteur en binaire pour stockage.

        Accepte None pour effacer l'embedding (cas d'une image sans visage
        exploitable), au lieu de lever une exception.
        """
        self.embedding = self._to_float32_bytes(emb_array, "embedding")

    def get_embedding(self):
        """Reconvertit le binaire en vecteur numpy."""
        if self.embedding:
            return np.frombuffer(self.embedding, dtype=np.float32)
        return None

    # ------------------------------------------------------------------
    # Descripteur face-api (OPTIONNEL, hérité)
    #
    # ⚠️ Ce champ n'intervient dans aucune décision d'identification :
    # la reconnaissance s'appuie exclusivement sur `embedding`, calculé
    # côté serveur par get_embeddings() et comparé via combined_score().
    # Il est conservé pour compatibilité et peut rester vide.
    # ------------------------------------------------------------------

    def set_faceapi_descriptor(self, desc_array):
        """Stocke le descripteur. Accepte None pour l'effacer."""
        self.faceapi_descriptor = self._to_float32_bytes(desc_array, "faceapi_descriptor")

    def get_faceapi_descriptor(self):
        """Reconvertit le binaire en vecteur numpy, ou None."""
        if self.faceapi_descriptor:
            return np.frombuffer(self.faceapi_descriptor, dtype=np.float32)
        return None

    def has_faceapi_descriptor(self):
        return self.faceapi_descriptor is not None

    # ------------------------------------------------------------------

    def to_dict(self):
        return {
            "idpers": self.idpers,
            "matricule": self.matricule,
            "nom": self.nom,
            "prenom": self.prenom,
            "email": self.email,
            "numtel": self.numtel,
            "iddiv": self.iddiv,
            "image": self.image,
            "idrh": self.idrh,
            "role": self.role,
            # 'type_pointage': self.type_pointage
        }