import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';

const API_URL = import.meta.env.VITE_API_URL;

const EMPTY_STATS = {
  effectif: 0,
  presence: 0,
  retards: 0,
  absence_non_justifiee: 0,
  absence_justifiee: 0,
  taux_presence: 0,
};

export function useStatsService({
  idserv,
  iddiv = null,
  selectedDate = null,
  dateDebutFiltre = '',
  dateFinFiltre = '',
  fetchWithAuth,
  refreshKey = 0,
}) {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!idserv) {
      setStats(EMPTY_STATS);
      return;
    }

    const params = new URLSearchParams();

    params.set('idserv', String(idserv));

    // =========================
    // DIVISION
    // =========================
    if (iddiv) {
      params.set('iddiv', String(iddiv));
    }

    // =========================
    // PLAGE DE DATES
    // =========================
    if (dateDebutFiltre && dateFinFiltre) {
      params.set(
        'dateDebut',
        dayjs(dateDebutFiltre).format('YYYY-MM-DD')
      );

      params.set(
        'dateFin',
        dayjs(dateFinFiltre).format('YYYY-MM-DD')
      );
    }

    // =========================
    // DATE UNIQUE
    // =========================
    else if (selectedDate) {
      params.set(
        'date',
        dayjs(selectedDate).format('YYYY-MM-DD')
      );
    }

    const url = `${API_URL}/api/pointage/stats?${params.toString()}`;

    console.log('📊 URL STATS:', url);

    setLoading(true);

    try {
      const response = await fetchWithAuth(url);

      const data = response?.data ?? response;

      setStats({
        effectif: Number(data?.effectif ?? 0),
        presence: Number(data?.presence ?? 0),
        retards: Number(data?.retards ?? 0),
        absence_non_justifiee: Number(
          data?.absence_non_justifiee ?? 0
        ),
        absence_justifiee: Number(
          data?.absence_justifiee ?? 0
        ),
        taux_presence: Number(
          data?.taux_presence ?? 0
        ),
      });

    } catch (error) {
      console.error(
        'Erreur lors du chargement des statistiques:',
        error
      );

      setStats(EMPTY_STATS);

    } finally {
      setLoading(false);
    }
  }, [
    idserv,
    iddiv,
    selectedDate,
    dateDebutFiltre,
    dateFinFiltre,
    fetchWithAuth,
  ]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  return {
    stats,
    loading,
    refreshStats: fetchStats,
  };
}