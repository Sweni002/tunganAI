import React, { useEffect, useState } from 'react';
import styles from '../dashboard.module.css';
import CountUp from './CountUp';
import { formatJourLong } from '../utils/periods';

const R = 62;
const CIRC = 2 * Math.PI * R;

/** « Aujourd'hui » : anneau de présence, répartition de l'effectif et compteurs détaillés. */
export default function TodayCard({ today }) {
  // Heure de dernière mise à jour : rassure sur la fraîcheur des chiffres
  const [updatedAt, setUpdatedAt] = useState(null);
  useEffect(() => {
    if (today) setUpdatedAt(new Date());
  }, [today]);

  const taux = today?.taux_presence ?? 0;
  const effectif = today?.effectif ?? 0;
  const aLHeure = Math.max((today?.presents ?? 0) - (today?.retards ?? 0), 0);

  const stats = [
    { key: 'presents', label: 'Présents', value: today?.presents, icon: 'fa-solid fa-user-check', tone: styles.tdOk },
    { key: 'retards', label: 'En retard', value: today?.retards, icon: 'fa-regular fa-clock', tone: styles.tdLate },
    { key: 'absents', label: 'Absents', value: today?.absents, icon: 'fa-solid fa-user-xmark', tone: styles.tdAbsent },
    { key: 'attente', label: 'Pas encore pointés', value: today?.pas_encore_pointes, icon: 'fa-solid fa-hourglass-half', tone: styles.tdWait },
  ];

  // Segments de la barre de répartition (proportionnels à l'effectif)
  const segments = [
    { key: 'ok', value: aLHeure, cls: styles.segOk, label: "À l'heure" },
    { key: 'late', value: today?.retards ?? 0, cls: styles.segLate, label: 'En retard' },
    { key: 'abs', value: today?.absents ?? 0, cls: styles.segAbsent, label: 'Absents' },
    { key: 'wait', value: today?.pas_encore_pointes ?? 0, cls: styles.segWait, label: 'Pas encore pointés' },
  ];

  return (
    <section className={`${styles.card} ${styles.today}`} aria-label="Aujourd'hui">
      <header className={styles.todayHead}>
        <div>
          <h3 className={styles.cardTitle}>Aujourd'hui</h3>
          <p className={styles.cardSub} style={{ textTransform: 'capitalize' }}>
            {today ? formatJourLong(today.date) : '…'}
          </p>
        </div>
        <span className={styles.livePill}>
          <span className={styles.liveDot} aria-hidden="true" />
          En direct
        </span>
      </header>

      {!today ? (
        <div className={styles.skel} style={{ height: 220, opacity: 0.35 }} />
      ) : (
        <>
          <div className={styles.todayBody}>
            <div className={styles.ring} role="img" aria-label={`Taux de présence : ${taux} %`}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle className={styles.ringTrack} cx="80" cy="80" r={R} fill="none" strokeWidth="14" />
                <circle
                  className={styles.ringValue}
                  cx="80"
                  cy="80"
                  r={R}
                  fill="none"
                  strokeWidth="14"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - Math.min(taux, 100) / 100)}
                />
              </svg>
              <div className={styles.ringLabel}>
                <strong>
                  <CountUp value={taux} decimals={0} />%
                </strong>
                <span>de présence</span>
              </div>
            </div>

            <div className={styles.todayStats}>
              {stats.map((s, i) => (
                <div key={s.key} className={`${styles.todayStat} ${s.tone}`} style={{ animationDelay: `${i * 70}ms` }}>
                  <span className={styles.todayIcon}>
                    <i className={s.icon} aria-hidden="true"></i>
                  </span>
                  <strong>
                    <CountUp value={s.value ?? 0} />
                  </strong>
                  <span className={styles.todayLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Répartition de l'effectif */}
          {effectif > 0 && (
            <div>
              <div className={styles.stack} role="img" aria-label="Répartition de l'effectif aujourd'hui">
                {segments
                  .filter((s) => s.value > 0)
                  .map((s) => (
                    <span
                      key={s.key}
                      className={`${styles.stackSeg} ${s.cls}`}
                      style={{ flexGrow: s.value }}
                      title={`${s.label} : ${s.value}`}
                    />
                  ))}
              </div>
              <div className={styles.stackLegend}>
                {segments.map((s) => (
                  <span key={s.key}>
                    <i className={`${styles.stackDot} ${s.cls}`} /> {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className={styles.todayFoot}>
            {effectif} agent{effectif > 1 ? 's' : ''} suivi{effectif > 1 ? 's' : ''}
            {updatedAt &&
              ` · mis à jour à ${updatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </>
      )}
    </section>
  );
}
