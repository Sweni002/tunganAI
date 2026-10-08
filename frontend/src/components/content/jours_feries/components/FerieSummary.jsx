import React from "react";
import { Skeleton } from "antd";
import styles from "../../autorisation_sortie/sortie.module.css";

/** Tuiles de résumé : total, à venir, aujourd'hui, passés (calculés par le serveur). */
export default function FerieSummary({ resume, loading }) {
  const attente = loading && !resume;

  const tiles = [
    { key: "total", cls: styles.cTotal, icon: "fa-solid fa-calendar-days", label: "Jours fériés", value: resume?.total ?? 0 },
    { key: "soon", cls: styles.cSoon, icon: "fa-regular fa-calendar", label: "À venir", value: resume?.a_venir ?? 0 },
    { key: "today", cls: styles.cRun, icon: "fa-regular fa-clock", label: "Aujourd'hui", value: resume?.aujourd_hui ?? 0 },
    { key: "past", cls: styles.cDone, icon: "fa-solid fa-circle-check", label: "Passés", value: resume?.passes ?? 0 },
  ];

  return (
    <section
      className={styles.summary}
      aria-label="Résumé des jours fériés"
      aria-busy={loading}
      style={{ opacity: loading && resume ? 0.6 : 1, transition: "opacity 200ms" }}
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
