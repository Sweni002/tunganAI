import { useEffect, useRef, useState } from "react";

/**
 * Portage React du M3WavyCircularProgressIndicatorIndeterminate (Flutter).
 * Loading M3 Expressive : track fixe + arc ondulé qui grossit/rétrécit en tournant.
 */
const M3WavyLoader = ({
  size = 56,
  strokeWidth,
  isThick = false,
  color = "#00c4cc",
  trackColor,
}) => {
  const [path, setPath] = useState("");
  const rafRef = useRef();
  const startTimeRef = useRef();

  // --- Mêmes calculs d'échelle que la version Flutter ---
  const defaultSize = isThick ? 52 : 48;
  const scale = size / defaultSize;
  const effectiveStrokeWidth = strokeWidth ?? (isThick ? 10 : 6) * scale;
  const amplitude = (isThick ? 1.8 : 1.5) * scale;
  const wavelength = 14 * scale;

  const baseRadius = (size - effectiveStrokeWidth - amplitude * 2) / 2;
  const center = size / 2;

  // trackColor par défaut = color à 15% d'opacité (via rgba si hex 6 chiffres, sinon fallback)
  const effectiveTrackColor = trackColor ?? toRgba(color, 0.15);

  useEffect(() => {
    const duration = 2000; // ms, identique au AnimationController Flutter

    const animate = (timestamp) => {
      if (startTimeRef.current === undefined) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) % duration;
      const animationValue = elapsed / duration; // 0 -> 1

      const circumference = 2 * Math.PI * baseRadius;
      const waveCount = Math.round(circumference / wavelength);

      // Rotation continue du début de l'arc
      const startAngle = animationValue * 2 * Math.PI;

      // Grows & shrinks : la longueur de l'arc oscille entre 0.15 et 0.75 tour
      const sweepAngle =
        (0.15 + 0.6 * ((Math.sin(animationValue * 2 * Math.PI) + 1) / 2)) *
        2 *
        Math.PI;

      const endAngle = startAngle + sweepAngle;
      const step = 0.02;

      let d = "";
      for (let angle = startAngle; angle <= endAngle; angle += step) {
        const wavePhase = (angle - startAngle) * waveCount;
        const r = baseRadius + Math.sin(wavePhase) * amplitude;
        const x = center + r * Math.cos(angle - Math.PI / 2);
        const y = center + r * Math.sin(angle - Math.PI / 2);
        d += d === "" ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }

      setPath(d);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, effectiveStrokeWidth, amplitude, wavelength, baseRadius, center]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      {/* 1. Track fixe, lisse */}
      <circle
        cx={center}
        cy={center}
        r={baseRadius}
        stroke={effectiveTrackColor}
        strokeWidth={effectiveStrokeWidth}
        fill="none"
      />
      {/* 2. Arc actif, ondulé */}
      <path
        d={path}
        stroke={color}
        strokeWidth={effectiveStrokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

// Petit helper pour appliquer une opacité à une couleur hex (#RRGGBB) ou renvoyer telle quelle sinon
function toRgba(hexOrColor, alpha) {
  const hex = hexOrColor.replace("#", "");
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hexOrColor; // fallback si ce n'est pas un hex 6 chiffres
}

export default M3WavyLoader;