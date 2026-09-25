// src/pages/Login/hooks/useFacePointage.js

import { useState, useEffect, useRef, useCallback } from "react";
import { authService } from "../services/authService";
import { checkFaceCovering, isFaceCovered } from "../services/roboflowService";
import { checkMacAgent, openMacAgentInstaller } from "./macAgentService";
import {
  getFaceLandmarker,
  nextTimestamp,
  landmarksToBox,
  computeLandmarkSignature,
} from "./mediapipeService";
import { getCachedMacAddress } from "./macCacheService";
import { enhanceLowLight, preloadLowLightAI } from "../hooks/lowLightAI";

// Passe à true si <Webcam mirrored /> est utilisé
const MIRRORED = false;

// Active / désactive l'amélioration IA de la luminosité
const LOW_LIGHT_AI_ENABLED = true;

// ============================================================
// POSTE : vérifié par le backend UNE FOIS PAR JOUR,
// jeton gardé dans le navigateur jusqu'à minuit
// ============================================================

const POSTE_STORAGE_KEY = "pointage_poste_v1";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const readStoredPoste = (mac) => {
  try {
    const raw = localStorage.getItem(POSTE_STORAGE_KEY);
    if (!raw) return null;
    const poste = JSON.parse(raw);
    if (!poste || poste.day !== todayStr() || poste.mac !== mac || !poste.token) {
      return null;
    }
    return poste;
  } catch {
    return null;
  }
};

const storePoste = (poste) => {
  try {
    localStorage.setItem(POSTE_STORAGE_KEY, JSON.stringify(poste));
  } catch {
    /* stockage indisponible : on garde seulement la mémoire */
  }
};

const clearStoredPoste = () => {
  try {
    localStorage.removeItem(POSTE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

// ============================================================
// FONCTIONS UTILITAIRES : CAPTURE
// ============================================================

// Webcam → Canvas (réduction de qualité haute, sans aliasing)
const captureFrameCanvas = (webcamRef, maxWidth = 480) => {
  const video = webcamRef.current?.video;
  if (!video || video.readyState !== 4) return null;

  let width = video.videoWidth;
  let height = video.videoHeight;

  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = Math.round(maxWidth);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(video, 0, 0, width, height);

  return canvas;
};

// Canvas → Blob JPEG
const canvasToBlob = (canvas, quality = 0.85) =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });

const compressImageFast = async (blob, targetSize = 150 * 1024) => {
  if (blob.size <= targetSize) return blob;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

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

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const quality = currentSize > 500 * 1024 ? 0.7 : 0.8;
      canvas.toBlob(
        (compressed) => {
          URL.revokeObjectURL(url);
          resolve(compressed || blob);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    img.src = url;
  });
};

// Cache pour les blobs
const blobCache = new Map();
const CACHE_MAX_SIZE = 3;
const CACHE_TTL = 5000;

// ============================================================
// HOOK PRINCIPAL
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
  const [macAgentInstalled, setMacAgentInstalled] = useState(false);
  const [macAgentInstalling, setMacAgentInstalling] = useState(false);
  const [macAgentChecking, setMacAgentChecking] = useState(true);

  // Références
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const abortControllerRef = useRef(null);
  const landmarkerRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  // Poste vérifié : { mac, token, idserv, serviceNom, day }
  const posteRef = useRef(null);
  const posteVerifyingRef = useRef(null);

  // ============================================================
  // VÉRIFICATION DU POSTE (UNE FOIS PAR JOUR)
  // ============================================================

  const verifyPoste = useCallback(async () => {
    // 1) En mémoire et valable aujourd'hui → instantané
    const cached = posteRef.current;
    if (cached && cached.day === todayStr()) return cached;

    // 2) Vérification déjà en cours → on l'attend
    if (posteVerifyingRef.current) return posteVerifyingRef.current;

    posteVerifyingRef.current = (async () => {
      try {
        const mac = await getCachedMacAddress();
        if (!mac) {
          throw new Error(
            "Impossible de récupérer l'adresse MAC Wi-Fi du poste. Vérifiez que l'agent local est bien lancé."
          );
        }

        // 3) Déjà vérifié aujourd'hui (même après rechargement de la page)
        const stored = readStoredPoste(mac);
        if (stored) {
          posteRef.current = stored;
          return stored;
        }

        // 4) Première vérification de la journée (seul appel backend)
        const data = await authService.pointageStep1VerifyMac(mac);

        const poste = {
          mac,
          token: data.poste_token,
          idserv: data.idserv,
          serviceNom: data.service_nom,
          day: data.day || todayStr(),
        };

        posteRef.current = poste;
        storePoste(poste);
        return poste;
      } catch (err) {
        posteRef.current = null;
        clearStoredPoste();
        throw err;
      } finally {
        posteVerifyingRef.current = null;
      }
    })();

    return posteVerifyingRef.current;
  }, []);

  const resetPoste = () => {
    posteRef.current = null;
    clearStoredPoste();
  };

  // ============================================================
  // INITIALISATION DU FACELANDMARKER
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
      } catch (err) {
        if (cancelled) return;
        console.error("Erreur initialisation MediaPipe :", err);
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
    };
  }, []);

  // ============================================================
  // PRÉCHARGEMENT DU MODÈLE IA (ZERO-DCE++)
  // ============================================================

  useEffect(() => {
    if (!LOW_LIGHT_AI_ENABLED || !webcamReady) return;
    preloadLowLightAI();
  }, [webcamReady]);

  // ============================================================
  // HISTORIQUE DES POINTAGES
  // ============================================================

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const wifiMacAddress = await getCachedMacAddress();
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
  // DÉTECTION FACIALE EN CONTINU (AFFICHAGE UNIQUEMENT)
  // ============================================================

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
  // VÉRIFICATION DE LA WEBCAM
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
  // NETTOYAGE DU CACHE
  // ============================================================

  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of blobCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) blobCache.delete(key);
      }

      if (blobCache.size > CACHE_MAX_SIZE) {
        const keys = Array.from(blobCache.keys());
        keys.slice(0, keys.length - CACHE_MAX_SIZE).forEach((key) => blobCache.delete(key));
      }
    }, 5000);
    return () => clearInterval(cleanup);
  }, []);

  // ============================================================
  // AGENT MAC
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const verifyMacAgent = async () => {
      const result = await checkMacAgent();
      if (cancelled) return;

      if (result.mobile) {
        setMacAgentInstalled(true);
        setMacAgentChecking(false);
        return;
      }

      setMacAgentInstalled(result.running);
      setMacAgentChecking(false);
    };

    verifyMacAgent();

    return () => {
      cancelled = true;
    };
  }, []);

  // Poste vérifié en arrière-plan dès que l'agent est prêt
  // (lu depuis le navigateur s'il a déjà été vérifié aujourd'hui)
  useEffect(() => {
    if (!macAgentInstalled) return;
    verifyPoste().catch((err) => {
      console.warn("Poste non vérifié au chargement :", err.message);
    });
  }, [macAgentInstalled, verifyPoste]);

  // ============================================================
  // FONCTIONS DE GESTION
  // ============================================================

  const handleClick = (type) => {
    setActive(type === active ? "" : type);
  };

  const closeSnackbar = () => setSnackbarOpen(false);
  const closeModal = () => setModalOpen(false);

  const showErrorModal = (message) => {
    setModalType("error");
    setModalMessage(message);
    setModalOpen(true);
  };

  // ============================================================
  // FONCTION PRINCIPALE : POINTAGE
  // Webcam → Canvas → Zero-DCE++ → Détection → Anti-spoof → Reconnaissance
  // ============================================================

  const handleStartPointage = async () => {
    if (!active) {
      setSnackbarMessage("Veuillez choisir Entrée ou Sortie !");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setScanning(true);
    setStartingPointage(true);

    const typePointage = active === "logout" ? "sortie" : "entree";
    const isSortie = active === "logout";

    try {
      // Poste : jeton du jour (aucun appel backend s'il existe déjà)
      let poste;
      try {
        poste = await verifyPoste();
      } catch (err) {
        showErrorModal(err.message || "Ce poste n'est pas autorisé.");
        return;
      }

      const wifiMacAddress = poste.mac;

      setPointageStarted(true);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const isMobile = window.innerWidth < 768;
      const landmarker = landmarkerRef.current;
      if (!landmarker) throw new Error("Modèle facial non initialisé");

      // ==================== CAPTURE : WEBCAM → CANVAS ====================
      const frameCanvas = captureFrameCanvas(webcamRef, isMobile ? 360 : 480);
      if (!frameCanvas) throw new Error("Impossible de capturer l'image");

      // ==================== IA : ZERO-DCE++ (si image sombre) ====================
      let workCanvas = frameCanvas;
      if (LOW_LIGHT_AI_ENABLED) {
        const ai = await enhanceLowLight(frameCanvas);
        workCanvas = ai.canvas;
        if (import.meta.env?.DEV) {
          console.debug(
            `[lowLightAI] ${ai.enhanced ? "appliqué" : `ignoré (${ai.reason})`} ` +
              `lum ${ai.lumBefore.toFixed(0)} → ${ai.lumAfter.toFixed(0)} en ${ai.ms.toFixed(0)} ms`
          );
        }
      }

      // ==================== DÉTECTION SUR L'IMAGE AMÉLIORÉE ====================
      let result = landmarker.detectForVideo(workCanvas, nextTimestamp());
      let landmarks = result.faceLandmarks?.[0];

      // Repli : détection sur la vidéo brute
      if (!landmarks) {
        result = landmarker.detectForVideo(video, nextTimestamp());
        landmarks = result.faceLandmarks?.[0];
      }

      if (!landmarks) {
        setSnackbarMessage("Aucun visage détecté.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        return;
      }

      const descriptorArray = computeLandmarkSignature(landmarks);

      // ==================== CANVAS → JPEG ====================
      const blob = await canvasToBlob(workCanvas, isMobile ? 0.8 : 0.85);
      if (!blob) throw new Error("Impossible de capturer l'image");

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
        showErrorModal(coveringErr.message || "Erreur anti-masque.");
        return;
      }

      if (isFaceCovered(coveringResult)) {
        showErrorModal("Visage masqué détecté. Retirez le masque/lunettes/Casquette...");
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
        if (err.name === "AbortError") return;
        showErrorModal(err.message || "Erreur anti-spoof.");
        return;
      }

      // ==================== ÉTAPE 2 : RECONNAISSANCE ====================
      setProcessingStep(2);

      let recognitionResult;
      try {
        recognitionResult = await authService.pointageStep3Recognition(
          antispoofResult.temp_id,
          wifiMacAddress,
          typePointage,
          poste.token
        );
      } catch (err) {
        if (err.name === "AbortError") return;
        // Jeton expiré (nouveau jour) ou invalide : revérification au prochain essai
        if (err.code === "poste_token_invalid") resetPoste();
        showErrorModal(err.message || "Visage non reconnu.");
        return;
      }

      // ==================== ÉTAPE 3 : ENREGISTREMENT ====================
      setProcessingStep(3);

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
      if (err.name === "AbortError") return;
      console.error("Erreur pointage :", err);
      setSnackbarMessage("Erreur de connexion avec le serveur.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSendingToServer(false);
      setStartingPointage(false);
      setPointageStarted(false);
      setScanning(false);
      setProcessingStep(0);
      abortControllerRef.current = null;
    }
  };

  const handleInstallMacAgent = async () => {
    if (macAgentInstalling) return;

    try {
      setMacAgentInstalling(true);
      await openMacAgentInstaller();
    } catch (error) {
      console.error("[mac-agent] Erreur installation :", error);
      setSnackbarMessage("Impossible de télécharger l'agent. Vérifiez votre connexion.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setMacAgentInstalling(false);
    }
  };

  // ============================================================
  // RETOUR DU HOOK (API publique identique)
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
    macAgentInstalled,
    macAgentChecking,
    openMacAgentInstaller,
    macAgentInstalling,
    handleInstallMacAgent,
  };
};