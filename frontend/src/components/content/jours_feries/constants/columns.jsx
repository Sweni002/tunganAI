import React from "react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { Tooltip } from "antd";
import sortie from "../../autorisation_sortie/sortie.module.css";
import styles from "../jours_feries.module.css";

const PERIODES = {
  complete: { cls: styles.chipTotal, icon: "fa-solid fa-calendar-day", label: "Journée complète" },
  matin: { cls: styles.chipMatin, icon: "fa-solid fa-sun", label: "Matin" },
  soir: { cls: styles.chipSoir, icon: "fa-solid fa-cloud-sun", label: "Après-midi" },
};

const ETATS = {
  passe: { cls: sortie.chipDone, icon: "fa-solid fa-circle-check", label: "Passé" },
  aujourdhui: { cls: sortie.chipRun, icon: "fa-regular fa-clock", label: "Aujourd'hui" },
  a_venir: { cls: sortie.chipSoon, icon: "fa-regular fa-calendar", label: "À venir" },
};

const entete = (texte) => <span style={{ textTransform: "uppercase" }}>{texte}</span>;

export const getColumns = (onEdit, onDelete) => [
  {
    title: entete("Date"),
    key: "date",
    render: (_, r) => {
      const d = dayjs(r.date).locale("fr");
      return (
        <div className={sortie.person}>
          <span className={styles.dayBadge} aria-hidden="true">
            <strong>{d.format("DD")}</strong>
            <span>{d.format("MMM")}</span>
          </span>
          <div className={sortie.personText}>
            <span className={sortie.personName} style={{ textTransform: "capitalize" }}>
              {d.format("dddd")}
            </span>
            <span className={sortie.personMat}>{d.format("D MMMM YYYY")}</span>
          </div>
        </div>
      );
    },
  },
  {
    title: entete("Période"),
    key: "periode",
    render: (_, r) => {
      const p = PERIODES[r.periode] ?? PERIODES.complete;
      return (
        <span className={`${sortie.chip} ${p.cls}`}>
          <i className={p.icon} aria-hidden="true"></i>
          {p.label}
        </span>
      );
    },
  },
  {
    title: entete("Motif"),
    dataIndex: "motif",
    key: "motif",
    render: (motif) => <span className={sortie.cellMain}>{motif}</span>,
  },
  {
    title: entete("État"),
    key: "etat",
    render: (_, r) => {
      const e = ETATS[r.etat] ?? ETATS.a_venir;
      return (
        <span className={`${sortie.chip} ${e.cls}`}>
          <i className={e.icon} aria-hidden="true"></i>
          {e.label}
        </span>
      );
    },
  },
  {
    title: "",
    key: "actions",
    width: 130,
    render: (_, r) => (
      <div className={styles.actionsCell}>
        <Tooltip title="Modifier">
          <button
            type="button"
            className={sortie.iconBtn}
            style={{ color: "#1b6979" }}
            onClick={() => onEdit(r)}
            aria-label="Modifier le jour férié"
          >
            <i className="fa-regular fa-pen-to-square" aria-hidden="true"></i>
          </button>
        </Tooltip>
        <Tooltip title="Supprimer">
          <button
            type="button"
            className={sortie.iconBtn}
            onClick={() => onDelete(r)}
            aria-label="Supprimer le jour férié"
          >
            <i className="fa-regular fa-trash-can" aria-hidden="true"></i>
          </button>
        </Tooltip>
      </div>
    ),
  },
];
