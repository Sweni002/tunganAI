from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .personnels import Personnels
from .divisions import Divisions  # ✅ Ajoute cette ligne
from .pointages import Pointage
from .conge import Conge
from .admin import Admin
from .autorisationAbsence import AutorisationAbsence
from .client import Client
from .type import TypeAutorisations
from .Responsable import Responsables
from .services import (Services ,ServiceMacAutorisee)
from .PasswordReset import PasswordReset
from .notifications import Notification
from .horaire import HorairesService 
from .AutorisationSpeciale import (
    AutorisationSpeciale,
    TypeAutorisation,
    PeriodeAutorisation,
)
from .mac_non_autorisees import MacNonAutorisee

from .journalPointage import JournalTentativePointage