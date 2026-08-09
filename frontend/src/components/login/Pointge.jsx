// src/components/login/Pointage.jsx

import React, { useContext, useEffect, useRef, useState } from 'react'
import styles from './login.module.css';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Button from '@mui/material/Button';
import { useNavigate } from "react-router-dom"
import bgImage from '../../assets/logo4.webp';
import { AuthContext } from '../../AuthContext';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Backdrop from '@mui/material/Backdrop';
import Fade from '@mui/material/Fade';
import { styled } from "@mui/material/styles";
import Webcam from "react-webcam";
import Typography from '@mui/material/Typography';
import { Tooltip } from 'antd';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

import Lottie from "lottie-react";
import SuccessLottie from '../../assets/success.json';
import ErrorLottie from '../../assets/error.json';
import { useMediaQuery } from 'react-responsive';
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import {
  checkFaceCovering,
  isFaceCovered,
  formatCoveringResult,
} from "./services/roboflowService";
import { getSystemWifiMac, isMobileDevice } from "./services/macAgentService";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import { computeLandmarkSignature, getFaceLandmarker, landmarksToBox, nextTimestamp } from './services/mediapipeService';

const API_URL = import.meta.env.VITE_API_URL;

// ⚙️ Passe à true si <Webcam mirrored /> est utilisé
const MIRRORED = false;

// ============================================================================
// ⚠️ `face_descriptor` envoyé à l'étape 4
//
// Ce n'est plus un descripteur de reconnaissance (MediaPipe n'en produit pas)
// mais une signature géométrique. Ici c'est acceptable : l'étape 4 journalise
// un pointage, l'identité ayant déjà été établie par step3-recognition côté
// serveur. Ne pas confondre avec l'enrôlement (AjoutPerso), où ce type de
// vecteur ne doit surtout pas remplacer l'empreinte de référence.
// ============================================================================
const SEND_FACE_SIGNATURE = true;

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

const PROCESSING_STEPS = [
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
        gap: 3,
        backdropFilter: "blur(3px)",
      }}
    >
      <span className={styles.loader}></span>

      <div style={{ textAlign: "center", padding: "0 24px" }}>
        <Fade in key={step} timeout={400}>
          <Typography
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: { xs: "0.85rem", sm: "1rem" },
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            {PROCESSING_STEPS[step]}
          </Typography>
        </Fade>

        <Typography
          sx={{
            fontFamily: "'Poppins', sans-serif",
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
                backgroundColor: i <= step ? "#00c4cc" : "rgba(255,255,255,0.25)",
                transition: "background-color 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
    </Backdrop>
  );
};

const MobileBlockedDialog = ({ onGoBack }) => (
  <Dialog open fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: "16px", textAlign: "center", p: 2 } }}>
    <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <DesktopWindowsIcon sx={{ fontSize: 56, color: "#1b6979" }} />
      <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1.05rem" }}>
        Pointage disponible uniquement sur PC
      </Typography>
      <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.85rem", color: "#666" }}>
        Cette page nécessite un poste fixe (Windows) pour fonctionner. Merci de vous rendre sur un
        ordinateur pour effectuer votre pointage.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ justifyContent: "center", pb: 1 }}>
      <Button variant="contained" onClick={onGoBack} sx={{ textTransform: "none", borderRadius: "8px" }}>
        Retour
      </Button>
    </DialogActions>
  </Dialog>
);

const PointageContent = () => {
  const { loginRespo, fetchMe } = useContext(AuthContext);

  const [active, setActive] = useState("entree");
  const [pointageStarted, setPointageStarted] = useState(false);
  const [startingPointage, setStartingPointage] = useState(false);
  const [sendingToServer, setSendingToServer] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const isFetching = useRef(false);
  const landmarkerRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [webcamReady, setWebcamReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [admin, setAdmin] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("warning");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");

  const [valueBtn, setValueBtn] = useState("entree");
  const isLargeScreen = useMediaQuery({ minWidth: 701 });

  const navigate = useNavigate();

  const handleChangeBtn = (event, newValue) => {
    setValueBtn(newValue);
    if (newValue === "entree") setActive("entree");
    else if (newValue === "logout") setActive("logout");
  };

  const handleClick = (type) => {
    setActive(type === active ? "" : type);
  };

  const goBack = () => navigate(-1);

  // ------------------------------------------------------------------
  // Initialisation du modèle MediaPipe
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setLoadingModels(true);
        const lm = await getFaceLandmarker();
        if (cancelled) return;
        landmarkerRef.current = lm;
        setModelsLoaded(true);
      } catch (err) {
        console.error("Erreur chargement du modèle facial :", err);
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  // ------------------------------------------------------------------
  // 🔄 Le chargement des descriptors (/faceapi-descriptors) et le
  // FaceMatcher ont été supprimés : ils ne servaient qu'à afficher un
  // texte générique ("Bonjour, Personnels de SRSP"). L'identification
  // réelle se fait côté serveur via step3-recognition.
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  // Overlay de détection
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!modelsLoaded) return;

    let animationId;
    let lastDraw = 0;
    const MIN_INTERVAL = window.innerWidth < 768 ? 90 : 60;

    const detectFace = () => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || video.readyState !== 4 || !canvas || !landmarker) {
        animationId = requestAnimationFrame(detectFace);
        return;
      }

      const context = canvas.getContext("2d", { willReadFrequently: true });
      const displaySize = {
        width: video.clientWidth,
        height: video.clientHeight,
      };

      // 🐛 Corrigé : la hauteur n'était réajustée que si la largeur changeait
      if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
        canvas.width = displaySize.width;
        canvas.height = displaySize.height;
      }

      const now = performance.now();
      const newFrame = video.currentTime !== lastVideoTimeRef.current;

      if (!scanning && newFrame && now - lastDraw >= MIN_INTERVAL) {
        lastDraw = now;
        lastVideoTimeRef.current = video.currentTime;

        try {
          const result = landmarker.detectForVideo(video, nextTimestamp());
          const hour = new Date().getHours();
          const label = hour < 18
            ? "Bonjour, Personnels de SRSP"
            : "Bonsoir, Personnels de SRSP";

          context.clearRect(0, 0, canvas.width, canvas.height);

          (result.faceLandmarks || []).forEach((landmarks) => {
            let { x, y, width, height } = landmarksToBox(
              landmarks,
              displaySize.width,
              displaySize.height
            );
            if (MIRRORED) x = displaySize.width - x - width;

            context.strokeStyle = "white";
            context.lineWidth = 1;
            context.strokeRect(x, y, width, height);

            context.fillStyle = "black";
            context.fillRect(x, y - 25, width, 25);

            context.fillStyle = "white";
            context.font = "8px Poppins";
            context.fillText(label, x + 5, y - 8);
          });
        } catch (err) {
          console.error("Erreur détection visages :", err);
        }
      }

      animationId = requestAnimationFrame(detectFace);
    };

    detectFace();

    return () => cancelAnimationFrame(animationId);
  }, [modelsLoaded, scanning]);

  useEffect(() => {
    const checkVideo = setInterval(() => {
      const video = webcamRef.current?.video;
      if (video && video.readyState === 4) {
        setWebcamReady(true);
        clearInterval(checkVideo);
      }
    }, 100);

    return () => clearInterval(checkVideo);
  }, []);

  useEffect(() => {
    const fetchAdmin = async () => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        const data = await fetchMe();
        setAdmin(data);
      } catch (err) {
        console.error("Erreur fetchMe:", err);
        setAdmin(null);
      } finally {
        isFetching.current = false;
      }
    };
    fetchAdmin();
  }, []);

  useEffect(() => {
    if (isLargeScreen) {
      document.body.style.background = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${bgImage}) no-repeat center center fixed`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.background = '';
      document.body.style.backgroundSize = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.body.style.background = '';
      document.body.style.backgroundSize = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.userSelect = '';
    };
  }, [isLargeScreen]);

  const getStep4Url = () => {
    if (admin.role === "personnel") {
      return active === "logout"
        ? `${API_URL}/api/pointage/facial_client_sortie_personnel/step4-enregistrer?idpers=${admin.personnel.idpers}`
        : `${API_URL}/api/pointage/facial_client_personnel/step4-enregistrer?idpers=${admin.personnel.idpers}`;
    }
    return active === "logout"
      ? `${API_URL}/api/pointage/facial_client_sortie_responsable/step4-enregistrer?idrh=${admin.responsable.idrh}`
      : `${API_URL}/api/pointage/facial_client_responsable/step4-enregistrer?idrh=${admin.responsable.idrh}`;
  };

  const handleStartPointage = async () => {
    setScanning(true);
    setStartingPointage(true);

    const wifiMacAddress = await getSystemWifiMac();
    console.log("Adresse MAC Wi-Fi du système :", wifiMacAddress);

    if (!wifiMacAddress) {
      setScanning(false);
      setStartingPointage(false);
      setModalType("error");
      setModalMessage(
        "Impossible de récupérer l'adresse MAC Wi-Fi du poste. Vérifiez que l'agent local est bien lancé avant de réessayer."
      );
      setModalOpen(true);
      return;
    }

    if (!active) {
      setScanning(false);
      setStartingPointage(false);
      setSnackbarMessage("Veuillez choisir Entrée ou Sortie avant de démarrer le pointage !");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    if (!webcamRef.current) {
      setScanning(false);
      setStartingPointage(false);
      return;
    }
    const video = webcamRef.current.video;
    if (video.readyState !== 4) {
      setScanning(false);
      setStartingPointage(false);
      return;
    }

    setPointageStarted(true);

    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const landmarker = landmarkerRef.current;
      if (!landmarker) throw new Error("Modèle facial non initialisé");

      const result = landmarker.detectForVideo(video, nextTimestamp());
      const landmarks = result.faceLandmarks?.[0];

      if (!landmarks) {
        setSnackbarMessage("Aucun visage détecté. Veuillez vous placer devant la caméra.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        return;
      }

      const descriptorArray = computeLandmarkSignature(landmarks);

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error("Impossible de capturer l'image");

      const res = await fetch(imageSrc);
      const blob = await res.blob();

      setSendingToServer(true);

      // ==================== ÉTAPE 0 : Anti-masque (Roboflow) ====================
      setProcessingStep(0);

      let coveringResult;
      try {
        coveringResult = await checkFaceCovering(blob);
      } catch (coveringErr) {
        console.error("Erreur analyse anti-masque :", coveringErr);
        setSendingToServer(false);
        setProcessingStep(0);
        setModalType("error");
        setModalMessage(coveringErr.message || "Erreur lors de l'analyse anti-masque.");
        setModalOpen(true);
        return;
      }

      if (isFaceCovered(coveringResult)) {
        setSendingToServer(false);
        setProcessingStep(0);
        setModalType("error");
        setModalMessage(
          `Visage masqué détecté. Merci de retirer masque/lunettes/cache avant de pointer.\n${formatCoveringResult(coveringResult)}`
        );
        setModalOpen(true);
        return;
      }

      // ==================== ÉTAPE 1 : Anti-spoof ====================
      setProcessingStep(1);

      let antispoofResult;
      try {
        const antispoofFormData = new FormData();
        antispoofFormData.append("image", blob, "capture.jpg");

        const antispoofResp = await fetch(`${API_URL}/api/pointage/facial_client/step2-antispoof`, {
          method: "POST",
          body: antispoofFormData,
          credentials: "include",
        });
        antispoofResult = await antispoofResp.json();
        if (!antispoofResp.ok) {
          throw new Error(antispoofResult.error || "Erreur lors de la vérification anti-usurpation.");
        }
      } catch (err) {
        setSendingToServer(false);
        setProcessingStep(0);
        setModalType("error");
        setModalMessage(err.message || "Erreur lors de la vérification anti-usurpation.");
        setModalOpen(true);
        return;
      }

      // ==================== ÉTAPE 2 : Reconnaissance faciale ====================
      setProcessingStep(2);

      let recognitionResult;
      try {
        const recognitionResp = await fetch(`${API_URL}/api/pointage/facial_client/step3-recognition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ temp_id: antispoofResult.temp_id }),
        });
        recognitionResult = await recognitionResp.json();
        if (!recognitionResp.ok) {
          throw new Error(recognitionResult.error || "Visage non reconnu, veuillez réessayer.");
        }
      } catch (err) {
        setSendingToServer(false);
        setProcessingStep(0);
        setModalType("error");
        setModalMessage(err.message || "Visage non reconnu, veuillez réessayer.");
        setModalOpen(true);
        return;
      }

      // ==================== ÉTAPE 3 : Enregistrement ====================
      setProcessingStep(3);

      const url = getStep4Url();

      const payload = {
        role: recognitionResult.role,
        id_value: recognitionResult.id_value,
        emb: recognitionResult.emb,
        score_face: recognitionResult.score_face,
        second_score: recognitionResult.second_score,
      };
      if (SEND_FACE_SIGNATURE) {
        payload.face_descriptor = descriptorArray;
      }

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      setSendingToServer(false);

      const data = await resp.json();

      if (!resp.ok) {
        const utterance = new SpeechSynthesisUtterance(data.error || "Erreur lors du pointage");
        utterance.lang = "fr-FR";
        speechSynthesis.speak(utterance);
        setModalType("error");
        setModalMessage(data.error || "Erreur lors du pointage");
      } else {
        if (data.speech) {
          let text = data.speech.replace(/(\d{1,2})h:?(\d{2})/g, "$1 heures $2");
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "fr-FR";
          speechSynthesis.speak(utterance);
        }
        setModalType("success");
        setModalMessage(data.message || "Pointage effectué avec succès !");
      }

      setModalOpen(true);
    } catch (err) {
      setSendingToServer(false);
      console.error("Erreur réseau :", err);

      const utterance = new SpeechSynthesisUtterance("Erreur de connexion avec le serveur.");
      utterance.lang = "fr-FR";
      speechSynthesis.speak(utterance);
      setSnackbarMessage("Erreur de connexion avec le serveur.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setStartingPointage(false);
      setPointageStarted(false);
      setScanning(false);
      setProcessingStep(0);
    }
  };

  return (
    <div
      className={styles.loginWrapper}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className={styles.rightPanel}>
        <ProcessingBackdrop open={sendingToServer} step={processingStep} />

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
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <span className={styles.loader2}></span>
          </div>
        )}

        <Tooltip title="Retour" onClick={goBack}>
          <IconButton
            sx={{
              position: "absolute",
              top: isLargeScreen ? 15 : 14,
              left: isLargeScreen ? 25 : 0,
              color: "white",
              zIndex: 1000,
              "&:hover": { transform: "scale(1.1)" },
              transition: "all 0.2s ease",
            }}
          >
            <i
              className="fa-solid fa-arrow-left"
              style={{ fontSize: isLargeScreen ? "1.6rem" : "0.9rem" }}
            />
          </IconButton>
        </Tooltip>

        {!isLargeScreen && (
          <Box
            sx={{
              width: "100%",
              position: "absolute",
              top: 5,
              left: "52%",
              zIndex: 1000,
              transform: "translateX(-50%)",
              maxWidth: 300,
            }}
          >
            <Tabs value={valueBtn} onChange={handleChangeBtn} variant="fullWidth">
              <Tab
                value="entree"
                label="Entrée"
                sx={{
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  color: "rgb(255, 255, 255)",
                  fontFamily: "'Poppins', sans-serif",
                  "&.Mui-selected": { color: "white", fontWeight: "bold" },
                }}
              />
              <Tab
                value="logout"
                label="Sortie"
                sx={{
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  color: "rgb(255, 255, 255)",
                  fontFamily: "'Poppins', sans-serif",
                  "&.Mui-selected": { color: "white" },
                }}
              />
            </Tabs>
          </Box>
        )}

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
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <span className={styles.loader2}></span>
          </div>
        )}

        {isLargeScreen && (
          <>
            <div className={styles.overlayTop}></div>
            <div className={styles.overlayBottom}></div>
            <div className={styles.overlayLeft}></div>
            <div className={styles.overlayRight}></div>

            <div className={styles.scannerFrame}>
              <div className={`${styles.corner} ${styles.tl_horizontal}`}></div>
              <div className={`${styles.corner} ${styles.tl_vertical}`}></div>
              <div className={`${styles.corner} ${styles.tr_horizontal}`}></div>
              <div className={`${styles.corner} ${styles.tr_vertical}`}></div>
              <div className={`${styles.corner} ${styles.bl_horizontal}`}></div>
              <div className={`${styles.corner} ${styles.bl_vertical}`}></div>
              <div className={`${styles.corner} ${styles.br_horizontal}`}></div>
              <div className={`${styles.corner} ${styles.br_vertical}`}></div>
              {scanning && <div className={styles.scanLine}></div>}
            </div>
          </>
        )}

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
                  onClick={() => handleClick("entree")}
                  className={`${styles.actives} ${active === "entree" ? styles.active : ""}`}
                >
                  <IconButton disabled={startingPointage}>
                    <i
                      className="fa-solid fa-right-to-bracket"
                      style={{
                        color: active === "entree" ? "black" : "white",
                        fontSize: "30px",
                      }}
                    ></i>
                  </IconButton>
                </div>
              </Tooltip>

              <Tooltip title="Sortie">
                <div
                  onClick={() => handleClick("logout")}
                  className={`${styles.actives} ${active === "logout" ? styles.active : ""}`}
                >
                  <IconButton disabled={startingPointage}>
                    <i
                      className="fa-solid fa-door-open"
                      style={{
                        color: active === "logout" ? "black" : "white",
                        fontSize: "30px",
                      }}
                    ></i>
                  </IconButton>
                </div>
              </Tooltip>
            </div>
          )}

          <div className={styles.centerGroup}>
            <div className={styles.demarrer}>
              <Button
                onClick={handleStartPointage}
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
                          fontFamily: "'Poppins', sans-serif",
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
                          fontFamily: "'Poppins', sans-serif",
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

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{
            position: "absolute",
            top: isLargeScreen ? 16 : 0,
            left: isLargeScreen ? "50%" : 0,
            transform: isLargeScreen ? "translateX(-50%)" : "none",
            zIndex: 9999,
            fontFamily: "'Poppins', sans-serif",
            width: "100%",
            p: 2,
          }}
        >
          <AlertSnackbar
            severity={snackbarSeverity}
            onClose={() => setSnackbarOpen(false)}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: isLargeScreen ? "0.96rem" : "0.7rem",
            }}
          >
            {snackbarMessage}
          </AlertSnackbar>
        </Snackbar>
      </div>

      <BootstrapDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
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
            sx={{ mt: 3, fontFamily: "'Poppins', sans-serif", whiteSpace: "pre-line" }}
          >
            {modalMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setModalOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: "transparent",
              borderRadius: 4,
              border: "none",
              color: "#238a8aff",
              p: 1.5,
              letterSpacing: 2,
              fontWeight: "bold",
            }}
          >
            ok
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </div>
  );
}

const Pointage = () => {
  const navigate = useNavigate();
  const [blocked] = useState(() => isMobileDevice());

  if (blocked) {
    return <MobileBlockedDialog onGoBack={() => navigate(-1)} />;
  }

  return <PointageContent />;
};

export default Pointage