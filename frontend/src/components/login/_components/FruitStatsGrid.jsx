import React from "react";

// Exemple de données
const grapeData = [
  { timeMs: 0, value: 62 },
  { timeMs: 100, value: 95 },
  { timeMs: 200, value: 125 },
  { timeMs: 300, value: 110 },
  { timeMs: 400, value: 85 },
  { timeMs: 500, value: 90 },
  { timeMs: 600, value: 125 },
  { timeMs: 700, value: 135 },
  { timeMs: 800, value: 100 },
  { timeMs: 900, value: 80 },
  { timeMs: 1000, value: 110 },
  { timeMs: 1100, value: 125 },
  { timeMs: 1200, value: 224 },
];

const bananaData = [
  { timeMs: 0, value: 180 },
  { timeMs: 100, value: 190 },
  { timeMs: 200, value: 178 },
  { timeMs: 300, value: 182 },
  { timeMs: 400, value: 180 },
  { timeMs: 500, value: 185 },
  { timeMs: 600, value: 175 },
  { timeMs: 700, value: 180 },
  { timeMs: 800, value: 172 },
  { timeMs: 900, value: 181 },
  { timeMs: 1000, value: 175 },
  { timeMs: 1100, value: 178 },
];

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
    const x = (index / (values.length - 1)) * width;
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
          color: "#e8f6f8",
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 20,
          fontFamily: "'Roboto Mono', monospace",
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
          color: "#e8f6f8",
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 20,
          fontFamily: "'Roboto Mono', monospace",
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

const FruitStatsGrid = () => {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        width: "100%",
        marginTop: 18,
        flexWrap: "wrap",
        boxSizing: "border-box",
        alignItems: "stretch", // Garantit que les deux colonnes ont la même hauteur
      }}
    >
      <div style={{ flex: "1 1 calc(60% - 8px)", minWidth: 300 }}>
        <StatCard title="Grape" data={grapeData} strokeColor="#4fd8ff" />
      </div>

      <div style={{ flex: "1 1 calc(40% - 8px)", minWidth: 250 }}>
        <CircularStatCard
          title="Banana (Moyenne)"
          data={bananaData}
          maxTarget={200}
          strokeColor="#7fd8ff"
        />
      </div>
    </div>
  );
};

export default FruitStatsGrid;