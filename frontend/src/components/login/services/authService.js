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

  // Récupère les temps des 15 derniers enregistrements réussis pour un poste.
  getRecentPerformanceMetrics: async (macAddress) => {
    const url = macAddress
      ? `${API_URL}/api/pointage/metrics/recent-performance?mac=${encodeURIComponent(macAddress)}`
      : `${API_URL}/api/pointage/metrics/recent-performance`;

    const response = await fetch(url);
    const data = await parseJsonSafe(response);

    if (!response.ok) {
      throw new Error((data && data.error) || "Impossible de récupérer les métriques.");
    }

    return data; // { macAddress, visualControl, identification, totalPointage, globalAverage }
  },

 // ⭐ MODIFICATION: Récupérer les descripteurs faciaux avec MAC
  getFaceDescriptors: async (macAddress) => {
    // Si MAC fournie, filtrer par service
    const url = macAddress 
      ? `${API_URL}/api/personnels/faceapi-descriptors?mac_address=${encodeURIComponent(macAddress)}`
      : `${API_URL}/api/personnels/faceapi-descriptors`;
    
    const response = await fetch(url, {
      credentials: "include",
    });
    const data = await response.json();
    return data;
  },

  // Pointage entrée (ancienne route en un seul appel — conservée pour compat)
  pointageEntree: async (formData) => {
    const response = await fetch(`${API_URL}/api/pointage/facial_client`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    return response;
  },

  // Pointage sortie (ancienne route en un seul appel — conservée pour compat)
  pointageSortie: async (formData) => {
    const response = await fetch(`${API_URL}/api/pointage/facial_client_sortie`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    return response;
  },

  // ==================== NOUVELLES ÉTAPES (4-step flow) ====================

  // Étape 2 : anti-spoof
  pointageStep2Antispoof: async (blob) => {
    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");

    const response = await fetch(`${API_URL}/api/pointage/facial_client/step2-antispoof`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      throw new Error((data && data.error) || "Erreur lors de la vérification anti-usurpation.");
    }

    return data; // { success, score, temp_id }
  },


  // Étape 3 : reconnaissance faciale
  pointageStep3Recognition: async (tempId, macAddress, typePointage) => {
    const response = await fetch(`${API_URL}/api/pointage/facial_client/step3-recognition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        temp_id: tempId,
        mac_address: macAddress,
        type_pointage: typePointage,
      }),
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      throw new Error((data && data.error) || "Visage non reconnu, veuillez réessayer.");
    }

    return data; // { role, id_value, emb, score_face, second_score, temp_id }
  },
  

  // Étape 4 : enregistrement du pointage (entrée OU sortie selon isSortie)
  pointageStep4Enregistrer: async (payload, isSortie) => {
    const url = isSortie
      ? `${API_URL}/api/pointage/facial_client_sortie/step4-enregistrer`
      : `${API_URL}/api/pointage/facial_client/step4-enregistrer`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    return response; // renvoyé brut, comme pointageEntree/pointageSortie d'origine
  },

    // ==================== HISTORIQUE DES TENTATIVES DE POINTAGE ====================

  // Récupère les 15 dernières tentatives de pointage pour un poste donné
  // (identifié par son adresse MAC Wi-Fi).
  getFacialHistory: async (macAddress) => {
    const response = await fetch(
      `${API_URL}/api/clients/history?mac_address=${encodeURIComponent(macAddress)}`,
      { credentials: "include" }
    );

    const data = await parseJsonSafe(response);
  console.log(data)
    if (!response.ok) {
      throw new Error((data && data.error) || "Impossible de récupérer l'historique.");
    }

    // Préfixe chaque URL photo relative avec API_URL pour que le composant
    // d'affichage puisse l'utiliser directement dans un <img src=...>
    // sans avoir à connaître l'URL du backend.
    return (data || []).map((entry) => ({
      ...entry,
      photo: entry.photo ? `${API_URL}${entry.photo}` : null,
    }));
},
// Étape 1 : vérification de l'adresse MAC (poste autorisé ?)
pointageStep1VerifyMac: async (macAddress, typePointage) => {
  const response = await fetch(`${API_URL}/api/pointage/facial_client/step1-verify-mac`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ mac_address: macAddress, type_pointage: typePointage }),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error((data && data.error) || "Ce poste n'est pas autorisé à effectuer un pointage.");
  }

  return data; // { authorized, idserv, service_nom }
},
};