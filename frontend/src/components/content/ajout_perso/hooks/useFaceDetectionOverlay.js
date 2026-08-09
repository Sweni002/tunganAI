// src/components/content/ajout_perso/hooks/useFaceDetectionOverlay.js

import { useEffect, useRef } from "react";
import { getFaceLandmarker, landmarksToBox, nextTimestamp } from "../../../login/services/mediapipeService";
// ⚙️ Passe à true si <Webcam mirrored /> est utilisé
const MIRRORED = false;

export function useFaceDetectionOverlay({ webcamRef, canvasRef, modelsLoaded, scanning }) {
  const landmarkerRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  useEffect(() => {
    if (!modelsLoaded) return;

    let animationId;
    let lastDraw = 0;
    const MIN_INTERVAL = 80; // ~12 fps, suffisant pour un cadre de visée

    const loop = () => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;

      if (!video || video.readyState !== 4 || !canvas) {
        animationId = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();
      const newFrame = video.currentTime !== lastVideoTimeRef.current;

      if (!scanning && newFrame && now - lastDraw >= MIN_INTERVAL) {
        lastDraw = now;
        lastVideoTimeRef.current = video.currentTime;

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        const landmarker = landmarkerRef.current;
        if (landmarker) {
          try {
            const result = landmarker.detectForVideo(video, nextTimestamp());

            (result.faceLandmarks || []).forEach((landmarks) => {
              let { x, y, width, height } = landmarksToBox(
                landmarks,
                canvas.width,
                canvas.height
              );
              if (MIRRORED) x = canvas.width - x - width;

              context.strokeStyle = "white";
              context.lineWidth = 1;
              context.strokeRect(x, y, width, height);
            });
          } catch (err) {
            console.error("Erreur détection visages :", err);
          }
        }
      }

      animationId = requestAnimationFrame(loop);
    };

    let cancelled = false;
    getFaceLandmarker()
      .then((lm) => {
        if (cancelled) return;
        landmarkerRef.current = lm;
      })
      .catch((err) => console.error("Erreur initialisation MediaPipe :", err));

    loop();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationId);
    };
  }, [webcamRef, canvasRef, modelsLoaded, scanning]);
}