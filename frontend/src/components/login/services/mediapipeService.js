// src/services/mediapipeService.js
//
// Remplace face-api.js par @mediapipe/tasks-vision (FaceLandmarker).
//
// Installation :
//   npm install @mediapipe/tasks-vision
//
// Assets à placer dans /public :
//   public/models/mediapipe/wasm/*          <- cp -r node_modules/@mediapipe/tasks-vision/wasm
//   public/models/mediapipe/face_landmarker.task
//     https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

const WASM_PATH = "/models/mediapipe/wasm";
const MODEL_PATH = "/models/mediapipe/face_landmarker.task";

// Deux instances distinctes : MediaPipe ne permet pas d'alterner
// VIDEO <-> IMAGE sur un même landmarker sans casser le suivi temporel.
const instances = { VIDEO: null, IMAGE: null };
const delegates = { VIDEO: null, IMAGE: null };

const createLandmarker = async (runningMode, delegate, numFaces) => {
  const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_PATH,
      delegate, // "GPU" | "CPU"
    },
    runningMode,
    numFaces,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
};

const getLandmarker = (runningMode, numFaces) => {
  if (!instances[runningMode]) {
    instances[runningMode] = (async () => {
      try {
        const lm = await createLandmarker(runningMode, "GPU", numFaces);
        delegates[runningMode] = "GPU";
        console.log(`✅ FaceLandmarker ${runningMode} initialisé (GPU)`);
        return lm;
      } catch (gpuErr) {
        console.warn(`⚠️ GPU indisponible pour ${runningMode}, bascule CPU :`, gpuErr);
        const lm = await createLandmarker(runningMode, "CPU", numFaces);
        delegates[runningMode] = "CPU";
        console.log(`✅ FaceLandmarker ${runningMode} initialisé (CPU)`);
        return lm;
      }
    })().catch((err) => {
      instances[runningMode] = null; // permet un retry
      throw err;
    });
  }
  return instances[runningMode];
};

/** Landmarker pour flux vidéo temps réel (detectForVideo). */
export const getFaceLandmarker = () => getLandmarker("VIDEO", 5);

/** Landmarker pour images statiques : <img>, <canvas>, ImageBitmap (detect). */
export const getImageFaceLandmarker = () => getLandmarker("IMAGE", 1);

export const getActiveDelegate = (runningMode = "VIDEO") => delegates[runningMode];

export const closeFaceLandmarkers = async () => {
  for (const mode of Object.keys(instances)) {
    if (!instances[mode]) continue;
    try {
      const lm = await instances[mode];
      lm.close();
    } catch {
      /* noop */
    }
    instances[mode] = null;
    delegates[mode] = null;
  }
};

// ============================================================
// ⭐ TIMESTAMPS MONOTONES
// detectForVideo() lève une exception si le timestamp n'est pas
// strictement croissant. Ce générateur global l'évite partout.
// ============================================================

let lastTs = 0;
export const nextTimestamp = () => {
  const t = Math.max(performance.now(), lastTs + 1);
  lastTs = t;
  return t;
};

// ============================================================
// ⭐ HELPERS GÉOMÉTRIE
// ============================================================

/** Convertit des landmarks normalisés (0..1) en boîte englobante en pixels. */
export const landmarksToBox = (landmarks, displayWidth, displayHeight, padding = 0.08) => {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;

  for (const p of landmarks) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const padX = (maxX - minX) * padding;
  const padY = (maxY - minY) * padding;

  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(1, maxX + padX);
  maxY = Math.min(1, maxY + padY);

  return {
    x: minX * displayWidth,
    y: minY * displayHeight,
    width: (maxX - minX) * displayWidth,
    height: (maxY - minY) * displayHeight,
  };
};

// Indices canoniques MediaPipe (478 points)
const RIGHT_EYE_OUTER = 33;
const LEFT_EYE_OUTER = 263;
const SIGNATURE_POINTS = 64; // -> vecteur de 128 valeurs (x, y)

/**
 * ⚠️ CE N'EST PAS UN EMBEDDING DE RECONNAISSANCE FACIALE.
 *
 * MediaPipe ne fournit aucun équivalent au descripteur 128-D de
 * face-api.js (faceRecognitionNet). Cette fonction produit une
 * *signature géométrique* : landmarks sous-échantillonnés, alignés
 * sur l'axe des yeux, centrés et normalisés en échelle.
 *
 * Utile comme empreinte de pose / contrôle d'intégrité, PAS pour
 * identifier quelqu'un ni comparer à d'anciens descripteurs face-api.
 */
export const computeLandmarkSignature = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return [];

  const stride = Math.max(1, Math.floor(landmarks.length / SIGNATURE_POINTS));
  const pts = [];
  for (let i = 0; pts.length < SIGNATURE_POINTS && i < landmarks.length; i += stride) {
    pts.push(landmarks[i]);
  }

  // Alignement rotationnel sur l'axe inter-oculaire
  const a = landmarks[RIGHT_EYE_OUTER] || pts[0];
  const b = landmarks[LEFT_EYE_OUTER] || pts[pts.length - 1];
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);

  // Centrage
  let cx = 0, cy = 0;
  for (const p of pts) { cx += p.x; cy += p.y; }
  cx /= pts.length;
  cy /= pts.length;

  const rotated = pts.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
  });

  // Normalisation d'échelle (RMS)
  let acc = 0;
  for (const p of rotated) acc += p.x * p.x + p.y * p.y;
  const rms = Math.sqrt(acc / rotated.length) || 1e-6;

  const out = [];
  for (const p of rotated) {
    out.push(p.x / rms, p.y / rms);
  }
  return out;
};

/**
 * Construit un objet de détection dont la forme reste proche de celle
 * de face-api.js, pour limiter les modifications côté consommateurs :
 *   detection.descriptor      (Array, ex-Float32Array)
 *   detection.box             { x, y, width, height } en pixels
 *   detection.detection.box   idem (ancien accès imbriqué)
 *   detection.landmarks       landmarks bruts MediaPipe (478 points)
 */
export const toDetectionResult = (landmarks, width, height) => {
  if (!landmarks) return null;
  const box = landmarksToBox(landmarks, width, height);
  return {
    landmarks,
    box,
    detection: { box },
    descriptor: computeLandmarkSignature(landmarks),
  };
};