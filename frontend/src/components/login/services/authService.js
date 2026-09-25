// src/pages/Login/services/authService.js

const API_URL = import.meta.env.VITE_API_URL;

async function parseJsonSafe(response) {
  const text = await response.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

// Erreur enrichie : status HTTP + code métier renvoyé par le backend
function apiError(response, data, fallback) {
  const err = new Error((data && data.error) || fallback);
  err.status = response.status;
  err.code = data && data.code;
  return err;
}

export const authService = {
  // Connexion
  login: async (matricule, password) => {
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ matricule, mot_de_passe: password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erreur de connexion");
    }

    return data;
  },

  // ==================== MÉTRIQUES DE PERFORMANCE ====================

  getRecentPerformanceMetrics: async (macAddress) => {
    const url = macAddress
      ? `${API_URL}/api/pointage/metrics/recent-performance?mac=${encodeURIComponent(macAddress)}`
      : `${API_URL}/api/pointage/metrics/recent-performance`;

    const response = await fetch(url);
    const data = await parseJsonSafe(response);

    if (!response.ok) {
      throw apiError(response, data, "Impossible de récupérer les métriques.");
    }

    return data;
  },

  getFaceDescriptors: async (macAddress) => {
    const url = macAddress
      ? `${API_URL}/api/personnels/faceapi-descriptors?mac_address=${encodeURIComponent(macAddress)}`
      : `${API_URL}/api/personnels/faceapi-descriptors`;

    const response = await fetch(url, { credentials: "include" });
    return response.json();
  },

  // Anciennes routes en un seul appel (conservées pour compat)
  pointageEntree: async (formData) => {
    return fetch(`${API_URL}/api/pointage/facial_client`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
  },

  pointageSortie: async (formData) => {
    return fetch(`${API_URL}/api/pointage/facial_client_sortie`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
  },

  // ==================== FLUX EN ÉTAPES ====================

  // Étape 1 : vérification du poste — appelée UNE FOIS au chargement de la page.
  // Renvoie { authorized, idserv, service_nom, poste_token, expires_in }
  pointageStep1VerifyMac: async (macAddress, typePointage) => {
    const response = await fetch(`${API_URL}/api/pointage/facial_client/step1-verify-mac`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ mac_address: macAddress, type_pointage: typePointage }),
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      throw apiError(response, data, "Ce poste n'est pas autorisé à effectuer un pointage.");
    }

    return data;
  },

  // Étape 2 : anti-spoof (+ embedding en parallèle côté serveur)
  pointageStep2Antispoof: async (blob, macAddress, typePointage) => {
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");
    if (macAddress) formData.append("mac_address", macAddress);
    if (typePointage) formData.append("type_pointage", typePointage);

    const response = await fetch(`${API_URL}/api/pointage/facial_client/step2-antispoof`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      throw apiError(response, data, "Erreur lors de la vérification anti-usurpation.");
    }

    return data; // { success, score, temp_id }
  },

  // Étape 3 : reconnaissance — le service est lu dans poste_token (pas de requête DB)
  pointageStep3Recognition: async (tempId, macAddress, typePointage, posteToken) => {
    const response = await fetch(`${API_URL}/api/pointage/facial_client/step3-recognition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        temp_id: tempId,
        mac_address: macAddress,
        type_pointage: typePointage,
        poste_token: posteToken,
      }),
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      throw apiError(response, data, "Visage non reconnu, veuillez réessayer.");
    }

    return data; // { role, id_value, emb, score_face, second_score, temp_id }
  },

  // Étape 4 : enregistrement (entrée OU sortie)
  pointageStep4Enregistrer: async (payload, isSortie) => {
    const url = isSortie
      ? `${API_URL}/api/pointage/facial_client_sortie/step4-enregistrer`
      : `${API_URL}/api/pointage/facial_client/step4-enregistrer`;

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
  },

  // ==================== HISTORIQUE ====================

  getFacialHistory: async (macAddress) => {
    const response = await fetch(
      `${API_URL}/api/clients/history?mac_address=${encodeURIComponent(macAddress)}`,
      { credentials: "include" }
    );

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      throw apiError(response, data, "Impossible de récupérer l'historique.");
    }

    return (data || []).map((entry) => ({
      ...entry,
      photo: entry.photo ? `${API_URL}${entry.photo}` : null,
    }));
  },
};