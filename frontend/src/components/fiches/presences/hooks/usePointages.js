// hooks/usePointages.js
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { mapPointageRaw, mapPointageRange } from '../utils/mapPointage';

const API_URL = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export function usePointages({
  idrh,
  idserv,
  selectedDate,
  selectedDivision,
  dateDebutFiltre,
  dateFinFiltre,
  searchText = '',
  role = null, // 'surface' | 'autres' | null
  fetchWithAuth,
  showSnack,
}) {
  const [personnels, setPersonnels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // --- Pagination par curseur ---
  const [cursors, setCursors] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Ref pour lire les curseurs dans l'effet sans le rendre dépendant de `cursors`
  const cursorsRef = useRef(cursors);
  cursorsRef.current = cursors;

  // Empêche une réponse tardive d'écraser un état plus récent
  const requestIdRef = useRef(0);

  // --- Recherche débouncée : évite un aller-retour serveur à chaque frappe ---
  const [debouncedSearch, setDebouncedSearch] = useState(searchText.trim());
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchText]);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // --- Construction de l'URL : un seul endroit, encodage sûr ---
  const buildRequest = useCallback(
    (lastId) => {
      const params = new URLSearchParams();
      params.set('idserv', String(idserv));
      params.set('limit', String(PAGE_SIZE));
      if (lastId) params.set('last_id', String(lastId));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (role) params.set('role', role);

      // 1. Plage de dates (prioritaire)
      if (dateDebutFiltre && dateFinFiltre) {
        params.set('dateDebut', dayjs(dateDebutFiltre).format('YYYY-MM-DD'));
        params.set('dateFin', dayjs(dateFinFiltre).format('YYYY-MM-DD'));
        if (selectedDivision) params.set('iddiv', String(selectedDivision));
        return {
          url: `${API_URL}/api/pointage/faciall/par_dates?${params.toString()}`,
          mapper: mapPointageRange,
        };
      }

      if (!selectedDate) return null;
      params.set('date', selectedDate);

      // 2. Date + division
      if (selectedDivision) {
        params.set('iddiv', String(selectedDivision));
        return {
          url: `${API_URL}/api/pointage/facial/par_date_division?${params.toString()}`,
          mapper: mapPointageRaw,
        };
      }

      // 3. Date seule
      return {
        url: `${API_URL}/api/pointage/faciall/par_date?${params.toString()}`,
        mapper: mapPointageRaw,
      };
    },
    [idserv, selectedDate, selectedDivision, dateDebutFiltre, dateFinFiltre, debouncedSearch, role]
  );

  // --- Signature des filtres : tout changement remet la pagination à zéro ---
  const filterSignature = useMemo(
    () =>
      [
        selectedDate,
        selectedDivision,
        dateDebutFiltre,
        dateFinFiltre,
        debouncedSearch,
        role,
        refreshKey,
      ].join('|'),
    [
      selectedDate,
      selectedDivision,
      dateDebutFiltre,
      dateFinFiltre,
      debouncedSearch,
      role,
      refreshKey,
    ]
  );

  const signatureRef = useRef(filterSignature);
  const pendingResetRef = useRef(false);

  // Cet effet DOIT rester déclaré avant l'effet de chargement
  useEffect(() => {
    if (signatureRef.current !== filterSignature) {
      signatureRef.current = filterSignature;
      cursorsRef.current = [null]; // maj synchrone : l'effet suivant lit la bonne valeur
      setCursors([null]);
      setPageIndex(0);
      setHasMore(false);
      pendingResetRef.current = true;
    }
  }, [filterSignature]);

  // --- Chargement ---
  useEffect(() => {
    if (!idrh || !idserv) return;

    // Les filtres viennent de changer mais pageIndex n'est pas encore retombé à 0 :
    // on attend le re-render pour ne pas tirer une page fantôme (page 4 d'une recherche neuve).
    if (pendingResetRef.current && pageIndex !== 0) return;
    pendingResetRef.current = false;

    const request = buildRequest(cursorsRef.current[pageIndex] || null);
    if (!request) {
      setPersonnels([]);
      setHasMore(false);
      setInitialLoadDone(true);
      return;
    }

    const myRequestId = ++requestIdRef.current;
    setLoading(true);

    const run = async () => {
      try {
        const response = await fetchWithAuth(request.url);
        if (myRequestId !== requestIdRef.current) return;

        const rawData = response?.data?.data || response?.data || response;
        if (!Array.isArray(rawData)) throw new Error('Données pointages invalides');

        const nextCursor = response?.data?.next_cursor ?? null;
        setHasMore(response?.data?.has_more ?? false);

        if (nextCursor) {
          setCursors((prev) => {
            const updated = [...prev];
            updated[pageIndex + 1] = nextCursor;
            return updated;
          });
        }

        setPersonnels(rawData.map(request.mapper));
      } catch (err) {
        console.error('Erreur lors du chargement des pointages:', err);
        if (myRequestId !== requestIdRef.current) return;
        setPersonnels([]);
        setHasMore(false);
        if (showSnack) showSnack(err.message || 'Erreur lors du chargement', true);
      } finally {
        if (myRequestId === requestIdRef.current) {
          setLoading(false);
          setInitialLoadDone(true);
        }
      }
    };

    run();
  }, [idrh, idserv, pageIndex, filterSignature, buildRequest, fetchWithAuth, showSnack]);

  const handleNextPage = useCallback(() => {
    if (hasMore) setPageIndex((prev) => prev + 1);
  }, [hasMore]);

  const handlePrevPage = useCallback(() => {
    setPageIndex((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const supprimerPointageLocalement = useCallback((key) => {
    setPersonnels((prev) => prev.filter((p) => p.key !== key));
  }, []);

  return {
    personnels,
    loading,
    initialLoadDone,
    pageIndex,
    hasMore,
    canGoPrev: pageIndex > 0,
    handleNextPage,
    handlePrevPage,
    triggerRefresh,
    supprimerPointageLocalement,
    setPersonnels,
  };
}