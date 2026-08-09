// Export de API_URL pour qu'il soit accessible depuis d'autres fichiers
export const API_URL = import.meta.env.VITE_API_URL;

// Ou si vous préférez une exportation par défaut avec API_URL inclus
// export default API_URL;

export const autorisationService = {
  /**
   * Effectue une requête fetch avec gestion d'authentification
   * @param {string} url - L'URL de la requête
   * @param {object} options - Les options de fetch
   * @param {function} navigate - La fonction navigate de react-router
   * @returns {Promise<any>} - La réponse JSON
   */
  async fetchWithAuth(url, options = {}, navigate) {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });

    if (response.status === 401) {
      if (navigate) {
        navigate("/login");
      }
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Erreur inconnue");
    }

    return response.json();
  },

  // ==================== AUTORISATIONS STANDARD ====================

  /**
   * Récupère toutes les autorisations d'un service
   * @param {number|string} idserv - L'ID du service
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async getAutorisations(idserv, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations/${idserv}`,
      {},
      navigate
    );
  },

  /**
   * Récupère les autorisations entre deux dates
   * @param {number|string} idserv - L'ID du service
   * @param {string} start - Date de début (YYYY-MM-DD)
   * @param {string} end - Date de fin (YYYY-MM-DD)
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async getAutorisationsBetweenDates(idserv, start, end, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations/between_dates/${idserv}?start=${start}&end=${end}`,
      {},
      navigate
    );
  },

  /**
   * Récupère les autorisations par date
   * @param {string} date - La date (YYYY-MM-DD)
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async getAutorisationsByDate(date, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations/par-date?date=${date}`,
      {},
      navigate
    );
  },

  /**
   * Crée une nouvelle autorisation standard
   * @param {object} data - Les données de l'autorisation
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async createAutorisation(data, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      navigate
    );
  },

  /**
   * Modifie une autorisation standard
   * @param {number|string} id - L'ID de l'autorisation
   * @param {object} data - Les données à modifier
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async updateAutorisation(id, data, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      navigate
    );
  },

  /**
   * Supprime une autorisation standard
   * @param {number|string} id - L'ID de l'autorisation
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async deleteAutorisation(id, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations/${id}`,
      {
        method: "DELETE",
      },
      navigate
    );
  },

  // ==================== AUTORISATIONS SPECIALES (Sortie) ====================

  /**
   * Récupère toutes les autorisations spéciales d'un service
   * @param {number|string} idserv - L'ID du service
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async getAutorisationsSpeciales(idserv, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations_speciales/${idserv}`,
      {},
      navigate
    );
  },

  /**
   * Récupère les autorisations spéciales entre deux dates
   * @param {number|string} idserv - L'ID du service
   * @param {string} start - Date de début (YYYY-MM-DD)
   * @param {string} end - Date de fin (YYYY-MM-DD)
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async getAutorisationsSpecialesBetweenDates(idserv, start, end, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations_speciales/between_dates/${idserv}?start=${start}&end=${end}`,
      {},
      navigate
    );
  },

  /**
   * Récupère les autorisations spéciales par date
   * @param {number|string} idserv - L'ID du service
   * @param {string} date - La date (YYYY-MM-DD)
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async getAutorisationsSpecialesByDate(idserv, date, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations_speciales/par-date/${idserv}?date=${date}`,
      {},
      navigate
    );
  },

  /**
   * Crée une nouvelle autorisation spéciale
   * @param {object} data - Les données de l'autorisation spéciale
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async createAutorisationSpeciale(data, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations_speciales/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      navigate
    );
  },

  /**
   * Supprime une autorisation spéciale
   * @param {number|string} id - L'ID de l'autorisation spéciale
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async deleteAutorisationSpeciale(id, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations_speciales/${id}`,
      {
        method: "DELETE",
      },
      navigate
    );
  },

  // ==================== DIVISIONS ====================

  /**
   * Récupère les divisions d'un service
   * @param {number|string} idserv - L'ID du service
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async getDivisions(idserv, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/divisions/with_count?idserv=${idserv}`,
      {},
      navigate
    );
  },

  // ==================== PERSONNELS ====================

  /**
   * Récupère les personnels d'un service
   * @param {number|string} idserv - L'ID du service
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async getPersonnels(idserv, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/personnels/service/${idserv}`,
      {},
      navigate
    );
  },

  /**
   * Récupère un personnel par son ID
   * @param {number|string} idpers - L'ID du personnel
   * @param {function} navigate - Fonction navigate
   * @returns {Promise<any>}
   */
  async getPersonnelById(idpers, navigate) {
    return this.fetchWithAuth(
      `${API_URL}/api/personnels/${idpers}`,
      {},
      navigate
    );
  },

  // ==================== UTILITAIRES ====================

  /**
   * Formate une date pour l'API
   * @param {Date|string} date - La date à formater
   * @returns {string} - La date au format YYYY-MM-DD
   */
  formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  },

  /**
   * Vérifie si une date est valide
   * @param {Date|string} date - La date à vérifier
   * @returns {boolean} - True si la date est valide
   */
  isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },

  /**
   * Construit un payload pour la création d'autorisation standard
   * @param {object} params - Les paramètres
   * @param {string|number} params.idpers - ID du personnel
   * @param {string} params.motif - Motif de l'autorisation
   * @param {string} params.nomtype - Nom du type d'autorisation
   * @param {Date|string} params.date_absence - Date d'absence
   * @param {string} params.demi_journee - Demi-journée (matin/apresmidi)
   * @returns {object} - Le payload formaté
   */
  buildAutorisationPayload({ idpers, motif, nomtype, date_absence, demi_journee }) {
    return {
      idpers: Number(idpers),
      motif: motif.trim(),
      nomtype: nomtype.trim(),
      date_absence: this.formatDate(date_absence),
      demi_journee: demi_journee || "journee",
    };
  },

  /**
   * Construit un payload pour la création d'autorisation spéciale
   * @param {object} params - Les paramètres
   * @param {string|number} params.idpers - ID du personnel
   * @param {string} params.motif - Motif de l'autorisation
   * @param {string} params.type_autorisation - Type (sortie/retard)
   * @param {string} params.periode - Période (matin/apres_midi)
   * @param {Date|string} params.date_debut - Date de début
   * @param {Date|string} params.date_fin - Date de fin (optionnel)
   * @returns {object} - Le payload formaté
   */
  buildAutorisationSpecialePayload({ idpers, motif, type_autorisation, periode, date_debut, date_fin }) {
    const payload = {
      idpers: Number(idpers),
      motif: motif.trim(),
      type_autorisation: type_autorisation.trim().toLowerCase(),
      periode: periode.trim().toLowerCase(),
      date_debut: this.formatDate(date_debut),
    };

    if (date_fin) {
      payload.date_fin = this.formatDate(date_fin);
    }

    return payload;
  },

  /**
   * Formate la réponse de l'API pour les autorisations spéciales
   * @param {any} response - La réponse brute de l'API
   * @returns {Array} - Le tableau formaté des autorisations
   */
  formatSpecialesResponse(response) {
    if (response?.success && Array.isArray(response.data)) {
      return response.data;
    }
    return response || [];
  },
};

// Export par défaut pour faciliter l'import
export default autorisationService;