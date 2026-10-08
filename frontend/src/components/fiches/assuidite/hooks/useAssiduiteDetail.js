// Détail du mois d'UN agent : identité + fiche d'assiduité (retards, absences, types) + compteurs matin / soir.
import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export function useAssiduiteDetail({ idpers, matricule, mois, annee }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const actif = Boolean(idpers || matricule);

  useEffect(() => {
    if (!actif) {
      setDetail(null);
      setError(null);
      return undefined;
    }

    const params = new URLSearchParams({ mois: Number(mois), annee: Number(annee) });
    if (idpers) params.set('idpers', idpers);
    else params.set('matricule', matricule);

    let cancelled = false; // ignore les réponses devenues obsolètes (clics rapides)
    setLoading(true);
    setError(null);
    setDetail(null);

    fetch(`${API_URL}/api/fiches_assiduite/detail?${params.toString()}`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Impossible de charger le détail');
        return data;
      })
      .then((data) => !cancelled && setDetail(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [actif, idpers, matricule, mois, annee]);

  return { detail, loading, error };
}
