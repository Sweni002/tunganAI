import React, { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styles from '../dashboard.module.css';
import { formatJourCourt, formatJourLong, formatJours } from '../utils/periods';

const SERIES = [
  { key: 'presence', label: 'Présence', color: '#16805f' },
  { key: 'retards', label: 'Retards', color: '#b87800' },
  { key: 'absences_non_justifiees', label: 'Absences non justifiées', color: '#c0353c' },
];

const AXIS_TICK = { fontSize: 11, fill: '#6b7a7e' };

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <strong>{formatJourLong(label)}</strong>
      {payload.map((p) => (
        <div key={p.dataKey}>
          <span className={styles.dot} style={{ '--c': p.color }} />
          {p.name} : <b>{formatJours(p.value)}</b>
        </div>
      ))}
    </div>
  );
}

/** Point actif : anneau blanc + halo, pour un retour visuel net au survol. */
const ActiveDot = ({ cx, cy, stroke }) => (
  <g>
    <circle cx={cx} cy={cy} r={12} fill={stroke} opacity={0.18} />
    <circle cx={cx} cy={cy} r={6} fill={stroke} stroke="#fff" strokeWidth={3} />
  </g>
);

/** Évolution jour par jour. Les jours sans aucun pointage (week-ends, fériés) sont masqués. */
export default function TrendChart({ serie = [] }) {
  const [hidden, setHidden] = useState({});

  const data = useMemo(
    () =>
      serie.filter(
        (d) => d.presence || d.retards || d.absences_non_justifiees || d.absences_justifiees
      ),
    [serie]
  );

  // Repères chiffrés au-dessus du graphique
  const highlights = useMemo(() => {
    if (!data.length) return [];
    const best = data.reduce((a, b) => (b.presence > a.presence ? b : a));
    const worstLate = data.reduce((a, b) => (b.retards > a.retards ? b : a));
    const worstAbs = data.reduce((a, b) => (b.absences_non_justifiees > a.absences_non_justifiees ? b : a));
    const avg = data.reduce((n, d) => n + d.presence, 0) / data.length;
    return [
      { key: 'avg', color: '#16805f', label: 'Présence moyenne', value: `${formatJours(avg)} j / jour` },
      { key: 'best', color: '#1b6979', label: 'Meilleur jour', value: formatJourCourt(best.date) },
      worstLate.retards > 0 && {
        key: 'late', color: '#b87800', label: 'Pic de retards', value: `${formatJourCourt(worstLate.date)} · ${formatJours(worstLate.retards)}`,
      },
      worstAbs.absences_non_justifiees > 0 && {
        key: 'abs', color: '#c0353c', label: "Pic d'absences", value: `${formatJourCourt(worstAbs.date)} · ${formatJours(worstAbs.absences_non_justifiees)}`,
      },
    ].filter(Boolean);
  }, [data]);

  const toggle = (key) => setHidden((h) => ({ ...h, [key]: !h[key] }));

  return (
    <section className={styles.card} aria-label="Évolution sur la période">
      <div className={styles.cardHead}>
        <div>
          <h3 className={styles.cardTitle}>Évolution sur la période</h3>
          <p className={styles.cardSub}>Jours ouvrés uniquement · en jours-équivalents</p>
        </div>
        <div className={styles.toggles}>
          {SERIES.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`${styles.toggle} ${hidden[s.key] ? styles.toggleOff : ''}`}
              aria-pressed={!hidden[s.key]}
              onClick={() => toggle(s.key)}
            >
              <span className={styles.dot} style={{ '--c': s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className={styles.empty}>Aucun pointage sur cette période.</div>
      ) : (
        <>
          <div className={styles.highlights}>
            {highlights.map((h) => (
              <div key={h.key} className={styles.highlight} style={{ '--c': h.color }}>
                <span className={styles.highlightLabel}>{h.label}</span>
                <strong>{h.value}</strong>
              </div>
            ))}
          </div>

          <div className={styles.chartFrame}>
            <div className={styles.chartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 16, right: 12, left: -8, bottom: 4 }}>
                  <defs>
                    <linearGradient id="gPresence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16805f" stopOpacity={0.38} />
                      <stop offset="100%" stopColor="#16805f" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e3eaec" strokeDasharray="4 8" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatJourCourt} tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={12} minTickGap={28} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={10} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={10} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#1b6979', strokeOpacity: 0.25, strokeWidth: 24, strokeLinecap: 'round' }} />
                  {!hidden.presence && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="presence"
                      name="Présence"
                      stroke="#16805f"
                      strokeWidth={3}
                      strokeLinecap="round"
                      fill="url(#gPresence)"
                      activeDot={<ActiveDot />}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  )}
                  {!hidden.retards && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="retards"
                      name="Retards"
                      stroke="#b87800"
                      strokeWidth={3}
                      strokeLinecap="round"
                      dot={{ r: 4, fill: '#b87800', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={<ActiveDot />}
                      animationDuration={1000}
                    />
                  )}
                  {!hidden.absences_non_justifiees && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="absences_non_justifiees"
                      name="Absences non justifiées"
                      stroke="#c0353c"
                      strokeWidth={3}
                      strokeLinecap="round"
                      dot={{ r: 4, fill: '#c0353c', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={<ActiveDot />}
                      animationDuration={1000}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
