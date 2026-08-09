from flask import Blueprint, request, jsonify
from models import db
from models import TypeAutorisations

bp = Blueprint('type_api', __name__)


@bp.route("/", methods=["POST"])
def add_type_autorisation():
    data = request.get_json()
    nomtype = data.get("nomtype")
    abbreviation = data.get("abbreviation")
    if not nomtype or not abbreviation:
        return jsonify({"error": "Les champs 'nomtype' et 'abbreviation' sont obligatoires"}), 400

    # Vérifier si déjà existant
    if TypeAutorisations.query.filter_by(nomtype=nomtype).first():
        return jsonify({"error": "Ce type existe déjà"}), 400

    new_type = TypeAutorisations(nomtype=nomtype,abbreviation=abbreviation)
    db.session.add(new_type)
    db.session.commit()

    return jsonify(new_type.to_dict()), 201


# 📋 Lister tous les types
@bp.route("/", methods=["GET"])
def get_all_types():
    types = TypeAutorisations.query.all()
    return jsonify([t.to_dict() for t in types])


# 🔍 Récupérer un type par ID
@bp.route("/<int:idtype>", methods=["GET"])
def get_type_by_id(idtype):
    type_aut = TypeAutorisations.query.get(idtype)
    if not type_aut:
        return jsonify({"error": "Type non trouvé"}), 404
    return jsonify(type_aut.to_dict())


# ✏️ Modifier un type
@bp.route("/<int:idtype>", methods=["PUT"])
def update_type(idtype):
    type_aut = TypeAutorisations.query.get(idtype)
    if not type_aut:
        return jsonify({"error": "Type non trouvé"}), 404

    data = request.get_json()
    nomtype = data.get("nomtype")
    abbreviation=data.get("abbreviation")
    if nomtype:
        # Vérifier doublon
        if TypeAutorisations.query.filter(TypeAutorisations.nomtype == nomtype, TypeAutorisations.idtype != idtype).first():
            return jsonify({"error": "Un autre type avec ce nom existe déjà"}), 400
        type_aut.nomtype = nomtype
    if abbreviation is not None:
        type_aut.abbreviation = abbreviation

    db.session.commit()
    return jsonify({"message": "Type modifié avec succès"})


# ❌ Supprimer un type
@bp.route("/<int:idtype>", methods=["DELETE"])
def delete_type(idtype):
    type_aut = TypeAutorisations.query.get(idtype)
    if not type_aut:
        return jsonify({"error": "Type non trouvé"}), 404

    db.session.delete(type_aut)
    db.session.commit()
    return jsonify({"message": "Type supprimé avec succès"})
