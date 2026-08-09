export function computeStats(personnels) {
  const total = personnels.length;

  let retard = 0;
  let present = 0;
  let absentNonJustifie = 0;

  personnels.forEach((p) => {
    // --- 1. Calcul des RETARDS ---
    if (p.matin?.retard) retard += 0.5;
    if (p.apresmidi?.retard) retard += 0.5;

    // --- 2. Calcul des PRÉSENTS (0.5 par demi-journée) ---
    // On est présent si on a une heure d'entrée (ou sortie) pour la demi-journée
    // et qu'on n'est pas absent.
    if (p.matin?.entree && !p.matin?.absence) present += 0.5;
    if (p.apresmidi?.entree && !p.apresmidi?.absence) present += 0.5;

    // --- 3. Calcul des ABSENTS NON JUSTIFIÉS ---
    // Vérification de la justification
    const justifie = Boolean(p.absence_matin_abbr || p.absence_soir_abbr || p.absence_surface);

    if (!justifie) {
      if (p.absence_unique === true || p.absence_unique === 1) {
        absentNonJustifie += 1;
      } else {
        if (p.matin?.absence) absentNonJustifie += 0.5;
        if (p.apresmidi?.absence) absentNonJustifie += 0.5;
      }
    }
  });

  return { total, retard, present, absentNonJustifie };
}