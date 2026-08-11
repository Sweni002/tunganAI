import React, { useState, useEffect, useRef } from "react";
import { useRecentPerformance } from "../services/useRecentPerformance";

export const StatCard = ({ title, data, strokeColor = "#3b82f6" }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [progress, setProgress] = useState(0);
  const svgRef = useRef(null);

  if (!data || data.length === 0) return null;

  // Normalisation des données
  const values = data.map((d) => (typeof d === "object" ? d.value : d));
  const labels = data.map((d, i) => (typeof d === "object" && d.label ? d.label : `P${i + 1}`));

  const startVal = values[0];
  const endVal = values[values.length - 1];
  const diff = endVal - startVal;
  const percentChange = startVal !== 0 ? ((diff / startVal) * 100).toFixed(1) : 0;
  const isPositive = diff >= 0;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  // Marge pour éviter d'écraser la courbe aux bords
  const padding = Math.max((maxVal - minVal) * 0.15, 5);
  const yMinDomain = Math.floor(minVal - padding);
  const yMaxDomain = Math.ceil(maxVal + padding);
  const yMidDomain = Math.round((yMinDomain + yMaxDomain) / 2);

  const width = 320;
  const height = 235;

  // Calcul des coordonnées
  const points = values.map((val, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((val - yMinDomain) / (yMaxDomain - yMinDomain)) * height;
    return { x, y, value: val, label: labels[index] };
  });

  // Génération d'un tracé lisse (Bezier Bézier)
  const createSmoothPath = (pts, progressVal = 1) => {
    if (pts.length < 2) return "";
    const pointsToShow = Math.max(2, Math.ceil(pts.length * progressVal));
    const visiblePoints = pts.slice(0, pointsToShow);
    
    return visiblePoints.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + point.x) / 2;
      return `${acc} C ${cx},${prev.y} ${cx},${point.y} ${point.x},${point.y}`;
    }, "");
  };

  const pathD = createSmoothPath(points, progress);
  
  // Tracé fermé pour le Density Plot (Surface sous la courbe)
  const areaD = progress > 0 ? `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z` : "";

  // Animation au montage
  useEffect(() => {
    setIsAnimating(true);
    setProgress(0);
    
    const duration = 1200; // 1.2 secondes
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(1, elapsed / duration);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - newProgress, 3);
      setProgress(eased);
      
      if (newProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    requestAnimationFrame(animate);
  }, [data]);

  const gradientId = React.useId ? React.useId() : `density-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  return (
    <div
      style={{
        backgroundColor: "rgba(18, 24, 38, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 16,
        padding: "20px 24px",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        userSelect: "none",
      }}
    >
      {/* Entête avec animation du pourcentage */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div
            style={{
              color: "#94a3b8",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            {title}
          </div>
        </div>

        {/* Badge de pourcentage animé */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            borderRadius: 8,
            backgroundColor: isPositive ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
            color: isPositive ? "#4ade80" : "#f87171",
            fontSize: "0.75rem",
            fontWeight: 700,
            fontFamily: "'Roboto Mono', monospace",
            transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <span style={{ 
            display: "inline-block",
            transition: "transform 0.3s ease",
          }}>
            {isPositive ? "↑" : "↓"}
          </span>
          <span style={{
            display: "inline-block",
            transition: "all 0.5s ease",
          }}>
            {Math.abs(percentChange)}%
          </span>
        </div>
      </div>

      {/* Graphique et Axes */}
      <div style={{ display: "flex", gap: 12, alignItems: "stretch", flex: 1 }}>
        {/* Axe Y */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-end",
            color: "rgba(148, 163, 184, 0.5)",
            fontSize: 10,
            fontFamily: "'Roboto Mono', monospace",
            height: height,
            flexShrink: 0,
          }}
        >
          <span>{yMaxDomain}</span>
          <span>{yMidDomain}</span>
          <span>{yMinDomain}</span>
        </div>

        {/* Zone Graphique */}
        <div style={{ flex: 1, position: "relative", height: height, minHeight: height }}>
          {/* Lignes de Grille animées */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              pointerEvents: "none",
              opacity: 0.1,
            }}
          >
            <div style={{ 
              borderBottom: "1px dashed #ffffff", 
              width: "100%",
              transform: `scaleX(${progress})`,
              transformOrigin: "left",
              transition: "transform 1.2s ease-out",
            }} />
            <div style={{ 
              borderBottom: "1px dashed #ffffff", 
              width: "100%",
              transform: `scaleX(${progress})`,
              transformOrigin: "left",
              transition: "transform 1.2s ease-out 0.2s",
            }} />
            <div style={{ 
              borderBottom: "1px dashed #ffffff", 
              width: "100%",
              transform: `scaleX(${progress})`,
              transformOrigin: "left",
              transition: "transform 1.2s ease-out 0.4s",
            }} />
          </div>

          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: "100%", height: "100%", overflow: "visible" }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor || "#3b82f6"} stopOpacity="0.4" />
                <stop offset="100%" stopColor={strokeColor || "#3b82f6"} stopOpacity="0.0" />
              </linearGradient>
              
              {/* Animation du glow */}
              <filter id={`glow-${gradientId}`}>
                <feGaussianBlur stdDeviation="2" result="blur">
                  <animate 
                    attributeName="stdDeviation" 
                    values="2;4;2" 
                    dur="3s" 
                    repeatCount="indefinite" 
                  />
                </feGaussianBlur>
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Density Plot animé */}
            {areaD && (
              <path 
                d={areaD} 
                fill={`url(#${gradientId})`}
                opacity={progress}
                style={{
                  transition: "opacity 0.8s ease",
                }}
              />
            )}

            {/* Courbe Principale animée */}
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#glow-${gradientId})`}
              style={{
                strokeDasharray: 1000,
                strokeDashoffset: 1000 * (1 - progress),
                transition: "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />

            {/* Point de début animé */}
            {progress > 0.1 && (
              <circle 
                cx={points[0].x} 
                cy={points[0].y} 
                r="3" 
                fill={strokeColor}
                style={{
                  opacity: Math.min(1, progress * 2),
                  transition: "opacity 0.5s ease",
                }}
              />
            )}

            {/* Point de fin animé avec pulse */}
            {progress > 0.8 && (
              <circle 
                cx={points[points.length - 1].x} 
                cy={points[points.length - 1].y} 
                r="4" 
                fill={strokeColor}
              >
                <animate
                  attributeName="r"
                  values="4;6;4"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="1;0.6;1"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Ligne verticale au survol */}
            {hoveredPoint && (
              <line
                x1={hoveredPoint.x}
                y1={0}
                x2={hoveredPoint.x}
                y2={height}
                stroke={strokeColor}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
            )}

            {/* Zones d'interaction invisibles (Hover Target) */}
            {points.map((pt, index) => (
              <circle
                key={index}
                cx={pt.x}
                cy={pt.y}
                r="12"
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPoint(pt)}
              />
            ))}

            {/* Highlight point survolé avec animation */}
            {hoveredPoint && (
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="5"
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth="2"
              >
                <animate
                  attributeName="r"
                  values="5;7;5"
                  dur="0.5s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </svg>

          {/* Tooltip au survol */}
          {hoveredPoint && (
            <div
              style={{
                position: "absolute",
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100}%`,
                transform: "translate(-50%, -120%)",
                backgroundColor: "#0f172a",
                border: `1px solid ${strokeColor}`,
                borderRadius: 6,
                padding: "2px 8px",
                color: "#f8fafc",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'Roboto Mono', monospace",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                zIndex: 10,
                animation: "tooltipIn 0.2s ease-out",
              }}
            >
              {hoveredPoint.value}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes tooltipIn {
          from {
            opacity: 0;
            transform: translate(-50%, -120%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -120%) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export const CircularStatCard = ({ metric, strokeColor = "#38bdf8" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [progress, setProgress] = useState(0);
  const [valueAnim, setValueAnim] = useState(0);

  if (!metric) return null;

  const {
    title = "Performance",
    value = 0,
    unit = "x",
    temps_moyen_ms,
    reference_ms,
  } = metric;

  // Pourcentage de remplissage (0 à 100)
  const maxScale = 15;
  const percentage =
    unit === "%"
      ? Math.min(100, Math.max(0, value))
      : Math.min(100, Math.max(0, (value / maxScale) * 100));

  // Statut visuel
  const getStatusBadge = () => {
    if (!temps_moyen_ms || !reference_ms)
      return { text: "N/A", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.12)" };
    const ratio = temps_moyen_ms / reference_ms;
    if (ratio <= 0.85)
      return { text: "Optimal", color: "#4ade80", bg: "rgba(34, 197, 94, 0.12)" };
    if (ratio <= 1.15)
      return { text: "Normal", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)" };
    return { text: "Élevé", color: "#f87171", bg: "rgba(239, 68, 68, 0.12)" };
  };

  const status = getStatusBadge();
  const safeId = `gauge-${(title || "stat").toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  // Animation au montage
  useEffect(() => {
    setProgress(0);
    setValueAnim(0);
    
    const duration = 1500; // 1.5 secondes
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(1, elapsed / duration);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - newProgress, 3);
      setProgress(eased);
      setValueAnim(eased * value);
      
      if (newProgress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  // ---- Géométrie du Gauge (arc à 270°, ouverture de 90° en bas) ----
  const size = 280;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  const START_ANGLE = 225;
  const SWEEP = 270;
  const endAngleFull = START_ANGLE + SWEEP;
  const endAngleProgress = START_ANGLE + (percentage / 100) * SWEEP * progress;

  const polarToCartesian = (angleDeg) => {
    const rad = ((angleDeg - 0) * Math.PI) / 180;
    return {
      x: center + radius * Math.sin(rad),
      y: center - radius * Math.cos(rad),
    };
  };

  const describeArc = (startAngle, endAngle) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const trackPath = describeArc(START_ANGLE, endAngleFull);
  const progressPath = progress > 0 ? describeArc(START_ANGLE, endAngleProgress) : null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: "rgba(18, 24, 38, 0.6)",
        border: `1px solid ${
          isHovered ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.08)"
        }`,
        borderRadius: 16,
        padding: "20px 24px",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        backdropFilter: "blur(12px)",
        boxShadow: isHovered
          ? "0 12px 40px rgba(0, 0, 0, 0.35)"
          : "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        userSelect: "none",
        gap: 16,
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* 1. En-tête avec Titre & Statut Badge animé */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            color: "#94a3b8",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 8px",
            borderRadius: 6,
            backgroundColor: status.bg,
            color: status.color,
            fontSize: "0.7rem",
            fontWeight: 700,
            fontFamily: "'Roboto Mono', monospace",
            letterSpacing: "0.02em",
            transition: "all 0.3s ease",
          }}
        >
          {status.text}
        </div>
      </div>

      {/* 2. Gauge en arc avec Valeur Centrée */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "18px 0",
          flex: 1,
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg
          width={size}
          height={size * 0.62}
          viewBox={`0 0 ${size} ${size}`}
          style={{ overflow: "visible", maxWidth: "100%", height: "auto" }}
        >
          <defs>
            <filter id={`glow-${safeId}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Dégradé du segment "rempli" : vert -> bleu */}
            <linearGradient id={`progress-${safeId}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor={strokeColor} />
            </linearGradient>

            {/* Dégradé du segment "restant" : gris métallisé */}
            <linearGradient id={`track-${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Arc de fond (portion restante) avec fade-in */}
          <path
            d={trackPath}
            fill="none"
            stroke={`url(#track-${safeId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              opacity: progress,
              transition: "opacity 0.8s ease",
            }}
          />

          {/* Arc de progression (portion remplie) avec animation */}
          {progressPath && (
            <path
              d={progressPath}
              fill="none"
              stroke={`url(#progress-${safeId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter={`url(#glow-${safeId})`}
              style={{
                transition: "d 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                opacity: progress,
              }}
            >
              {/* Animation de pulsation du glow */}
              <animate
                attributeName="stroke-opacity"
                values="1;0.7;1"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
          )}
        </svg>

        {/* Valeur Numérique Centrée avec compteur animé */}
        <div
          style={{
            position: "absolute",
            top: "45%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                color: "#f8fafc",
                fontSize: "1.9rem",
                fontWeight: 800,
                fontFamily: "'Roboto Mono', monospace",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                transition: "all 0.3s ease",
              }}
            >
              {Math.round(valueAnim)}
            </span>
            <span
              style={{
                color: strokeColor,
                fontSize: "0.95rem",
                fontWeight: 700,
                fontFamily: "'Roboto Mono', monospace",
                marginLeft: 2,
                opacity: progress,
                transition: "opacity 0.5s ease",
              }}
            >
              {unit}
            </span>
          </div>
        </div>

        {/* Tooltip au survol avec animation */}
        {showTooltip && (
          <div
            style={{
              position: "absolute",
              top: -16,
              backgroundColor: "#0f172a",
              border: `1px solid ${strokeColor}`,
              borderRadius: 8,
              padding: "6px 12px",
              color: "#f8fafc",
              fontSize: "0.72rem",
              fontFamily: "'Roboto Mono', monospace",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              animation: "tooltipIn 0.2s ease-out",
            }}
          >
            <div>
              Indice: <span style={{ color: strokeColor, fontWeight: 700 }}>{value}{unit}</span>
            </div>
            <div>
              Exécution: <span style={{ fontWeight: 700 }}>{temps_moyen_ms ?? "--"} ms</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Pied de carte avec animation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 12,
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          fontFamily: "'Roboto Mono', monospace",
          fontSize: "0.7rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ color: "#64748b", fontWeight: 600, fontSize: "0.65rem" }}>
            MOYENNE
          </span>
          <span 
            style={{ 
              color: "#f8fafc", 
              fontWeight: 700,
              opacity: progress,
              transition: "opacity 0.8s ease",
            }}
          >
            {temps_moyen_ms ?? "--"} ms
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 2,
          }}
        >
          <span style={{ color: "#64748b", fontWeight: 600, fontSize: "0.65rem" }}>
            RÉFÉRENCE
          </span>
          <span 
            style={{ 
              color: "#94a3b8", 
              fontWeight: 600,
              opacity: progress,
              transition: "opacity 0.8s ease 0.2s",
            }}
          >
            {reference_ms ?? "--"} ms
          </span>
        </div>
      </div>

      <style>{`
        @keyframes tooltipIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// Composant Skeleton
const FruitStatsGridSkeleton = () => {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        width: "100%",
        marginTop: 18,
        flexWrap: "wrap",
        boxSizing: "border-box",
        alignItems: "stretch",
      }}
    >
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.5; }
        }
        .skeleton-block {
          background-color: rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
      `}</style>

      <div
        style={{
          flex: "1 1 calc(60% - 8px)",
          minWidth: 300,
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 12,
          padding: 20,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="skeleton-block" style={{ width: "50%", height: 16 }} />
          <div className="skeleton-block" style={{ width: "20%", height: 14 }} />
        </div>
        <div className="skeleton-block" style={{ width: "100%", height: "100%", borderRadius: 8, minHeight: 120 }} />
      </div>

      <div
        style={{
          flex: "1 1 calc(40% - 8px)",
          minWidth: 250,
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 12,
          padding: 20,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div className="skeleton-block" style={{ width: "60%", height: 16, alignSelf: "flex-start" }} />
        <div className="skeleton-block" style={{ width: 100, height: 100, borderRadius: "50%" }} />
      </div>
    </div>
  );
};

const FruitStatsGrid = ({ refreshKey = 0 }) => {
  const { metrics, loading, error } = useRecentPerformance(refreshKey);

  if (loading) {
    return <FruitStatsGridSkeleton />;
  }

  if (error || !metrics) {
    return (
      <div style={{ color: "#f87171", fontFamily: "'Roboto Mono', monospace", padding: 24 }}>
        {error || "Aucune métrique disponible"}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        width: "100%",
        marginTop: 18,
        flexWrap: "wrap",
        boxSizing: "border-box",
        alignItems: "stretch",
      }}
    >
      <div style={{ flex: "1 1 calc(68% - 8px)", minWidth: 300, display: "flex" }}>
        <StatCard
          title={metrics.vitesseTraitement.title}
          data={metrics.vitesseTraitement.data}
          strokeColor={metrics.vitesseTraitement.color}
        />
      </div>

      <div style={{ flex: "1 1 calc(32% - 8px)", minWidth: 250, display: "flex" }}>
        <CircularStatCard
          metric={metrics.moyenne}
          strokeColor={metrics.moyenne.color}
        />
      </div>
    </div>
  );
};

export default FruitStatsGrid;