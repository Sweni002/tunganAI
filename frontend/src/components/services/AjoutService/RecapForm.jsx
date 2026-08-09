import React from "react";
import styles from "../ajout_service.module.css";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { Spin } from "antd";

// "07:10" -> "07h10"
const formatHeure = (h) => (h ? h.replace(":", "h") : "—");

// Plage formatée : "07h10 — 08h10"
const formatPlage = (debut, fin) =>
  debut || fin ? `${formatHeure(debut)} — ${formatHeure(fin)}` : "Non renseignée";

// ---------------------------------------------------------------------------
// Styles hissés au niveau module (perf)
// ---------------------------------------------------------------------------
const sectionTitleSx = {
  fontFamily: "'Poppins', sans-serif",
  fontSize: "0.95rem",
  fontWeight: 600,
  color: "#14535f",
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const editBtnSx = {
  fontFamily: "'Poppins', sans-serif",
  fontSize: "0.75rem",
  color: "#14535f",
  textTransform: "none",
  textDecoration: "underline",
  minWidth: "auto",
  p: 0,
  cursor: "pointer",
  "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
};

const btnPrecedentSx = {
  fontFamily: "'Poppins', sans-serif",
  color: "#14535f",
  borderColor: "#14535f",
  fontSize: "0.75rem",
  mb: 1,
  display: "flex",
  gap: 1.5,
  py: 1.0,
  px: 3,
  minWidth: "140px",
  borderRadius: "4px",
  justifyContent: "center",
  textTransform: "none",
  transition: "all 0.3s ease",
  cursor: "pointer",
};

const btnSauvegarderSx = {
  fontFamily: "'Poppins', sans-serif",
  backgroundColor: "#14535f",
  fontSize: "0.75rem",
  mb: 1,
  display: "flex",
  gap: 1.5,
  py: 1.0,
  px: 3,
  minWidth: "140px",
  borderRadius: "4px",
  justifyContent: "center",
  border: "none",
  textTransform: "none",
  transition: "all 0.3s ease",
  cursor: "pointer",
};

// ---------------------------------------------------------------------------
// Ligne du récap : libellé gris à gauche, valeur à droite
// ---------------------------------------------------------------------------
const RecapRow = ({ label, value, isEmpty }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "7px 0",
      gap: "16px",
    }}
  >
    <span
      style={{
        fontSize: "0.7rem",
        color: "#8a8a8a",
        fontFamily: "'Poppins', sans-serif",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: "0.7rem",
        fontWeight: isEmpty ? 400 : 500,
        color: isEmpty ? "#b5b5b5" : "#2c2c2c",
        fontStyle: isEmpty ? "italic" : "normal",
        fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
        textAlign: "right",
      }}
    >
      {value}
    </span>
  </div>
);

// Carte de section du récap avec en-tête + bouton Modifier
const RecapSection = ({ icon, title, onEdit, children }) => (
  <div
    style={{
        width:"100%",
       

      border: "1px solid #e6e9ea",
      borderRadius: "8px",
      padding: "14px 18px",
      marginBottom: "16px",
      backgroundColor: "#fcfdfd",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "6px",
         }}
    >
      <Typography sx={sectionTitleSx}>
        <i className={icon} style={{ fontSize: "0.8rem" }}></i>
        <span style={{fontSize:"0.75rem"}}>
  {title}
        </span>
      
      </Typography>
      {onEdit && (
        <Button variant="text" onClick={onEdit} sx={editBtnSx}>
          <i
            className="fa-solid fa-pen"
            style={{ fontSize: "0.6rem", marginRight: "5px" }}
          ></i>
       
     
        </Button>
      )}
    </div>
    <Divider sx={{ mb: 0.5 }} />
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// RecapForm — Étape 3 : récapitulatif avant sauvegarde
// ---------------------------------------------------------------------------
const RecapForm = ({
  formState,
  preview,
  loading,
  onBack,
  onEditStep, // (stepIndex) => void : revenir directement à une étape
  onSubmit,   // handleCreateService
}) => {
  return (
    <div className={styles.form}>
      {/* Message d'introduction */}
      <Typography
        sx={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "0.7rem",
          color: "#8a8a8a",
          mb: 2,
        }}
      >
        Vérifiez les informations ci-dessous avant de sauvegarder le service.
      </Typography>

  <div style={{width:"100%"}}>


      {/* ============ SECTION 1 : Informations du service ============ */}
      <RecapSection
        icon="fa-solid fa-circle-info"
        title="Informations du service"
        onEdit={onEditStep ? () => onEditStep(0) : undefined}
      >
        <RecapRow
          label="Code service"
          value={formState.code || "Non renseigné"}
          isEmpty={!formState.code}
        />
        <RecapRow
          label="Nom du service"
          value={formState.nom || "Non renseigné"}
          isEmpty={!formState.nom}
        />
        <RecapRow
          label="Sigle"
          value={formState.sigle || "Non renseigné"}
          isEmpty={!formState.sigle}
        />
        <RecapRow
          label="Adresse"
          value={formState.addresse || "Non renseignée"}
          isEmpty={!formState.addresse}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
          }}
        >
          <span
            style={{
              fontSize: "0.82rem",
              color: "#8a8a8a",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Logo
          </span>
          {preview ? (
            <img
              src={preview}
              alt="Logo du service"
              style={{
                width: "48px",
                height: "48px",
                objectFit: "cover",
                borderRadius: "6px",
                border: "1px solid #e6e9ea",
              }}
            />
          ) : (
            <span
              style={{
                fontSize: "0.85rem",
                color: "#b5b5b5",
                fontStyle: "italic",
              }}
            >
              Aucun logo
            </span>
          )}
        </div>
      </RecapSection>

      {/* ============ SECTION 2 : Horaires — Matin ============ */}
      <RecapSection
        icon="fa-solid fa-sun"
        title="Horaires — Matin"
        onEdit={onEditStep ? () => onEditStep(1) : undefined}
      >
        <RecapRow
          label="Plage d'entrée"
          value={formatPlage(formState.entreeMatinDebut, formState.entreeMatinFin)}
          isEmpty={!formState.entreeMatinDebut && !formState.entreeMatinFin}
        />
        <RecapRow
          label="Plage de sortie"
          value={formatPlage(formState.sortieMatinDebut, formState.sortieMatinFin)}
          isEmpty={!formState.sortieMatinDebut && !formState.sortieMatinFin}
        />
      </RecapSection>

      {/* ============ SECTION 3 : Horaires — Soir ============ */}
      <RecapSection
        icon="fa-solid fa-moon"
        title="Horaires — Soir"
        onEdit={onEditStep ? () => onEditStep(1) : undefined}
      >
        <RecapRow
          label="Plage d'entrée"
          value={formatPlage(formState.entreeSoirDebut, formState.entreeSoirFin)}
          isEmpty={!formState.entreeSoirDebut && !formState.entreeSoirFin}
        />
        <RecapRow
          label="Plage de sortie"
          value={formatPlage(formState.sortieSoirDebut, formState.sortieSoirFin)}
          isEmpty={!formState.sortieSoirDebut && !formState.sortieSoirFin}
        />
      </RecapSection>
    
      {/* ================= BOUTONS ================= */}
      <div
        className={styles.btn}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* Précédent */}
        <Button
          variant="outlined"
          disabled={loading}
          onClick={onBack}
          sx={btnPrecedentSx}
        >
          <i className="fa-solid fa-arrow-left" style={{ fontSize: "1rem" }}></i>
          <span>Précédent</span>
        </Button>

        {/* Sauvegarder (action finale) */}
        <Button
          variant="contained"
          disabled={loading}
          onClick={onSubmit}
          sx={btnSauvegarderSx}
        >
          {loading ? (
            <Spin size="large" />
          ) : (
            <>
              <i className="fa-solid fa-check" style={{ fontSize: "1rem" }}></i>
              <span>Sauvegarder</span>
            </>
          )}
        </Button>
      </div>
        </div>
    </div>
  );
};

export default RecapForm;