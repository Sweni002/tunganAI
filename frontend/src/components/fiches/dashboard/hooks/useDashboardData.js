import { useCallback, useEffect, useMemo, useState } from 'react';
import { rangeForPreset } from '../utils/periods';

const API_URL = import.meta.env.VITE_API_URL;
const TODAY_REFRESH_MS = 60_000;

const DEFAULT_FILTERS = { preset: 'mois', ...rangeForPreset('mois'), iddiv: '', role: '' };

/**
 * Données du tableau de bord d'un service : filtres + /overview + /today.
 * - /overview suit les filtres (période, division, type d'agent) ;
 * - /today est rafraîchi chaque minute et à chaque pointage reçu en temps réel.
 */
export function useDashboardData({ idserv, fetchWithAuth }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [overview, setOverview] = useState(null);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Les paramètres communs aux deux routes
  const scopeParams = useMemo(() => {
    const p = new URLSearchParams({ idserv: String(idserv ?? '') });
    if (filters.iddiv) p.set('iddiv', String(filters.iddiv));
    if (filters.role) p.set('role', filters.role);
    return p;
  }, [idserv, filters.iddiv, filters.role]);

  // --- Vue d'ensemble de la période ---
  useEffect(() => {
    if (!idserv || !filters.debut || !filters.fin) return undefined;
    if (filters.fin < filters.debut) {
      setError('La date de fin doit être postérieure à la date de début.');
      return undefined;
    }

    let cancelled = false; // ignore les réponses devenues obsolètes
    setLoading(true);
    setError(null);

    const params = new URLSearchParams(scopeParams);
    params.set('dateDebut', filters.debut);
    params.set('dateFin', filters.fin);

    fetchWithAuth(`${API_URL}/api/dashboard/overview?${params.toString()}`)
      .then((data) => !cancelled && setOverview(data))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [idserv, scopeParams, filters.debut, filters.fin, refreshKey, fetchWithAuth]);

  // --- Photo du jour ---
  useEffect(() => {
    if (!idserv) return undefined;

    let cancelled = false;
    const load = () =>
      fetchWithAuth(`${API_URL}/api/dashboard/today?${scopeParams.toString()}`)
        .then((data) => !cancelled && setToday(data))
        .catch((e) => console.error('Dashboard (aujourd\'hui) :', e));

    load();
    const timer = setInterval(load, TODAY_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [idserv, scopeParams, refreshKey, fetchWithAuth]);

  // --- Mises à jour des filtres ---
  const setPreset = useCallback((preset) => {
    const range = rangeForPreset(preset);
    setFilters((f) => ({ ...f, preset, ...(range || {}) }));
  }, []);

  const setCustomRange = useCallback((debut, fin) => {
    setFilters((f) => ({ ...f, preset: 'custom', debut, fin }));
  }, []);

  const setDivision = useCallback((iddiv) => setFilters((f) => ({ ...f, iddiv })), []);
  const setRole = useCallback((role) => setFilters((f) => ({ ...f, role })), []);
  const reset = useCallback(() => setFilters({ ...DEFAULT_FILTERS, ...rangeForPreset('mois') }), []);

  const isFiltered =
    filters.preset !== DEFAULT_FILTERS.preset || Boolean(filters.iddiv) || Boolean(filters.role);

  return {
    filters,
    setPreset,
    setCustomRange,
    setDivision,
    setRole,
    reset,
    isFiltered,
    overview,
    today,
    loading,
    error,
    refresh,
  };
}
