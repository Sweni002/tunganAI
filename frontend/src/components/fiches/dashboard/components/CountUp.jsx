import { useEffect, useState } from 'react';

/** Compteur animé (ease-out). Saute l'animation si l'utilisateur la refuse. */
export default function CountUp({ value, decimals = 0, format, duration = 900 }) {
  const target = Number(value) || 0;
  const [val, setVal] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !target) {
      setVal(target);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / duration);
      setVal(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  if (format) return format(val);
  return val.toFixed(decimals).replace('.', ',');
}
