import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from '../dashboard.module.css';
import { formatJours } from '../utils/periods';

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const JOURS_LONGS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const AXIS_TICK = { fontSize: 11, fill: '#6b7a7e' };

function WeekdayTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <strong>{label}</strong>
      {payload.map((p) => (
        <div key={p.dataKey}>
          <span className={styles.dot} style={{ '--c': p.color }} />
          {p.name} : <b>{formatJours(p.value)}</b> / jour
        </div>
      ))}
    </div>
  );
}

/** Moyenne des retards et des absences par jour de la semaine : repère les jours « à risque ». */
export default function WeekdayChart({ serie = [] }) {
  const { data, insight } = useMemo(() => {
    const acc = {};
    serie.forEach((d) => {
      const worked = d.presence || d.retards || d.absences_non_justifiees || d.absences_justifiees;
      if (!worked) return; // jour non travaillé
      const w = dayjs(d.date).day();
      acc[w] = acc[w] || { n: 0, retards: 0, absences: 0 };
      acc[w].n += 1;
      acc[w].retards += d.retards;
      acc[w].absences += d.absences_non_justifiees;
    });

    const rows = [1, 2, 3, 4, 5, 6, 0]
      .filter((w) => acc[w])
      .map((w) => ({
        jour: JOURS[w],
        long: JOURS_LONGS[w],
        retards: Math.round((acc[w].retards / acc[w].n) * 10) / 10,
        absences: Math.round((acc[w].absences / acc[w].n) * 10) / 10,
      }));

    const pire = rows.reduce(
      (best, r) => (r.retards + r.absences > (best?.retards ?? 0) + (best?.absences ?? 0) ? r : best),
      null
    );
    const text =
      pire && pire.retards + pire.absences > 0
        ? `Le ${pire.long} concentre le plus de retards et d'absences en moyenne.`
        : rows.length
          ? 'Aucun jour de la semaine ne se distingue sur cette période.'
          : null;
    return { data: rows, insight: text };
  }, [serie]);

  return (
    <section className={styles.card} aria-label="Par jour de la semaine">
      <div className={styles.cardHead}>
        <div>
          <h3 className={styles.cardTitle}>Jours à risque</h3>
          <p className={styles.cardSub}>Moyenne par jour de la semaine</p>
        </div>
        <div className={styles.toggles}>
          <span className={styles.legend}>
            <span className={styles.dot} style={{ '--c': '#b87800' }} /> Retards
          </span>
          <span className={styles.legend}>
            <span className={styles.dot} style={{ '--c': '#c0353c' }} /> Absences
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className={styles.empty}>Pas assez de données.</div>
      ) : (
        <>
          <div className={styles.chartFrame}>
            <div className={styles.chartBox} style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 16, right: 8, left: -20, bottom: 4 }} barGap={8} barCategoryGap="22%">
                  <CartesianGrid stroke="#e3eaec" strokeDasharray="4 8" vertical={false} />
                  <XAxis dataKey="jour" tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={12} />
                  <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={10} allowDecimals />
                  <Tooltip content={<WeekdayTooltip />} cursor={{ fill: 'rgba(27,105,121,0.08)', radius: 14 }} />
                  <Bar
                    dataKey="retards"
                    name="Retards"
                    fill="#b87800"
                    radius={[10, 10, 10, 10]}
                    maxBarSize={20}
                    background={{ fill: '#eef2f3', radius: 10 }}
                    animationDuration={1000}
                  />
                  <Bar
                    dataKey="absences"
                    name="Absences non justifiées"
                    fill="#c0353c"
                    radius={[10, 10, 10, 10]}
                    maxBarSize={20}
                    background={{ fill: '#eef2f3', radius: 10 }}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {insight && (
            <p className={styles.insight}>
              <i className="fa-solid fa-lightbulb" aria-hidden="true"></i> {insight}
            </p>
          )}
        </>
      )}
    </section>
  );
}
