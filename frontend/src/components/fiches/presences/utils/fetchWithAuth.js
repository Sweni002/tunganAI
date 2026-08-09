// utils/fetchWithAuth.js
// Centralise la logique de fetch authentifié (cookie de session + gestion 401)
// utilisée partout dans le module Presences.

export const createFetchWithAuth = (navigate) => {
  return async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
    });

    if (response.status === 401) {
      navigate('/login');
      throw new Error('Session expirée, veuillez vous reconnecter.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erreur inconnue');
    }

    return response.json();
  };
};