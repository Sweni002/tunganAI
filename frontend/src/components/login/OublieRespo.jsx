import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import styles from './oublie.module.css';
import { useNavigate } from "react-router-dom";
import Logo from '../../assets/logo1.png';
import CircularProgress from '@mui/material/CircularProgress';
import { useMediaQuery } from 'react-responsive';



const API_URL = import.meta.env.VITE_API_URL;


const OublieRespo = () => {
  const [email, setemail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); 
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); 
  const [role, setRole] = useState("responsable"); // valeur par défaut
 const isLargeScreen = useMediaQuery({ minWidth: 701 });

  const handleRoleChange = (event) => {
    setRole(event.target.value);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(false);

    if (!email) {
      setError(true);
      setErrorMsg("Veuillez saisir votre email");
      setLoading(false);
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError(true);
      setErrorMsg("Adresse e-mail invalide");
      setLoading(false);
      return;
    }

    const url = `${API_URL}/api/auth/send-reset-code`;

    const nextRoute = "/accepte";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(true);
        setErrorMsg(data.error || "Erreur lors de l'envoi du code");
      } else {
        // ✅ Navigation selon rôle
        navigate(nextRoute, { state: { email } });
      }
    } catch (err) {
      setError(true);
      setErrorMsg("Erreur serveur");
    }

    setLoading(false);
  };


  const handleBack = () => window.history.back();

  const handleemailChange = (e) => {
    const value = e.target.value;
 
      setemail(value);
      if (error) {
        setError(false);
        setErrorMsg("");
      }
    
  };

  return (
    <div className={styles.container}>
      <img
        src={Logo}
        alt="Logo"
        style={{
          objectFit: "contain",
          marginTop: isLargeScreen ? 36 : "15",
          width: isLargeScreen ? 120 : "80",
          height: 118,
        }}
      />
      <Box
        className={styles.card}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading) {
            e.preventDefault(); // empêche le rechargement de la page
            handleSubmit(); // déclenche la fonction de connexion
          }
        }}
        sx={{
          maxWidth: isLargeScreen ? 470 : "100%", // 470px sur grands écrans, 100% sur petits
          width: "100%",
          p: isLargeScreen ? 5 : "1",
          borderRadius: isLargeScreen ? 3 : "0",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          position: "relative",
        }}
      >
        <IconButton
          onClick={handleBack}
          sx={{ position: "absolute", top: 16, left: 16, color: "#40a9ff" }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography
          variant={isLargeScreen ? "h5" : "h6"}
          sx={{
            mt: 3,
            fontWeight: 700,
            textAlign: "center",
            color: "#40a9ff",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Mot de passe oublié
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            mt: 1,
            mb: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{ display: "flex", flexDirection: "column" }}
          >
            <span style={{ color: "red" }}>*</span>
            <span
              style={{
                color: "#6d6b6bff",
                fontSize: "0.9rem",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Merci de saisir l'adresse e-mail liée à votre compte pour
              reinitialiser votre mot de passe
            </span>
          </Typography>

          <TextField
            id="email"
            label="Email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={handleemailChange}
            InputProps={{
              style: { fontSize: 18, textAlign: "center" },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px", // <-- border radius added
                "&.Mui-focused fieldset": {
                  borderColor: "#40a9ff",
                },
              },
            }}
          />
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            mt: 2,
            py: 1.5,
            fontFamily: "'Poppins', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 2,
            background: "linear-gradient(90deg, #40a9ff, #1890ff)",
            "&:hover": {
              background: "linear-gradient(90deg, #1890ff, #096dd9)",
              transform: "translateY(-1px)",
            },
            "&.Mui-disabled": {
              backgroundColor: "#14535f",
              color: "#fff", // optionnel (texte blanc)
              opacity: 0.7, // optionnel (effet disabled léger)
            },
            transition: "0.3s",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#f1f1f1ff",
                fontSize: "1.0rem",
              }}
            >
              <span className={styles.loader}></span>
                                        </div>
          ) : (
            "Réinitialiser"
          )}{" "}
        </Button>

        {/* Alert pour erreur */}
        {error && (
          <Alert
            severity="error"
            sx={{ mt: 2, fontSize: 13, fontFamily: "'Poppins', sans-serif" }}
          >
            {errorMsg}{" "}
            {/* ici le message peut venir du serveur ou du frontend */}
          </Alert>
        )}
      </Box>
    </div>
  );
};

export default OublieRespo;
