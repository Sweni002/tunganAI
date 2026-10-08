import React from "react";
import { Skeleton } from "antd";
import styles from "../sortie.module.css";

/** Répartition des autorisations (statistiques calculées par le serveur) : total, en cours, à venir, terminées. */
export default function SortieSummary({ stats, loading }) {
  const counts = {
    total: stats?.total ?? 0,
    run: stats?.etats?.en_cours ?? 0,
    soon: stats?.etats?.a_venir ?? 0,
    done: stats?.etats?.terminees ?? 0,
  };
  const attente = loading && !stats;

  const tiles = [
    { key: "total", cls: styles.cTotal, icon: "fa-solid fa-person-walking-arrow-right", label: "Autorisations", value: counts.total },
    { key: "run", cls: styles.cRun, icon: "fa-regular fa-clock", label: "En cours", value: counts.run },
    { key: "soon", cls: styles.cSoon, icon: "fa-regular fa-calendar", label: "À venir", value: counts.soon },
    { key: "done", cls: styles.cDone, icon: "fa-solid fa-circle-check", label: "Terminées", value: counts.done },
  ];

  return (
    <section
      className={styles.summary}
      aria-label="Résumé des autorisations"
      aria-busy={loading}
      style={{ opacity: loading && stats ? 0.6 : 1, transition: "opacity 200ms" }}
    >
      {tiles.map((t, i) => (
        <div key={t.key} className={`${styles.tile} ${t.cls}`} style={{ animationDelay: `${i * 70}ms` }}>
          <span className={styles.tileIcon}>
            <i className={t.icon} aria-hidden="true"></i>
          </span>
          <div className={styles.tileText}>
            <span className={styles.tileValue}>
              {attente ? <Skeleton.Input active size="small" style={{ width: 48, minWidth: 0 }} /> : t.value}
            </span>
            <span className={styles.tileLabel}>{t.label}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
