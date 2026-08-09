from flask import Flask, request, send_file, jsonify
from models import db, Personnels, Divisions, AutorisationAbsence, TypeAutorisation
from datetime import date
from calendar import monthrange
import os

app = Flask(__name__)


@app.route("/generer-excel-rh", methods=["GET"])
def generer_excel_rh():
    idrh = request.args.get("idrh", type=int)
    mois = request.args.get("mois", type=int)
    annee = request.args.get("annee", type=int)

    if not idrh or not mois or not annee:
        return jsonify({"error": "Paramètres 'idrh', 'mois' et 'annee' requis."}), 400

    # Récupérer le personnel attaché à cet RH
    personnels = Personnels.query.filter_by(idrh=idrh).all()
    if not personnels:
        return jsonify({"error": f"Aucun personnel trouvé pour RH {idrh}."}), 404

    # Types d'absences depuis la BDD
    types_absences = [t.to_dict() for t in TypeAutorisation.query.all()]
    if not types_absences:
        types_absences = [
            {"idtype": 1, "nomtype": "Repos annuel", "abbreviation": "RAM"},
            {"idtype": 2, "nomtype": "Congé payé", "abbreviation": "CP"},
            {"idtype": 3, "nomtype": "Mission", "abbreviation": "MA"},
        ]

    # Construire structure_divisions
    structure_divisions = {}
    for pers in personnels:
        div_nom = pers.division.nom if pers.division else "Sans division"
        if div_nom not in structure_divisions:
            structure_divisions[div_nom] = []

        # Comptage des absences par type pour le mois
        absences = (
            AutorisationAbsence.query.filter_by(idpers=pers.idpers)
            .filter(
                extract("month", AutorisationAbsence.date_absence) == mois,
                extract("year", AutorisationAbsence.date_absence) == annee,
            )
            .all()
        )

        absences_par_type = {}
        for t in types_absences:
            absences_par_type[t["abbreviation"]] = sum(
                1
                for a in absences
                if a.type_autorisation
                and a.type_autorisation.abbreviation == t["abbreviation"]
            )

        structure_divisions[div_nom].append(
            {
                "n": pers.idpers,
                "nom": pers.nom,
                "im": pers.matricule,
                "absences_par_type": absences_par_type,
            }
        )

    # Dates du mois
    date_debut = date(annee, mois, 1).strftime("%d/%m/%Y")
    date_fin = date(annee, mois, monthrange(annee, mois)[1]).strftime("%d/%m/%Y")

    try:
        # Génération Excel
        from excel import creer_fiche_assiduite

        chemin = creer_fiche_assiduite(
            nom_service=f"RH ID {idrh}",
            mois=date(annee, mois, 1).strftime("%B"),
            annee=annee,
            sigle_service_adresse=f"Personnel géré par RH {idrh}",
            date_debut=date_debut,
            date_fin=date_fin,
            structure_divisions=structure_divisions,
            types_absences=types_absences,
        )
        return send_file(chemin, as_attachment=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

