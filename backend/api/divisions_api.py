from flask import Blueprint, request, jsonify
from models import db ,Services,Responsables
from sqlalchemy import func, extract ,Integer ,case,literal
from datetime import datetime
from models import  Pointage, Personnels, Divisions

bp = Blueprint('divisions_api', __name__)

@bp.route('/', methods=['POST'])
def create_division():
    nom = request.form.get('nom')
    idserv = request.form.get('idserv')

    if not nom or not idserv:
        return jsonify({'error': 'Champs requis : nom, idserv'}), 400

    # Vérifier si le service existe
    service = Services.query.get(idserv)
    if not service:
        return jsonify({'error': 'Service non trouvé'}), 404

    # Vérifier doublon
    if Divisions.query.filter_by(nom=nom, idserv=idserv).first():
        return jsonify({'error': 'Une division avec ce nom existe déjà pour ce service'}), 409

    try:
        new_div = Divisions(nom=nom, idserv=idserv)
        db.session.add(new_div)
        db.session.commit()

        return jsonify({
            'message': 'Division créée avec succès',
            'division': new_div.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la création : {str(e)}"}), 500


@bp.route('/<int:iddiv>/by_responsable/<int:idrh>', methods=['GET'])
def get_division_by_responsable(iddiv, idrh):
    # Vérifier que le responsable existe
    resp = Responsables.query.get(idrh)
    if not resp:
        return jsonify({'error': 'Responsable non trouvé'}), 404

    # Récupérer la division
    div = Divisions.query.get(iddiv)
    if not div:
        return jsonify({'error': 'Division non trouvée'}), 404

    # Vérifier que la division appartient au service du responsable
    if div.idserv != resp.idserv:
        return jsonify({'error': 'Cette division n\'est pas gérée par ce responsable'}), 403

    return jsonify(div.to_dict()), 200


@bp.route('/<int:iddiv>', methods=['PUT'])
def update_division(iddiv):
    nom = request.form.get('nom')
    idserv = request.form.get('idserv')

    if not nom or not idserv:
        return jsonify({'error': 'Champs requis : nom, idserv'}), 400

    # Vérifier si la division existe
    division = Divisions.query.get(iddiv)
    if not division:
        return jsonify({'error': 'Division non trouvée'}), 404

    # Vérifier si le service existe
    service = Services.query.get(idserv)
    if not service:
        return jsonify({'error': 'Service non trouvé'}), 404

    # Vérifier doublon (sauf si c'est la même division)
    doublon = Divisions.query.filter_by(nom=nom, idserv=idserv).first()
    if doublon and doublon.iddiv != iddiv:
        return jsonify({'error': 'Une division avec ce nom existe déjà pour ce service'}), 409

    try:
        division.nom = nom
        division.idserv = idserv

        db.session.commit()

        return jsonify({
            'message': 'Division mise à jour avec succès',
            'division': division.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la mise à jour : {str(e)}"}), 500

@bp.route('/divisions_with_service', methods=['GET'])
def get_divisions_with_service():
    try:
        results = (
            db.session.query(
                Divisions.iddiv,
                Divisions.nom.label("nomdivision"),
                Services.idserv,
                Services.nom.label("nomservice")
            )
            .join(Services, Divisions.idserv == Services.idserv)
            .all()
        )

        data = [
            {
                "iddiv": r.iddiv,
                "nomdivision": r.nomdivision,
                "idserv": r.idserv,
                "nomservice": r.nomservice
            }
            for r in results
        ]

        return jsonify(data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/<int:iddiv>', methods=['DELETE'])
def delete_division(iddiv):
    div = Divisions.query.get_or_404(iddiv)
    try:
        db.session.delete(div)
        db.session.commit()
        return jsonify({"message": "Division supprimée"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@bp.route("/with_count", methods=["GET"])
def get_divisions_with_count():

    idserv = request.args.get("idserv")

    if not idserv:
        return jsonify({"error": "idserv requis"}), 400

    divisions_with_count = (
        db.session.query(
            Divisions.iddiv,
            Divisions.nom,
            func.count(Personnels.idpers).label("total_personnels"),
        )
        .outerjoin(Personnels, Personnels.iddiv == Divisions.iddiv)
        .filter(Divisions.idserv == idserv)
        .group_by(Divisions.iddiv, Divisions.nom)
        .order_by(Divisions.nom.asc())
        .all()
    )

    result = []

    for d in divisions_with_count:
        result.append(
            {
                "iddiv": d.iddiv,
                "nomdivision": d.nom,
                "total_personnels": d.total_personnels,
            }
        )

    return jsonify(result), 200


@bp.route("/with_count_by_service", methods=["GET"])
def get_divisions_with_count_by_service():
    idserv = request.args.get("idserv")
    if not idserv:
        return jsonify({"error": "idserv requis"}), 400

    # Vérifier que le service existe
    service = Services.query.get(idserv)
    if not service:
        return jsonify({"error": "Service introuvable"}), 404

    # Récupérer les divisions du service avec le nombre de personnels
    divisions_with_count = (
        db.session.query(
            Divisions.iddiv,
            Divisions.nom,
            func.count(Personnels.idpers).label("total_personnels"),
        )
        .outerjoin(Personnels, Personnels.iddiv == Divisions.iddiv)
        .filter(Divisions.idserv == idserv)
        .group_by(Divisions.iddiv, Divisions.nom)
        .order_by(Divisions.nom.asc())
        .all()
    )

    result = [
        {"iddiv": d.iddiv, "nomdivision": d.nom, "total_personnels": d.total_personnels}
        for d in divisions_with_count
    ]

    return jsonify(result), 200


@bp.route('/with_count/<int:idrh>', methods=['GET'])
def get_divisions_by_responsable(idrh):
    # Vérifier si le responsable existe
    resp = Responsables.query.get(idrh)
    if not resp:
        return jsonify({'error': 'Responsable non trouvé'}), 404

    # Récupérer les divisions du service du responsable
    divisions = Divisions.query.filter_by(idserv=resp.idserv).order_by(Divisions.nom.asc()).all()

    result = []
    for d in divisions:
        # Compter les personnels du responsable dans cette division
        total_personnels = sum(1 for p in d.personnels if p.responsable and p.responsable.idrh == idrh)
        result.append({
            'iddiv': d.iddiv,
            'nomdivision': d.nom,
            'total_personnels': total_personnels
        })

    return jsonify(result), 200


@bp.route("/by_personnel", methods=["GET"])
def get_divisions_by_personnel():
    # Vérifier si le personnel existe
    idpers = request.args.get("idpers", type=int)
    if not idpers:
        return jsonify({"error": "idpers manquant"}), 400

    pers = Personnels.query.get(idpers)
    if not pers:
        return jsonify({"error": "Personnel non trouvé"}), 404

    # Récupérer le service via la division du personnel
    division = pers.division
    if not division:
        return jsonify({"error": "Division du personnel non trouvée"}), 404

    service = division.service
    if not service:
        return jsonify({"error": "Service du personnel non trouvé"}), 404

    # Récupérer toutes les divisions de ce service
    divisions = (
        Divisions.query.filter_by(idserv=service.idserv)
        .order_by(Divisions.nom.asc())
        .all()
    )

    result = []
    for d in divisions:
        # Compter le nombre de personnels dans cette division
        total_personnels = len(d.personnels)
        result.append(
            {
                "iddiv": d.iddiv,
                "nomdivision": d.nom,
                "total_personnels": total_personnels,
            }
        )

    return jsonify(result), 200


@bp.route('/by_responsable', methods=['GET'])
def get_divisions_by_responsables():
    idrh = request.args.get('idrh')  # ou session['user_id'] si connecté
    if not idrh:
        return jsonify({'error': 'idrh requis'}), 400

    responsable = Responsables.query.get(idrh)
    if not responsable:
        return jsonify({'error': 'Responsable introuvable'}), 404

    # Filtrer les divisions par idserv du responsable
    divisions = (
        db.session.query(
            Divisions.iddiv,
            Divisions.nom.label('nomdivision')
        )
        .filter(Divisions.idserv == responsable.idserv)
        .order_by(Divisions.nom.asc())
        .all()
    )

    # Transformer en liste de dict
    result = [{'iddiv': d.iddiv, 'nomdivision': d.nomdivision} for d in divisions]

    return jsonify(result), 200


@bp.route("/by_service", methods=["GET"])
def get_divisions_by_service():
    # 🔹 Récupérer idserv depuis les query params
    idserv = request.args.get('idserv')
    if not idserv:
        return jsonify({'error': 'idserv requis'}), 400

    try:
        idserv = int(idserv)
    except ValueError:
        return jsonify({'error': 'idserv doit être un entier valide'}), 400

    # 🔹 Vérifier que le service existe
    service = Services.query.get(idserv)
    if not service:
        return jsonify({'error': 'Service introuvable'}), 404

    # 🔹 Récupérer les divisions pour ce service
    divisions = (
        db.session.query(
            Divisions.iddiv,
            Divisions.nom.label('nomdivision')
        )
        .filter(Divisions.idserv == idserv)
        .order_by(Divisions.nom.asc())
        .all()
    )

    # 🔹 Transformer en liste de dict
    result = [{'iddiv': d.iddiv, 'nomdivision': d.nomdivision} for d in divisions]

    return jsonify(result), 200

@bp.route("/tendance-retards-par-jour", methods=["GET"])
def tendance_retards_par_jour():
    """
    Total des retards (matin + soir) par jour de la semaine pour tous les jours.
    Toujours afficher les 7 jours même si aucun retard.
    """
    # Expression pour jour de la semaine (MON, TUE, ... en français)
    jour_expr = func.to_char(Pointage.date, 'DY', 'NLS_DATE_LANGUAGE=FRENCH').label("jour_semaine")

    # Chaque case retourne 1 si retard, sinon 0
    retard_matin_expr = case((Pointage.retard_matin == True, 1), else_=0)
    retard_soir_expr  = case((Pointage.retard_soir == True, 1), else_=0)
    total_retard_expr = func.sum(retard_matin_expr + retard_soir_expr).label("total_retard")

    # Requête
    result = (
        db.session.query(jour_expr, total_retard_expr)
        .group_by(jour_expr)
        .all()
    )

    # Dictionnaire de tous les jours par défaut
    jours = ["LUN.", "MAR.", "MER.", "JEU.", "VEN.", "SAM.", "DIM."]
    data_dict = {jour: 0 for jour in jours}

    # Complète avec les données récupérées
    for r in result:
        jour = r.jour_semaine.strip().upper()
        data_dict[jour] = int(r.total_retard)

    # Transforme en liste pour JSON
    data = [{"jour": jour, "total_retard": total_retard} for jour, total_retard in data_dict.items()]

    return jsonify(data)


@bp.route("/evolution-presence-par-mois", methods=["GET"])
def evolution_presence_par_mois():
    """
    Total de la présence (matin + soir) par mois pour chaque division,
    en tenant compte des absences réelles.
    """

    # Table de référence pour les 12 mois
    mois_table = [
        {"num": i, "nom": nom} for i, nom in enumerate(
            ["JAN", "FEV", "MAR", "AVR", "MAI", "JUN", 
             "JUL", "AOU", "SEP", "OCT", "NOV", "DEC"], start=1
        )
    ]

    # Récupérer toutes les divisions
    divisions = Divisions.query.all()
    result = []

    for div in divisions:
        div_data = {"division": div.nom if div.nom else f"Division {div.iddiv}"}
        for mois in mois_table:
            # Calcul total présence par mois et par division
            total_presence = db.session.query(
                func.sum(
                    case((Pointage.absence_matin == 0, 1), else_=0) +
                    case((Pointage.absence_soir == 0, 1), else_=0)
                )
            ).join(Personnels, Personnels.idpers == Pointage.idpers)\
             .filter(Personnels.iddiv == div.iddiv)\
             .filter(extract('month', Pointage.date) == mois["num"])\
             .scalar()

            div_data[mois["nom"]] = int(total_presence or 0)

        result.append(div_data)

    return jsonify(result)

@bp.route('/presence-par-division-courant', methods=['GET'])
def presence_par_division_courant():
    """Présence totale par division pour le mois en cours"""
    now = datetime.now()
    mois_courant = now.month
    annee_courante = now.year

    result = (
        db.session.query(
            Divisions.iddiv,
            Divisions.nom,
            func.sum(func.coalesce(Pointage.presence, 0)).label('total_presence')
        )
        .join(Personnels, Personnels.iddiv == Divisions.iddiv)
        .join(Pointage, Pointage.idpers == Personnels.idpers)
        .filter(extract('month', Pointage.date) == mois_courant)
        .filter(extract('year', Pointage.date) == annee_courante)
        .group_by(Divisions.iddiv, Divisions.nom)
        .all()
    )

    data = [
        {
            "iddiv": r.iddiv,
            "nomdivision": r.nom,
            "total_presence": int(r.total_presence)
        }
        for r in result
    ]

    return jsonify(data)
