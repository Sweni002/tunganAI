// src/pages/Login/hooks/useFacePointage.js

import { useState, useEffect, useRef, useCallback } from "react";
import { authService } from "../services/authService";
import {
  checkFaceCovering,
  isFaceCovered,
  formatCoveringResult,
} from "../services/roboflowService";
import { socket } from "../../../socket";
import { getSystemWifiMac } from "./macAgentService";
import {
  getFaceLandmarker,
  nextTimestamp,
  landmarksToBox,
  computeLandmarkSignature,
} from "./mediapipeService";

// ⚙️ Passe à true si <Webcam mirrored /> est utilisé, sinon l'overlay
// sera décalé horizontalement par rapport à l'image affichée.
const MIRRORED = false;

// ============================================================
// ⭐ FONCTIONS UTILITAIRES OPTIMISÉES (inchangées)
// ============================================================

const captureOptimizedImage = (webcamRef, maxWidth = 480, quality = 0.7) => {
  const video = webcamRef.current?.video;
  if (!video || video.readyState !== 4) return null;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: false });

  let width = video.videoWidth;
  let height = video.videoHeight;

  const isMobile = window.innerWidth < 768;
  const targetMaxWidth = isMobile ? 320 : maxWidth;

  if (width > targetMaxWidth) {
    const ratio = targetMaxWidth / width;
    width = Math.round(targetMaxWidth);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  context.imageSmoothingEnabled = false;
  context.drawImage(video, 0, 0, width, height);

  return new Promise((resolve) => {
    const qualityValue = window.innerWidth < 768 ? 0.6 : quality;
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", qualityValue);
  });
};

const compressImageFast = async (blob, targetSize = 150 * 1024) => {
  if (blob.size <= targetSize) {
    return blob;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const currentSize = blob.size;
      const ratio = Math.min(1, Math.sqrt(targetSize / currentSize));

      let width = Math.round(img.width * ratio);
      let height = Math.round(img.height * ratio);

      if (width < 100) width = 100;
      if (height < 100) height = 100;

      canvas.width = width;
      canvas.height = height;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);

      const quality = currentSize > 500 * 1024 ? 0.5 : 0.65;

      canvas.toBlob((compressed) => resolve(compressed || blob), "image/jpeg", quality);
    };
    img.onerror = () => resolve(blob);
    img.src = URL.createObjectURL(blob);
  });
};

// Cache pour les blobs
const blobCache = new Map();
const CACHE_MAX_SIZE = 3;
const CACHE_TTL = 5000;

// ============================================================
// ⭐ HOOK PRINCIPAL
// ============================================================

export const useFacePointage = () => {
  // États
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [active, setActive] = useState("entree");
  const [pointageStarted, setPointageStarted] = useState(false);
  const [startingPointage, setStartingPointage] = useState(false);
  const [sendingToServer, setSendingToServer] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("warning");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Références
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const abortControllerRef = useRef(null);
  const landmarkerRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  // ============================================================
  // ⭐ INITIALISATION DU FACELANDMARKER
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setLoadingModels(true);
        const landmarker = await getFaceLandmarker();
        if (cancelled) return;
        landmarkerRef.current = landmarker;
        setModelsLoaded(true);
        console.log("✅ MediaPipe FaceLandmarker prêt");
      } catch (err) {
        if (cancelled) return;
        console.error("❌ Erreur initialisation MediaPipe :", err);
        setSnackbarMessage("Erreur lors du chargement du modèle facial");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      // Le landmarker est un singleton partagé : on ne le ferme que si
      // l'application entière se démonte. Décommente si besoin.
      // closeFaceLandmarker();
    };
  }, []);

  // ============================================================
  // ⭐ HISTORIQUE DES POINTAGES (inchangé)
  // ============================================================

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const wifiMacAddress = await getSystemWifiMac();
      if (!wifiMacAddress) {
        setHistory([]);
        return;
      }
      const data = await authService.getFacialHistory(wifiMacAddress);
      setHistory(data);
    } catch (err) {
      console.error("Erreur chargement historique pointage :", err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ============================================================
  // ⭐ DÉTECTION FACIALE EN CONTINU (AFFICHAGE UNIQUEMENT)
  // ============================================================

  useEffect(() => {
    if (!modelsLoaded) return;

    let animationId;
    let lastDraw = 0;
    const MIN_INTERVAL = window.innerWidth < 768 ? 90 : 60; // ~11 / ~16 fps

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
          // ⚡ detectForVideo est synchrone dans tasks-vision
          const result = landmarker.detectForVideo(video, nextTimestamp());

          context.clearRect(0, 0, canvas.width, canvas.height);

          (result.faceLandmarks || []).forEach((landmarks) => {
            let { x, y, width, height } = landmarksToBox(
              landmarks,
              displaySize.width,
              displaySize.height
            );

            if (MIRRORED) {
              x = displaySize.width - x - width;
            }

            const len = Math.max(14, Math.min(width, height) * 0.22);
            const r = 6;

            context.save();
            context.strokeStyle = "rgba(255,255,255,0.95)";
            context.lineWidth = 3;
            context.lineCap = "round";
            context.lineJoin = "round";
            context.shadowColor = "rgba(0,0,0,0.45)";
            context.shadowBlur = 6;

            const corner = (cx, cy, sx, sy) => {
              context.beginPath();
              context.moveTo(cx + sx * len, cy);
              context.lineTo(cx + sx * r, cy);
              context.quadraticCurveTo(cx, cy, cx, cy + sy * r);
              context.lineTo(cx, cy + sy * len);
              context.stroke();
            };

            corner(x, y, 1, 1);
            corner(x + width, y, -1, 1);
            corner(x, y + height, 1, -1);
            corner(x + width, y + height, -1, -1);

            context.shadowBlur = 0;
            context.lineWidth = 1;
            context.strokeStyle = "rgba(255,255,255,0.18)";
            context.strokeRect(x, y, width, height);
            context.restore();
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

  // ============================================================
  // ⭐ VÉRIFICATION DE LA WEBCAM (inchangé)
  // ============================================================

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

  // ============================================================
  // ⭐ NETTOYAGE DU CACHE (inchangé)
  // ============================================================

  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of blobCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          blobCache.delete(key);
        }
      }

      if (blobCache.size > CACHE_MAX_SIZE) {
        const keys = Array.from(blobCache.keys());
        keys.slice(0, keys.length - CACHE_MAX_SIZE).forEach((key) => {
          blobCache.delete(key);
        });
      }
    }, 5000);
    return () => clearInterval(cleanup);
  }, []);

  // ============================================================
  // ⭐ FONCTIONS DE GESTION
  // ============================================================

  const handleClick = (type) => {
    setActive(type === active ? "" : type);
  };

  const closeSnackbar = () => setSnackbarOpen(false);
  const closeModal = () => setModalOpen(false);

  // ============================================================
  // ⭐ FONCTION PRINCIPALE : POINTAGE
  // ============================================================

  const handleStartPointage = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setScanning(true);
    setStartingPointage(true);

    const wifiMacAddress = await getSystemWifiMac();
    console.log("Adresse MAC Wi-Fi du système :", wifiMacAddress);

    if (!wifiMacAddress) {
      setScanning(false);
      setStartingPointage(false);
      setModalType("error");
      setModalMessage(
        "Impossible de récupérer l'adresse MAC Wi-Fi du poste. Vérifiez que l'agent local est bien lancé."
      );
      setModalOpen(true);
      return;
    }

    if (!active) {
      setScanning(false);
      setStartingPointage(false);
      setSnackbarMessage("Veuillez choisir Entrée ou Sortie !");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    const typePointage = active === "logout" ? "sortie" : "entree";

    // Étape 1: Vérification MAC
    try {
      await authService.pointageStep1VerifyMac(wifiMacAddress, typePointage);
    } catch (macErr) {
      setScanning(false);
      setStartingPointage(false);
      setModalType("error");
      setModalMessage(macErr.message || "Ce poste n'est pas autorisé.");
      setModalOpen(true);
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
      const isMobile = window.innerWidth < 768;
      const landmarker = landmarkerRef.current;

      if (!landmarker) {
        throw new Error("Modèle facial non initialisé");
      }

      // ⚡ Détection du visage — sert à valider la présence + signature géométrique
      const result = landmarker.detectForVideo(video, nextTimestamp());
      const landmarks = result.faceLandmarks?.[0];

      if (!landmarks) {
        setStartingPointage(false);
        setSnackbarMessage("Aucun visage détecté.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        setScanning(false);
        return;
      }

      // ⚠️ Signature géométrique MediaPipe (128 valeurs), PAS un embedding
      // de reconnaissance. L'identification reste faite côté serveur.
      const descriptorArray = computeLandmarkSignature(landmarks);

      // ⚡ Capture et compression
      const blob = await captureOptimizedImage(webcamRef, isMobile ? 320 : 480, 0.65);

      if (!blob) {
        throw new Error("Impossible de capturer l'image");
      }

      let processedBlob = blob;
      if (blob.size > 180 * 1024) {
        processedBlob = await compressImageFast(blob, 150 * 1024);
      }

      setSendingToServer(true);

      // ==================== ÉTAPE 0 : ANTI-MASQUE ====================
      setProcessingStep(0);

      let coveringResult;
      try {
        coveringResult = await checkFaceCovering(processedBlob, wifiMacAddress, typePointage);
      } catch (coveringErr) {
        console.error("Erreur analyse anti-masque :", coveringErr);
        setSendingToServer(false);
        setProcessingStep(0);
        setModalType("error");
        setModalMessage(coveringErr.message || "Erreur anti-masque.");
        setModalOpen(true);
        return;
      }

      if (isFaceCovered(coveringResult)) {
        setSendingToServer(false);
        setProcessingStep(0);
        setModalType("error");
        setModalMessage("Visage masqué détecté. Retirez le masque/lunettes/Casquette...");
        setModalOpen(true);
        return;
      }

      // ==================== ÉTAPE 1 : ANTI-SPOOF ====================
      setProcessingStep(1);

      let antispoofResult;
      try {
        antispoofResult = await authService.pointageStep2Antispoof(
          processedBlob,
          wifiMacAddress,
          typePointage
        );
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Requête annulée");
          return;
        }
        setSendingToServer(false);
        setProcessingStep(0);
        setModalType("error");
        setModalMessage(err.message || "Erreur anti-spoof.");
        setModalOpen(true);
        return;
      }

      // ==================== ÉTAPE 2 : RECONNAISSANCE FACIALE ====================
      setProcessingStep(2);

      let recognitionResult;
      try {
        recognitionResult = await authService.pointageStep3Recognition(
          antispoofResult.temp_id,
          wifiMacAddress,
          typePointage
        );
        console.log("RecognitionResult =", recognitionResult);
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Requête annulée");
          return;
        }
        setSendingToServer(false);
        setProcessingStep(0);
        setModalType("error");
        setModalMessage(err.message || "Visage non reconnu.");
        setModalOpen(true);
        return;
      }

      // ==================== ÉTAPE 3 : ENREGISTREMENT ====================
      setProcessingStep(3);

      const isSortie = active === "logout";

      const response = await authService.pointageStep4Enregistrer(
        {
          role: recognitionResult.role,
          id_value: recognitionResult.id_value,
          emb: recognitionResult.emb,
          score_face: recognitionResult.score_face,
          second_score: recognitionResult.second_score,
          face_descriptor: descriptorArray,
          mac_address: wifiMacAddress,
          temp_id: recognitionResult.temp_id,
          type_pointage: typePointage,
        },
        isSortie
      );

      setSendingToServer(false);

      const data = await response.json();

      if (!response.ok) {
        setModalType("error");
        setModalMessage(data.error || "Erreur lors du pointage");
        const utterance = new SpeechSynthesisUtterance(data.error || "Erreur lors du pointage");
        utterance.lang = "fr-FR";
        speechSynthesis.speak(utterance);
      } else {
        setModalType("success");
        setModalMessage(data.message || "Pointage effectué avec succès !");
        if (data.speech) {
          const text = data.speech.replace(/(\d{1,2})h:?(\d{2})/g, "$1 heures $2");
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "fr-FR";
          speechSynthesis.speak(utterance);
        }
      }

      setModalOpen(true);
      fetchHistory();
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Requête annulée");
        return;
      }
      setSendingToServer(false);
      console.error("Erreur pointage :", err);
      setSnackbarMessage("Erreur de connexion avec le serveur.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setStartingPointage(false);
      setPointageStarted(false);
      setScanning(false);
      setProcessingStep(0);
      abortControllerRef.current = null;
    }
  };

  // ============================================================
  // ⭐ RETOUR DU HOOK (API publique identique)
  // ============================================================

  return {
    modelsLoaded,
    loadingModels,
    scanning,
    webcamReady,
    active,
    pointageStarted,
    startingPointage,
    sendingToServer,
    processingStep,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    modalOpen,
    modalMessage,
    modalType,
    canvasRef,
    webcamRef,
    history,
    historyLoading,
    handleClick,
    handleStartPointage,
    closeSnackbar,
    closeModal,
    setWebcamReady,
  };
};