import React from "react";
import { Tooltip } from "antd";
import { SunDimIcon, MoonStarsIcon } from "@phosphor-icons/react";
import styles from "../sortie.module.css";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("fr-FR") : "-");

const initiales = (personnel) =>
  `${personnel?.prenom?.[0] ?? ""}${personnel?.nom?.[0] ?? ""}`.toUpperCase() || "?";

const ETATS = {
  terminee: { cls: styles.chipDone, icon: "fa-solid fa-circle-check", label: "Terminée", title: "Cette autorisation est terminée" },
  avenir: { cls: styles.chipSoon, icon: "fa-regular fa-calendar", label: "À venir", title: "Cette autorisation n'a pas encore commencé" },
  encours: { cls: styles.chipRun, icon: "fa-regular fa-clock", label: "En cours", title: "Cette autorisation est en cours" },
};

const etatDe = (etat) => {
  const n = (etat || "").toLowerCase().trim();
  if (n === "terminée" || n === "terminee") return ETATS.terminee;
  if (n === "à venir" || n === "a venir") return ETATS.avenir;
  return ETATS.encours;
};

const PERIODES = {
  matin: { icon: <SunDimIcon size={18} />, label: "Matin", cls: styles.chipMorning },
  "apres-midi": { icon: <MoonStarsIcon size={18} />, label: "Après-midi", cls: styles.chipAfternoon },
  apres_midi: { icon: <MoonStarsIcon size={18} />, label: "Après-midi", cls: styles.chipAfternoon },
  "après-midi": { icon: <MoonStarsIcon size={18} />, label: "Après-midi", cls: styles.chipAfternoon },
};

const entete = (texte) => <span style={{ textTransform: "uppercase" }}>{texte}</span>;

export const getColumns = (navigate, handleDeleteClick) => [
  {
    title: entete("Agent"),
    key: "agent",
    render: (_, record) => (
      <div className={styles.person}>
        <span className={styles.avatar} aria-hidden="true">{initiales(record.personnel)}</span>
        <div className={styles.personText}>
          <span className={styles.personName}>
            {record.personnel?.prenom ?? "-"} {record.personnel?.nom ?? ""}
          </span>
          <span className={styles.personMat}>{record.personnel?.matricule ?? "-"}</span>
        </div>
      </div>
    ),
  },
  {
    title: entete("Date"),
    key: "date",
    render: (_, record) => (
      <div className={styles.cellStack}>
        <span className={styles.cellMain}>{formatDate(record.date_debut)}</span>
        {record.date_fin && <span className={styles.cellSub}>au {formatDate(record.date_fin)}</span>}
      </div>
    ),
  },
  {
    title: entete("Motif / Type"),
    key: "motif_type",
    render: (_, record) => (
      <div className={styles.cellStack}>
        <span className={styles.cellMain}>{record.motif ?? "-"}</span>
        <span className={styles.cellTag}>{record.type_autorisation ?? "-"}</span>
      </div>
    ),
  },
  {
    title: entete("Période"),
    key: "periode",
    render: (_, record) => {
      const item = PERIODES[(record.periode ?? "").toLowerCase()];
      return (
        <span className={`${styles.chip} ${item?.cls ?? ""}`}>
          {item?.icon}
          {item?.label ?? record.periode ?? "-"}
        </span>
      );
    },
  },
  {
    title: entete("État"),
    key: "etat",
    render: (_, record) => {
      const e = etatDe(record.etat);
      return (
        <Tooltip title={e.title}>
          <span className={`${styles.chip} ${e.cls}`}>
            <i className={e.icon} aria-hidden="true"></i>
            {e.label}
          </span>
        </Tooltip>
      );
    },
  },
  {
    title: "",
    key: "actions",
    width: 90,
    render: (_, record) => (
      <Tooltip title="Supprimer">
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => handleDeleteClick(record)}
          aria-label="Supprimer l'autorisation"
        >
          <i className="fa-regular fa-trash-can" aria-hidden="true"></i>
        </button>
      </Tooltip>
    ),
  },
];
