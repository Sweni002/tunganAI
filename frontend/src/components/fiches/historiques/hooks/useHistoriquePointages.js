// hooks/useHistoriquePointages.js
import { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { mapHistoriquePointage } from '../utils/mapPointage';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Remplace les 2 useEffect + les fonctions fetch dupliquées du fichier
 * d'origine (mêmes bugs potentiels que dans presences/usePointages.js
 * avant refactor : deux effets pouvaient tous les deux déclencher un fetch
 * pour le cas "date unique", en parallèle). Ici il n'y a qu'UN SEUL effet,
 * un seul `loading`, et `loadingPage` (loader plein écran) ne se coupe
 * qu'après résolution du tout premier chargement.
 */
export function useHistoriquePointages({ idpers, selectedDate, dateDebutFiltre, dateFinFiltre, fetchWithAuth, showSnack }) {
  const [personnels, setPersonnels] = useState([]);
  const [filteredByDatePersonnels, setFilteredByDatePersonnels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Empêche une réponse "en retard" d'une requête annulée d'écraser un état plus récent
  const requestIdRef = useRef(0);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const fetchParDate = useCallback(
    async (date) => {
      const url = `${API_URL}/api/pointage/faciall/par_date_personnel?date=${date}&idpers=${idpers}`;
      const response = await fetchWithAuth(url);
      const pointages = Array.isArray(response.data) ? response.data : response;

      if (!Array.isArray(pointages)) {
        throw new Error('Données pointages invalides');
      }
      return pointages.map(mapHistoriquePointage);
    },
    [idpers, fetchWithAuth]
  );

  const fetchParDates = useCallback(
    async (dateDebut, dateFin) => {
      const debut = dayjs(dateDebut).format('YYYY-MM-DD');
      const fin = dayjs(dateFin).format('YYYY-MM-DD');

      const url = `${API_URL}/api/pointage/facial/par_dates_personnel?dateDebut=${debut}&dateFin=${fin}&idpers=${idpers}`;
      const data = await fetchWithAuth(url);

      if (!Array.isArray(data)) throw new Error('Données pointages invalides');
      return data.map(mapHistoriquePointage);
    },
    [idpers, fetchWithAuth]
  );

  // --- Effet unique de chargement ---
  useEffect(() => {
    if (!idpers) return;

    const myRequestId = ++requestIdRef.current;
    setLoading(true);

    const finishIfCurrent = () => {
      if (myRequestId === requestIdRef.current) {
        setLoading(false);
        setLoadingPage(false);
      }
    };

    const run = async () => {
      try {
        if (dateDebutFiltre && dateFinFiltre) {
          const rows = await fetchParDates(dateDebutFiltre, dateFinFiltre);
          if (myRequestId !== requestIdRef.current) return;
          setPersonnels(rows);
          setFilteredByDatePersonnels(rows);
        } else if (selectedDate) {
          const rows = await fetchParDate(selectedDate);
          if (myRequestId !== requestIdRef.current) return;
          setPersonnels(rows);
        } else {
          setPersonnels([]);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des pointages:', err);
        if (myRequestId !== requestIdRef.current) return;
        setPersonnels([]);
        setFilteredByDatePersonnels([]);
      } finally {
        finishIfCurrent();
      }
    };

    run();
  }, [idpers, selectedDate, dateDebutFiltre, dateFinFiltre, refreshKey, fetchParDate, fetchParDates]);

  // --- Filtrage manuel par plage de dates (bouton "Filtrer") ---
  const filtrerParDates = useCallback(
    async (dateDebut, dateFin) => {
      setLoading(true);
      try {
        const rows = await fetchParDates(dateDebut, dateFin);
        setPersonnels(rows);
        setFilteredByDatePersonnels(rows);
        if (showSnack) {
          showSnack(`${rows.length} pointage${rows.length > 1 ? 's' : ''} trouvée${rows.length > 1 ? 's' : ''}`, false);
        }
      } catch (error) {
        console.error(error);
        setPersonnels([]);
        setFilteredByDatePersonnels([]);
        if (showSnack) showSnack(error.message || 'Erreur lors du chargement', true);
      } finally {
        setLoading(false);
      }
    },
    [fetchParDates, showSnack]
  );

  return {
    personnels,
    filteredByDatePersonnels,
    loading,
    loadingPage,
    triggerRefresh,
    filtrerParDates,
  };
}
