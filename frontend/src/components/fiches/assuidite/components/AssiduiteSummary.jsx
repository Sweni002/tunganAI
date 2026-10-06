import React from "react";
import { Skeleton } from "antd";
import styles from "../../assiduitePerso/components/dashboard.module.css";
import { fmtMin } from "../../assiduitePerso/components/retardUtils";

/**
 * Résumé du mois : totaux calculés par le serveur (/fiches_assiduite/resume)
 * sur tous les agents correspondant aux filtres, quelle que soit la page affichée.
 */
export default function AssiduiteSummary({ resume, loading }) {
  const r = resume || {};
  const nonJust = r.absences_non_justifiees ?? 0;
  const dash = loading && !resume ? <Skeleton.Input active size="small" style={{ width: 60 }} /> : null;

  const kpis = [
    { key: "agents", tone: "warn2", icon: "fa-solid fa-users", label: "Agents", value: dash ?? r.agents ?? 0, hint: "Selon vos filtres" },
    { key: "retards", tone: "warn", icon: "fa-regular fa-clock", label: "Retards", value: dash ?? r.retards?.nombre ?? 0, hint: `Volume : ${fmtMin(r.retards?.total_minutes ?? 0)}` },
    { key: "nonjust", tone: "danger", icon: "fa-solid fa-user-xmark", label: "Absences non justifiées", value: dash ?? nonJust, hint: nonJust > 0 ? "À régulariser" : "Rien à signaler" },
    { key: "just", tone: "info", icon: "fa-solid fa-user-check", label: "Absences justifiées", value: dash ?? r.absences_justifiees ?? 0, hint: "Jours valables" },
  ];

  return (
    <section className={styles.hero} aria-label="Résumé du mois" aria-busy={loading}>
      <h3 className={styles.sectionTitle}>Résumé du mois</h3>
      <div className={styles.kpis} style={{ opacity: loading && resume ? 0.6 : 1, transition: "opacity 200ms" }}>
        {kpis.map((k, i) => (
          <div key={k.key} className={`${styles.kpi} ${styles[k.tone]}`} style={{ animationDelay: `${i * 70}ms` }}>
            <span className={styles.kpiIcon}>
              <i className={k.icon} aria-hidden="true"></i>
            </span>
            <span className={styles.kpiValue}>{k.value}</span>
            <span className={styles.kpiLabel}>{k.label}</span>
            <span className={styles.kpiHint}>{dash ? <Skeleton.Input active size="small" style={{ width: 90, height: 12, minWidth: 0 }} /> : k.hint}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
