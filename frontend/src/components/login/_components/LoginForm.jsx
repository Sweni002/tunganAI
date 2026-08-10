// src/pages/Login/components/LoginForm.jsx

import React, { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close";
import { ThreeDot } from "react-loading-indicators";
import Lottie from "lottie-react";
import Hello from "../../../assets/hello.json";
import Face from "../../../assets/face.json";
import Logo from "../../../assets/logo1.png";
import styles from "../login.module.css";

const LoginForm = ({
  nom,
  setNom,
  mdp,
  setMdp,
  showPassword,
  handleShowPassword,
  loginError,
  setLoginError,
  loading,
  onLogin,
  onKeyDown,
  isLargeScreen,
  onForgotPassword,
  onShowPointage,
  currentLottie,
}) => {
  const [hovered, setHovered] = useState(false);

  const handleMouseDownPassword = (event) => event.preventDefault();

  return (
    <div className={styles.leftPanel}>
      <div className={styles.loginH}>
        <div className={styles.login1}>
          <img src={Logo} alt="" />
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          {loginError && (
            <Alert
              severity="error"
              fullWidth
              sx={{
                fontSize: "0.9rem",
                padding: 1,
                display: "flex",
                width: "100%",
                fontFamily: "'Poppins', sans-serif",
              }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setLoginError(false)}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {loginError}
            </Alert>
          )}

          <div className={styles.cards}>
            <div className={styles.gauche}>
              <div className={styles.left}>
                <h2>Ha, te revoilà !</h2>
                <span>Heureux de te revoir</span>
              </div>

              <div className={styles.form} onKeyDown={onKeyDown}>
                <div className={styles.input1}>
                  <Box sx={{ p: 2, px: isLargeScreen ? 2 : 0, py: 2 }}>
                    <TextField
                      id="standard-basic"
                      fullWidth
                      disabled={loading}
                      label="Matricule"
                      value={nom}
                      onChange={(e) => {
                        setNom(e.target.value);
                        if (loginError) setLoginError("");
                      }}
                      variant="standard"
                      InputLabelProps={{
                        style: {
                          fontSize: "1.1rem",
                          letterSpacing: "1px",
                          fontFamily: "'Poppins', sans-serif",
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <i
                              className="fa-solid fa-user-check"
                              style={{ fontSize: "1.2rem", color: "gray" }}
                            />
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{
                        style: { padding: "6px", fontSize: 20 },
                      }}
                    />
                  </Box>

                  <Box sx={{ p: 2, px: isLargeScreen ? 2 : 0, py: 3 }}>
                    <TextField
                      id="standard-password"
                      fullWidth
                      disabled={loading}
                      label="Mot de passe"
                      variant="standard"
                      value={mdp}
                      onChange={(e) => {
                        setMdp(e.target.value);
                        if (loginError) setLoginError("");
                      }}
                      type={showPassword ? "text" : "password"}
                      InputLabelProps={{
                        style: {
                          fontSize: "1.1rem",
                          letterSpacing: "1px",
                          fontFamily: "'Poppins', sans-serif",
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showPassword ? "Masquer" : "Afficher"}
                              onClick={handleShowPassword}
                              onMouseDown={handleMouseDownPassword}
                            >
                              <i
                                className={showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}
                                style={{ fontSize: "1.2rem", color: "gray" }}
                              />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{
                        style: { padding: "6px", fontSize: 20 },
                      }}
                    />
                  </Box>

                  <div className={styles.oublie} onClick={onForgotPassword}>
                    <p>Mot de passe oublié ?</p>
                  </div>

                  <div className={styles.btn}>
                    <Button
                      variant="outlined"
                      disabled={loading}
                      sx={{
                        fontFamily: "'Poppins', sans-serif",
                        width: "100%",
                        height: "48px",
                        backgroundColor: "rgb(51, 94, 143)",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: isLargeScreen ? "1.0rem" : "0.85rem",
                        mb: 1,
                        px: 1,
                        borderRadius: isLargeScreen ? "4px" : "32px",
                        border: "none",
                        textTransform: "none",
                        position: "relative",
                        boxShadow: hovered
                          ? "0 4px 20px rgba(51, 94, 143, 0.6)"
                          : "0 2px 5px rgba(0,0,0,0.2)",
                        transform: hovered ? "scale(1.05)" : "scale(1)",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={() => setHovered(true)}
                      onMouseLeave={() => setHovered(false)}
                      onClick={onLogin}
                    >
                      <span style={{ visibility: loading ? "hidden" : "visible" }}>
                        Se connecter
                      </span>
                      {loading && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <ThreeDot color="#ffffff" size="small" variant="pulsate" />
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.droite}>
              <div className={styles.lotties}>
                <div className={currentLottie === 1 ? styles.jsonLott : styles.jsonLotts}>
                  {currentLottie === 1 ? (
                    <Lottie animationData={Hello} loop={true} />
                  ) : (
                    <Lottie animationData={Face} loop={true} />
                  )}
                </div>
                <div className={styles.merci}>
                  <h2>Espace  {import.meta.env.VITE_APP_NAME}</h2>
                  <label>
                    Entrez vos identifiants pour accéder à votre compte ou
                    choisissez l'option de pointage.
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.faire}>
          <div className={styles.enbas}>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                fontFamily: "'Poppins', sans-serif",
                backgroundColor: "white",
                border: "none",
                color: "#1976d2",
                fontWeight: "bold",
                borderRadius: "5px",
                padding: "15px",
                fontSize: "16px",
                transition: "all 0.3s ease",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
              onClick={onShowPointage}
            >
              <i className="fa-solid fa-expand" style={{ marginRight: 12, fontSize: "1.4rem" }} />
              Faire pointage
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;