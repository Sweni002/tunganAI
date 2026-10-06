import React from 'react';
import styles from '../dashboard.module.css';
import { PRESETS } from '../utils/periods';

const ROLES = [
  { key: '', label: 'Tous' },
  { key: 'bureau', label: 'Bureau' },
  { key: 'surface', label: 'Surface' },
];

export default function FiltersBar({
  filters,
  divisions,
  onPreset,
  onCustomRange,
  onDivision,
  onRole,
  onReset,
  isFiltered,
}) {
  return (
    <section className={styles.filters} aria-label="Filtres du tableau de bord">
      <div className={styles.segmented} role="group" aria-label="Période">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`${styles.seg} ${filters.preset === p.key ? styles.segActive : ''}`}
            aria-pressed={filters.preset === p.key}
            onClick={() => onPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {filters.preset === 'custom' && (
        <div className={styles.dateGroup}>
          <label>
            Du{' '}
            <input
              type="date"
              className={styles.dateInput}
              value={filters.debut}
              max={filters.fin || undefined}
              onChange={(e) => onCustomRange(e.target.value, filters.fin)}
            />
          </label>
          <label>
            au{' '}
            <input
              type="date"
              className={styles.dateInput}
              value={filters.fin}
              min={filters.debut || undefined}
              onChange={(e) => onCustomRange(filters.debut, e.target.value)}
            />
          </label>
        </div>
      )}

      <select
        className={styles.select}
        value={filters.iddiv}
        onChange={(e) => onDivision(e.target.value)}
        aria-label="Division"
      >
        <option value="">Toutes les divisions</option>
        {divisions.map((d) => (
          <option key={d.iddiv} value={d.iddiv}>
            {d.nomdivision}
          </option>
        ))}
      </select>

      <div className={styles.segmented} role="group" aria-label="Type d'agent">
        {ROLES.map((r) => (
          <button
            key={r.key || 'tous'}
            type="button"
            className={`${styles.seg} ${filters.role === r.key ? styles.segActive : ''}`}
            aria-pressed={filters.role === r.key}
            onClick={() => onRole(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <span className={styles.spacer} />

      {isFiltered && (
        <button type="button" className={styles.linkBtn} onClick={onReset}>
          <i className="fa-solid fa-rotate-left" aria-hidden="true"></i> Réinitialiser
        </button>
      )}
    </section>
  );
}
