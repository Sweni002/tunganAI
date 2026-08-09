import React from "react";
import DialogContent from "@mui/material/DialogContent";
import { BootstrapDialog } from "../Header.styles";
import styles from "../header.module.css"; // ⚠️ même fichier CSS que l'original, chemin à adapter si besoin

const SearchDialog = ({ open, handleClose }) => {
  return (
    <BootstrapDialog
      onClose={handleClose}
      aria-labelledby="customized-dialog-title"
      open={open}
    >
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <div className={styles.dialog}>
          <input type="text" placeholder="Rechercher..." />
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>
      </div>

      <DialogContent>
        <div className={styles.liste}>
          <div className={styles.resultat}>
            {[1, 2, 3, 4].map((i) => (
              <div className={styles.liste1} key={i}>
                <div className={styles.liste2}>
                  <h3>Personnels</h3>
                  <p>Ajout Personnels</p>
                </div>
                <i className="fa-solid fa-bars-staggered"></i>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </BootstrapDialog>
  );
};

export default SearchDialog;