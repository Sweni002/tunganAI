import React, { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, Alert, IconButton, InputAdornment } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useLocation } from "react-router-dom";
import styles from './mdp.module.css';
 import { Spin } from "antd";
 import { useNavigate } from "react-router-dom";
 import Logo from '../../assets/finances.png';
import CircularProgress from '@mui/material/CircularProgress';


const API_URL = import.meta.env.VITE_API_URL;

const Motdepasse = () => {
    const navigate =useNavigate()
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const location = useLocation(); // récupérer le matricule envoyé depuis /mdp
 const { email, code } = location.state || {}; // récupère email et code
const [loading ,setLoading] = useState(false)

  const handleBack = () =>{
  navigate("/login", { replace: true });


  };
  useEffect(() => {
    if (!email || !code) {
      navigate("/login", { replace: true });
    }
  }, [email, code,navigate]);

  const handleSubmit = async () => {
    setSubmitted(false);
    setError(false);
    setLoading(true)

    if (!password) {
      setError(true);
      setErrorMsg("Veuillez saisir le mot de passe");
      setLoading(false)
      return;
    }
    if (!confirm) {
      setError(true);
      setErrorMsg("Veuillez confirmer le mot de passe");
      setLoading(false)
      return;
    }
    if (password.length < 5) {
      setError(true);
      setErrorMsg("Le mot de passe doit contenir au moins 5 caractères");
      setLoading(false)
      return;
    }
    if (password !== confirm) {
      setError(true);
      setErrorMsg("Les mots de passe ne correspondent pas");
      setLoading(false)
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, new_password: password })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setError(false);
        setErrorMsg("");
      
        navigate("/login")
           setLoading(false) // redirection après 2s

      } else {
        setError(true);
        setErrorMsg(data.error || "Erreur serveur inconnue");
        setLoading(false)
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setErrorMsg("Erreur réseau ou serveur.");
      setLoading(false)
    }
  };

  
  return (
    <div className={styles.container}>
      <div className={styles.enhaut}>
        <div className={styles.login1}>
          <img src={Logo} alt="" />
        </div>
      </div>

      <Box
        className={styles.card}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading) {
            e.preventDefault(); // empêche le rechargement de la page
            handleSubmit(); // déclenche la fonction de connexion
          }
        }}
        sx={{
          maxWidth: 470,
          width: "90%",
          p: 4,
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
          variant="h6"
          sx={{
            mt: 4,
            fontWeight: 700,
            textAlign: "center",
            color: "#40a9ff",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Réinitialiser le mot de passe
        </Typography>

        <TextField
          type={showPassword ? "text" : "password"}
          placeholder="Mot de passe"
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(false);
          }}
          InputProps={{
            style: {
              fontSize: "1.0rem",
              textAlign: "center",
              marginTop: 13,
              fontFamily: "'Poppins', sans-serif",
            },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          type={showConfirm ? "text" : "password"}
          placeholder="Confirmer le mot de passe"
          variant="outlined"
          fullWidth
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (error) setError(false);
          }}
          InputProps={{
            style: {
              fontSize: "1.0rem",
              textAlign: "center",
              marginTop: 13,
              fontFamily: "'Poppins', sans-serif",
            },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiInputBase-input": {
              paddingX: 2,
              paddingY: 2.2,
              // padding interne (haut, droite, bas, gauche)
            },
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px", // <-- border radius added
              "&.Mui-focused fieldset": {
                borderColor: "#40a9ff",
              },
            },
          }}
        />

        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          sx={{
            mt: 2,
            fontFamily: "'Poppins', sans-serif",

            py: 1.5,
            fontSize: 16,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 2,
            background: "linear-gradient(90deg, #40a9ff, #1890ff)",
            "&:hover": {
              background: "linear-gradient(90deg, #1890ff, #096dd9)",
              transform: "translateY(-1px)",
            },
            transition: "0.3s",
            "&.Mui-disabled": {
              backgroundColor: "#14535f",
              color: "#fff", // optionnel (texte blanc)
              opacity: 0.7, // optionnel (effet disabled léger)
            },
          }}
        >
          {loading ? <span className={styles.loader}></span> : "Valider"}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2, fontSize: 13 }}>
            {errorMsg}
          </Alert>
        )}
        {submitted && !error && (
          <Alert severity="success" sx={{ mt: 2, fontSize: 13 }}>
            Mot de passe réinitialisé avec succès !
          </Alert>
        )}
      </Box>
    </div>
  );
};

export default Motdepasse;
