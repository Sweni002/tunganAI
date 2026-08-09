// utils/mapPointage.js
// Le backend renvoie parfois les champs "à plat" (heure_entree_matin, ...)
// et parfois déjà agrégés en objets { matin: {...}, apresmidi: {...} }.
// Ces 2 fonctions remplacent les 3 mappers dupliqués du fichier d'origine.

/**
 * Format "brut" : utilisé pour /par_date, /par_date_division, /par_dates (agents de bureau au jour le jour)
 */
export function mapPointageRaw(p) {
  const pers = p.personnel || {};
  const division = pers.division || {};

  return {
    key: p.id,
    idpointage: p.id,
    idpers: p.idpers,
    nom: pers.nom || 'Inconnu',
    prenom: pers.prenom || '',
    role: pers.role || '',
    matricule: pers.matricule || '',
    division: division.nom || '',
    divisionId: division.iddiv || null,
    date: p.date,
    absence: p.absence || null,
    nomabbr: p.nomabbr || null,

    heure_entree_unique: p.heure_entree_unique || null,
    heure_sortie_unique: p.heure_sortie_unique || null,
    absence_unique: p.absence_unique || null,
    absence_surface: p.absence_surface || null,

    retard_matin_minutes: p.retard_matin_minutes,
    retard_soir_minutes: p.retard_soir_minutes,

    matin: {
      entree: p.heure_entree_matin,
      sortie: p.heure_sortie_matin,
      retard: p.retard_matin,
      absence: p.absence_matin,
    },
    apresmidi: {
      entree: p.heure_entree_soir,
      sortie: p.heure_sortie_soir,
      retard: p.retard_soir,
      absence: p.absence_soir,
    },

    heure_entree_soir: p.heure_entree_soir,
    heure_sortie_soir: p.heure_sortie_soir,
    absence_soir: p.absence_soir,
    absence_matin_abbr: p.absence_matin_abbr || null,
    absence_soir_abbr: p.absence_soir_abbr || null,

    statut: p.absence ? 'Absent' : 'Présent',
    justificatif: p.justificatif || null,
  };
}

/**
 * Format "pré-agrégé" : utilisé pour /par_dates avec plage (fetchPointagesParDates1 d'origine)
 * où le backend renvoie déjà p.matin / p.apresmidi construits.
 */
export function mapPointageRange(p) {
  return {
    key: p.id,
    idpers: p.idpers,
    nom: p.personnel?.nom || 'Inconnu',
    prenom: p.personnel?.prenom || '',
    matricule: p.personnel?.matricule || '',
    role: p.personnel?.role || '',
    division: p.personnel?.division?.nom || '—',
    divisionId: p.personnel?.division?.iddiv || null,
    date: p.date,
    nomabbr: p.nomabbr || null,

    heure_entree_unique: p.heure_entree_unique,
    heure_sortie_unique: p.heure_sortie_unique || null,
    absence_surface: p.absence_surface || null,
    absence_unique: p.absence_unique || null,

    retard_matin_minutes: p.retard_matin_minutes,
    retard_soir_minutes: p.retard_soir_minutes,

    matin: p.matin,
    apresmidi: p.apresmidi,

    absence_matin_abbr: p.absence_matin_abbr,
    absence_soir_abbr: p.absence_soir_abbr,
    absence_matin: p.absence_matin,
    absence_soir: p.absence_soir,

    statut: p.absence ? 'Absent' : 'Présent',
    justificatif: p.justificatif || null,
  };
}