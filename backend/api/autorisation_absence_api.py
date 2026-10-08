from flask import Blueprint, request, jsonify
from models import db, AutorisationAbsence, Personnels ,TypeAutorisations  ,Pointage,Responsables,Services
from datetime import datetime ,timedelta
from dateutil.parser import isoparse
from __init__ import socketio

bp = Blueprint('autorisation_api', __name__)


_PER_PAGE_MAX = 100


def _personnels_du_service(idserv):
    """Sous-requête : idpers des agents des divisions du service (évite de charger les ids en mémoire)."""
    from sqlalchemy import select
    from models import Divisions

    divisions_du_service = select(Divisions.iddiv).where(Divisions.idserv == idserv)
    return select(Personnels.idpers).where(Personnels.iddiv.in_(divisions_du_service))


def _parse_date_ou_none(valeur):
    return datetime.strptime(valeur, "%Y-%m-%d").date() if valeur else None


@bp.route("/<int:idserv>", methods=["GET"])
def get_autorisations_by_service(idserv):
    """Autorisations d'un service.

    Sans paramètre : toute la liste (comportement historique).
    Paramètres optionnels, combinables :
      - page, per_page : pagination serveur (per_page <= 100) ; ajoute total/page/per_page
      - q              : recherche matricule / nom / prénom / motif
      - date           : un jour précis (YYYY-MM-DD)
      - start, end     : plage de dates (YYYY-MM-DD)
    Avec `page`, la réponse est un objet {"data": [...], "total": n, ...} ;
    sans `page`, c'est une liste, comme avant.
    """
    from sqlalchemy import func, or_
    from sqlalchemy.orm import joinedload
    from models import Services

    if not Services.query.get(idserv):
        return jsonify({"error": "Service non trouvé"}), 404

    try:
        date_unique = _parse_date_ou_none(request.args.get("date"))
        debut = _parse_date_ou_none(request.args.get("start"))
        fin = _parse_date_ou_none(request.args.get("end"))
    except ValueError:
        return jsonify({"error": "Format de date invalide. Utilisez AAAA-MM-JJ."}), 400

    if debut and fin and fin < debut:
        return jsonify({"error": "'end' doit être une date postérieure ou égale à 'start'."}), 400

    query = AutorisationAbsence.query.filter(
        AutorisationAbsence.idpers.in_(_personnels_du_service(idserv))
    )

    if date_unique:
        query = query.filter(AutorisationAbsence.date_absence == date_unique)
    if debut:
        query = query.filter(AutorisationAbsence.date_absence >= debut)
    if fin:
        query = query.filter(AutorisationAbsence.date_absence <= fin)

    q = (request.args.get("q") or "").strip().lower()
    if q:
        motif = f"%{q}%"
        query = query.join(Personnels, AutorisationAbsence.idpers == Personnels.idpers).filter(
            or_(
                func.lower(Personnels.matricule).like(motif),
                func.lower(Personnels.nom).like(motif),
                func.lower(Personnels.prenom).like(motif),
                func.lower(AutorisationAbsence.motif).like(motif),
            )
        )

    # Les plus récentes d'abord ; l'id départage les ex æquo (pagination stable)
    query = query.order_by(AutorisationAbsence.date_absence.desc(), AutorisationAbsence.id.desc())

    page = request.args.get("page", type=int)
    if not page:
        return jsonify([a.to_dict() for a in query.all()]), 200

    page = max(page, 1)
    per_page = max(1, min(request.args.get("per_page", default=10, type=int) or 10, _PER_PAGE_MAX))

    total = query.order_by(None).count()
    lignes = (
        query.options(
            joinedload(AutorisationAbsence.personnel),
            joinedload(AutorisationAbsence.type_autorisation),
        )
        .limit(per_page)
        .offset((page - 1) * per_page)
        .all()
    )

    return jsonify({
        "data": [a.to_dict() for a in lignes],
        "total": total,
        "page": page,
        "per_page": per_page,
    }), 200


@bp.route("/stats/<int:idserv>", methods=["GET"])
def get_stats_autorisations(idserv):
    """Statistiques des autorisations d'absence d'UN service.

    Filtres optionnels, identiques à la liste : date, start + end, q (recherche).
    Réponse : total, états (en cours / à venir / terminées), demi-journées
    (matin / après-midi / complète) et répartition par type d'autorisation.
    Un responsable ne consulte que son service.
    """
    from datetime import date as _date
    from flask import session
    from sqlalchemy import case, func, or_

    if session.get("role") == "responsable":
        responsable = Responsables.query.get(session.get("responsable_id"))
        if not responsable or responsable.idserv != idserv:
            return jsonify({"error": "Accès refusé à ce service"}), 403

    try:
        date_unique = _parse_date_ou_none(request.args.get("date"))
        debut = _parse_date_ou_none(request.args.get("start"))
        fin = _parse_date_ou_none(request.args.get("end"))
    except ValueError:
        return jsonify({"error": "Format de date invalide. Utilisez AAAA-MM-JJ."}), 400

    if debut and fin and fin < debut:
        return jsonify({"error": "'end' doit être une date postérieure ou égale à 'start'."}), 400

    def filtrer(query):
        query = query.filter(AutorisationAbsence.idpers.in_(_personnels_du_service(idserv)))
        if date_unique:
            query = query.filter(AutorisationAbsence.date_absence == date_unique)
        if debut:
            query = query.filter(AutorisationAbsence.date_absence >= debut)
        if fin:
            query = query.filter(AutorisationAbsence.date_absence <= fin)

        q = (request.args.get("q") or "").strip().lower()
        if q:
            motif = f"%{q}%"
            query = query.join(Personnels, AutorisationAbsence.idpers == Personnels.idpers).filter(
                or_(
                    func.lower(Personnels.matricule).like(motif),
                    func.lower(Personnels.nom).like(motif),
                    func.lower(Personnels.prenom).like(motif),
                    func.lower(AutorisationAbsence.motif).like(motif),
                )
            )
        return query

    aujourdhui = _date.today()
    A = AutorisationAbsence

    # États et demi-journées : UNE requête d'agrégation
    ligne = filtrer(
        db.session.query(
            func.count(A.id),
            func.sum(case((A.date_absence < aujourdhui, 1), else_=0)),
            func.sum(case((A.date_absence > aujourdhui, 1), else_=0)),
            func.sum(case((A.demi_journee == "matin", 1), else_=0)),
            func.sum(case((A.demi_journee == "apres-midi", 1), else_=0)),
            func.sum(case((A.demi_journee == "complete", 1), else_=0)),
        )
    ).one()

    total = int(ligne[0] or 0)
    terminees = int(ligne[1] or 0)
    a_venir = int(ligne[2] or 0)

    # Répartition par type (jointure sur le type, nom du type + abréviation)
    types = filtrer(
        db.session.query(TypeAutorisations.nomtype, TypeAutorisations.abbreviation, func.count(A.id))
        .select_from(A)
        .join(TypeAutorisations, A.idtype == TypeAutorisations.idtype)
    ).group_by(TypeAutorisations.nomtype, TypeAutorisations.abbreviation).order_by(func.count(A.id).desc()).all()

    return jsonify({
        "idserv": idserv,
        "total": total,
        "etats": {
            "en_cours": total - terminees - a_venir,
            "a_venir": a_venir,
            "terminees": terminees,
        },
        "demi_journees": {
            "matin": int(ligne[3] or 0),
            "apres_midi": int(ligne[4] or 0),
            "complete": int(ligne[5] or 0),
        },
        "par_type": [
            {"type": nom, "abreviation": abbr, "nombre": int(n)} for nom, abbr, n in types
        ],
    }), 200


@bp.route('/par-date', methods=['GET'])
def get_autorisations_par_date():
    date_str = request.args.get('date')
    try:
        if not date_str:
            return jsonify({"error": "Le paramètre 'date' est requis."}), 400

        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()

        query = AutorisationAbsence.query.filter_by(date_absence=date_obj)

        # Restreint au service demandé : sans idserv, on garde l'ancien comportement
        idserv = request.args.get('idserv', type=int)
        if idserv:
            query = query.filter(AutorisationAbsence.idpers.in_(_personnels_du_service(idserv)))

        return jsonify([a.to_dict() for a in query.all()]), 200
    except ValueError:
        return jsonify({"error": "Format de date invalide. Utilisez AAAA-MM-JJ."}), 400


@bp.route("/between_dates/<int:idserv>", methods=["GET"])
def get_autorisations_between_dates_by_service(idserv):
    from datetime import datetime
    from models import AutorisationAbsence, Personnels, Divisions, Services

    start_str = request.args.get("start")
    end_str = request.args.get("end")

    if not start_str or not end_str:
        return jsonify({"error": "Les paramètres 'start' et 'end' sont requis."}), 400

    try:
        start_date = datetime.strptime(start_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Format de date invalide. Utilisez AAAA-MM-JJ."}), 400

    if end_date < start_date:
        return jsonify({"error": "'end' doit être une date postérieure ou égale à 'start'."}), 400

    # Vérifier que le service existe
    service = Services.query.get(idserv)
    if not service:
        return jsonify({"error": "Service non trouvé"}), 404

    # Récupérer les divisions du service
    divisions_ids = [d.iddiv for d in service.divisions]  # assumes Services a une relation "divisions"

    # Récupérer les personnels de ces divisions
    personnels_ids = [
        p.idpers for p in Personnels.query.filter(Personnels.iddiv.in_(divisions_ids)).all()
    ]

    # Récupérer les autorisations pour ces personnels entre les dates
    autorisations = AutorisationAbsence.query.filter(
        AutorisationAbsence.idpers.in_(personnels_ids),
        AutorisationAbsence.date_absence >= start_date,
        AutorisationAbsence.date_absence <= end_date,
    ).all()

    return jsonify([a.to_dict() for a in autorisations]), 200

@bp.route('/', methods=['POST'])
def add_autorisation():
    data = request.json
    try:
        # 🔹 Dates
        from dateutil.parser import isoparse

        date_debut = isoparse(data['date_debut']).astimezone().date()
        date_fin = isoparse(data['date_fin']).astimezone().date()

        if date_debut > date_fin:
            return jsonify({"error": "La date de début ne peut pas être supérieure à la date de fin."}), 400
        

        motif = data['motif']
        idpers = data['idpers']
        idtype = data.get('type')           
        demi_journee = data.get('demi_journee')  # matin / apres-midi / complete / None

        # Vérification du personnel
        personnel = Personnels.query.get(idpers)
        if not personnel:
            return jsonify({"error": "Personnel non trouvé"}), 404

        # Vérification du type d'autorisation
        type_autorisation = None
        if idtype:
            type_autorisation = TypeAutorisations.query.get(idtype)
            if not type_autorisation:
                return jsonify({"error": "Type d'autorisation non trouvé"}), 404

        # 🔹 Générer toutes les dates
        delta = (date_fin - date_debut).days
        dates_a_inserer = [date_debut + timedelta(days=i) for i in range(delta + 1)]

        # Vérification des doublons
        doublons = AutorisationAbsence.query.filter(
            AutorisationAbsence.idpers == idpers,
            AutorisationAbsence.date_absence.in_(dates_a_inserer)
        ).all()
        if doublons:
            dates_doublons = [d.date_absence.isoformat() for d in doublons]
            return jsonify({
                "error": "Certaines dates sont déjà autorisées pour ce personnel.",
                "dates_doublons": dates_doublons
            }), 409

        # 🔹 Création des autorisations
        nouvelles_autorisations = []
        for d in dates_a_inserer:
            # ✅ Déterminer la demi-journée pour chaque jour
            if len(dates_a_inserer) == 1:
                # Un seul jour : on garde ce que l'utilisateur a choisi (matin/après-midi/complete)
                demi_journee_jour = demi_journee or "complete"
            else:
                # Plusieurs jours
                if d == date_fin:
                    # Le dernier jour = demi-journée choisie par l'utilisateur
                    demi_journee_jour = demi_journee or "complete"
                else:
                    # Tous les autres jours = complète
                    demi_journee_jour = "complete"

            # Création de l'autorisation
            autorisation = AutorisationAbsence(
                date_absence=d,
                motif=motif,
                idpers=idpers,
                idtype=idtype,
                demi_journee=demi_journee_jour
            )
            db.session.add(autorisation)
            db.session.flush()  # obtenir l'id avant commit
            nouvelles_autorisations.append(autorisation)

            # 🔹 Mise à jour du pointage existant
            pointage = Pointage.query.filter_by(date=d, idpers=idpers).first()
            if not pointage:
                pointage = Pointage(date=d, idpers=idpers)
                db.session.add(pointage)
                db.session.flush()

            pointage.autorisation_id = autorisation.id

            type_nom = type_autorisation.nomtype if type_autorisation else ""
            pointage.justificatif = f"{motif} ({type_nom})" if type_nom else motif

            # 🔹 Définir les absences sur le pointage selon demi-journée
            if demi_journee_jour == 'matin':
                pointage.absence_matin = True

            elif demi_journee_jour == 'apres-midi':
                pointage.absence_soir = True

            else:
                # complète
                pointage.absence_matin = True
                pointage.absence_soir = True
                pointage.absence = True
            
            if personnel.role == "surface":
                 pointage.heure_entree_unique = None  # ou tu peux mettre l'heure réelle
                 pointage.absence_unique = True

            db.session.add(pointage)

        db.session.commit()
        socketio.emit("pointage_update")

        return jsonify([a.to_dict() for a in nouvelles_autorisations]), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@bp.route('/<int:id>', methods=['DELETE'])
def delete_autorisation(id):
    autorisation = AutorisationAbsence.query.get(id)
    if not autorisation:
        return jsonify({"error": "Autorisation non trouvée"}), 404

    try:
        # Mise à jour du pointage s’il existe à la même date
        from models import Pointage
        pointage = Pointage.query.filter_by(date=autorisation.date_absence, idpers=autorisation.idpers).first()
        if pointage:
            # Vérifie si le justificatif correspond à l'autorisation
            if pointage.justificatif == autorisation.motif:
                pointage.justificatif = None

            # Mettre à jour les absences selon le type de demi-journée
            if autorisation.demi_journee == "matin":
                pointage.absence_matin = None
            elif autorisation.demi_journee == "apres-midi":
                pointage.absence_soir = None
            else:  # journée entière
                pointage.absence_matin = None
                pointage.absence_soir = None
                pointage.absence = None
            db.session.add(pointage) 

        db.session.delete(autorisation)
        db.session.commit() 
        socketio.emit("pointage_update")


        return jsonify({"message": "Autorisation supprimée avec succès"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@bp.route("/<int:id>", methods=["PUT"])
def update_autorisation(id):
    data = request.json
    try:
        from dateutil.parser import isoparse
        from datetime import timedelta
        import dateutil.parser
        # 🔹 Dates

        # 🔹 Dates
        date_debut = isoparse(data["date_debut"]).astimezone().date()
        date_fin = isoparse(data["date_fin"]).astimezone().date()

        print(date_debut)
        if date_debut > date_fin:
            return (
                jsonify(
                    {
                        "error": "La date de début ne peut pas être supérieure à la date de fin."
                    }
                ),
                400,
            )

        motif = data["motif"]
        idpers = data["idpers"]
        idtype = data.get("idtype")
        demi_journee = data.get("demi_journee")  # matin/apres-midi/complete/None

        # 🔹 Vérification du personnel
        personnel = Personnels.query.get(idpers)
        if not personnel:
            return jsonify({"error": "Personnel non trouvé"}), 404

        # 🔹 Vérification de l'autorisation existante
        autorisation_existante = AutorisationAbsence.query.get(id)
        if not autorisation_existante:
            return jsonify({"error": "Autorisation d'origine non trouvée"}), 404

        # 🔹 Calcul des dates à traiter
        delta = (date_fin - date_debut).days
        dates_a_traiter = [date_debut + timedelta(days=i) for i in range(delta + 1)]

        # 🔹 Vérifier doublons hors autorisation actuelle
        doublons = AutorisationAbsence.query.filter(
            AutorisationAbsence.idpers == idpers,
            AutorisationAbsence.date_absence.in_(dates_a_traiter),
            AutorisationAbsence.id != id,
        ).all()
        if doublons:
            dates_doublons = [d.date_absence.isoformat() for d in doublons]
            return (
                jsonify(
                    {
                        "error": "Certaines dates ont déjà une autorisation pour ce personnel.",
                        "dates_doublons": dates_doublons,
                    }
                ),
                409,
            )

        # 🔹 Récupérer toutes les autorisations existantes du motif pour ce personnel
        autorisations_existantes = AutorisationAbsence.query.filter_by(
            idpers=idpers, motif=autorisation_existante.motif
        ).all()
        dates_existantes = [a.date_absence for a in autorisations_existantes]

        # 🔹 Supprimer les anciennes dates hors intervalle
        dates_a_supprimer = [d for d in dates_existantes if d not in dates_a_traiter]
        if dates_a_supprimer:
            AutorisationAbsence.query.filter_by(
                idpers=idpers, motif=autorisation_existante.motif
            ).filter(AutorisationAbsence.date_absence.in_(dates_a_supprimer)).delete(
                synchronize_session=False
            )

        # 🔹 Mise à jour ou création des autorisations
        nouvelles_autorisations = []
        for d in dates_a_traiter:
            # Déterminer demi-journée
            if len(dates_a_traiter) == 1:
                demi_journee_jour = demi_journee or "complete"
            else:
                if d == date_debut:
                    demi_journee_jour = demi_journee or "complete"
                elif d == date_fin:
                    demi_journee_jour = demi_journee or "complete"
                else:
                    demi_journee_jour = "complete"

            # Autorisation existante ?
            autorisation = AutorisationAbsence.query.filter_by(
                idpers=idpers, date_absence=d
            ).first()
            if autorisation:
                autorisation.motif = motif
                autorisation.idtype = idtype
                autorisation.demi_journee = demi_journee_jour
            else:
                autorisation = AutorisationAbsence(
                    date_absence=d,
                    motif=motif,
                    idpers=idpers,
                    idtype=idtype,
                    demi_journee=demi_journee_jour,
                )
                db.session.add(autorisation)
                db.session.flush()  # pour récupérer l'id
            nouvelles_autorisations.append(autorisation)

            # 🔹 Mettre à jour ou créer le pointage
            pointage = Pointage.query.filter_by(date=d, idpers=idpers).first()
            if not pointage:
                pointage = Pointage(date=d, idpers=idpers)
                db.session.add(pointage)
                db.session.flush()

            pointage.autorisation_id = autorisation.id
            type_autorisation = TypeAutorisations.query.get(idtype) if idtype else None
            type_nom = type_autorisation.nomtype if type_autorisation else ""
            pointage.justificatif = f"{motif} ({type_nom})" if type_nom else motif

            # 🔹 Définir absences selon demi-journée
            if demi_journee_jour == "matin":
                pointage.absence_matin = True
            elif demi_journee_jour == "apres-midi":
                pointage.absence_soir = True
            else:
                pointage.absence_matin = True
                pointage.absence_soir = True
                pointage.absence = True

            if personnel.role == "surface":
                pointage.heure_entree_unique = None  # ou tu peux mettre l'heure réelle
                pointage.absence_unique = True

            db.session.add(pointage)

        db.session.commit()
        socketio.emit("pointage_update")

        return (
            jsonify(
                {
                    "message": "Autorisation(s) mise(s) à jour avec succès",
                    "autorisations": [a.to_dict() for a in nouvelles_autorisations],
                }
            ),
            200,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
