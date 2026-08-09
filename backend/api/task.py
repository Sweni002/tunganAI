from datetime import datetime, date
from models import db
from models.pointages import Pointage
from models.personnels import Personnels

def creer_pointages_vides():
    today = date.today()

    # Vérifie s'il existe déjà des pointages pour aujourd'hui
    existants = Pointage.query.filter_by(date=today).first()
    if existants:
        print(f"[!] Les pointages du {today} existent déjà.")
        return

    personnels = Personnels.query.all()
    for p in personnels:
        pointage = Pointage(
            idpers=p.idpers,
            date=today,
            heure_entree_matin=None,
            heure_sortie_matin=None,
            heure_entree_soir=None,
            heure_sortie_soir=None,
            absence_matin=None,
            absence_soir=None,
            absence=None,
            presence=None,
            retard_matin=None,
            retard_soir=None,
            retard_total_minutes=None,
            justificatif=None
        )
        db.session.add(pointage)

    db.session.commit()
    print(f"[✓] Pointages vides créés pour {len(personnels)} employés à la date {today}.")
