// src/pages/Responsable/services/responsableService.js

const API_URL = import.meta.env.VITE_API_URL;

export const responsableService = {
  // Créer un responsable
  createResponsable: async (formData) => {
    const response = await fetch(`${API_URL}/api/responsables/`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de l'ajout");
    }
    return data;
  },

  // Récupérer tous les services
  getServices: async () => {
    const response = await fetch(`${API_URL}/api/services/`, {
      credentials: "include",
    });
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Format de réponse invalide");
    }
    return data;
  },

  // Récupérer les divisions d'un service
  getDivisionsByService: async (serviceId) => {
    const response = await fetch(
      `${API_URL}/api/divisions/with_count_by_service?idserv=${serviceId}`,
      { credentials: "include" }
    );
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Format de réponse invalide");
    }
    return data;
  },
};