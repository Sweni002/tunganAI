// hooks/useTrend.js
import { useEffect, useRef, useState } from 'react';

/**
 * Compare `value` à sa valeur précédente (dernier rendu commité) et renvoie
 * { percent, direction } ou null s'il n'y a pas encore de point de comparaison
 * (premier chargement) ou si la variation est nulle.
 *
 * C'est une vraie tendance basée sur les données réellement chargées
 * (ex: en changeant de date ou de division), pas un chiffre inventé.
 */
export function useTrend(value) {
  const previousRef = useRef(null);
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    const previous = previousRef.current;

    if (previous !== null && previous !== undefined && previous !== 0) {
      const diff = value - previous;
      const percent = Math.round((diff / previous) * 100);
      setTrend(percent === 0 ? null : { percent: Math.abs(percent), direction: percent > 0 ? 'up' : 'down' });
    }

    previousRef.current = value;
  }, [value]);

  return trend;
}