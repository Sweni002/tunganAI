// src/pages/Responsable/hooks/useFaceDetection.js

import { useState, useEffect, useRef } from "react";
import { getFaceLandmarker, getImageFaceLandmarker, landmarksToBox, nextTimestamp, toDetectionResult } from "../../../login/services/mediapipeService";

// ⚙️ Passe à true si <Webcam mirrored /> est utilisé
const MIRRORED = false;

export const useFaceDetection = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const canvasRef = useRef(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);

  const videoLandmarkerRef = useRef(null);
  const imageLandmarkerRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Le landmarker IMAGE est chargé à la demande pour ne pas
        // doubler le coût d'initialisation sur les écrans qui ne
        // font que de la webcam.
        const videoLm = await getFaceLandmarker();
        if (cancelled) return;
        videoLandmarkerRef.current = videoLm;
        setModelsLoaded(true);
      } catch (error) {
        console.error("Erreur chargement modèles:", error);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Détection sur un flux vidéo. Retourne un objet compatible face-api. */
  const detectFace = async (video) => {
    const landmarker = videoLandmarkerRef.current;
    if (!modelsLoaded || !video || !landmarker) return null;
    if (video.readyState !== 4) return null;

    try {
      const result = landmarker.detectForVideo(video, nextTimestamp());
      const landmarks = result.faceLandmarks?.[0];
      return toDetectionResult(landmarks, video.videoWidth, video.videoHeight);
    } catch (err) {
      console.error("Erreur détection vidéo :", err);
      return null;
    }
  };

  /** Détection sur une image statique (<img>, <canvas>, ImageBitmap). */
  const detectFaceFromImage = async (imageElement) => {
    if (!modelsLoaded || !imageElement) return null;

    try {
      if (!imageLandmarkerRef.current) {
        imageLandmarkerRef.current = await getImageFaceLandmarker();
      }

      const result = imageLandmarkerRef.current.detect(imageElement);
      const landmarks = result.faceLandmarks?.[0];

      const width =
        imageElement.naturalWidth || imageElement.videoWidth || imageElement.width;
      const height =
        imageElement.naturalHeight || imageElement.videoHeight || imageElement.height;

      return toDetectionResult(landmarks, width, height);
    } catch (err) {
      console.error("Erreur détection image :", err);
      return null;
    }
  };

  /** Dessine les cadres de détection sur le canvas overlay. */
  const drawFaceBoxes = async (video, canvas) => {
    const landmarker = videoLandmarkerRef.current;
    if (!modelsLoaded || !video || !canvas || !landmarker) return;
    if (video.readyState !== 4) return;

    // Évite de réanalyser une frame déjà traitée
    if (video.currentTime === lastVideoTimeRef.current) return;
    lastVideoTimeRef.current = video.currentTime;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    try {
      const result = landmarker.detectForVideo(video, nextTimestamp());

      (result.faceLandmarks || []).forEach((landmarks) => {
        let { x, y, width, height } = landmarksToBox(landmarks, canvas.width, canvas.height);
        if (MIRRORED) x = canvas.width - x - width;

        context.strokeStyle = "white";
        context.lineWidth = 1;
        context.strokeRect(x, y, width, height);
      });
    } catch (err) {
      console.error("Erreur dessin détections :", err);
    }
  };

  return {
    modelsLoaded,
    canvasRef,
    faceDescriptor,
    setFaceDescriptor,
    detectFace,
    detectFaceFromImage,
    drawFaceBoxes,
  };
};