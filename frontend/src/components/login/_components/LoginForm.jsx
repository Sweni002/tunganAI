// src/pages/Login/components/LoginForm.jsx

import React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { ThreeDot } from "react-loading-indicators";
import Lottie from "lottie-react";
import Hello from "../../../assets/hello.json";
import Face from "../../../assets/face.json";
import Logo from "../../../assets/logo1.png";
import styles from "../login.module.css";
import m3 from "./m3.module.css";
import PointageCTA from "./PointageCTA";
import ErrorToast from "./ErrorToast";

/* ================= TOKENS M3 EXPRESSIVE ================= */

const PRIMARY = "rgb(51, 94, 143)";
const SPRING_FAST = "cubic-bezier(0.42, 1.67, 0.21, 0.9)";
const EFFECTS = "cubic-bezier(0.34, 0.8, 0.34, 1)";

const labelStyle = {
  fontSize: "0.95rem",
  letterSpacing: "0.5px",
  fontFamily: "'Poppins', sans-serif",
};

const inputStyle = { padding: 7, fontSize: 16 };

const iconStyle = { fontSize: "1rem", color: "gray" };

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
  const handleMouseDownPassword = (event) => event.preventDefault();

  return (
    <div className={styles.leftPanel}>
      <div className={styles.loginH}>
        <div className={styles.login1}>
          <img src={Logo} alt="Logo" />
        </div>
      </div>

      <div className={styles.container}>
        <div
          className={`${styles.card} ${m3.card} ${loginError ? m3.shake : ""}`}
        >
          <div className={styles.cards}>
            <div className={styles.gauche}>
              <div className={`${styles.left} ${m3.headline}`}>
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
                      autoComplete="username"
                      InputLabelProps={{ style: labelStyle }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <i
                              className="fa-solid fa-user-check"
                              aria-hidden="true"
                              style={iconStyle}
                            />
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{ style: inputStyle }}
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
                      autoComplete="current-password"
                      InputLabelProps={{ style: labelStyle }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showPassword ? "Masquer" : "Afficher"}
                              onClick={handleShowPassword}
                              onMouseDown={handleMouseDownPassword}
                            >
                              <i
                                className={
                                  showPassword
                                    ? "fa-solid fa-eye"
                                    : "fa-solid fa-eye-slash"
                                }
                                aria-hidden="true"
                                style={iconStyle}
                              />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{ style: inputStyle }}
                    />
                  </Box>

                  <div
                    className={`${styles.oublie} ${m3.forgot}`}
                    onClick={onForgotPassword}
                  >
                    <p>Mot de passe oublié ?</p>
                  </div>

                  <div className={styles.btn}>
                    <Button
                      variant="contained"
                      disableElevation
                      disabled={loading}
                      sx={{
                        fontFamily: "'Poppins', sans-serif",
                        width: "100%",
                        height: "48px",
                        backgroundColor: PRIMARY,
                        color: "white",
                        fontWeight: 700,
                        fontSize: isLargeScreen ? "0.9rem" : "0.8rem",
                        letterSpacing: "0.3px",
                        mb: 1,
                        px: 1,
                        borderRadius: "999px",
                        textTransform: "none",
                        position: "relative",
                        overflow: "hidden",
                        transition: `border-radius 350ms ${SPRING_FAST}, transform 350ms ${SPRING_FAST}, box-shadow 200ms ${EFFECTS}, background-color 200ms ${EFFECTS}`,
                        "&:hover": {
                          backgroundColor: "rgb(44, 84, 130)",
                          borderRadius: "20px",
                          boxShadow: "0 6px 18px rgba(51, 94, 143, 0.35)",
                        },
                        "&:active": {
                          borderRadius: "12px",
                          transform: "scale(0.97)",
                        },
                        "&:focus-visible": {
                          outline: "3px solid rgba(59, 130, 211, 0.5)",
                          outlineOffset: "3px",
                        },
                        "&.Mui-disabled": {
                          backgroundColor: PRIMARY,
                          color: "#fff",
                          opacity: 0.75,
                        },
                      }}
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

            <div className={`${styles.droite} ${m3.tonal}`}>
              <div className={styles.lotties}>
                <div
                  className={
                    currentLottie === 1 ? styles.jsonLott : styles.jsonLotts
                  }
                >
                  {currentLottie === 1 ? (
                    <Lottie animationData={Hello} loop={true} />
                  ) : (
                    <Lottie animationData={Face} loop={true} />
                  )}
                </div>
                <div className={styles.merci}>
                  <h2>Espace {import.meta.env.VITE_APP_NAME}</h2>
                  <label>
                    Connectez-vous pour accéder à votre compte, ou utilisez le{" "}
                    <strong>pointage rapide</strong> en bas à droite.
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Erreur en toast, en haut à droite */}
      <ErrorToast
        key={loginError || "none"}
        message={loginError}
        onClose={() => setLoginError("")}
      />

      <PointageCTA onClick={onShowPointage} disabled={loading} />
    </div>
  );
};

export default LoginForm;