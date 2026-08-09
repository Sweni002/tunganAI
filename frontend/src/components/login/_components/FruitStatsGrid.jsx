import React from "react";
import { useRecentPerformance } from "../services/useRecentPerformance";



// Card avec Graphique Temporel (Courbe SVG)
export const StatCard = ({ title, data, strokeColor = "#3b82f6" }) => {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => (typeof d === "object" ? d.value : d));

  const startVal = values[0];
  const endVal = values[values.length - 1];

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const yMinDomain = Math.floor(minVal - 10);
  const yMaxDomain = Math.ceil(maxVal + 10);
  const yMidDomain = Math.round((yMinDomain + yMaxDomain) / 2);

  const width = 280;
  const height = 140; // Hauteur du graphique augmentée (au lieu de 90)

  const points = values.map((val, index) => {
   const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((val - yMinDomain) / (yMaxDomain - yMinDomain)) * height;
    return { x, y, value: val };
  });

  const pathD = points.reduce((acc, point, i) => {
    return i === 0 ? `M ${point.x},${point.y}` : `${acc} L ${point.x},${point.y}`;
  }, "");

  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 12,
        padding: "26px 38px",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
        color: "#8da8be",
            fontFamily: "'Roboto Mono', monospace",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            marginBottom:25
        }}
      >
        {title}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "stretch", flex: 1 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-end",
            color: "rgba(232, 246, 248, 0.5)",
            fontSize: 10,
            fontFamily: "'Roboto Mono', monospace",
            paddingRight: 4,
            height: height,
          }}
        >
          <span>{yMaxDomain}</span>
          <span>{yMidDomain}</span>
          <span>{yMinDomain}</span>
        </div>

        <div style={{ flex: 1, position: "relative", height: height }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              pointerEvents: "none",
              opacity: 0.05,
            }}
          >
            <div style={{ borderBottom: "1px dashed #ffffff", width: "100%" }} />
            <div style={{ borderBottom: "1px dashed #ffffff", width: "100%" }} />
            <div style={{ borderBottom: "1px dashed #ffffff", width: "100%" }} />
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: "100%", height: "100%", overflow: "visible" }}
          >
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={startPoint.x} cy={startPoint.y} r="3.5" fill={strokeColor} />
            <circle cx={endPoint.x} cy={endPoint.y} r="3.5" fill={strokeColor} />
          </svg>

          <div
            style={{
              position: "absolute",
              left: `${(startPoint.x / width) * 100}%`,
              top: `${(startPoint.y / height) * 100}%`,
              transform: "translate(-50%, 8px)",
              color: strokeColor,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Roboto Mono', monospace",
            }}
          >
            {startVal}
          </div>

          <div
            style={{
              position: "absolute",
              left: `${(endPoint.x / width) * 100}%`,
              top: `${(endPoint.y / height) * 100}%`,
              transform: "translate(-50%, -20px)",
              color: strokeColor,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Roboto Mono', monospace",
            }}
          >
            {endVal}
          </div>
        </div>
      </div>
    </div>
  );
};

// Card Circulaire ajustée en hauteur
export const CircularStatCard = ({
  title,
  data,
  maxTarget = 200,
  strokeColor = "#7fd8ff",
}) => {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => (typeof d === "object" ? d.value : d));
  const avgVal = Math.round(
    values.reduce((acc, curr) => acc + curr, 0) / values.length
  );

  const percentage = Math.min(100, Math.round((avgVal / maxTarget) * 100));

  const size = 110; // Taille du cercle légèrement agrandie
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 12,
        padding: "26px 38px",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Titre */}
      <div
        style={{
           color: "#8da8be",
            fontFamily: "'Roboto Mono', monospace",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            marginBottom:25
        }}
      >
        {title}
      </div>

      {/* Contenu principal centrés verticalement */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          gap: 16,
          width: "100%",
          flex: 1,
        }}
      >
        {/* Graphique Circulaire SVG */}
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: strokeColor,
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "'Roboto Mono', monospace",
            }}
          >
            {percentage}%
          </div>
        </div>

        {/* Détails de la moyenne */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontFamily: "'Roboto Mono', monospace",
            alignItems: "flex-start",
          }}
        >
          <span style={{ color: "rgba(232, 246, 248, 0.5)", fontSize: 12 }}>
            MOYENNE
          </span>
          <span style={{ color: "#e8f6f8", fontSize: 26, fontWeight: 700 }}>
            {avgVal}
          </span>
        </div>
      </div>
    </div>
  );
};


// Composant Skeleton reproduisant la grille à 2 colonnes (60% / 40%)
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
      {/* Animation d'impulsion pour l'effet Skeleton */}
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

      {/* Carte Skeleton Gauche (60%) */}
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
        {/* En-tête */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="skeleton-block" style={{ width: "50%", height: 16 }} />
          <div className="skeleton-block" style={{ width: "20%", height: 14 }} />
        </div>
        {/* Zone Graphique */}
        <div className="skeleton-block" style={{ width: "100%", height: 120, borderRadius: 8 }} />
      </div>

      {/* Carte Skeleton Droite (40%) */}
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
        <div className="skeleton-block" style={{ width: "60%", height: 16, selfAlign: "flex-start" }} />
        {/* Cercle central */}
        <div className="skeleton-block" style={{ width: 100, height: 100, borderRadius: "50%" }} />
      </div>
    </div>
  );
};

const FruitStatsGrid = ({ refreshKey = 0 }) => {
  const { metrics, loading, error } = useRecentPerformance(refreshKey);

  // 1. Affichage du Skeleton pendant le chargement
  if (loading) {
    return <FruitStatsGridSkeleton />;
  }

  // 2. Gestion de l'erreur
  if (error || !metrics) {
    return (
      <div style={{ color: "#f87171", fontFamily: "'Roboto Mono', monospace", padding: 24 }}>
        {error || "Aucune métrique disponible"}
      </div>
    );
  }

  const maxRecordedTime = Math.max(...metrics.vitesseTraitement.data, 1);

  // 3. Rendu principal des données chargées
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
      <div style={{ flex: "1 1 calc(60% - 8px)", minWidth: 300 }}>
        <StatCard
          title={metrics.vitesseTraitement.title}
          data={metrics.vitesseTraitement.data}
          strokeColor={metrics.vitesseTraitement.color}
        />
      </div>

      <div style={{ flex: "1 1 calc(40% - 8px)", minWidth: 250 }}>
        <CircularStatCard
          title={metrics.moyenne.title}
          data={metrics.moyenne.data}
          maxTarget={maxRecordedTime}
          strokeColor={metrics.moyenne.color}
        />
      </div>
    </div>
  );
};



export default FruitStatsGrid;