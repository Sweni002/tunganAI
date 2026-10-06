import React from 'react';
import styles from '../dashboard.module.css';
import { formatJours, formatMinutes } from '../utils/periods';

function WatchCard({ title, subtitle, rows, emptyText, badge, badgeClass }) {
  return (
    <section className={styles.card} aria-label={title}>
      <div className={styles.cardHead}>
        <div>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardSub}>{subtitle}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={styles.empty}>{emptyText}</div>
      ) : (
        <ol className={styles.watch} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((r, i) => (
            <li key={r.idpers} className={styles.watchRow}>
              <span className={styles.rank}>{i + 1}</span>
              <div className={styles.who}>
                <strong title={r.nom}>{r.nom}</strong>
                <span>
                  {r.matricule}
                  {r.division ? ` · ${r.division}` : ''}
                </span>
              </div>
              <span className={`${styles.badge} ${badgeClass}`}>{badge(r)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Deux classements : les plus en retard, et ceux qui cumulent des absences non justifiées. */
export default function WatchLists({ aSurveiller }) {
  return (
    <div className={styles.rowPair}>
      <WatchCard
        title="Les plus en retard"
        subtitle="Cumul de minutes de retard"
        rows={aSurveiller?.retards ?? []}
        emptyText="Aucun retard sur cette période."
        badge={(r) => formatMinutes(r.minutes_retard)}
        badgeClass={styles.badgeWarn}
      />
      <WatchCard
        title="Absences non justifiées"
        subtitle="À régulariser en priorité"
        rows={aSurveiller?.absences ?? []}
        emptyText="Aucune absence non justifiée sur cette période."
        badge={(r) => `${formatJours(r.absences_non_justifiees)} j`}
        badgeClass={styles.badgeBad}
      />
    </div>
  );
}
