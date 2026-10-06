const API_URL = import.meta.env.VITE_API_URL;

export const autorisationService = {
  async fetchWithAuth(url, options = {}, navigate) {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });

    if (response.status === 401) {
      navigate("/login");
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Erreur inconnue");
    }

    return response.json();
  },

  async getAutorisations(idserv) {
    return this.fetchWithAuth(`${API_URL}/api/autorisations/${idserv}`);
  },

  async getAutorisationsBetweenDates(idserv, start, end) {
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations/between_dates/${idserv}?start=${start}&end=${end}`
    );
  },

  // Une page d'autorisations d'un service, filtrée côté serveur.
  // params : { page, per_page, q, date, start, end } (valeurs vides ignorées)
  async getAutorisationsPage(idserv, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
    });
    return this.fetchWithAuth(`${API_URL}/api/autorisations/${idserv}?${query.toString()}`);
  },

  async getAutorisationsByDate(date, idserv) {
    const extra = idserv ? `&idserv=${idserv}` : "";
    return this.fetchWithAuth(
      `${API_URL}/api/autorisations/par-date?date=${date}${extra}`
    );
  },

  async deleteAutorisation(id) {
    return this.fetchWithAuth(`${API_URL}/api/autorisations/${id}`, {
      method: "DELETE",
    });
  },

  async getDivisions(idserv) {
    return this.fetchWithAuth(
      `${API_URL}/api/divisions/with_count?idserv=${idserv}`
    );
  },
};