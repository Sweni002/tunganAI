// fiches/dashboard/index.jsx — tableau de bord du responsable
import React, { useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import styles from './dashboard.module.css';
import { useAdminAuth } from '../presences/hooks/useAdminAuth';
import { useDivisions } from '../presences/hooks/useDivisions';
import { useSocketRefresh } from '../presences/hooks/useSocketRefresh';
import { createFetchWithAuth } from '../presences/utils/fetchWithAuth';
import { useDashboardData } from './hooks/useDashboardData';
import PageHeader from '../../content/autorisations_absences/components/PageHeader';

import FiltersBar from './components/FiltersBar';
import TodayCard from './components/TodayCard';
import KpiCards from './components/KpiCards';
import TrendChart from './components/TrendChart';
import WeekdayChart from './components/WeekdayChart';
import DivisionsChart from './components/DivisionsChart';
import WatchLists from './components/WatchLists';

dayjs.locale('fr');

const Dashboard = () => {
  const { admin, idrh, idserv, navigate } = useAdminAuth();
  const fetchWithAuth = useMemo(() => createFetchWithAuth(navigate), [navigate]);

  const {
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
  } = useDashboardData({ idserv, fetchWithAuth });

  const { divisions } = useDivisions({ idrh, idserv, fetchWithAuth });

  // Un pointage arrive : on recharge (regroupe les rafales en un seul rafraîchissement)
  const debouncedRefresh = useMemo(() => {
    let t;
    return () => {
      clearTimeout(t);
      t = setTimeout(refresh, 1500);
    };
  }, [refresh]);
  useSocketRefresh(debouncedRefresh);

  const handleReset = useCallback(() => reset(), [reset]);

  if (admin && !idserv) {
    return (
      <div className={styles.page}>
        <PageHeader title="Tableau de bord" subtitle="Suivi de l'assiduité et des présences de votre service" />
        <div className={styles.card}>
          <div className={styles.empty}>
            Ce tableau de bord est réservé aux responsables rattachés à un service.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Tableau de bord"
        subtitle="Suivi de l'assiduité et des présences de votre service"
      />

      <FiltersBar
        filters={filters}
        divisions={divisions}
        onPreset={setPreset}
        onCustomRange={setCustomRange}
        onDivision={setDivision}
        onRole={setRole}
        onReset={handleReset}
        isFiltered={isFiltered}
      />

      {error && (
        <div className={styles.errorBox} role="alert">
          {error}
        </div>
      )}

      <div className={styles.rowTop}>
        <TodayCard today={today} />
        <KpiCards overview={overview} loading={loading} />
      </div>

      <div className={styles.rowCharts} style={loading && overview ? { opacity: 0.6 } : undefined}>
        <TrendChart serie={overview?.serie} />
        <WeekdayChart serie={overview?.serie} />
      </div>

      <DivisionsChart divisions={overview?.divisions} />

      <WatchLists aSurveiller={overview?.a_surveiller} />
    </div>
  );
};

export default Dashboard;
