import React from 'react';
import styles from '../dashboard.module.css';
import CountUp from './CountUp';
import { formatJours, formatMinutes } from '../utils/periods';

/**
 * Pastille de tendance vs période précédente.
 * `goodWhen` : sens favorable ('up' pour un taux, 'down' pour retards / absences).
 */
function Trend({ value, unit, goodWhen }) {
  if (value === null || value === undefined) {
    return <span className={`${styles.trend} ${styles.trendFlat}`}>— vs période précédente</span>;
  }
  if (value === 0) {
    return <span className={`${styles.trend} ${styles.trendFlat}`}>= stable</span>;
  }
  const up = value > 0;
  const good = (goodWhen === 'up') === up;
  const sign = up ? '+' : '−';
  const abs = Math.abs(value).toString().replace('.', ',');
  return (
    <span className={`${styles.trend} ${good ? styles.trendGood : styles.trendBad}`}>
      <i className={`fa-solid fa-arrow-${up ? 'up' : 'down'}`} aria-hidden="true"></i>
      {sign}
      {abs} {unit} <span style={{ fontWeight: 400 }}>vs préc.</span>
    </span>
  );
}

const Skeleton = () => (
  <div className={styles.kpiGrid}>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className={`${styles.card} ${styles.skel}`} style={{ height: 190 }} />
    ))}
  </div>
);

export default function KpiCards({ overview, loading }) {
  if (!overview) return <Skeleton />;

  const { kpis, tendances } = overview;
  const nd = (v) => (v === null || v === undefined);
  const pct = (v) => `${v.toFixed(1).replace('.', ',')} %`;

  // Taux fournis par le serveur ; calculés ici si une ancienne réponse en cache ne les contient pas
  const attendus = kpis.presence + kpis.absences_non_justifiees + kpis.absences_justifiees;
  const tauxRetard =
    kpis.taux_retard ?? (kpis.presence ? Math.min((kpis.retards / kpis.presence) * 100, 100) : null);
  const tauxAbsences =
    kpis.taux_absences_non_justifiees ?? (attendus ? (kpis.absences_non_justifiees / attendus) * 100 : null);
  const trendRetard =
    tendances.taux_retard !== undefined ? (
      <Trend value={tendances.taux_retard} unit="pts" goodWhen="down" />
    ) : (
      <Trend value={tendances.retards} unit="%" goodWhen="down" />
    );
  const trendAbsences =
    tendances.taux_absences_non_justifiees !== undefined ? (
      <Trend value={tendances.taux_absences_non_justifiees} unit="pts" goodWhen="down" />
    ) : (
      <Trend value={tendances.absences_non_justifiees} unit="%" goodWhen="down" />
    );

  const cards = [
    {
      key: 'presence',
      tone: styles.tonePresence,
      icon: 'fa-solid fa-user-check',
      label: 'Taux de présence',
      value: kpis.taux_presence,
      render: (v) => `${v.toFixed(1).replace('.', ',')} %`,
      hint: `${formatJours(kpis.presence)} jours de présence`,
      trend: <Trend value={tendances.taux_presence} unit="pts" goodWhen="up" />,
    },
    {
      key: 'ponctualite',
      tone: styles.tonePunct,
      icon: 'fa-regular fa-clock',
      label: 'Ponctualité',
      value: kpis.taux_ponctualite,
      render: (v) => `${v.toFixed(1).replace('.', ',')} %`,
      hint: 'Part des présences sans retard',
      trend: <Trend value={tendances.taux_ponctualite} unit="pts" goodWhen="up" />,
    },
    {
      key: 'retards',
      tone: styles.toneLate,
      icon: 'fa-solid fa-hourglass-half',
      label: 'Retards',
      value: tauxRetard,
      render: pct,
      hint: `${formatJours(kpis.retards)} jour${kpis.retards > 1 ? 's' : ''} de retard · ${formatMinutes(kpis.minutes_retard)} cumulées`,
      trend: trendRetard,
    },
    {
      key: 'absences',
      tone: styles.toneAbsent,
      icon: 'fa-solid fa-user-xmark',
      label: 'Absences non justifiées',
      value: tauxAbsences,
      render: pct,
      hint: `${formatJours(kpis.absences_non_justifiees)} jour${kpis.absences_non_justifiees > 1 ? 's' : ''} · + ${formatJours(kpis.absences_justifiees)} justifiée${kpis.absences_justifiees > 1 ? 's' : ''}`,
      trend: trendAbsences,
    },
  ];

  return (
    <div className={`${styles.kpiGrid} ${loading ? styles.refreshing : ''}`} aria-busy={loading}>
      {cards.map((c, i) => (
        <article
          key={c.key}
          className={`${styles.card} ${styles.kpi} ${c.tone}`}
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <span className={styles.kpiIcon}>
            <i className={c.icon} aria-hidden="true"></i>
          </span>
          <span className={styles.kpiValue}>
            {nd(c.value) ? '—' : <CountUp value={c.value} format={c.render} />}
          </span>
          <span className={styles.kpiLabel}>{c.label}</span>
          <span className={styles.kpiHint}>{c.hint}</span>
          {c.trend}
        </article>
      ))}
    </div>
  );
}
