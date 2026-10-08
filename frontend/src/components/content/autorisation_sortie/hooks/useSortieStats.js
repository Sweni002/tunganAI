import { useEffect, useState } from "react";
import autorisationService from "../services/autorisationService";

const VIDE = {
  total: 0,
  etats: { en_cours: 0, a_venir: 0, terminees: 0 },
  periodes: { matin: 0, apres_midi: 0 },
  types: { sortie: 0, retard: 0 },
  agents_autorises_aujourdhui: 0,
};

/**
 * Statistiques des autorisations du service (endpoint /stats/<idserv>), calculées côté serveur.
 * `filtre` = filtre APPLIQUÉ à la liste ({ date } ou { start, end } ou {}).
 * `refreshKey` change à chaque modification de la liste (ajout, suppression, filtre).
 */
export function useSortieStats({ idserv, filtre, refreshKey }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idserv) return undefined;

    let cancelled = false;
    setLoading(true);

    autorisationService
      .getStatsSpeciales(idserv, filtre)
      .then((data) => !cancelled && setStats({ ...VIDE, ...data }))
      .catch((err) => {
        if (cancelled) return;
        console.error("Erreur stats autorisations :", err);
        setStats(null);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idserv, JSON.stringify(filtre), refreshKey]);

  return { stats, loading };
}
