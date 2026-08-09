import React, { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, Alert, IconButton ,CircularProgress } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import styles from './accepte.module.css';
import { useLocation, useNavigate } from "react-router-dom";
import Logo from '../../assets/logo1.png';
import { Tooltip, Tag } from 'antd';
import ReplayIcon from '@mui/icons-material/Replay'; // en haut du fichier


const AccepteRespo = () => {
     const location = useLocation();

  const email = location.state?.email || ""; // email passé depuis la page précédente

  const [code, setCode] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); 
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); 
  const [timer, setTimer] = useState(0);
 const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
    if (!email) {
      navigate("/login"); // redirige vers /login
    }
  }, [email, navigate]);

    useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

const handleSubmit = async () => {
  setSubmitted(true);
  setLoading(true);
  setError(false);
  setErrorMsg("");

  // Vérifier le code
  if (!code) {
    setError(true);
    setErrorMsg("Veuillez saisir le code.");
    setLoading(false);
    return;
  }

  const codeRegex = /^\d{6}$/; // exactement 6 chiffres
  if (!codeRegex.test(code)) {
    if (/[^0-9]/.test(code)) {
      setError(true);
      setErrorMsg("Le code ne doit contenir que des chiffres.");
    } else {
      setError(true);
      setErrorMsg("Le code doit comporter exactement 6 chiffres.");
    }
    setLoading(false);
    return;
  }

  // Ensuite tu peux continuer avec la vérification côté serveur si nécessaire
  try {
   const response = await fetch("https://192.168.0.115:5000/api/auth/verify-reset-code-responsable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await response.json();

    if (response.ok) {
      setError(false);
      setErrorMsg("");
          navigate("/mdp_respo", { state: { email ,code} });
    } else {
      setError(true);
      setErrorMsg(data.error || "Code incorrect.");
    }
  } catch (err) {
    setError(true);
    setErrorMsg("Erreur réseau ou serveur.");
  } finally {
    setLoading(false);
  }
};

  const handleBack = () => window.history.back();

const handleCode = (e) => {
  let value = e.target.value;

  // Ne garder que les chiffres
  const numericValue = value.replace(/\D/g, "");

  // Limiter à 6 caractères
  const limitedValue = numericValue.slice(0, 6);

  setCode(limitedValue);

  // Effacer l'erreur seulement si l'utilisateur a tapé un chiffre
  if (error && /^\d*$/.test(value)) {
    setError(false);
    setErrorMsg("");
  }
};

  const handleResend = async () => {
    setResendLoading(true);
    setError(false);
    setErrorMsg("");
console.log(email)
    try {
      const response = await fetch(`https://192.168.0.115:5000/api/auth/send-reset-code-responsable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
             setTimer(30); // 30 secondes avant de pouvoir renvoyer
      } else {
        setError(true);
        setErrorMsg(data.error || "Impossible de renvoyer le code.");
      }
    } catch {
      setError(true);
      setErrorMsg("Erreur réseau ou serveur.");
    } finally {
      setResendLoading(false);
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
        sx={{
          maxWidth: 420,
          width: "90%",
          p: 4,
          borderRadius: 4,
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          position: "relative",
        }}
      >
      
        <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, textAlign: "left", color: "#40a9ff" ,fontFamily: "'Poppins', sans-serif"}}>
                Vérification 
              </Typography>
      
          <div className={styles.titre}>
<label htmlFor="">Un code de réinitialisation à 6 chiffres a été envoyé à l’adresse <strong>{email}</strong></label>
          </div>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      

<TextField
  id="email"
 placeholder="Entrez le code ici "
  variant="outlined"
  fullWidth
  value={code}
  onChange={handleCode}
 margin="normal"
   InputProps={{
    style: { fontSize: 17, textAlign: "center" },
  }}
  InputLabelProps={{
    style: { fontSize: 18  ,
  
    }, // taille du label
  }}
   sx={{
    "& .MuiInputBase-input": {
      paddingX : 2,
      paddingY :2.2
         // padding interne (haut, droite, bas, gauche)
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
            mt: 1,
            py: 1.3,
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
           <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
             <CircularProgress size={20} style={{color :"white"}} />
             
           </Box>
         ) : (
           "Réinitialiser"
         )}        </Button>
<Button
  fullWidth
  variant="text"
  onClick={handleResend}
  disabled={timer > 0 || resendLoading}
  startIcon={<ReplayIcon />}
  sx={{
    mt: 1,
    color: "#1890ff",
    textTransform: "none",
    textDecoration: "none", // par défaut pas de soulignement
    "&:hover": {
      textDecoration: "underline", // underline au survol
      backgroundColor: "transparent", // garde le fond transparent
    },
  }}
>
  {timer > 0 ? `Renvoyer le code dans ${timer}s` : "Renvoyer le code"}
</Button>

{/* Alert pour erreur */}
{error && (
  <Alert severity="error" sx={{ mt: 2, fontSize: 13 }}>
    {errorMsg} {/* ici le message peut venir du serveur ou du frontend */}
  </Alert>
)}

      </Box>
    </div>
  );
};

export default AccepteRespo;   