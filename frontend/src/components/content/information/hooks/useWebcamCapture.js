// hooks/useWebcamCapture.js
import { useEffect, useRef, useState } from 'react';
import { dataURLtoFile } from '../utils/fileHelpers';
import { computeLandmarkSignature, getFaceLandmarker, landmarksToBox, nextTimestamp } from '../../../login/services/mediapipeService';

// ⚙️ Passe à true si <Webcam mirrored /> est utilisé
const MIRRORED = false;

/**
 * @param {boolean} modelsLoaded
 * @param {(payload: { imageSrc: string, imageFile: File, faceDescriptor: number[] }) => void} onCaptureSuccess
 * @param {(message: string) => void} onNoFaceDetected
 */
export function useWebcamCapture({ modelsLoaded, onCaptureSuccess, onNoFaceDetected }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  const [openWeb, setOpenWeb] = useState(false);
  const [webcamLoading, setWebcamLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Détecte quand le flux vidéo de la webcam est réellement prêt
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

  // Initialisation du FaceLandmarker (singleton partagé)
  useEffect(() => {
    let cancelled = false;

    getFaceLandmarker()
      .then((lm) => {
        if (!cancelled) landmarkerRef.current = lm;
      })
      .catch((err) => {
        console.error('❌ Erreur initialisation MediaPipe :', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Dessine en continu les rectangles de détection de visage sur le canvas overlay
  useEffect(() => {
    if (!modelsLoaded) return;

    const interval = setInterval(() => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || video.readyState !== 4 || !canvas || !landmarker) return;
      if (video.currentTime === lastVideoTimeRef.current) return;
      lastVideoTimeRef.current = video.currentTime;

      // Canvas calé sur les dimensions intrinsèques de la vidéo (comme avant)
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const result = landmarker.detectForVideo(video, nextTimestamp());

        (result.faceLandmarks || []).forEach((landmarks) => {
          let { x, y, width, height } = landmarksToBox(landmarks, canvas.width, canvas.height);
          if (MIRRORED) x = canvas.width - x - width;

          context.strokeStyle = 'white';
          context.lineWidth = 1;
          context.strokeRect(x, y, width, height);
        });
      } catch (err) {
        console.error('Erreur détection visages :', err);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [modelsLoaded, scanning]);

  const handleCapture = async () => {
    if (!webcamRef.current) return;
    setCapturing(true);

    const video = webcamRef.current.video;
    if (video.readyState !== 4) {
      setCapturing(false);
      return;
    }
    setWebcamLoading(true);

    const landmarker = landmarkerRef.current;
    if (!landmarker) {
      onNoFaceDetected?.('Modèle facial non initialisé.');
      setWebcamLoading(false);
      setCapturing(false);
      return;
    }

    let landmarks;
    try {
      const result = landmarker.detectForVideo(video, nextTimestamp());
      landmarks = result.faceLandmarks?.[0];
    } catch (err) {
      console.error('Erreur détection :', err);
    }

    if (!landmarks) {
      onNoFaceDetected?.('Aucun visage détecté.');
      setWebcamLoading(false);
      setCapturing(false);
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    const imageFile = dataURLtoFile(imageSrc, 'webcam.jpg');

    // ⚠️ Signature géométrique MediaPipe, PAS un embedding de reconnaissance.
    // Ne peut pas servir à identifier ni à matcher contre d'anciens descripteurs face-api.
    const faceDescriptor = computeLandmarkSignature(landmarks);

    onCaptureSuccess?.({ imageSrc, imageFile, faceDescriptor });

    setWebcamLoading(false);
    setOpenWeb(false);
    setCapturing(false);
  };

  return {
    webcamRef,
    canvasRef,
    openWeb,
    setOpenWeb,
    webcamLoading,
    capturing,
    webcamReady,
    scanning,
    setScanning,
    handleCapture,
  };
}