import React, { useContext, useEffect, useState } from "react";
import { Box, TextField, Button, Typography, Alert, IconButton, InputAdornment, CircularProgress } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../AuthContext";
import Logo from '../../assets/logo1.png';
import styles from './mdp.module.css';
import { ThreeDot } from "react-loading-indicators";

const ChangerMDP = () => {
  const navigate = useNavigate();
const { user, fetchMe, setUser } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !["personnel", "responsable","admin"].includes(user.role)) {
        setUser(null)
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

const handleSubmit = async () => {
  setError("");
  setSuccess("");

  if (!currentPassword || !newPassword || !confirmPassword) {
    setError("Tous les champs sont requis.");
    return;
  }
  if (newPassword.length < 5) {
    setError("Le mot de passe doit contenir au moins 5 caractères.");
    return;
  }
  if (newPassword !== confirmPassword) {
    setError("Les mots de passe ne correspondent pas.");
    return;
  }

  try {
    setLoading(true);

    let apiUrl = "";
    let body = {
      current_password: currentPassword,
      new_password: newPassword,
    };
console.log(user)
    if (user.role === "personnel" && user.personnel?.idpers) {
      apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/change-password/${user.personnel.idpers}`;
    } else if (user.role === "responsable" && user.responsable?.idrh) {
      apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/change-password-responsable/${user.responsable.idrh}`;
    } else if (user.role === "admin" && user.admin?.idadmin) {
      // 🔹 ajout admin
      apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/change-password-admin/${user.admin.idadmin}`;
    } else {
      setError(
        "Impossible de déterminer l'utilisateur pour le changement de mot de passe.",
      );
      setLoading(false);
      return;
    }

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess("Mot de passe changé avec succès. Veuillez vous reconnecter.");
      setUser(null); // Déconnexion forcée

      window.location.href = "/login"; // Redirige vers la page de login } else {
       }
  } catch (err) {
    console.error(err);
    setError("Erreur réseau ou serveur.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className={styles.container}>
      <div className={styles.enhaut}>
        <div className={styles.login1}>
          <img src={Logo} alt="Logo" />
        </div>
      </div>

      <Box
        className={styles.card}
        sx={{
          maxWidth: 480,
          width: "100%",
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
          onClick={() => navigate(-1)}
          sx={{ position: "absolute", top: 16, left: 16, color: "#507fa5" }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            mt: 4,
            fontWeight: 700,
            textAlign: "center",
            color: "#507fa5",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Changer le mot de passe
        </Typography>

        <Box
          sx={{
            mt: 2,
            px: 2,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <TextField
            type={showCurrent ? "text" : "password"}
            placeholder="Mot de passe actuel"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            InputProps={{
              style: {
                fontSize: "0.9rem",
                textAlign: "center",
                fontFamily: "'Poppins', sans-serif",
              },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowCurrent(!showCurrent)}>
                    {showCurrent ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            type={showNew ? "text" : "password"}
            placeholder="Nouveau mot de passe"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            InputProps={{
              style: {
                fontSize: "0.9rem",
                textAlign: "center",
                fontFamily: "'Poppins', sans-serif",
              },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNew(!showNew)}>
                    {showNew ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            type={showConfirm ? "text" : "password"}
            placeholder="Confirmer le mot de passe"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputProps={{
              style: {
                fontSize: "0.9rem",
                textAlign: "center",
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
          />
        </Box>

        <Button
          fullWidth
          disabled={loading}
          variant="contained"
          onClick={handleSubmit}
          sx={{
            mt: 2,
            background: "linear-gradient(90deg,#00c4cc,#8b69b8)",
            textTransform: "uppercase",
            borderRadius: 2,
            fontSize: "0.9rem",
            fontFamily: "'Poppins', sans-serif",
            height: "45px", // 🔹 fixe la hauteur du bouton
            "&.Mui-disabled": {
              backgroundColor: "#14535f",
              color: "#fff", // optionnel (texte blanc)
              opacity: 0.7, // optionnel (effet disabled léger)
            },
          }}
        >
          {loading ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span className={styles.loader}></span>
            </div>
          ) : (
            "Valider"
          )}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2, fontSize: 13 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2, fontSize: 13 }}>
            {success}
          </Alert>
        )}
      </Box>
    </div>
  );
};

export default ChangerMDP;