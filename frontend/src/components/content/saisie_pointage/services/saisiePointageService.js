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
    error.erreurs = data.erreurs ?? []; // erreurs par agent d'un enregistrement refusé
    error.status = response.status;
    throw error;
  }
  return data;
}

export const saisiePointageService = {
  /** Agents du service + heures déjà enregistrées à la date donnée. */
  charger(idserv, date, navigate) {
    return requete(`${API_URL}/api/pointage/saisie/${idserv}?date=${date}`, {}, navigate);
  },

  /** Enregistre les lignes modifiées (tout ou rien). */
  enregistrer(payload, navigate) {
    return requete(
      `${API_URL}/api/pointage/saisie_manuelle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      navigate
    );
  },
};
