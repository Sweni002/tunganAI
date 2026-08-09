// utils/mapPointage.js
// Le backend renvoie les champs "à plat" (heure_entree_matin, ...) pour
// /par_date_personnel, et parfois déjà agrégés en objets { matin, apresmidi }
// pour /par_dates_personnel. Ce mapper gère les deux cas via les `??`
// (remplace les 2 mappers quasi identiques dupliqués dans le fichier d'origine).
export function mapHistoriquePointage(p) {
  const pers = p.personnel || {};
  const division = pers.division || {};

  return {
    key: p.id,
    idpointage: p.id,
    idpers: p.idpers,
    nom: pers.nom || 'Inconnu',
    prenom: pers.prenom || '',
    matricule: pers.matricule || '',
    division: division.nom || '',
    divisionId: division.iddiv || null,
    date: p.date,
    role: pers.role || '',

    retard_matin_minutes: p.retard_matin_minutes,
    retard_soir_minutes: p.retard_soir_minutes,

    absence_unique: p.absence_unique || null,
    heure_entree_unique: p.heure_entree_unique ?? null,
    heure_sortie_unique: p.heure_sortie_unique || null,
    absence_surface: p.absence_surface || null,
    nomabbr: p.nomabbr || null,

    matin: {
      entree: p.heure_entree_matin ?? p.matin?.entree ?? null,
      sortie: p.heure_sortie_matin ?? p.matin?.sortie ?? null,
      retard: p.retard_matin ?? p.matin?.retard ?? null,
      absence: p.absence_matin ?? p.matin?.absence ?? null,
    },
    apresmidi: {
      entree: p.heure_entree_soir ?? p.apresmidi?.entree ?? null,
      sortie: p.heure_sortie_soir ?? p.apresmidi?.sortie ?? null,
      retard: p.retard_soir ?? p.apresmidi?.retard ?? null,
      absence: p.absence_soir ?? p.apresmidi?.absence ?? null,
    },

    absence_matin_abbr: p.absence_matin_abbr || null,
    absence_soir_abbr: p.absence_soir_abbr || null,

    statut: p.absence ? 'Absent' : 'Présent',
    heure_entree_soir: p.heure_entree_soir,
    heure_sortie_soir: p.heure_sortie_soir,
    absence_soir: p.absence_soir,
    justificatif: p.justificatif || null,
  };
}
