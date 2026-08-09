import React from "react";
import Dialog from "@mui/material/Dialog";
import { styled } from "@mui/material/styles";
import { Spin } from "antd";
import styles from "./service.module.css";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: theme.spacing(1.5),
    width: "100%",
    maxWidth: "400px",
  },
}));

const DeleteConfirmDialog = ({ open, loading, onClose, onConfirm }) => {
  return (
    <BootstrapDialog
      onClose={onClose}
      aria-labelledby="customized-dialog-title"
      open={open}
    >
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
        <label htmlFor="id" style={{ fontSize: "0.8rem", color: "#676767" }}>
          Voulez-vous vraiment supprimer ce service ?
        </label>
        <div className={styles.supp}>
          <div className={styles.supp1}>
            <button onClick={onClose}>Non</button>
          </div>
          <div className={styles.supp2}>
            <button onClick={onConfirm}>
              {loading ? <Spin size="small" /> : "Oui"}
            </button>
          </div>
        </div>
      </div>
    </BootstrapDialog>
  );
};

export default DeleteConfirmDialog;