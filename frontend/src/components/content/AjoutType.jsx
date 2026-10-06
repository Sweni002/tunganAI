import Breadcrumbs from "@mui/material/Breadcrumbs";
import React, { useState } from "react";
import styles from "./ajout_type.module.css";
import Perso from "../../assets/v3.png";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import SnackbarContent from "@mui/material/SnackbarContent";
import { Spin } from "antd";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

// "" (même origine via nginx) ou "https://192.168.88.142" — jamais de "/" final
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

// Lecture sûre : évite "JSON.parse: unexpected character" sur une page d'erreur HTML
async function parseJsonSafe(response) {
  const text = await response.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

const inputSx = {
  mt: 1,
  mb: 2,
  width: "100%",
  "& .MuiInputBase-input": {
    padding: "8px 1px",
    fontSize: "0.9rem",
    fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
    "@media (max-width:600px)": {
      padding: "5px 0px !important",
    },
  },
};

const AjoutType = () => {
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({ nom: false, abbreviation: false });

  const validateForm = () => {
    const newErrors = {
      nom: !nom.trim(),
      abbreviation: !abbreviation.trim(),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const showSnack = (message, ok) => {
    setMsg(message);
    setSuccess(ok);
    setOpenSnack(true);
  };

  const createTypes = async () => {
    if (!validateForm() || loading) return;

    setLoading(true);
    setMsg("");

    try {
      // "/" final : pas de redirection 308 côté Flask
      const response = await fetch(`${API_URL}/api/types/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nomtype: nom.trim(),
          abbreviation: abbreviation.trim(),
        }),
      });

      const data = await parseJsonSafe(response);

      if (!response.ok) {
        showSnack(data?.error || `Erreur serveur (${response.status})`, false);
        return;
      }

      showSnack(data?.message || "Type d'absence ajouté avec succès", true);
      setNom("");
      setAbbreviation("");
    } catch (error) {
      console.error("Erreur d'ajout :", error);
      showSnack("Impossible de contacter le serveur", false);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnack = () => {
    setOpenSnack(false);
  };

  const action = (
    <>
      {success && (
        <Button
          color="primary"
          size="medium"
          onClick={() => {
            setOpenSnack(false);
            navigate("/global/type");
          }}
          sx={{ p: 1, fontSize: 17 }}
        >
          Voir
        </Button>
      )}
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleCloseSnack}
        sx={{
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            color: "#f44336",
          },
          transition: "background-color 0.3s, color 0.3s",
        }}
      >
        <CloseIcon fontSize="medium" />
      </IconButton>
    </>
  );

  return (
    <div className={styles.personnels}>
      <div className={styles.break}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" sx={{ fontSize: "0.9rem" }}>
            Type d'absence
          </Link>
          <Typography sx={{ color: "text.primary", fontSize: "0.9rem" }}>
            Ajout
          </Typography>
        </Breadcrumbs>
      </div>

      <div className={styles.card}>
        <div className={styles.container}>
          <div className={styles.retour} onClick={() => navigate(-1)}>
            <IconButton aria-label="retour" size="large">
              <i className="fa-solid fa-arrow-left"></i>
            </IconButton>
          </div>

          <div className={styles.sary}>
            <div className={styles.sary1}>
              <img src={Perso} alt="" />
            </div>
          </div>

          <div className={styles.form}>
            <div className={styles.inputM}>
              <label htmlFor="nomtype">
                Nom du type d'absence <span style={{ color: "red" }}>*</span>
              </label>
              <TextField
                id="nomtype"
                placeholder="Entrez le nom du type d'absence"
                variant="standard"
                fullWidth
                value={nom}
                onChange={(e) => {
                  setNom(e.target.value);
                  if (errors.nom) setErrors((prev) => ({ ...prev, nom: false }));
                }}
                error={!!errors.nom}
                helperText={errors.nom ? "Le nom du type d'absence est requis." : ""}
                sx={inputSx}
              />
            </div>

            <div className={styles.inputM}>
              <label htmlFor="abbreviation">
                Abréviation <span style={{ color: "red" }}>*</span>
              </label>
              <TextField
                id="abbreviation"
                placeholder="ex: ABS, CNG"
                variant="standard"
                fullWidth
                value={abbreviation}
                onChange={(e) => {
                  setAbbreviation(e.target.value);
                  if (errors.abbreviation)
                    setErrors((prev) => ({ ...prev, abbreviation: false }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createTypes();
                }}
                error={!!errors.abbreviation}
                helperText={errors.abbreviation ? "L'abréviation est requise." : ""}
                sx={inputSx}
              />
            </div>

            <div className={styles.btn}>
              <Button
                variant="contained"
                disabled={loading}
                fullWidth
                onClick={createTypes}
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  backgroundColor: "#14535f",
                  fontSize: "0.9rem",
                  mb: 1,
                  display: "flex",
                  gap: 2,
                  py: 1.0,
                  borderRadius: "4px",
                  justifyContent: "center",
                  border: "none",
                  textTransform: "none",
                  transition: "all 0.3s ease",
                }}
              >
                {loading ? (
                  <Spin size="large" />
                ) : (
                  <>
                    <i className="fa-solid fa-plus" style={{ fontSize: "1.1rem" }}></i>
                    <span>Sauvegarder</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Snackbar
        open={openSnack}
        autoHideDuration={5000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <SnackbarContent
          sx={{
            p: 1,
            px: 3,
            fontSize: "17px",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 3,
            backgroundColor: success ? undefined : "#b71c1c",
          }}
          message={<span style={{ marginRight: 8, fontSize: "0.9rem" }}>{msg}</span>}
          action={action}
        />
      </Snackbar>
    </div>
  );
};

export default AjoutType;