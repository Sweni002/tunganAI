// hooks/usePersistentToggle.js
import { useState, useEffect } from 'react';

/**
 * Booléen persisté dans localStorage (ex: afficher/masquer un filtre),
 * pour que le choix de l'utilisateur survive à un rechargement de page.
 */
export function usePersistentToggle(key, defaultValue = true) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? defaultValue : stored === 'true';
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // localStorage indisponible (mode privé, quota...) : on ignore silencieusement
    }
  }, [key, value]);

  return [value, setValue];
}