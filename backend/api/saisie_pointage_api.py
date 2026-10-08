"""Saisie MANUELLE des pointages d'un service (coupure de la reconnaissance faciale).

  GET  /api/pointage/saisie/<idserv>?date=AAAA-MM-JJ   agents du service + heures déjà enregistrées ce jour-là
  POST /api/pointage/saisie_manuelle                   enregistre les lignes modifiées (tout ou rien)

Mêmes règles que la modification d'un pointage par le responsable (update_pointage_responsable) :
  - entrée / sortie dans les plages horaires du service (sortie hors plage = autorisation de sortie requise) ;
  - sortie postérieure à l'entrée, et jamais de sortie sans entrée ;
  - retard calculé sur entree_*_fin (annulé par une autorisation de retard) ;
  - période fériée du service : modification refusée ;
  - le pointage du jour est créé s'il n'existe pas encore.
En plus :
  - aucune saisie dans le futur ni un week-end ;
  - détection d'un enregistrement concurrent : si quelqu'un a pointé une case depuis le chargement
    de la page (« base » ne correspond plus à la base), la ligne est refusée avec un message explicite.
Un responsable ne saisit que pour SON service. Toutes les erreurs sont renvoyées ensemble.
"""
from datetime import date, datetime, time

from flask import Blueprint, jsonify, request, session

from api.pointage_faciale import a_autorisation_retard, a_autorisation_sortie
from sqlalchemy import and_, or_

from models import AutorisationSpeciale, Divisions, Personnels, Pointage, Responsables, Services, db
from utils.jours_feries import ferie_pour_modification

bp = Blueprint("saisie_pointage_api", __name__)

try:  # socketio : rafraîchit les pages ouvertes (comme les autres endpoints de pointage)
    from __init__ import socketio
except Exception:  # pragma: no cover
    socketio = None

CHAMPS_BUREAU = ("entree_matin", "sortie_matin", "entree_soir", "sortie_soir")
CHAMPS_SURFACE = ("entree_unique", "sortie_unique")

LIBELLES = {
    "entree_matin": "entrée du matin",
    "sortie_matin": "sortie du matin",
    "entree_soir": "entrée de l'après-midi",
    "sortie_soir": "sortie de l'après-midi",
    "entree_unique": "entrée",
    "sortie_unique": "sortie",
}
COLONNES = {
    "entree_matin": "heure_entree_matin",
    "sortie_matin": "heure_sortie_matin",
    "entree_soir": "heure_entree_soir",
    "sortie_soir": "heure_sortie_soir",
    "entree_unique": "heure_entree_unique",
    "sortie_unique": "heure_sortie_unique",
}


# Bornes ABSOLUES de la journée (aucune heure en dehors, même avec une autorisation de sortie)
BORNES = {"matin": (time(6, 0), time(13, 0)), "soir": (time(12, 0), time(19, 0))}


# ===========================================================================
# OUTILS
# ===========================================================================

def _acces_service(idserv):
    """None si autorisé, sinon (réponse, code). Responsable de CE service uniquement."""
    if session.get("role") == "responsable":
        responsable = Responsables.query.get(session.get("responsable_id"))
        if responsable and responsable.idserv == idserv:
            return None
    return jsonify({"error": "Accès refusé à ce service"}), 403


def _hhmm(valeur):
    if not valeur:
        return None
    return valeur.strftime("%H:%M") if hasattr(valeur, "strftime") else str(valeur)[:5]


def _heure(valeur):
    """datetime/time -> time (les horaires du service sont stockés en DateTime)."""
    return valeur.time() if isinstance(valeur, datetime) else valeur


def _parse_heure(texte):
    """« HH:MM » -> time, None si vide ; ValueError si invalide."""
    if texte in (None, ""):
        return None
    return datetime.strptime(str(texte)[:5], "%H:%M").time()


def _cle_matricule(p):
    try:
        return (0, int(p.matricule))
    except (TypeError, ValueError):
        return (1, str(p.matricule))


def _jour_depuis_requete(valeur):
    try:
        return datetime.strptime(valeur, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def _controle_date(jour):
    """Message d'erreur si la date ne se prête pas à une saisie, sinon None."""
    if jour > date.today():
        return "La date est dans le futur : on ne peut pas saisir de pointage à l'avance."
    if jour.weekday() >= 5:
        return "La date est un week-end : il n'y a pas de pointage ce jour-là."
    return None


# ===========================================================================
# LECTURE
# ===========================================================================

@bp.route("/saisie/<int:idserv>", methods=["GET"])
def saisie_liste(idserv):
    erreur = _acces_service(idserv)
    if erreur:
        return erreur
    service = Services.query.get(idserv)
    if not service:
        return jsonify({"error": "Service introuvable"}), 404

    jour = _jour_depuis_requete(request.args.get("date")) or date.today()

    personnels = (
        Personnels.query.join(Divisions, Personnels.iddiv == Divisions.iddiv)
        .filter(Divisions.idserv == idserv)
        .all()
    )
    personnels.sort(key=_cle_matricule)
    divisions = Divisions.query.filter_by(idserv=idserv).all()
    noms_divisions = {d.iddiv: d.nom for d in divisions}
    effectifs = {}
    for p in personnels:
        effectifs[p.iddiv] = effectifs.get(p.iddiv, 0) + 1

    pointages = {}
    ids = [p.idpers for p in personnels]
    for debut in range(0, len(ids), 900):  # limite d'un IN Oracle
        for pt in Pointage.query.filter(
            Pointage.date == jour, Pointage.idpers.in_(ids[debut:debut + 900])
        ).all():
            pointages[pt.idpers] = pt

    # Autorisations spéciales valables ce jour-là : sortie / retard, par période.
    # Sans date_fin = jour unique (date_debut) ; avec date_fin = plage.
    autorisations = {}
    for debut in range(0, len(ids), 900):
        for a in AutorisationSpeciale.query.filter(
            AutorisationSpeciale.idpers.in_(ids[debut:debut + 900]),
            or_(
                and_(AutorisationSpeciale.date_fin.is_(None), AutorisationSpeciale.date_debut == jour),
                and_(
                    AutorisationSpeciale.date_fin.isnot(None),
                    AutorisationSpeciale.date_debut <= jour,
                    AutorisationSpeciale.date_fin >= jour,
                ),
            ),
        ).all():
            type_a = a.type_autorisation.value if a.type_autorisation else None
            periode = "matin" if (a.periode and a.periode.value == "matin") else "soir"
            if type_a in ("sortie", "retard"):
                autorisations.setdefault(a.idpers, {})[f"{type_a}_{periode}"] = True

    lignes = []
    for p in personnels:
        pt = pointages.get(p.idpers)
        ligne = {
            "idpers": p.idpers,
            "matricule": p.matricule,
            "nom": p.nom,
            "prenom": p.prenom,
            "role": p.role,
            "division": noms_divisions.get(p.iddiv),
            "iddiv": p.iddiv,
            # {"sortie_matin": True, "retard_soir": True, ...} : lève les limites horaires correspondantes
            "autorisations": autorisations.get(p.idpers, {}),
            "idpointage": pt.id if pt else None,
            "absence_matin": bool(pt.absence_matin) if pt else False,
            "absence_soir": bool(pt.absence_soir) if pt else False,
            "absence_unique": bool(pt.absence_unique) if pt else False,
        }
        for champ in CHAMPS_BUREAU + CHAMPS_SURFACE:
            ligne[champ] = _hhmm(getattr(pt, COLONNES[champ], None)) if pt else None
        lignes.append(ligne)

    horaire = getattr(service, "horaire", None)
    horaires = (
        {
            c: _hhmm(getattr(horaire, c, None))
            for c in (
                "entree_matin_debut", "entree_matin_fin", "sortie_matin_debut", "sortie_matin_fin",
                "entree_soir_debut", "entree_soir_fin", "sortie_soir_debut", "sortie_soir_fin",
            )
        }
        if horaire
        else None
    )

    ferie = ferie_pour_modification(idserv, jour)

    return jsonify({
        "date": jour.isoformat(),
        "service": service.nom,
        "personnels": lignes,
        "divisions": sorted(
            ({"iddiv": d.iddiv, "nom": d.nom, "effectif": effectifs.get(d.iddiv, 0)} for d in divisions),
            key=lambda d: d["nom"].lower(),
        ),
        "horaires": horaires,
        "ferie": {"matin": ferie["matin"], "soir": ferie["soir"], "motif": ferie.get("motif")} if ferie else None,
        "avertissement": _controle_date(jour),
    }), 200


# ===========================================================================
# ENREGISTREMENT
# ===========================================================================

def _nouveau_pointage(idpers, jour):
    return Pointage(
        idpers=idpers,
        date=jour,
        heure_entree_matin=None,
        heure_sortie_matin=None,
        heure_entree_soir=None,
        heure_sortie_soir=None,
        absence_matin=None,
        absence_soir=None,
        absence=None,
        presence=None,
        retard_matin=False,
        retard_soir=False,
        retard_total_minutes=0,
    )


def _traiter_ligne(ligne, personnel, jour, idserv, ferie):
    """Applique une ligne à son pointage. Retourne (pointage, messages d'erreur, a_change)."""
    erreurs = []
    est_surface = personnel.role == "surface"
    champs = CHAMPS_SURFACE if est_surface else CHAMPS_BUREAU

    pointage = Pointage.query.filter_by(idpers=personnel.idpers, date=jour).first()
    cree = pointage is None
    if cree:
        pointage = _nouveau_pointage(personnel.idpers, jour)

    # ---- Valeurs saisies (seules les clés présentes sont traitées) ----
    nouvelles = {}
    for champ in champs:
        if champ not in ligne:
            continue
        try:
            nouvelles[champ] = _parse_heure(ligne.get(champ))
        except ValueError:
            erreurs.append(f"{LIBELLES[champ].capitalize()} : heure invalide « {ligne.get(champ)} » (format HH:MM).")

    base = ligne.get("base") or {}
    changes = {}
    for champ, valeur in nouvelles.items():
        actuel = getattr(pointage, COLONNES[champ])
        if _hhmm(valeur) == _hhmm(actuel):
            continue  # inchangé

        # Enregistrement concurrent : la base n'est plus ce que le responsable a vu
        if champ in base and _hhmm(actuel) != (base.get(champ) or None):
            erreurs.append(
                f"a déjà pointé {LIBELLES[champ]}"
                f"{f' à {_hhmm(actuel)}' if actuel else ' (supprimée depuis)'}"
                " depuis le chargement de la page : rechargez la liste."
            )
            continue
        changes[champ] = valeur

    if not changes:
        return pointage, erreurs, False

    # ---- Jour férié du service : période non modifiable ----
    if ferie:
        if est_surface:
            if ferie["matin"] and ferie["soir"]:
                erreurs.append(f"Jour férié ({ferie.get('motif') or 'sans motif'}) : la journée ne peut pas être modifiée.")
        else:
            for champ in changes:
                periode = "matin" if champ.endswith("matin") else "soir"
                if ferie[periode]:
                    erreurs.append(
                        f"Jour férié ({ferie.get('motif') or 'sans motif'}) : "
                        f"{LIBELLES[champ]} non modifiable."
                    )

    # ---- Valeurs résultantes (anciennes + modifiées) ----
    def valeur(champ):
        if champ in changes:
            return changes[champ]
        actuel = getattr(pointage, COLONNES[champ])
        return actuel.time() if actuel else None

    # ---- Bornes absolues : matin 06:00 – 13:00, après-midi 12:00 – 19:00 ----
    if not est_surface:
        for champ, valeur_champ in changes.items():
            if not valeur_champ:
                continue
            periode = "matin" if champ.endswith("matin") else "soir"
            debut_b, fin_b = BORNES[periode]
            if not (debut_b <= valeur_champ <= fin_b):
                erreurs.append(
                    f"{LIBELLES[champ].capitalize()} ({valeur_champ:%H:%M}) hors des heures permises "
                    f"({debut_b:%H:%M} – {fin_b:%H:%M})."
                )

    # ---- Règles horaires (agents de bureau) ----
    horaires = None
    if not est_surface:
        horaires = personnel.division.service.horaire if personnel.division and personnel.division.service else None
        if not horaires:
            erreurs.append("Horaires non configurés pour ce service.")

    if horaires:
        em_d, em_f = _heure(horaires.entree_matin_debut), _heure(horaires.entree_matin_fin)
        sm_d, sm_f = _heure(horaires.sortie_matin_debut), _heure(horaires.sortie_matin_fin)
        es_d, es_f = _heure(horaires.entree_soir_debut), _heure(horaires.entree_soir_fin)
        ss_d, ss_f = _heure(horaires.sortie_soir_debut), _heure(horaires.sortie_soir_fin)

        def plage(d, f):
            return f"{d:%H:%M} – {f:%H:%M}"

        if "entree_matin" in changes and changes["entree_matin"] and not (em_d <= changes["entree_matin"] < sm_d):
            erreurs.append(
                f"Entrée du matin ({changes['entree_matin']:%H:%M}) hors des plages du service "
                f"(entrée possible de {em_d:%H:%M} à {sm_d:%H:%M})."
            )
        if "entree_soir" in changes and changes["entree_soir"] and not (es_d <= changes["entree_soir"] < ss_d):
            erreurs.append(
                f"Entrée de l'après-midi ({changes['entree_soir']:%H:%M}) hors des plages du service "
                f"(entrée possible de {es_d:%H:%M} à {ss_d:%H:%M})."
            )
        for champ, periode_aut, debut, fin in (
            ("sortie_matin", "matin", sm_d, sm_f),
            ("sortie_soir", "apres_midi", ss_d, ss_f),
        ):
            h = changes.get(champ)
            if h and not (debut <= h <= fin) and not a_autorisation_sortie(personnel.idpers, jour, periode_aut):
                erreurs.append(
                    f"{LIBELLES[champ].capitalize()} ({h:%H:%M}) hors de la plage du service "
                    f"({plage(debut, fin)}) et sans autorisation de sortie."
                )

    # ---- Cohérence entrée / sortie ----
    paires = (
        (("entree_unique", "sortie_unique"),)
        if est_surface
        else (("entree_matin", "sortie_matin"), ("entree_soir", "sortie_soir"))
    )
    for entree, sortie in paires:
        e, s = valeur(entree), valeur(sortie)
        if s and not e:
            erreurs.append(f"{LIBELLES[sortie].capitalize()} renseignée sans {LIBELLES[entree]}.")
        elif e and s and s < e:
            erreurs.append(
                f"{LIBELLES[sortie].capitalize()} ({s:%H:%M}) antérieure à {LIBELLES[entree]} ({e:%H:%M})."
            )

    if erreurs:
        return pointage, erreurs, True

    # ---- Application ----
    for champ, valeur_champ in changes.items():
        setattr(
            pointage,
            COLONNES[champ],
            datetime.combine(jour, valeur_champ) if valeur_champ else None,
        )

    if est_surface:
        if pointage.heure_entree_unique:
            pointage.absence_unique = False
            pointage.presence = True
    else:
        # Mêmes règles que la modification d'un pointage
        if pointage.heure_entree_matin and pointage.heure_sortie_matin:
            pointage.absence_matin = False
        if pointage.heure_entree_soir and pointage.heure_sortie_soir:
            pointage.absence_soir = False

        def retard(entree_dt, limite, periode):
            if not entree_dt:
                return False, 0
            minutes = int((entree_dt - datetime.combine(jour, _heure(limite))).total_seconds() / 60)
            if minutes > 0 and not a_autorisation_retard(personnel.idpers, jour, periode):
                return True, minutes
            return False, 0

        if pointage.heure_entree_matin and not pointage.absence_matin:
            pointage.retard_matin, pointage.retard_matin_minutes = retard(
                pointage.heure_entree_matin, horaires.entree_matin_fin, "matin"
            )
        else:
            pointage.retard_matin, pointage.retard_matin_minutes = False, 0

        if pointage.heure_entree_soir and not pointage.absence_soir:
            pointage.retard_soir, pointage.retard_soir_minutes = retard(
                pointage.heure_entree_soir, horaires.entree_soir_fin, "apres_midi"
            )
        else:
            pointage.retard_soir, pointage.retard_soir_minutes = False, 0

        pointage.retard_total_minutes = (pointage.retard_matin_minutes or 0) + (pointage.retard_soir_minutes or 0)
        pointage.absence = bool(pointage.absence_matin and pointage.absence_soir)
        pointage.presence = not pointage.absence

    if cree:
        db.session.add(pointage)
    return pointage, erreurs, True


@bp.route("/saisie_manuelle", methods=["POST"])
def saisie_manuelle():
    data = request.get_json(silent=True) or {}

    try:
        idserv = int(data.get("idserv"))
    except (TypeError, ValueError):
        return jsonify({"error": "idserv requis"}), 400

    erreur = _acces_service(idserv)
    if erreur:
        return erreur

    jour = _jour_depuis_requete(data.get("date"))
    if not jour:
        return jsonify({"error": "date invalide (format AAAA-MM-JJ)"}), 400
    probleme = _controle_date(jour)
    if probleme:
        return jsonify({"error": probleme}), 400

    lignes = data.get("lignes")
    if not isinstance(lignes, list) or not lignes:
        return jsonify({"error": "Aucune ligne à enregistrer"}), 400
    if len(lignes) > 1000:
        return jsonify({"error": "Trop de lignes (1000 maximum)"}), 400

    # Agents du service concernés, en une requête
    ids = []
    for l in lignes:
        try:
            ids.append(int(l.get("idpers")))
        except (TypeError, ValueError):
            pass
    personnels = {}
    for debut in range(0, len(ids), 900):
        for p in (
            Personnels.query.join(Divisions, Personnels.iddiv == Divisions.iddiv)
            .filter(Divisions.idserv == idserv, Personnels.idpers.in_(ids[debut:debut + 900]))
            .all()
        ):
            personnels[p.idpers] = p

    ferie = ferie_pour_modification(idserv, jour)

    erreurs, enregistres, crees = [], 0, 0
    try:
        for l in lignes:
            try:
                idpers = int(l.get("idpers"))
            except (TypeError, ValueError):
                erreurs.append({"idpers": None, "matricule": None, "nom": "Ligne inconnue", "messages": ["idpers manquant"]})
                continue

            personnel = personnels.get(idpers)
            if not personnel:
                erreurs.append({
                    "idpers": idpers, "matricule": None, "nom": f"Agent {idpers}",
                    "messages": ["Cet agent n'appartient pas à votre service."],
                })
                continue

            pointage, messages, modifie = _traiter_ligne(l, personnel, jour, idserv, ferie)
            if messages:
                erreurs.append({
                    "idpers": idpers,
                    "matricule": personnel.matricule,
                    "nom": f"{personnel.prenom} {personnel.nom}",
                    "messages": messages,
                })
            elif modifie:
                enregistres += 1
                if pointage.id is None:
                    crees += 1

        if erreurs:
            db.session.rollback()
            n = len(erreurs)
            return jsonify({
                "error": f"{n} ligne{'s' if n > 1 else ''} refusée{'s' if n > 1 else ''} : rien n'a été enregistré.",
                "erreurs": erreurs,
            }), 400

        if not enregistres:
            db.session.rollback()
            return jsonify({"message": "Aucune modification à enregistrer", "enregistres": 0, "crees": 0}), 200

        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": "Erreur lors de l'enregistrement", "details": str(exc)}), 500

    if socketio is not None:
        try:
            socketio.emit("pointage_update")
        except Exception:
            pass

    return jsonify({
        "message": f"{enregistres} pointage{'s' if enregistres > 1 else ''} enregistré{'s' if enregistres > 1 else ''}"
                   + (f" dont {crees} créé{'s' if crees > 1 else ''}" if crees else ""),
        "enregistres": enregistres,
        "crees": crees,
    }), 200
