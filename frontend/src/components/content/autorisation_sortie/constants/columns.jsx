import React from "react";
import { Tooltip } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { SunDimIcon, MoonStarsIcon } from "@phosphor-icons/react";
import styles from "../conge.module.css";

export const getColumns = (navigate, handleDeleteClick) => [
  {
    title: <div style={{ width: "100%", textTransform: "uppercase" }}>Matricule</div>,
    dataIndex: "matricule",
    key: "matricule",
    render: (_, record) => record.personnel?.matricule ?? "-",
  },
  {
    title: <div style={{ textAlign: "center", width: "100%", textTransform: "uppercase" }}>Nom & Prénom</div>,
    key: "nomprenom",
    render: (_, record) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem" }}>{record.personnel?.nom ?? "-"}</span>
        <span style={{ fontSize: "0.8rem" }}>{record.personnel?.prenom ?? "-"}</span>
      </div>
    ),
  },
  {
    title: <div style={{ textAlign: "center", width: "100%", textTransform: "uppercase" }}>Date</div>,
    key: "date",
    align: "center",
    render: (_, record) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span>{record.date_debut ? new Date(record.date_debut).toLocaleDateString() : "-"}</span>
        {record.date_fin && (
          <span style={{ fontSize: "0.75rem", color: "#555", fontWeight: "bold" }}>
            au {new Date(record.date_fin).toLocaleDateString()}
          </span>
        )}
      </div>
    ),
  },
  {
    title: <div style={{ textAlign: "center", width: "100%", textTransform: "uppercase" }}>Motif / Type</div>,
    key: "motif_type",
    align: "center",
    render: (_, record) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontWeight: 600 }}>{record.motif ?? "-"}</span>
        <span style={{ fontSize: "0.8rem", color: "#1B6979", textTransform: "capitalize" }}>
          {record.type_autorisation ?? "-"}
        </span>
      </div>
    ),
  },
  {
    title: "État",
    key: "etat",
    align: "center",
    render: (_, record) => {
      const value = record.etat || "";
      const normalized = value.toLowerCase().trim();
      const isTermine = normalized === "terminée" || normalized === "terminee";

      return (
        <div
          title={isTermine ? "Cette autorisation est terminée" : "Cette autorisation est en cours"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 22px",
            borderRadius: 50,
            backgroundColor: isTermine ? "#e8f5e9" : "#fff3e0",
            color: isTermine ? "#388e3c" : "#f57c00",
            fontWeight: 600,
            width: "fit-content",
            margin: "auto",
            fontSize: "0.75rem",
          }}
        >
          {isTermine ? "Terminé" : "En cours"}
        </div>
      );
    },
  },
  {
    title: "Période",
    key: "periode",
    align: "center",
    render: (_, record) => {
      const value = (record.periode ?? "").toLowerCase();
      const config = {
        matin: { icon: <SunDimIcon size={23} />, label: "Matin", color: "#1565c0", bg: "#e3f2fd" },
        "apres-midi": { icon: <MoonStarsIcon size={23} />, label: "Après-midi", color: "#ef6c00", bg: "#fff3e0" },
        "après-midi": { icon: <MoonStarsIcon size={23} />, label: "Après-midi", color: "#ef6c00", bg: "#fff3e0" },
      };
      const item = config[value] || { icon: <MoonStarsIcon size={23} />, label: record.periode ?? "-", color: "#616161", bg: "#f5f5f5" };
      return (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 15px",
            borderRadius: 20,
            backgroundColor: item.bg,
            color: item.color,
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "capitalize",
          }}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      );
    },
  },
  {
    title: "",
    key: "actions",
    render: (_, record) => (
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Tooltip title="Supprimer">
          <div
            className={styles.iconCircle}
            onClick={() => handleDeleteClick(record)}
            style={{ cursor: "pointer", color: "#9e192b", fontSize: "0.9rem" }}
          >
            <i className="fa-regular fa-trash-can"></i>
          </div>
        </Tooltip>
      </div>
    ),
  },
];