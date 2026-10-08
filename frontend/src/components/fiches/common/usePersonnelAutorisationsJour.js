// Autorisations d'un agent valables AUJOURD'HUI (spéciales : sortie / retard, et absence du jour).
import { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export function usePersonnelAutorisationsJour({ idpers, fetchWithAuth, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // fetchWithAuth peut être recréé à chaque rendu par l'appelant : on le garde en ref
  // pour ne pas relancer la requête en boucle.
  const fetchRef = useRef(fetchWithAuth);
  fetchRef.current = fetchWithAuth;

  useEffect(() => {
    if (!idpers) return undefined;

    let cancelled = false;
    setLoading(true);

    fetchRef.current(`${API_URL}/api/pointage/personnel/autorisations-jour?idpers=${idpers}`)
      .then((res) => !cancelled && setData(res))
      .catch((err) => {
        if (cancelled) return;
        console.error('Erreur autorisations du jour :', err);
        setData(null);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [idpers, refreshKey]);

  return { data, loading };
}
