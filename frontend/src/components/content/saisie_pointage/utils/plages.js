// Plages horaires autorisées pour chaque case de la saisie manuelle.
//
// 1) Bornes ABSOLUES de la journée : matin 06:00 – 13:00, après-midi 12:00 – 19:00.
//    Aucune heure en dehors n'est proposée.
// 2) Plage du SERVICE, à l'intérieur de ces bornes (mêmes règles que le serveur) :
//    - entrée : de « début d'entrée » jusqu'au début de la sortie ; au-delà de « fin d'entrée » c'est un
//      retard (annulé par une autorisation de retard) ;
//    - sortie : dans la plage de sortie du service, SAUF autorisation de sortie (alors libre dans les bornes).
// L'agent de surface n'a pas de plage.

export const BORNES = {
  matin: { min: "06:00", max: "13:00" },
  soir: { min: "12:00", max: "19:00" },
};

const versMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

const depuisMinutes = (total) =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

/** Intersection de [min, max] avec les bornes absolues de la période. */
function dansLesBornes(periode, min, max) {
  const b = BORNES[periode];
  return {
    min: depuisMinutes(Math.max(versMinutes(min), versMinutes(b.min))),
    max: depuisMinutes(Math.min(versMinutes(max), versMinutes(b.max))),
  };
}

/**
 * Plage d'une case pour un agent donné.
 * Retourne null (pas de contrainte) ou
 * { min, max, libre, libelle, finEntree?, retardExcuse? }
 */
export function plagePour(champ, ligne, horaires) {
  if (!horaires || ligne.role === "surface") return null;
  const aut = ligne.autorisations || {};

  const entree = (periode, debut, fin, debutSortie, retardExcuse) => {
    const { min, max } = dansLesBornes(periode, debut, depuisMinutes(versMinutes(debutSortie) - 1)); // borne haute exclue côté serveur
    return { min, max, libelle: `${min} – ${depuisMinutes(Math.min(versMinutes(fin), versMinutes(max)))}`, finEntree: fin, retardExcuse };
  };

  const sortieNormale = (periode, debut, fin, autorisee) => {
    if (autorisee) {
      const b = BORNES[periode];
      return { min: b.min, max: b.max, libre: true, libelle: `${b.min} – ${b.max}` };
    }
    const { min, max } = dansLesBornes(periode, debut, fin);
    return { min, max, libelle: `${min} – ${max}` };
  };

  switch (champ) {
    case "entree_matin":
      return entree("matin", horaires.entree_matin_debut, horaires.entree_matin_fin, horaires.sortie_matin_debut, Boolean(aut.retard_matin));
    case "entree_soir":
      return entree("soir", horaires.entree_soir_debut, horaires.entree_soir_fin, horaires.sortie_soir_debut, Boolean(aut.retard_soir));
    case "sortie_matin":
      return sortieNormale("matin", horaires.sortie_matin_debut, horaires.sortie_matin_fin, aut.sortie_matin);
    case "sortie_soir":
      return sortieNormale("soir", horaires.sortie_soir_debut, horaires.sortie_soir_fin, aut.sortie_soir);
    default:
      return null;
  }
}

/** Message d'erreur si l'heure sort de la plage, sinon null. */
export function messageHorsPlage(champ, valeur, ligne, horaires) {
  if (!valeur) return null;
  const plage = plagePour(champ, ligne, horaires);
  if (!plage) return null;
  const v = versMinutes(valeur);
  if (v < versMinutes(plage.min) || v > versMinutes(plage.max)) {
    return plage.libre
      ? `Hors de la période (${plage.min} – ${plage.max})`
      : `Hors plage (${plage.min} – ${plage.max})`;
  }
  return null;
}

/** Minutes de retard d'une entrée (0 si à l'heure ; `excuse` si une autorisation de retard la couvre). */
export function retardMinutes(champ, valeur, ligne, horaires) {
  if (!valeur) return { minutes: 0, excuse: false };
  const plage = plagePour(champ, ligne, horaires);
  if (!plage?.finEntree) return { minutes: 0, excuse: false };
  const minutes = versMinutes(valeur) - versMinutes(plage.finEntree);
  if (minutes <= 0) return { minutes: 0, excuse: false };
  return { minutes, excuse: plage.retardExcuse };
}
