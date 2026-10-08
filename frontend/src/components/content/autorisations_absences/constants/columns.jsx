import React from "react";
import { Tooltip } from "antd";
import styles from "../../autorisation_sortie/sortie.module.css";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("fr-FR") : "-");

const initiales = (record) =>
  `${record.prenom?.[0] ?? ""}${record.nom?.[0] ?? ""}`.toUpperCase() || "?";

const ETATS = {
  terminee: { cls: styles.chipDone, icon: "fa-solid fa-circle-check", label: "Terminée", title: "Cette autorisation est terminée" },
  avenir: { cls: styles.chipSoon, icon: "fa-regular fa-calendar", label: "À venir", title: "Cette autorisation n'a pas encore commencé" },
  encours: { cls: styles.chipRun, icon: "fa-regular fa-clock", label: "En cours", title: "Cette autorisation est en cours" },
};

const etatDe = (etat) => {
  const n = (etat || "").toLowerCase().trim();
  if (["terminé", "terminée", "terminee"].includes(n)) return ETATS.terminee;
  if (n === "à venir" || n === "a venir") return ETATS.avenir;
  return ETATS.encours;
};

const DEMI_JOURNEES = {
  matin: "Matin",
  "apres-midi": "Après-midi",
  complete: "Journée complète",
};

const entete = (texte) => <span style={{ textTransform: "uppercase" }}>{texte}</span>;

export const getColumns = (navigate, handleDeleteClick) => [
  {
    title: entete("Agent"),
    key: "agent",
    render: (_, record) => (
      <div className={styles.person}>
        <span className={styles.avatar} aria-hidden="true">{initiales(record)}</span>
        <div className={styles.personText}>
          <span className={styles.personName}>
            {record.prenom ?? "-"} {record.nom ?? ""}
          </span>
          <span className={styles.personMat}>{record.matricule ?? "-"}</span>
        </div>
      </div>
    ),
  },
  {
    title: entete("Date"),
    dataIndex: "date_absence",
    key: "date_absence",
    render: (text, record) => (
      <div className={styles.cellStack}>
        <span className={styles.cellMain}>{formatDate(text)}</span>
        <span className={styles.cellSub}>
          {DEMI_JOURNEES[record.demi_journee] ?? record.demi_journee ?? "-"}
        </span>
      </div>
    ),
  },
  {
    title: entete("Type"),
    dataIndex: "nomtype",
    key: "nomtype",
    render: (text, record) => (
      <div className={styles.cellStack}>
        <span className={styles.cellMain}>{text || "-"}</span>
        {record.motif && <span className={styles.cellSub}>{record.motif}</span>}
      </div>
    ),
  },
  {
    title: entete("État"),
    dataIndex: "etat",
    key: "etat",
    render: (text) => {
      const e = etatDe(text);
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
    width: 130,
    render: (_, record) => (
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <Tooltip title="Modifier">
          <button
            type="button"
            className={styles.iconBtn}
            style={{ color: "#1b6979" }}
            onClick={() => navigate("/global/modifier_auto", { state: { record } })}
            aria-label="Modifier l'autorisation"
          >
            <i className="fa-regular fa-pen-to-square" aria-hidden="true"></i>
          </button>
        </Tooltip>
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
      </div>
    ),
  },
];
