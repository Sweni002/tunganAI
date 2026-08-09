from models import db
from sqlalchemy import Date, DateTime, Boolean, Integer, String, ForeignKey, Sequence
from sqlalchemy.orm import relationship ,backref
from datetime import datetime, time, date

class Pointage(db.Model):
    __tablename__ = 'pointages'

    id_seq = Sequence('pointages_id_seq', start=1, increment=1)

    id = db.Column(Integer,id_seq, primary_key=True,server_default=id_seq.next_value())
    date = db.Column(Date, nullable=False, index=True)

    # Horaires
    heure_entree_matin = db.Column(DateTime)
    heure_sortie_matin = db.Column(DateTime)
    heure_entree_soir  = db.Column(DateTime)
    heure_sortie_soir  = db.Column(DateTime)
    heure_entree_unique = db.Column(DateTime,nullable=True)
    heure_sortie_unique = db.Column(DateTime,nullable=True)

    # Retards / absences
    retard_matin         = db.Column(Boolean, nullable=True)
    retard_soir          = db.Column(Boolean, nullable=True)
    retard_total_minutes = db.Column(Integer, nullable=True)
    retard_matin_minutes = db.Column(Integer, nullable=True)
    retard_soir_minutes  = db.Column(Integer, nullable=True)

    absence_matin = db.Column(Boolean, nullable=True)
    absence_soir  = db.Column(Boolean, nullable=True)
    absence       = db.Column(Boolean, nullable=True)
    presence       = db.Column(Boolean, nullable=True)
    absence_unique = db.Column(Boolean, nullable=True)
    justificatif = db.Column(String(255))

    idpers = db.Column(Integer, ForeignKey('personnels.idpers', ondelete='CASCADE'), nullable=False)
    personnel = relationship("Personnels",backref=backref("autorisations_absences", cascade="all, delete-orphan"),
    passive_deletes=True)
   
    autorisationsortie = relationship("AutorisationSpeciale", back_populates="pointages")
    autorisationsortie_id = db.Column(
        Integer, db.ForeignKey("autorisations_speciales.id", ondelete="SET NULL")
    )
    autorisation_id = db.Column(Integer, db.ForeignKey('autorisations_absences.id', ondelete='SET NULL'))
    autorisation = relationship("AutorisationAbsence", back_populates="pointages")

    # -----------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------
    def calcul_retard_total_du_jour(self):
        retard_total = 0

        # --- Retard matin ---
        if self.heure_entree_matin:
            delta_matin = (self.heure_entree_matin.time().hour - 8) * 60 + self.heure_entree_matin.time().minute

            # Retard commence à 8h11 → marge 10 min (8h00 → 8h10)
            if delta_matin > 10:
                retard_total += delta_matin - 10

        # --- Retard après-midi ---
        if self.heure_entree_soir:
            delta_soir = (self.heure_entree_soir.time().hour - 14) * 60 + self.heure_entree_soir.time().minute

            # Retard commence à 14h01 (pas de marge)
            if delta_soir > 0:
                retard_total += delta_soir

        # Enregistrer dans la base
        self.retard_total_minutes = retard_total

        return retard_total

    @staticmethod
    def _fmt(dt):
        """Renvoie 'HHh:MM' ou None si dt est None."""
        return dt.strftime("%Hh:%M") if dt else None

    def to_dict(self):
        now = datetime.now()
        heure_actuelle = now.time()

        seuil_matin_absence = time(10, 0)
        seuil_matin_termine = time(11, 30)
        seuil_soir_absence  = time(14, 30)
        seuil_soir_termine  = time(18, 0)

        a_pointe_matin = self.heure_entree_matin is not None or self.heure_sortie_matin is not None
        a_pointe_soir  = self.heure_entree_soir is not None or self.heure_sortie_soir is not None

        # -----------------------
        # Absence matin
        # -----------------------
        if heure_actuelle < seuil_matin_absence:
            absence_matin = False if a_pointe_matin else None
        elif seuil_matin_absence <= heure_actuelle < seuil_matin_termine:
            absence_matin = self.absence_matin if self.absence_matin is not None else (False if a_pointe_matin else None)
        else:
            absence_matin = self.absence_matin or (not a_pointe_matin)

        # -----------------------
        # Absence soir
        # -----------------------
        if heure_actuelle < seuil_soir_absence:
            absence_soir = False if a_pointe_soir else None
        elif seuil_soir_absence <= heure_actuelle < seuil_soir_termine:
            absence_soir = self.absence_soir if self.absence_soir is not None else (False if a_pointe_soir else None)
        else:  # Après 18h
            if not a_pointe_soir:
                absence_soir = True
            else:
                absence_soir = self.absence_soir if self.absence_soir is not None else False

        # -----------------------
        # Retards
        # -----------------------
        retard_matin = self.retard_matin if a_pointe_matin else None
        retard_soir  = self.retard_soir if a_pointe_soir else None

        # Calcul du retard total en minutes
        retard_total = 0
        if retard_matin and self.heure_entree_matin:
            delta_matin = (self.heure_entree_matin.time().hour - 8) * 60 + self.heure_entree_matin.time().minute
            retard_total += max(0, delta_matin)
        if retard_soir and self.heure_entree_soir:
            delta_soir = (self.heure_entree_soir.time().hour - 14) * 60 + self.heure_entree_soir.time().minute
            retard_total += max(0, delta_soir)

        # -----------------------
        # Absence/P présence globales
        # -----------------------
        absence_global = None
        if absence_matin is not None and absence_soir is not None:
            absence_global = absence_matin and absence_soir

        presence_global = None
        if absence_global is not None:
            presence_global = not absence_global

        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "heure_entree_matin": self._fmt(self.heure_entree_matin),
            "heure_sortie_matin": self._fmt(self.heure_sortie_matin),
            "heure_entree_soir": self._fmt(self.heure_entree_soir),
            "heure_sortie_soir": self._fmt(self.heure_sortie_soir),
            "retard_matin": retard_matin,
            "retard_soir": retard_soir,
            "retard_total_minutes": retard_total,
            "absence_matin": absence_matin,
            "absence_unique": self.absence_unique,
            "absence_soir": absence_soir,
            "absence": absence_global,
            "presence": presence_global,
            "justificatif": self.justificatif,
            "idpers": self.idpers,
            "heure_sortie_unique": self._fmt(self.heure_sortie_unique),
            "heure_entree_unique": self._fmt(self.heure_entree_unique),
            "autorisation": (
                {
                    "id": self.autorisation.id,
                    "motif": self.autorisation.motif,
                    "type": (
                        self.autorisation.type_autorisation.nomtype
                        if self.autorisation.type_autorisation
                        else None
                    ),
                }
                if self.autorisation
                else None
            ),
        }
