from flask import Blueprint, request, jsonify
from models import db
from models.conge import Conge
from models.personnels import Personnels  # Assure-toi que ce fichier est bien importable
from datetime import datetime ,date
from sqlalchemy import func ,text ,distinct
from models import Divisions
from sqlalchemy import func, and_
from sqlalchemy.orm import aliased


bp = Blueprint('conges_api', __name__, url_prefix='/api/conges')

# ✅ GET - Tous les congés
@bp.route('/', methods=['GET'])
def get_conges():
    conges = Conge.query.all()
    return jsonify([c.to_dict() for c in conges]), 200

@bp.route('/between_dates', methods=['GET'])
def get_conges_between_dates():
    # Récupération des paramètres dans l'URL (ex: /api/conges/between_dates?start=2025-01-01&end=2025-01-31)
    start_str = request.args.get('start')
    end_str = request.args.get('end')

    if not start_str or not end_str:
        return jsonify({'error': 'Les paramètres start et end sont requis (format YYYY-MM-DD).'}), 400

    try:
        start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Format de date invalide, utilisez YYYY-MM-DD.'}), 400

    if start_date > end_date:
        return jsonify({'error': 'La date de début doit être antérieure ou égale à la date de fin.'}), 400

    # Filtrer les congés dont la période chevauche l'intervalle demandé
    conges = Conge.query.filter(
        Conge.date_debut <= end_date,
        Conge.date_fin >= start_date
    ).all()

    return jsonify([c.to_dict() for c in conges]), 200


# ✅ GET - Congé par ID
@bp.route('/<int:id>', methods=['GET'])
def get_conge(id):
    conge = Conge.query.get_or_404(id)
    return jsonify(conge.to_dict()), 200

@bp.route('/', methods=['POST'])
def ajouter_conge():
    data = request.get_json()

    try:
        date_debut = datetime.strptime(data['date_debut'], '%Y-%m-%d').date()
        date_fin = datetime.strptime(data['date_fin'], '%Y-%m-%d').date()
        idpers = data['idpers']
        motif = data.get('motif', 'annuel')
        statut = data.get('statut', 'accepté')

        # Vérifier que le personnel existe
        personnel = Personnels.query.get(idpers)
        if not personnel:
            return jsonify({'error': 'Personnel non trouvé'}), 404

        # Vérification de cohérence des dates
        if date_debut > date_fin:
            return jsonify({
                'error': 'La date de début ne peut pas être postérieure à la date de fin.'
            }), 400

        # Vérification de conflit de dates avec d'autres congés de ce personnel
        conflit = Conge.query.filter(
            Conge.idpers == idpers,
            Conge.date_debut <= date_fin,
            Conge.date_fin >= date_debut
        ).first()

        if conflit:
            return jsonify({
                'error': 'Ce personnel a déjà un congé qui chevauche cette période.',
                'conge_conflit': conflit.to_dict()
            }), 400

        # Création du nouveau congé
        conge = Conge(
            date_debut=date_debut,
            date_fin=date_fin,
            motif=motif,
            statut=statut,
            idpers=idpers
        )

        db.session.add(conge)
        db.session.commit()

        return jsonify({
            'message': 'Congé ajouté avec succès.',
            'conge': conge.to_dict()
        }), 201

    except KeyError as e:
        return jsonify({'error': f'Champ manquant : {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
def modifier_conge(id):
    data = request.get_json()

    try:
        date_debut = datetime.strptime(data['date_debut'], '%Y-%m-%d').date()
        date_fin = datetime.strptime(data['date_fin'], '%Y-%m-%d').date()
        idpers = data['idpers']
        motif = data.get('motif', 'annuel')
        statut = data.get('statut', 'accepté')

        # Rechercher le congé à modifier
        conge = Conge.query.get(id)
        if not conge:
            return jsonify({'error': 'Congé non trouvé'}), 404

        # Vérifier que le personnel existe
        personnel = Personnels.query.get(idpers)
        if not personnel:
            return jsonify({'error': 'Personnel non trouvé'}), 404

        # Vérification de cohérence des dates
        if date_debut > date_fin:
            return jsonify({
                'error': 'La date de début ne peut pas être postérieure à la date de fin.'
            }), 400

        # Vérification de conflit de dates avec d'autres congés (exclure le congé actuel)
        conflit = Conge.query.filter(
            Conge.id != id,
            Conge.idpers == idpers,
            Conge.date_debut <= date_fin,
            Conge.date_fin >= date_debut
        ).first()

        if conflit:
            return jsonify({
                'error': 'Ce personnel a déjà un congé qui chevauche cette période.',
                'conge_conflit': conflit.to_dict()
            }), 400

        # Mise à jour du congé
        conge.date_debut = date_debut
        conge.date_fin = date_fin
        conge.idpers = idpers
        conge.motif = motif
        conge.statut = statut

        db.session.commit()

        return jsonify({
            'message': 'Congé mis à jour avec succès.',
            'conge': conge.to_dict()
        }), 200

    except KeyError as e:
        return jsonify({'error': f'Champ manquant : {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# ✅ DELETE - Supprimer un congé
@bp.route('/<int:id>', methods=['DELETE'])
def delete_conge(id):
    conge = Conge.query.get_or_404(id)
    try:
        db.session.delete(conge)
        db.session.commit()
        return jsonify({'message': 'Congé supprimé avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    
@bp.route('/count_personnels_en_conge_par_division', methods=['GET'])
def count_personnels_en_conge_par_division():
    today = date.today()

    conge_alias = aliased(Conge)
    personnels_alias = aliased(Personnels)

    result = (
        db.session.query(
            Divisions.iddiv,
            Divisions.nom.label('nomdivision'),
            func.count(func.distinct(conge_alias.idpers)).label('total_personnels_en_conge')
        )
        .outerjoin(personnels_alias, personnels_alias.iddiv == Divisions.iddiv)
        .outerjoin(conge_alias, and_(
            conge_alias.idpers == personnels_alias.idpers,
            conge_alias.date_fin >= today,
            conge_alias.statut == "accepté"
        ))
        .group_by(Divisions.iddiv, Divisions.nom)
        .order_by(Divisions.nom)  # 🔥 Ajout de ce tri alphabétique
        .all()
    )

    counts = [
        {
            'iddiv': iddiv,
            'nomdivision': nomdivision,
            'total_personnels_en_conge': int(total)
        }
        for iddiv, nomdivision, total in result
    ]

    return jsonify(counts), 200
