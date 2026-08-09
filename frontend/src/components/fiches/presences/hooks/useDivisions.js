// hooks/useDivisions.js
import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export function useDivisions({ idrh, idserv, fetchWithAuth }) {
  const [divisions, setDivisions] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);

  useEffect(() => {
    if (!idrh || !idserv) return;

    setLoadingDivisions(true);
    fetchWithAuth(`${API_URL}/api/divisions/with_count?idserv=${idserv}`)
      .then((divisionsData) => {
        if (Array.isArray(divisionsData)) {
          setDivisions(divisionsData);
        } else {
          console.error('Erreur divisions:', divisionsData);
          setDivisions([]);
        }
      })
      .catch((err) => {
        console.error('Erreur fetch divisions:', err);
        setDivisions([]);
      })
      .finally(() => setLoadingDivisions(false));
  }, [idrh, idserv, fetchWithAuth]);

  return { divisions, loadingDivisions };
}