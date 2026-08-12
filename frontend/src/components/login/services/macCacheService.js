// src/pages/Login/services/macCacheService.js
import { getSystemWifiMac } from "./macAgentService";

let macCache = null;
let macCachePromise = null;
const CACHE_TTL = 60000; // 1 minute

export const getCachedMacAddress = async (forceRefresh = false) => {
  // Si on a une valeur en cache et qu'elle n'est pas expirée
  if (macCache && !forceRefresh) {
    return macCache;
  }

  // Si une promesse est déjà en cours, on la retourne
  if (macCachePromise) {
    return macCachePromise;
  }

  // Sinon, on lance une nouvelle requête
  macCachePromise = (async () => {
    try {
      const mac = await getSystemWifiMac();
      macCache = mac;
      return mac;
    } finally {
      macCachePromise = null;
    }
  })();

  return macCachePromise;
};

// Optionnel: fonction pour vider le cache
export const clearMacCache = () => {
  macCache = null;
  macCachePromise = null;
};