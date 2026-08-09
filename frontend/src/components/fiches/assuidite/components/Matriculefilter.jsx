import React from "react";
import Popover from "@mui/material/Popover";
import IconButton from "@mui/material/IconButton";
import { CiSearch } from "react-icons/ci";
import styles from "../assiduite.module.css";

const MatriculeFilter = ({
  selectedMatricule,
  setSelectedMatricule,
  anchorEl,
  setAnchorEl,
  searchPers,
  setSearchPers,
  personnels,
  loading,
  errorMsg,
  handleSelectMatricule,
}) => {
  return (
    <>
      <div
        className={styles.matricule}
        style={{ cursor: "pointer", width: { xs: "100%", sm: "auto" } }}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <label>
          {selectedMatricule
            ? typeof selectedMatricule === "string"
              ? selectedMatricule
              : selectedMatricule.matricule
            : "matricule"}
        </label>

        {selectedMatricule && (
          <IconButton
            sx={{ p: 1, mt: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMatricule(null);
            }}
            aria-label="Réinitialiser filtre matricule"
            title="Réinitialiser filtre matricule"
            type="button"
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: "0.75rem", color: "black" }}></i>
          </IconButton>
        )}
        <IconButton size="large">
          <i className="fa-solid fa-chevron-down"></i>
        </IconButton>
      </div>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setSearchPers("");
          setAnchorEl(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            borderRadius: "25px",
            width: { xs: 300, sm: 400 },
            padding: 2,
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
            backgroundColor: "white",
          },
        }}
      >
        <div className={styles.dialog}>
          <input
            type="text"
            value={searchPers}
            onChange={(e) => setSearchPers(e.target.value)}
            style={{ width: "100%" }}
          />
          <CiSearch size={25} />
        </div>

        <div
          style={{
            minHeight: 300,
            maxHeight: 400,
            overflowY: "auto",
            padding: 18,
            marginTop: 10,
          }}
        >
          {loading ? (
            <p>Chargement...</p>
          ) : errorMsg ? (
            <p style={{ color: "red" }}>{errorMsg}</p>
          ) : (
            <div className={styles.liste}>
              {personnels
                .filter((p) =>
                  `${p.nom} ${p.prenom} ${p.matricule}`
                    .toLowerCase()
                    .includes(searchPers.toLowerCase()),
                )
                .map((p) => (
                  <div
                    key={p.idpers}
                    className={styles.liste1}
                    onClick={() => handleSelectMatricule(p)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.liste2}>
                      <h4>{p.nom}</h4>
                      <p style={{ fontSize: "0.8rem", color: "#666" }}>{p.matricule}</p>
                    </div>
                    <i className="fa-solid fa-user-check"></i>
                  </div>
                ))}
              {personnels.length === 0 && <p>Aucun personnel trouvé.</p>}
            </div>
          )}
        </div>
      </Popover>
    </>
  );
};

export default MatriculeFilter;