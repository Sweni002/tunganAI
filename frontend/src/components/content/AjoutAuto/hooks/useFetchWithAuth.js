import { useNavigate } from "react-router-dom";

// Logique inchangée par rapport à AjoutAuto.jsx d'origine (fetchWithAuth)
export function useFetchWithAuth() {
  const navigate = useNavigate();

  const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });

    if (response.status === 401) {
      navigate("/login"); // Redirige ici
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Erreur inconnue");
    }

    return response.json();
  };

  return fetchWithAuth;
}
