from datetime import datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Sequence, String, UniqueConstraint

from models import db

# Valeurs possibles de `periode`
PERIODE_MATIN = "matin"
PERIODE_SOIR = "soir"
PERIODE_COMPLETE = "complete"
PERIODES = (PERIODE_MATIN, PERIODE_SOIR, PERIODE_COMPLETE)


class JourFerie(db.Model):
    """Jour férié d'UN service : matin, soir ou journée complète.

    Un jour férié bloque le pointage et le contrôle des absences pour la période
    concernée (utils/jours_feries.py).
    """

    __tablename__ = "jours_feries"
    __table_args__ = (
        UniqueConstraint("idserv", "date", "periode", name="uq_jour_ferie_service_date_periode"),
    )

    id_seq = Sequence("jours_feries_id_seq", start=1, increment=1)

    id = db.Column(Integer, id_seq, primary_key=True, server_default=id_seq.next_value())
    idserv = db.Column(
        Integer, ForeignKey("services.idserv", ondelete="CASCADE"), nullable=False, index=True
    )
    date = db.Column(Date, nullable=False, index=True)
    periode = db.Column(String(10), nullable=False, default=PERIODE_COMPLETE)
    motif = db.Column(String(255), nullable=False)
    created_at = db.Column(DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "idserv": self.idserv,
            "date": self.date.isoformat() if self.date else None,
            "periode": self.periode,
            "motif": self.motif,
        }
