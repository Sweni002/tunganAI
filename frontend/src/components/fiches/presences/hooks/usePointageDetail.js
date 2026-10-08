// hooks/usePointageDetail.js
// Charge le détail d'un pointage (agent + pointage + autorisations + récap du mois)
// à l'ouverture de la modale. Les réponses périmées (clics rapides) sont ignorées.
import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export function usePointageDetail({ idpointage, fetchWithAuth, refreshKey }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!idpointage) {
      setDetail(null);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchWithAuth(`${API_URL}/api/pointage/detail/${idpointage}`)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setDetail(null);
          setError(err.message || 'Impossible de charger le détail');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idpointage, fetchWithAuth, refreshKey]);

  return { detail, loading, error };
}
