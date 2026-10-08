import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import styles from "./dashboard.module.css";
import { hmsToMinutes, fmtMin } from "./retardUtils";

const cleanDates = (raw = []) => raw.map((d) => d.replace(/\s+(matin|après-midi)$/, ""));

// Compteur animé (ease-out) ; saute l'animation si l'utilisateur la refuse
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !target) {
      setVal(target);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

const Counter = ({ value, format }) => {
  const v = useCountUp(Number(value) || 0);
  return <>{format ? format(v) : v}</>;
};

/**
 * Tableau de bord d'un seul personnel : identité + indicateurs clés du mois.
 * Les chiffres sont agrégés depuis filteredPersonnels (normalement 1 ligne).
 */
export default function DashboardHero({ c }) {
  const rows = c.filteredPersonnels || [];
  const p = rows[0];
  const loading = c.loading || !c.ready;

  const retardNb = rows.reduce((n, r) => n + (r.retards?.nombre ?? 0), 0);
  const retardMin = rows.reduce((n, r) => n + hmsToMinutes(r.total_retard_minutes), 0);
  const nonJustNb = rows.reduce((n, r) => n + (r.absences?.non_justifiees?.nombre ?? 0), 0);
  const justifNb = rows.reduce(
    (n, r) => n + (r.absences_par_type || []).reduce((m, a) => m + (a.nombre || 0), 0),
    0,
  );

  const parType = {};
  rows.forEach((r) =>
    (r.absences_par_type || []).forEach((a) => {
      if (a.nombre > 0) parType[a.idtype] = (parType[a.idtype] || 0) + a.nombre;
    }),
  );
  const typeChips = (c.types || [])
    .filter((t) => parType[t.idtype])
    .map((t) => ({ id: t.idtype, label: t.nomtype, n: parType[t.idtype] }));

  const openRetards = () => {
    const dates = cleanDates(rows.flatMap((r) => r.retards?.dates || []));
    if (!dates.length) return;
    c.fetchRetardDetails(dates);
    c.setSelectedRetardDates(dates);
  };

  const allClear = rows.length > 0 && retardNb === 0 && nonJustNb === 0;
  const hasIssue = nonJustNb > 0;
  const statut = !rows.length
    ? null
    : allClear
      ? { cls: styles.statusOk, icon: "fa-solid fa-circle-check", text: "Assiduité exemplaire" }
      : hasIssue
        ? { cls: styles.statusBad, icon: "fa-solid fa-triangle-exclamation", text: "Absences à régulariser" }
        : { cls: styles.statusWarn, icon: "fa-solid fa-circle-info", text: "Quelques retards ce mois-ci" };

  const initials = p ? `${(p.nom || "")[0] || ""}${(p.prenom || "")[0] || ""}`.toUpperCase() : "–";
  const mois = dayjs(c.selectedDate).locale("fr").format("MMMM YYYY");

  // Nombres ENTIERS de matins / soirs (calculés par le serveur) : pas de virgule
  const matin = c.resume?.matin;
  const soir = c.resume?.soir;
  const partage = (cle) => (matin && soir ? { split: { matin: matin[cle] ?? 0, soir: soir[cle] ?? 0 } } : {});

  const kpis = [
    {
      key: "retards",
      tone: "warn",
      icon: "fa-regular fa-clock",
      label: "Retards",
      value: retardNb,
      raw: retardNb,
      ...partage("retards"),
      hint: retardNb > 0 ? "Voir le détail" : "Aucun retard",
      onClick: retardNb > 0 ? openRetards : undefined,
    },
    {
      key: "volume",
      tone: "warn2",
      icon: "fa-solid fa-hourglass-half",
      label: "Volume de retard",
      value: retardMin,
      format: fmtMin,
      hint: "Cumul du mois",
    },
    {
      key: "nonjust",
      tone: "danger",
      icon: "fa-solid fa-user-xmark",
      label: "Absences non justifiées",
      value: nonJustNb,
      ...partage("absences_non_justifiees"),
      hint: nonJustNb > 0 ? "À régulariser" : "Rien à signaler",
    },
    {
      key: "just",
      tone: "info",
      icon: "fa-solid fa-user-check",
      label: "Absences justifiées",
      value: justifNb,
      ...partage("absences_justifiees"),
      hint: matin && soir ? "Demi-journées valables" : "Jours valables",
    },
  ];

  return (
    <section className={styles.hero} aria-label="Tableau de bord">
      <div className={styles.profile}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.identity}>
          <h2>{p ? `${p.nom ?? ""} ${p.prenom ?? ""}` : loading ? "Chargement…" : "Aucune donnée"}</h2>
          <div className={styles.meta}>
            {p?.matricule && <span className={styles.pill}>Matricule {p.matricule}</span>}
            {p?.division && <span className={styles.pill}>{p.division}</span>}
            <span className={`${styles.pill} ${styles.pillMonth}`}>
              <i className="fa-regular fa-calendar" aria-hidden="true"></i> {mois}
            </span>
          </div>
        </div>
        {statut && (
          <div className={`${styles.status} ${statut.cls}`} role="status">
            <i className={statut.icon} aria-hidden="true"></i> {statut.text}
          </div>
        )}
      </div>

      <h3 className={styles.sectionTitle}>Résumé du mois</h3>
      <div className={styles.kpis}>
        {kpis.map((k, i) => (
          <button
            key={k.key}
            type="button"
            className={`${styles.kpi} ${styles[k.tone]}`}
            style={{ animationDelay: `${i * 70}ms` }}
            onClick={k.onClick}
            disabled={!k.onClick}
          >
            <span className={styles.kpiIcon}>
              <i className={k.icon} aria-hidden="true"></i>
            </span>
            <span className={styles.kpiLabel}>{k.label}</span>
            {k.split ? (
              <span className={styles.kpiSplit}>
                <span className={styles.kpiHalf}>
                  <span className={styles.kpiHalfLabel}>
                    <i className="fa-solid fa-sun" aria-hidden="true"></i>Matin
                  </span>
                  <span className={styles.kpiHalfValue}>
                    <Counter value={k.split.matin} />
                  </span>
                </span>
                <span className={styles.kpiHalf}>
                  <span className={styles.kpiHalfLabel}>
                    <i className="fa-solid fa-cloud-sun" aria-hidden="true"></i>Soir
                  </span>
                  <span className={styles.kpiHalfValue}>
                    <Counter value={k.split.soir} />
                  </span>
                </span>
              </span>
            ) : (
              <span className={styles.kpiValue}>
                <Counter value={k.value} format={k.format} />
              </span>
            )}
            <span className={styles.kpiHint}>{k.hint}</span>
          </button>
        ))}
      </div>

      {typeChips.length > 0 && (
        <div className={styles.types}>
          <span className={styles.typesTitle}>Absences justifiées par type</span>
          {typeChips.map((t) => (
            <span key={t.id} className={styles.typeChip}>
              {t.label} <strong>{t.n}</strong>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
