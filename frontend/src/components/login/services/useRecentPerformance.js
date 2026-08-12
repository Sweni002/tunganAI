// src/pages/Login/services/useRecentPerformance.js
import { useEffect, useState } from "react";
import { authService } from "./authService";
import { getCachedMacAddress } from "./macCacheService";

export const useRecentPerformance = (refreshKey = 0) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Utiliser le cache au lieu d'appeler directement getSystemWifiMac
        const mac = await getCachedMacAddress();
        const data = await authService.getRecentPerformanceMetrics(mac);
        
        console.log(data)

        if (!cancelled) setMetrics(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [refreshKey]);

  return { metrics, loading, error };
};