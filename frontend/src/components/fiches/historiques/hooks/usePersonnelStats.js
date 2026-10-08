// hooks/usePersonnelStats.js
// Compteurs entiers (matin / soir) d'un agent sur la période affichée.
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';

const API_URL = import.meta.env.VITE_API_URL;

export function usePersonnelStats({ idpers, selectedDate, dateDebutFiltre, dateFinFiltre, fetchWithAuth, refreshKey = 0 }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRef = useRef(fetchWithAuth);
  fetchRef.current = fetchWithAuth;

  useEffect(() => {
    if (!idpers) return undefined;

    const params = new URLSearchParams({ idpers: String(idpers) });
    if (dateDebutFiltre && dateFinFiltre) {
      params.set('dateDebut', dayjs(dateDebutFiltre).format('YYYY-MM-DD'));
      params.set('dateFin', dayjs(dateFinFiltre).format('YYYY-MM-DD'));
    } else if (selectedDate) {
      params.set('date', dayjs(selectedDate).format('YYYY-MM-DD'));
    }

    let cancelled = false;
    setLoading(true);

    fetchRef.current(`${API_URL}/api/pointage/personnel/stats?${params.toString()}`)
      .then((res) => !cancelled && setStats(res))
      .catch((err) => {
        if (cancelled) return;
        console.error('Erreur stats personnel :', err);
        setStats(null);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [idpers, selectedDate, dateDebutFiltre, dateFinFiltre, refreshKey]);

  return { stats, loading };
}
