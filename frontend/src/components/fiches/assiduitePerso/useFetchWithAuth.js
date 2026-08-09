/**
 * Fabrique une fonction fetchWithAuth liée à un `navigate` donné.
 * - envoie les cookies de session (credentials: include)
 * - redirige vers /login sur un 401
 * - lève une erreur lisible si la réponse n'est pas ok
 */
export function createFetchWithAuth(navigate) {
  return async function fetchWithAuth(url, options = {}) {
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
  };
}
