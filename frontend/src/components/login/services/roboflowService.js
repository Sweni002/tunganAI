// src/pages/Login/services/roboflowService.js

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Envoie une image (Blob JPEG) à ton backend Flask, qui relaie la requête
 * vers Roboflow (clé API gardée côté serveur, pas de CORS côté front
 * puisqu'on appelle ton propre domaine déjà autorisé).
 *
 * En cas d'échec HTTP ou réseau, lève une Error dont le message est
 * directement exploitable pour affichage (dans le modal par ex.).
 */
export const checkFaceCovering = async (blob) => {
  const formData = new FormData();
  formData.append("image", blob, "capture.jpg");

  let response;
  try {
    response = await fetch(`${API_URL}/api/pointage/check-face-covering`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
  } catch (networkErr) {
    console.error("[check-face-covering] Requête réseau échouée :", networkErr);
    throw new Error("Impossible de contacter le service d'analyse anti-masque.");
  }

  const text = await response.text().catch(() => "");
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

    console.log("[check-face-covering] Réponse backend :", data);


  if (!response.ok) {
    console.error(`[check-face-covering] HTTP ${response.status} :`, text);
    const backendMessage =
      (data && (data.error || data.detail)) ||
      `Erreur ${response.status} lors de l'analyse anti-masque.`;
    throw new Error(backendMessage);
  }

  return data;
};

/**
 * Interprète la réponse Roboflow pour savoir si un masque/cache est détecté.
 * Défensif : gère à la fois un format "classification" (top/confidence)
 * et un format "object-detection" (predictions[]).
 */
export const isFaceCovered = (data, threshold = 0.5) => {
  if (!data) return false;

  // Format classification : { top: "covered", confidence: 0.87, predictions: [...] }
  if (typeof data.top === "string") {
    const label = data.top.toLowerCase();
    const conf = data.confidence ?? 1;
    return conf >= threshold && /cover|mask|masque/.test(label);
  }

  // 🔥 Format workflow Roboflow (run_workflow) : { predictions: { image: {...}, predictions: [...] } }
  const nestedPredictions = data?.predictions?.predictions;
  if (Array.isArray(nestedPredictions) && nestedPredictions.length > 0) {
    const coveringClasses = ["mask", "helmet", "hat", "cap"];
    return nestedPredictions.some((p) => {
      const cls = (p.class || "").trim().toLowerCase();
      const conf = p.confidence ?? 1;
      return conf >= threshold && coveringClasses.includes(cls);
    });
  }

  // Format object-detection à plat (au cas où un autre endpoint renvoie ce format) :
  // { predictions: [{ class: "face_covering", confidence: 0.9 }, ...] }
  if (Array.isArray(data.predictions) && data.predictions.length > 0) {
    return data.predictions.some(
      (p) =>
        (p.confidence ?? 1) >= threshold &&
        /cover|mask|masque/.test((p.class || "").toLowerCase())
    );
  }

  return false;
};

/**
 * Formate la réponse brute de Roboflow en texte lisible pour affichage
 * dans le modal (succès ou détails de détection).
 */
export const formatCoveringResult = (data) => {
  if (!data) return "Analyse terminée.";

  const predictions = data?.predictions?.predictions;
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return "Aucune anomalie détectée.";
  }

  return predictions
    .map((p) => {
      const cls = (p.class || "").trim();
      const confPct = p.confidence != null ? ` (${Math.round(p.confidence * 100)}%)` : "";
      return `${cls}${confPct}`;
    })
    .join(", ");
};