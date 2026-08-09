// src/pages/Login/ProfileHistoryCard.jsx

import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import PsychologyIcon from "@mui/icons-material/Psychology";
import HistoryIcon from "@mui/icons-material/History";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";

// ----------------------------------------------------------------------
// Constants & Config Helpers
// ----------------------------------------------------------------------

export const DEFAULT_STATUS_COLORS = {
  Validé: "#22c55e",
  Inconnu: "#f59e0b",
  Erreur: "#ef4444",
};

const getTypeConfig = (type) => {
  const normalized = type?.toLowerCase() || "";
  const isEntree = normalized === "entree" || normalized === "entrée";

  return isEntree
    ? {
        label: "Entrée",
        symbol: "↙",
        color: "#22c55e",
        bg: "rgba(34, 197, 94, 0.15)",
        border: "rgba(34, 197, 94, 0.35)",
      }
    : {
        label: "Sortie",
        symbol: "↗",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.15)",
        border: "rgba(245, 158, 11, 0.35)",
      };
};

// Fonction de formatage (ajoute un espace tous les 3 chiffres)
const formatMatricule = (val) => {
  if (!val) return "N/A";
  const str = String(val).replace(/\D/g, ""); // Sécurité : garde uniquement les chiffres
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// ----------------------------------------------------------------------
// Component 1: HistoryDetailCard
// ----------------------------------------------------------------------

export const HistoryDetailCard = ({ item, onClose, statusColors = DEFAULT_STATUS_COLORS }) => {
  if (!item) return null;

  const statusColor = statusColors[item.status] ?? "#9fb8c9";
  const typeConfig = getTypeConfig(item.type_pointage);

  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(135deg, rgba(15, 35, 55, 0.9) 0%, rgba(8, 20, 34, 0.9) 100%)",
        border: "1px solid rgba(56, 189, 248, 0.25)",
        borderRadius: 16,
        padding: "24px 24px 16px",
        marginBottom: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
        backdropFilter: "blur(8px)",
        fontFamily: "'Roboto Mono', monospace",
      }}
    >
      {/* Header Badges & Actions */}
      <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <PsychologyIcon sx={{ color: "#38bdf8", fontSize: "1.6rem", filter: "drop-shadow(0 0 6px #38bdf8)" }} />
      
      </div>

      {/* Main Identity Row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
          <Avatar
            src={item.photo}
            variant="rounded"
            sx={{
              width: 64,
              height: 64,
              borderRadius: "12px",
              backgroundColor: "#2a3b4c",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          />
          <span
            style={{
              position: "absolute",
              bottom: -3,
              right: -3,
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: statusColor,
              border: "2px solid #0f2337",
              boxShadow: `0 0 8px ${statusColor}`,
            }}
          />
        </div>

        <div style={{ minWidth: 0, paddingRight: 40, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                color: "#ffffff",
                fontSize: "1.05rem",
                fontWeight: 700,
                letterSpacing: "0.2px",
              }}
            >
              {formatMatricule(item.matricule) || "N/A"}
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 6,
                backgroundColor: typeConfig.bg,
                border: `1px solid ${typeConfig.border}`,
                color: typeConfig.color,
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <span>{typeConfig.label}</span>
            </div>
          </div>

          <div
            style={{
              color: "rgba(255, 255, 255, 0.65)",
              fontSize: "0.82rem",
              marginTop: 12,
              wordBreak: "break-word",
              lineHeight: "1.35",
            }}
          >
            {item.message || "Aucune remarque spécifique."}
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          marginTop: 4,
          paddingTop: 10,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "5px 12px",
            borderRadius: 6,
            backgroundColor: `${statusColor}1a`,
            border: `1px solid ${statusColor}44`,
          }}
        >
          <span style={{ color: statusColor, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>
            {item.status || "Inconnu"}
          </span>
        </div>

        <div
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "0.8rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>{item.date}</span>
          <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>•</span>
          <span style={{ color: "#7fd8ff", fontWeight: 600 }}>{item.time}</span>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Helper Component: Skeleton Row
// ----------------------------------------------------------------------

const HistorySkeletonRow = ({ isLast }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "12px 10px",
      borderBottom: !isLast ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
    }}
  >
    <Skeleton
      variant="circular"
      width={45}
      height={45}
      sx={{ bgcolor: "rgba(255,255,255,0.08)", flexShrink: 0 }}
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <Skeleton
        variant="text"
        width="55%"
        height={18}
        sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
      />
      <Skeleton
        variant="text"
        width="35%"
        height={14}
        sx={{ bgcolor: "rgba(255,255,255,0.06)", marginTop: 0.3 }}
      />
    </div>
    <Skeleton
      variant="rounded"
      width={50}
      height={20}
      sx={{ bgcolor: "rgba(255,255,255,0.08)", flexShrink: 0, borderRadius: "10px" }}
    />
  </div>
);

// ----------------------------------------------------------------------
// Component 2: ProfileHistoryCard
// ----------------------------------------------------------------------

const ProfileHistoryCard = ({
  history = [],
  selectedItem,
  onSelectItem,
  statusColors = DEFAULT_STATUS_COLORS,
  height = 440,
  loading = false,
  skeletonRows = 6,
  minSkeletonDuration = 2000,
}) => {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), minSkeletonDuration);
    return () => clearTimeout(timer);
  }, [minSkeletonDuration]);

  const showSkeleton = loading || !minTimeElapsed;

  return (
    <div
      style={{
        width: 520,
        height,
        minWidth: 280,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 14,
        fontFamily: "'Roboto Mono', monospace",
        boxSizing: "border-box",
        padding: "26px 24px 30px 24px",
        overflow: "hidden",
      }}
    >
      <Typography
        sx={{
          color: "#ffffff",
          fontFamily: "'Roboto Mono', monospace",
          fontSize: "1.1rem",
          fontWeight: 700,
          marginBottom: 1.5,
          flexShrink: 0,
        }}
      >
        Récent
      </Typography>

      {showSkeleton ? (
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", paddingRight: 6, paddingLeft: 4 }}>
          {Array.from({ length: skeletonRows }).map((_, index) => (
            <HistorySkeletonRow key={index} isLast={index === skeletonRows - 1} />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: "rgba(255, 255, 255, 0.4)",
            textAlign: "center",
          }}
        >
          <HistoryIcon sx={{ fontSize: "2.5rem", opacity: 0.5 }} />
          <Typography
            sx={{
              fontFamily: "'Roboto Mono', monospace",
              fontSize: "0.85rem",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            Aucun historique récent.
          </Typography>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: 6,
            paddingLeft: 4,
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.2) transparent",
          }}
          className="profile-history-scroll"
        >
          {history.map((item, index) => {
            const statusColor = statusColors[item.status] ?? "#9fb8c9";
            const isLast = index === history.length - 1;
            const isSelected = selectedItem?.id === item.id;
            const typeConfig = getTypeConfig(item.type_pointage);

            return (
              <div
                key={item.id || index}
                onClick={() => onSelectItem?.(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 10px",
                  cursor: "pointer",
                  borderRadius: 8,
                  backgroundColor: isSelected ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  transition: "background-color 0.2s ease",
                  borderBottom: !isLast ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
                }}
              >
                {/* Avatar + Status Indicator */}
                <div style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
                  <Avatar
                    src={item.photo}
                    sx={{
                      width: 45,
                      height: 45,
                      backgroundColor: "#2a3b4c",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: statusColor,
                      border: "2px solid #0f2337",
                      boxShadow: `0 0 6px ${statusColor}aa`,
                    }}
                  />
                </div>

                {/* Identity Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block",
                    }}
                  >
                   {formatMatricule(item.matricule)}
                  </span>

                  <div style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.72rem", marginTop: 3 }}>
                    {item.date}
                  </div>
                </div>

                {/* Type Tag & Time */}
                <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
                  <Tooltip title={typeConfig.label} arrow placement="top">
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: typeConfig.bg,
                        color: typeConfig.color,
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        flexShrink: 0,
                        userSelect: "none",
                      }}
                    >
                      {typeConfig.symbol}
                    </span>
                  </Tooltip>

                  <span style={{ color: "#7fd8ff", fontSize: "0.82rem", fontWeight: 600,fontFamily: "monospace",  }}>
                    {item.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileHistoryCard;