import React from "react";
import Dialog from "@mui/material/Dialog";
import { styled } from "@mui/material/styles";
import { Spin } from "antd";
import styles from "../conge.module.css"; // 👈 IMPORT AJOUTÉ

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: theme.spacing(2),
    width: "100%",
    maxWidth: "400px",
  },
}));

const DeleteDialog = ({
  open,
  onClose,
  onConfirm,
  loading,
}) => {
  return (
    <BootstrapDialog onClose={onClose} open={open}>
      <div
        style={{
          margin: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <h3 style={{ fontSize: "0.9rem" }}>Suppression...</h3>
        <label style={{ fontSize: "0.8rem", color: "#676767" }}>
          Voulez-vous vraiment supprimer cette autorisation ?
        </label>
        <div className={styles.supp}> {/* 👈 MODIFIÉ */}
          <div className={styles.supp1}> {/* 👈 MODIFIÉ */}
            <button onClick={onClose}>Non</button>
          </div>
          <div className={styles.supp2}> {/* 👈 MODIFIÉ */}
            <button onClick={onConfirm}>
              {loading ? <Spin size="small" /> : "Oui"}
            </button>
          </div>
        </div>
      </div>
    </BootstrapDialog>
  );
};

export default DeleteDialog;