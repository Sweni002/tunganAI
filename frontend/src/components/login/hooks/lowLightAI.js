// src/pages/Login/hooks/lowLightAI.js
//
// Amélioration de luminosité par IA (Zero-DCE++) dans le navigateur
// Webcam → Canvas → ONNX Runtime Web → zero_dce++.onnx → Canvas amélioré

// Build WASM uniquement (sans WebGPU/JSEP) : plus léger, pas de .jsep.mjs
import * as ort from "onnxruntime-web/wasm";

// ============================================================
// CONFIGURATION
// ============================================================

const MODEL_URL = "/models/zero_dce++.onnx";

// Pas de wasmPaths : Vite sert les .wasm/.mjs directement depuis node_modules
// (voir optimizeDeps.exclude dans vite.config.js)
// Multi-thread uniquement si la page est cross-origin isolated
ort.env.wasm.numThreads = self.crossOriginIsolated
  ? Math.min(4, navigator.hardwareConcurrency || 2)
  : 1;

// null = modèle à taille dynamique (export Zero-DCE++ standard)
// { width: 512, height: 512 } si ton export ONNX a une taille fixe
const MODEL_INPUT_SIZE = null;

// Zero-DCE++ retourne (enhanced_image, curve_params) → on prend la sortie 0
const OUTPUT_INDEX = 0;

export const LOW_LIGHT_DEFAULTS = {
  threshold: 95, // luminance moyenne (0-255) sous laquelle l'IA s'active
  blend: 0.7, // part de l'image IA (reste naturel pour l'anti-spoof)
};

// ============================================================
// SESSION ONNX (chargée une seule fois)
// ============================================================

let sessionPromise = null;

const getSession = () => {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    }).catch((err) => {
      console.error("[lowLightAI] Chargement du modèle impossible :", err);
      sessionPromise = null;
      return null;
    });
  }
  return sessionPromise;
};

export const preloadLowLightAI = () => getSession();

// ============================================================
// UTILITAIRES
// ============================================================

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

// Luminance moyenne (échantillonnage 1 pixel sur 4 → rapide)
export const measureLuminance = (data) => {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 16) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    count++;
  }
  return count ? sum / count : 0;
};

const resizeCanvas = (source, width, height) => {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return c;
};

// RGBA → Float32 NCHW [0,1]
const toTensor = (data, width, height) => {
  const n = width * height;
  const input = new Float32Array(3 * n);
  for (let i = 0, p = 0; p < n; i += 4, p++) {
    input[p] = data[i] / 255;
    input[n + p] = data[i + 1] / 255;
    input[2 * n + p] = data[i + 2] / 255;
  }
  return new ort.Tensor("float32", input, [1, 3, height, width]);
};

// ============================================================
// AMÉLIORATION PRINCIPALE
// ============================================================

/**
 * Éclaircit le canvas avec Zero-DCE++ seulement s'il est sombre.
 * Modifie le canvas en place.
 * @returns {Promise<{canvas, enhanced, lumBefore, lumAfter, ms}>}
 */
export async function enhanceLowLight(canvas, options = {}) {
  const { threshold, blend } = { ...LOW_LIGHT_DEFAULTS, ...options };
  const t0 = performance.now();

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { width: w, height: h } = canvas;
  const original = ctx.getImageData(0, 0, w, h);
  const lumBefore = measureLuminance(original.data);

  const skip = (reason) => ({
    canvas,
    enhanced: false,
    lumBefore,
    lumAfter: lumBefore,
    ms: performance.now() - t0,
    reason,
  });

  if (lumBefore >= threshold) return skip("assez_clair");

  const session = await getSession();
  if (!session) return skip("modele_indisponible");

  try {
    // Taille d'entrée du modèle
    const mw = MODEL_INPUT_SIZE?.width ?? w;
    const mh = MODEL_INPUT_SIZE?.height ?? h;
    const src = mw === w && mh === h ? canvas : resizeCanvas(canvas, mw, mh);
    const srcData =
      src === canvas
        ? original.data
        : src.getContext("2d").getImageData(0, 0, mw, mh).data;

    const feeds = { [session.inputNames[0]]: toTensor(srcData, mw, mh) };
    const results = await session.run(feeds);
    const out = results[session.outputNames[OUTPUT_INDEX]].data;

    // Sortie NCHW → canvas à la taille du modèle
    const n = mw * mh;
    let aiData;
    if (mw === w && mh === h) {
      aiData = new Uint8ClampedArray(w * h * 4);
      for (let i = 0, p = 0; p < n; i += 4, p++) {
        aiData[i] = out[p] * 255;
        aiData[i + 1] = out[n + p] * 255;
        aiData[i + 2] = out[2 * n + p] * 255;
        aiData[i + 3] = 255;
      }
    } else {
      const tmp = document.createElement("canvas");
      tmp.width = mw;
      tmp.height = mh;
      const tctx = tmp.getContext("2d", { willReadFrequently: true });
      const tImg = tctx.createImageData(mw, mh);
      for (let i = 0, p = 0; p < n; i += 4, p++) {
        tImg.data[i] = out[p] * 255;
        tImg.data[i + 1] = out[n + p] * 255;
        tImg.data[i + 2] = out[2 * n + p] * 255;
        tImg.data[i + 3] = 255;
      }
      tctx.putImageData(tImg, 0, 0);
      aiData = resizeCanvas(tmp, w, h).getContext("2d").getImageData(0, 0, w, h).data;
    }

    // Mélange IA + original
    const d = original.data;
    const keep = 1 - blend;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = clamp255(d[i] * keep + aiData[i] * blend);
      d[i + 1] = clamp255(d[i + 1] * keep + aiData[i + 1] * blend);
      d[i + 2] = clamp255(d[i + 2] * keep + aiData[i + 2] * blend);
    }
    ctx.putImageData(original, 0, 0);

    return {
      canvas,
      enhanced: true,
      lumBefore,
      lumAfter: measureLuminance(d),
      ms: performance.now() - t0,
    };
  } catch (err) {
    console.error("[lowLightAI] Inférence échouée :", err);
    ctx.putImageData(original, 0, 0);
    return skip("erreur_inference");
  }
}