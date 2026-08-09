// src/pages/Login/DataChartsColumn.jsx

import React from "react";
import Typography from "@mui/material/Typography";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, YAxis } from "recharts";

// ---------------------------------------------------------------
// ⚠️ Données factices en attendant un vrai endpoint d'analytics
// (nombre de pointages/jour, vitesse de reconnaissance, alertes...).
// Remplace ces tableaux par les données réelles quand l'API existera.
// ---------------------------------------------------------------
const dataSeries = [
  { v: 12 }, { v: 18 }, { v: 14 }, { v: 22 }, { v: 30 }, { v: 24 }, { v: 34 }, { v: 28 },
];
const matchSpeedSeries = [
  { v: 40 }, { v: 55 }, { v: 48 }, { v: 70 }, { v: 65 }, { v: 90 }, { v: 110 }, { v: 95 }, { v: 130 },
];
const alertsSeries = [
  { v: 3 }, { v: 6 }, { v: 2 }, { v: 8 }, { v: 5 }, { v: 9 }, { v: 4 },
];

const CARD_STYLE = {
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "14px 16px",
  marginBottom: 14,
  fontFamily: "'Roboto Mono', monospace",
};

const CARD_TITLE_STYLE = {
  color: "#9fb8c9",
  fontSize: "0.72rem",
  fontFamily: "'Roboto Mono', monospace",
  letterSpacing: "0.5px",
  marginBottom: 6,
};

const DataChartsColumn = ({ entreesCount = 0, sortiesCount = 0 }) => {
  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        padding: "20px 14px",
        overflowY: "auto",
        height: "100%",
      }}
    >
      {/* Data (mini line chart) */}
      <div style={CARD_STYLE}>
        <Typography sx={{ ...CARD_TITLE_STYLE }}>Data</Typography>
        <div style={{ height: 70 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataSeries}>
              <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
              <Line type="monotone" dataKey="v" stroke="#4fd8ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deux mini stats côte à côte */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <div style={{ ...CARD_STYLE, flex: 1, margin: 0, textAlign: "center" }}>
          <div style={{ color: "#e8f6f8", fontSize: "1.3rem", fontWeight: 700 }}>{entreesCount}</div>
          <div style={{ color: "#9fb8c9", fontSize: "0.68rem" }}>Entrées</div>
        </div>
        <div
          style={{
            ...CARD_STYLE,
            flex: 1,
            margin: 0,
            textAlign: "center",
            border: "1px solid #4fd8ff",
            backgroundColor: "rgba(79,216,255,0.08)",
          }}
        >
          <div style={{ color: "#4fd8ff", fontSize: "1.3rem", fontWeight: 700 }}>{sortiesCount}</div>
          <div style={{ color: "#9fb8c9", fontSize: "0.68rem" }}>Sorties</div>
        </div>
      </div>

      {/* Match speed */}
      <div style={CARD_STYLE}>
        <Typography sx={{ ...CARD_TITLE_STYLE }}>Vitesse de reconnaissance</Typography>
        <div style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={matchSpeedSeries}>
              <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
              <Line type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts histoire */}
      <div style={CARD_STYLE}>
        <Typography sx={{ ...CARD_TITLE_STYLE }}>Alertes historique</Typography>
        <div style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={alertsSeries}>
              <YAxis hide />
              <Bar dataKey="v" fill="#4fd8ff" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DataChartsColumn;