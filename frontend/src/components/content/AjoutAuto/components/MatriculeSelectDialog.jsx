import React from "react";
import TextField from "@mui/material/TextField";
import DialogContent from "@mui/material/DialogContent";
import InputAdornment from "@mui/material/InputAdornment";
import { CiSearch } from "react-icons/ci";
import { BootstrapDialog } from "./BootstrapDialogs";
import { styleListe1, styleListe2, styleListe2H4 } from "../styles";

// ⚠️ Dans l'original, la recherche utilisait className={styles.dialo} et la
// liste className={styles.liste} : aucune de ces deux classes n'existait
// dans ajout_conge.module.css (seules .dialog, .liste1, .liste2 existent).
// Ces deux endroits n'avaient donc déjà aucun style appliqué — comportement
// reproduit fidèlement ici (pas de style ajouté sur ces deux wrappers).
const MatriculeSelectDialog = ({
  open,
  onClose,
  searchPers,
  setSearchPers,
  loading,
  errorMsg,
  personnels,
  onSelectPersonnel,
}) => {
  return (
    <BootstrapDialog onClose={onClose} open={open}>
      <div>
        <TextField
          placeholder="Rechercher un personnel..."
          value={searchPers}
          onChange={(e) => setSearchPers(e.target.value)}
          variant="standard"
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <CiSearch size={30} />
              </InputAdornment>
            ),
          }}
          sx={{
            mt: 0,
            mb: 0,
            width: "100%",
            "& .MuiInputBase-root": {
              paddingRight: "10px", // évite que le texte touche l’icône
            },

            "& .MuiInputBase-input": {
              padding: "17px 1px",
              fontSize: "1rem",
              fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
              "@media (max-width:600px)": {
                padding: "5px 0px !important",
              },
            },
          }}
        />
      </div>

      <DialogContent
        style={{
          minHeight: 300,
          maxHeight: 400,
          overflowY: "auto",
        }}
      >
        {loading ? (
          <p>Chargement...</p>
        ) : errorMsg ? (
          <p style={{ color: "red" }}>{errorMsg}</p>
        ) : (
          <div>
            {personnels
              .filter((p) =>
                `${p.nom} ${p.prenom} ${p.matricule}`
                  .toLowerCase()
                  .includes(searchPers.toLowerCase())
              )
              .map((p) => (
                <div
                  key={p.idpers}
                  className="ajout-auto-liste1"
                  onClick={() => onSelectPersonnel(p)}
                  style={{ ...styleListe1, cursor: "pointer" }}
                >
                  <div style={styleListe2}>
                    <h4 style={styleListe2H4}>
                      {p.nom} {p.prenom}
                    </h4>
                    <p style={{ fontSize: "0.85rem", color: "#666" }}>
                      {p.matricule}
                    </p>
                  </div>
                  <i className="fa-solid fa-user-check"></i>
                </div>
              ))}
            {personnels.length === 0 && <p>Aucun personnel trouvé.</p>}
          </div>
        )}
      </DialogContent>
    </BootstrapDialog>
  );
};

export default MatriculeSelectDialog;