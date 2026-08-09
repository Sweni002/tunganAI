import React from "react";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import { Tooltip } from "antd";
import { EditOutlined } from "@ant-design/icons";
import styles from "./responsables.module.css";

export function usePersonnelsColumns({ navigate, handleDeleteClick, API_URL }) {
  const columns = [
    {
      title: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        </div>
      ),
      dataIndex: "image",
      key: "image",
      render: (text, record) => {
        const avatarContent = record.image ? (
          <Avatar
            alt={`${record.prenom} ${record.nom}`}
            src={`${API_URL}/uploads/${record.image}`}
            sx={{ width: 50, height: 50 }}
          />
        ) : (
          <Avatar sx={{ width: 50, height: 50 }}>
            {record.nom ? record.nom[0].toUpperCase() : "?"}
          </Avatar>
        );
        const roleLabel =
          record.role === "surface"
            ? "Agent de surface"
            : record.role === "bureau"
            ? "Agent de bureau"
            : "Non défini";

        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Tooltip title={roleLabel}>{avatarContent}</Tooltip>
          </div>
        );
      },
    },
    {
      title: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}>
          Matricule
        </div>
      ),
      dataIndex: "matricule",
      key: "matricule",
      textAlign: "center",
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          {record.matricule}
          <label htmlFor="" style={{ color: "#464545ff", fontWeight: "bold" }}>
            {" "}
            {record.nomdivision}
          </label>
        </div>
      ),
    },
    {
      title: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          Nom & prénom
        </div>
      ),
      key: "nomprenomdivision",
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {record.nom}
          <label htmlFor=""> {record.prenom}</label>
        </div>
      ),
    },
    {
      title: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          Email
        </div>
      ),
      dataIndex: "email",
      key: "email",
      render: (text) => <div style={{ textAlign: "center" }}>{text}</div>,
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", width: "70%", alignItems: "center", justifyContent: "space-around" }}>
          <Tooltip title="Modifier">
            <div
              className={styles.iconCircle}
              onClick={() => navigate("/global/modifier_perso", { state: { record } })}
            >
              <IconButton aria-label="more" id="long-button" aria-haspopup="true" size="small">
                <EditOutlined style={{ color: "#1B6979", fontSize: "0.9rem" }} />
              </IconButton>
            </div>
          </Tooltip>
          <Tooltip title="Supprimer">
            <div className={styles.iconCircle} onClick={() => handleDeleteClick(record)}>
              <IconButton aria-label="more" id="long-button" aria-haspopup="true" size="small">
                <i
                  className="fa-regular fa-trash-can"
                  style={{ color: "#ff4d4f", fontSize: "0.9rem", cursor: "pointer" }}
                ></i>
              </IconButton>
            </div>
          </Tooltip>
        </div>
      ),
    },
  ];

  return { columns };
}