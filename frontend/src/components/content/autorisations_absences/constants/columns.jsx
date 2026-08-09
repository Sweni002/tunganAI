import React from "react";
import { Tooltip } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import styles from "../conge.module.css"; // 👈 IMPORT AJOUTÉ

export const getColumns = (navigate, handleDeleteClick) => [
  {
    title: "Matricule",
    dataIndex: "matricule",
    key: "matricule",
    render: (_, record) => record.matricule ?? "-",
  },
  {
    title: "Nom & prénom",
    key: "nomprenom",
    render: (_, record) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <label style={{ fontSize: "0.8rem" }}>{record.nom ?? "-"}</label>
        <label style={{ fontSize: "0.8rem" }}>{record.prenom ?? "-"}</label>
      </div>
    ),
  },
  {
    title: "Date",
    dataIndex: "date_absence",
    key: "date_absence",
    align: "center",
    render: (text, record) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span>{text ? new Date(text).toLocaleDateString() : "-"}</span>
        <span
          style={{ fontSize: "0.75rem", color: "#555", fontWeight: "bold" }}
        >
          {record.demi_journee || "-"}
        </span>
      </div>
    ),
  },
  {
    title: "Types",
    dataIndex: "nomtype",
    key: "nomtyp",
    render: (text) => <strong>{text || "-"}</strong>,
    align: "center",
  },
  {
    title: "État",
    dataIndex: "etat",
    key: "etat",
    align: "center",
    render: (text) => {
      const normalized = text?.toLowerCase().trim();
      const isTermine = ["terminé", "terminée", "terminee"].includes(normalized);

      return (
        <div
          title={
            isTermine
              ? "Cette autorisation est terminée"
              : "Cette autorisation est toujours en cours"
          }
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 50,
            backgroundColor: isTermine ? "#e8f5e9" : "#fff3e0",
            color: isTermine ? "#388e3c" : "#f57c00",
            fontWeight: 600,
            width: "fit-content",
            margin: "auto",
            fontSize: "0.75rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          {isTermine ? (
            <>
              <CheckCircleOutlined
                style={{ color: "#4caf50", fontSize: "1.0rem" }}
              />
              Terminé
            </>
          ) : (
            <>
              <ClockCircleOutlined
                style={{ color: "#ff9800", fontSize: "1.0rem" }}
              />
              En cours
            </>
          )}
        </div>
      );
    },
  },
  {
    title: "",
    key: "actions",
    render: (_, record) => (
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Tooltip title="Modifier">
          <div
            className={styles.iconCircle} // 👈 MODIFIÉ
            onClick={() =>
              navigate("/global/modifier_auto", { state: { record } })
            }
          >
            <EditOutlined style={{ color: "#1B6979", fontSize: "0.9rem" }} />
          </div>
        </Tooltip>
        <Tooltip title="Supprimer">
          <div
            className={styles.iconCircle} // 👈 MODIFIÉ
            onClick={() => handleDeleteClick(record)}
            style={{
              cursor: "pointer",
              color: "#ff4d4f",
              fontSize: "0.9rem",
            }}
          >
            <i className="fa-regular fa-trash-can"></i>
          </div>
        </Tooltip>
      </div>
    ),
  },
];