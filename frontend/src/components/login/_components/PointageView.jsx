// src/pages/Login/components/PointageView.jsx

import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Backdrop from "@mui/material/Backdrop";
import Fade from "@mui/material/Fade";
import { styled } from "@mui/material/styles";
import { Tooltip } from "antd";
import MuiAlert from "@mui/material/Alert";
import Lottie from "lottie-react";
import SuccessLottie from "../../../assets/success.json";
import ErrorLottie from "../../../assets/error.json";
import styles from "../login.module.css";

const AlertSnackbar = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: theme.spacing(0),
    width: "100%",
    maxWidth: "420px",
  },
}));

// ---------------------------------------------------------------
// Backdrop de traitement : défile automatiquement 3 étapes
// tant que "open" (= sendingToServer, uniquement l'envoi réseau) est vrai
// ---------------------------------------------------------------
const PROCESSING_STEPS = [
  "Vérification du poste",
  "Analyse anti-masque",
  "Vérification anti-usurpation",
  "Reconnaissance faciale",
  "Enregistrement du pointage",
];

const ProcessingBackdrop = ({ open, step = 0 }) => {
  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: 10500,
        color: "#fff",
        backgroundColor: "rgba(0,0,0,0.75)",
        flexDirection: "column",
        gap: 5,
        backdropFilter: "blur(23px)",
      }}
    >
      <span className={styles.loader}></span>

      <div style={{ textAlign: "center", padding: "0 24px" }}>
        <Fade in key={step} timeout={400}>
          <Typography
            sx={{
              fontFamily: "'Roboto Mono', monospace",
              fontSize: { xs: "0.85rem", sm: "1rem" },
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            {PROCESSING_STEPS[step]}
          </Typography>
        </Fade>

        {/* 🆕 Message fixe, ne change pas avec l'étape : rassure l'utilisateur
            qu'il n'a pas besoin de fixer l'écran pendant tout le traitement */}
        <Typography
          sx={{
            fontFamily: "'Roboto Mono', monospace",
            fontSize: { xs: "0.7rem", sm: "0.8rem" },
            color: "rgba(255,255,255,0.6)",
            mt: 1,
          }}
        >
          Vous pouvez faire autre chose en attendant
        </Typography>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 14,
          }}
        >
          {PROCESSING_STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor:
                  i <= step ? "#00c4cc" : "rgba(255,255,255,0.25)",
                transition: "background-color 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
    </Backdrop>
  );
};

// ---------------------------------------------------------------
// Barre d'action (Entrée/Sortie + bouton Démarrer). Extraite de
// PointageView pour pouvoir être placée EN DEHORS de celui-ci (ex: en
// dessous, comme un sibling), avec exactement le même style/logique.
// ---------------------------------------------------------------
export const PointageActionBar = ({
  isLargeScreen,
  active,
  pointageStarted,
  startingPointage,
  modelsLoaded,
  onHandleClick,
  onStartPointage,
}) => {
  return (
    <div
      className={styles.startButtonContainer}
      style={
        !isLargeScreen
          ? {
            position: "fixed",
            left: 0,
            right: 0,
            bottom: "max(16px, env(safe-area-inset-bottom, 16px))",
            zIndex: 1200,
          }
          : undefined
      }
    >
      {!pointageStarted && isLargeScreen && (
        <div className={styles.leftGroup}>
          <Tooltip title="Entrée">
            <div
              onClick={() => onHandleClick("entree")}
              className={`${styles.actives} ${active === "entree" ? styles.active : ""}`}
            >
              <IconButton disabled={startingPointage}>
                <i
                  className="fa-solid fa-right-to-bracket"
                  style={{
                    color: active === "entree" ? "black" : "white",
                    fontSize: "30px",
                  }}
                />
              </IconButton>
            </div>
          </Tooltip>

          <Tooltip title="Sortie">
            <div
              onClick={() => onHandleClick("logout")}
              className={`${styles.actives} ${active === "logout" ? styles.active : ""}`}
            >
              <IconButton disabled={startingPointage}>
                <i
                  className="fa-solid fa-door-open"
                  style={{
                    color: active === "logout" ? "black" : "white",
                    fontSize: "30px",
                  }}
                />
              </IconButton>
            </div>
          </Tooltip>
        </div>
      )}

      <div className={styles.centerGroup}>
        <div className={styles.demarrer}>
          <Button
            onClick={onStartPointage}
            variant="contained"
            disabled={startingPointage || !modelsLoaded}
            fullWidth
            sx={{
              padding: 3,
              display: "flex",
              width: "100%",
              height: "100%",
              justifyContent: "center",
              gap: 2,
              backgroundColor: "transparent",
              border: "none",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {startingPointage ? (
                <>
                  <span className={styles.loader}></span>
                  <span
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: isLargeScreen ? "0.96rem" : "0.7rem",
                      fontFamily: "'Roboto Mono', monospace",
                    }}
                  >
                    VÉRIFICATION
                  </span>
                </>
              ) : (
                <>
                  <i
                    className="fa-solid fa-expand"
                    style={{
                      color: active === "sortie" ? "black" : "white",
                      fontSize: isLargeScreen ? "30px" : "1.2rem",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Roboto Mono', monospace",
                      fontSize: isLargeScreen ? "0.96rem" : "0.7rem",
                    }}
                  >
                    Démarrer le pointage
                  </span>
                </>
              )}
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

const PointageView = ({
  webcamRef,
  canvasRef,
  webcamReady,
  loadingModels,
  isLargeScreen,
  scanning,
  active,
  pointageStarted,
  startingPointage,
  processingStep,
  sendingToServer,
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  modalOpen,
  modalMessage,
  modalType,
  onCloseSnackbar,
  onCloseModal,
  onHandleClick,
  onStartPointage,
  onGoBack,
  modelsLoaded,
  containerStyle,
  hideActionBar = false,
  subjectId,
  confidence,
  subjectType,
}) => {
  return (
    <div className={styles.rightPanel} style={containerStyle}>
      {/* Backdrop de traitement : uniquement pendant l'envoi/traitement backend */}
      <ProcessingBackdrop open={sendingToServer} step={processingStep} />


      {/* Loader modèles */}
      {loadingModels && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 10000,
            color: "white",
            flexDirection: "column",
            fontFamily: "'Roboto Mono', monospace",
          }}
        >
          <span className={styles.loader2}></span>
        </div>
      )}



      {/* Webcam */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        style={{
          width: isLargeScreen ? "100%" : "90%",
          height: "100%",
          objectFit: "contain",
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Loader webcam */}
      {!webcamReady && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 10000,
            color: "white",
            flexDirection: "column",
            fontFamily: "'Roboto Mono', monospace",
          }}
        >
          <span className={styles.loader2}></span>
        </div>
      )}

      {/* Cadre hexagonal façon "scan facial" (desktop) + labels d'info.
          Remplace l'ancien cadre carré (CSS overlayTop/Bottom/Left/Right +
          scannerFrame) par un SVG stylé en inline, comme la maquette. */}
      {isLargeScreen && (
        <>
          <svg
            viewBox="0 0 400 400"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "62%",
              height: "62%",
              pointerEvents: "none",
              zIndex: 20,
              overflow: "visible",
            }}
          >


            {scanning && (
              <line x1="30" y1="200" x2="370" y2="200" stroke="#00e5ff" strokeWidth="2.5" opacity="0.85">
                <animate attributeName="y1" values="60;340;60" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="y2" values="60;340;60" dur="1.6s" repeatCount="indefinite" />
              </line>
            )}
          </svg>


        </>
      )}

      {/* Boutons d'action : rendus ici par défaut (mobile, comportement
          identique à l'original). Le parent peut passer hideActionBar
          pour les rendre lui-même EN DEHORS (cas desktop). */}
      {!hideActionBar && (
        <PointageActionBar
          isLargeScreen={isLargeScreen}
          active={active}
          pointageStarted={pointageStarted}
          startingPointage={startingPointage}
          modelsLoaded={modelsLoaded}
          onHandleClick={onHandleClick}
          onStartPointage={onStartPointage}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={onCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          fontFamily: "'Roboto Mono', monospace",
          position: "absolute",
          top: isLargeScreen ? 16 : 0,
          left: isLargeScreen ? "50%" : 0,
          transform: isLargeScreen ? "translateX(-50%)" : "none",
          zIndex: 9999,
          width: "100%",
          p: 2,
        }}
      >
        <AlertSnackbar
          severity={snackbarSeverity}
          onClose={onCloseSnackbar}
          sx={{
            width: "100%",
            fontFamily: "'Roboto Mono', monospace",
            fontSize: isLargeScreen ? "0.96rem" : "0.7rem",
          }}
        >
          {snackbarMessage}
        </AlertSnackbar>
      </Snackbar>

      {/* Modal succès/erreur */}
      <BootstrapDialog
        open={modalOpen}
        onClose={onCloseModal}
        PaperProps={{
          style: { textAlign: "center", padding: isLargeScreen ? 20 : 10 },
        }}
      >
        <DialogContent>
          <Lottie
            animationData={modalType === "success" ? SuccessLottie : ErrorLottie}
            loop={false}
            style={{
              width: isLargeScreen ? 250 : 180,
              height: isLargeScreen ? 170 : 120,
              margin: "0 auto",
            }}
          />
          <Typography
            variant={isLargeScreen ? "h7" : "h9"}
            sx={{ mt: 3, fontFamily: "'Roboto Mono', monospace" }}
          >
            {modalMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onCloseModal}
            variant="contained"
            sx={{
              backgroundColor: "transparent",
              borderRadius: 4,
              border: "none",
              color: "#238a8aff",
              p: 1.5,
              letterSpacing: 2,
              fontWeight: "bold",
              fontFamily: "'Roboto Mono', monospace",
            }}
          >
            ok
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </div>
  );
};

export default PointageView;