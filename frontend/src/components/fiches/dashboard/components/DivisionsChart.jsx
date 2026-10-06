import React from 'react';
import styles from '../dashboard.module.css';
import { formatJours } from '../utils/periods';

// Seuils lisibles : ≥ 90 % bon, 75–90 % à surveiller, < 75 % préoccupant
const colorFor = (taux) => (taux >= 90 ? '#16805f' : taux >= 75 ? '#d99100' : '#c0353c');

/** Taux de présence par division, de la plus faible à la plus forte (les points faibles d'abord). */
export default function DivisionsChart({ divisions = [] }) {
  return (
    <section className={styles.card} aria-label="Présence par division">
      <div className={styles.cardHead}>
        <div>
          <h3 className={styles.cardTitle}>Présence par division</h3>
          <p className={styles.cardSub}>Des plus faibles aux plus élevées</p>
        </div>
      </div>

      {divisions.length === 0 ? (
        <div className={styles.empty}>Aucune donnée de division sur cette période.</div>
      ) : (
        <div className={styles.divList}>
          {divisions.map((d) => {
            const taux = d.taux_presence;
            return (
              <div key={d.iddiv} className={styles.divRow}>
                <span className={styles.divName} title={d.nom}>
                  {d.nom}
                </span>
                <div
                  className={styles.bar}
                  role="progressbar"
                  aria-valuenow={taux ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Taux de présence ${d.nom}`}
                >
                  <div
                    className={styles.barFill}
                    style={{ width: `${taux ?? 0}%`, '--fill': colorFor(taux ?? 0) }}
                  />
                </div>
                <span className={styles.divVal}>
                  {taux === null ? '—' : `${String(taux).replace('.', ',')} %`}
                </span>
                <span className={styles.divMeta}>
                  {d.effectif} agent{d.effectif > 1 ? 's' : ''} · {formatJours(d.retards)} retard
                  {d.retards > 1 ? 's' : ''} · {formatJours(d.absences_non_justifiees)} absence
                  {d.absences_non_justifiees > 1 ? 's' : ''} non justifiée
                  {d.absences_non_justifiees > 1 ? 's' : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
