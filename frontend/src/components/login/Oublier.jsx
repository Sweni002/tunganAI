import React, { useState } from "react";
import { Box, TextField, Button, Typography, Alert, IconButton } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import styles from './oublie.module.css';
import { useNavigate } from "react-router-dom";
import Logo from '../../assets/logo1.png';
import CircularProgress from '@mui/material/CircularProgress';

const Oublier = () => {
  const [email, setemail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); 
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); 

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

  try {
    const res = await fetch("https://192.168.0.115:5000/api/auth/send-reset-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(true);
      setErrorMsg(data.error);
    } else {
     
      navigate("/accepte", { state: { email } }); // <- on transmet l'email
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
            objectFit:"contain",
                marginTop: 36,
                 width: 120,
            height: 118,
                }}
        />
      <Box
        className={styles.card}
        sx={{
          maxWidth: 400,
          width: "100%",
          p: 5,
          borderRadius: 3,
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          position: "relative",
        }}
      >
        <IconButton onClick={handleBack} sx={{ position: "absolute", top: 16, left: 16, color: "#40a9ff" }}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h5" sx={{ mt: 3, fontWeight: 700, textAlign: "center", color: "#40a9ff" ,  fontFamily: "'Poppins', sans-serif",
}}>
          Mot de passe oublié
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 ,mt:1,mb:1}}>
          <Typography variant="body2" sx={{ display: "flex", flexDirection: "column" }}>
         <span style={{color :"red"}}>*</span>
            <span style={{ color: "#6d6b6bff", fontSize: "0.9rem",  fontFamily: "'Poppins', sans-serif",
 }}>
              Merci de saisir l'adresse e-mail liée à votre compte pour reinitialiser votre mot de passe
            </span>
          </Typography>

          <TextField
            id="email"
           label="Email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={handleemailChange}
              InputProps={{ style: { fontSize: 18, textAlign: 'center' } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": { borderColor: "#40a9ff" },
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
            borderRadius: 3,
            background: "linear-gradient(90deg, #40a9ff, #1890ff)",
            "&:hover": {
              background: "linear-gradient(90deg, #1890ff, #096dd9)",
              transform: "translateY(-1px)",
            },
            transition: "0.3s",
          }}
        >
       {loading ? (
    <div style={{ display: "flex", alignItems: "center", gap: 10 ,color: "#f1f1f1ff" ,fontSize: "1.0rem"}}>
      <CircularProgress size={22} sx={{color:"white"}} />
      Vérification
    </div>
  ) : (
    "Réinitialiser"
  )}        </Button>



{/* Alert pour erreur */}
{error && (
  <Alert severity="error" sx={{ mt: 2, fontSize: 13,  fontFamily: "'Poppins', sans-serif",}}>
    {errorMsg} {/* ici le message peut venir du serveur ou du frontend */}
  </Alert>
)}

      </Box>
    </div>
  );
};

export default Oublier;
