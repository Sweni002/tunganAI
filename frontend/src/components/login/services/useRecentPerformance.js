// src/pages/Login/services/useRecentPerformance.js
import { useEffect, useState } from "react";
import { authService } from "./authService";
import { getSystemWifiMac } from "./macAgentService";

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
        const mac = await getSystemWifiMac(); // null si l'agent n'est pas lancé
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