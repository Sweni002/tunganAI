const API_URL = import.meta.env.VITE_API_URL;

async function requete(url, options = {}, navigate) {
  const response = await fetch(url, { credentials: "include", ...options });

  if (response.status === 401) {
    if (navigate) navigate("/login");
    throw new Error("Session expirée, veuillez vous reconnecter.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Erreur inconnue");
    error.details = data; // ex. liste « ignores » d'un ajout refusé
    error.status = response.status;
    throw error;
  }
  return data;
}

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const joursFeriesService = {
  /** Page de jours fériés du service : { data, total, page, per_page, resume } */
  liste(idserv, { page = 1, perPage = 10, q = "", periode = "" } = {}, navigate) {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (q) params.set("q", q);
    if (periode) params.set("periode", periode);
    return requete(`${API_URL}/api/jours_feries/${idserv}?${params.toString()}`, {}, navigate);
  },

  /** Ajoute un ou plusieurs jours (date_debut -> date_fin). */
  ajouter(payload, navigate) {
    return requete(`${API_URL}/api/jours_feries/`, json("POST", payload), navigate);
  },

  modifier(id, payload, navigate) {
    return requete(`${API_URL}/api/jours_feries/${id}`, json("PUT", payload), navigate);
  },

  supprimer(id, navigate) {
    return requete(`${API_URL}/api/jours_feries/${id}`, { method: "DELETE" }, navigate);
  },
};
