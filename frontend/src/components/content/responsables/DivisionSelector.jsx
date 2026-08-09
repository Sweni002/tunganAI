// src/pages/Responsable/components/DivisionSelector.jsx

import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { styled } from "@mui/material/styles";
import styles from "./ajout_perso.module.css";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "30px",
    padding: theme.spacing(4),
    width: "100%",
    maxWidth: "500px",
  },
}));

const DivisionSelector = ({ 
  open, 
  onClose, 
  divisions, 
  onSelect,
  loading 
}) => {
  const [search, setSearch] = useState("");

  const filteredDivisions = divisions.filter((div) =>
    div.nomdivision.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <BootstrapDialog
      onClose={onClose}
      aria-labelledby="customized-dialog-title"
      open={open}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          alignItems: "flex-start",
        }}
      >
        <div className={styles.dialog}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>
      </div>

      <DialogContent
        style={{
          minHeight: 300,
          maxHeight: 400,
          overflowY: "auto",
        }}
      >
        <div className={styles.liste}>
          {filteredDivisions.length > 0 ? (
            filteredDivisions.map((div, i) => (
              <div
                className={styles.liste1}
                key={div.iddiv || i}
                onClick={() => onSelect(div)}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.liste2}>
                  <h3>{div.nomdivision}</h3>
                </div>
                <i className="fa-solid fa-bars-staggered"></i>
              </div>
            ))
          ) : (
            <p>Aucune division trouvée.</p>
          )}
        </div>
      </DialogContent>
    </BootstrapDialog>
  );
};

export default DivisionSelector;