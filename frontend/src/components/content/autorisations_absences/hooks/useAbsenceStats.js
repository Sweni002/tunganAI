import { useEffect, useState } from "react";
import { autorisationService } from "../services/autorisationService";

const VIDE = {
  total: 0,
  etats: { en_cours: 0, a_venir: 0, terminees: 0 },
  demi_journees: { matin: 0, apres_midi: 0, complete: 0 },
  par_type: [],
};

/**
 * Statistiques des autorisations d'absence du service (endpoint /stats/<idserv>).
 * `filtre` : filtre de dates appliqué ({ date } ou { start, end }) ; `refreshKey` : change après
 * une modification de la liste (suppression, rechargement).
 */
export function useAbsenceStats({ idserv, filtre, refreshKey }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idserv) return undefined;

    let cancelled = false;
    setLoading(true);

    autorisationService
      .getStats(idserv, filtre)
      .then((data) => !cancelled && setStats({ ...VIDE, ...data }))
      .catch((err) => {
        if (cancelled) return;
        console.error("Erreur stats autorisations d'absence :", err);
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
