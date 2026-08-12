// src/pages/Login/ProfileHistoryCard.jsx

import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import PsychologyIcon from "@mui/icons-material/Psychology";
import HistoryIcon from "@mui/icons-material/History";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import { keyframes } from "@mui/system";

// ----------------------------------------------------------------------
// Animations personnalisées
// ----------------------------------------------------------------------

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const glowPulse = keyframes`
  0% { box-shadow: 0 0 5px rgba(56, 189, 248, 0.2); }
  50% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.5); }
  100% { box-shadow: 0 0 5px rgba(56, 189, 248, 0.2); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

const shimmerGradient = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

// ----------------------------------------------------------------------
// Constants & Config Helpers
// ----------------------------------------------------------------------

export const DEFAULT_STATUS_COLORS = {
  Validé: "#22c55e",
  Inconnu: "#f59e0b",
  Erreur: "#ef4444",
  Présent: "#22c55e",
  Absent: "#ef4444",
  Retard: "#f59e0b",
  Congé: "#8b5cf6",
  En_attente: "#38bdf8",
};

const getTypeConfig = (type) => {
  const normalized = type?.toLowerCase() || "";
  const isEntree = normalized === "entree" || normalized === "entrée";

  return isEntree
    ? {
        label: "Entrée",
        symbol: "→",
        color: "#22c55e",
        bg: "rgba(34, 197, 94, 0.15)",
        border: "rgba(34, 197, 94, 0.35)",
        icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
      }
    : {
        label: "Sortie",
        symbol: "←",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.15)",
        border: "rgba(245, 158, 11, 0.35)",
        icon: <ScheduleIcon sx={{ fontSize: 14 }} />,
      };
};

// Fonction de formatage (ajoute un espace tous les 3 chiffres)
const formatMatricule = (val) => {
  if (!val) return "N/A";
  const str = String(val).replace(/\D/g, "");
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// ----------------------------------------------------------------------
// Component 1: HistoryDetailCard (amélioré)
// ----------------------------------------------------------------------

export const HistoryDetailCard = ({ item, onClose, statusColors = DEFAULT_STATUS_COLORS }) => {
  if (!item) return null;

  const statusColor = statusColors[item.status] ?? "#9fb8c9";
  const typeConfig = getTypeConfig(item.type_pointage);

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(18, 24, 38, 0.6)",
        borderRadius: 16,
        padding: "24px 24px 16px",
        marginBottom: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(12px)",
        fontFamily: "'Roboto Mono', monospace",
        animation: `${scaleIn} 0.4s cubic-bezier(0.4, 0, 0.2, 1) both`,
        overflow: "hidden",
      }}
    >
      {/* Effet de brillance en haut */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${typeConfig.color}44, ${typeConfig.color}88, ${typeConfig.color}44, transparent)`,
          opacity: 0.6,
        }}
      />

      {/* Header Badges & Actions */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(56, 189, 248, 0.1)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
          }}
        >
          <PsychologyIcon
            sx={{
              color: "#38bdf8",
              fontSize: "1.2rem",
              filter: "drop-shadow(0 0 8px rgba(56, 189, 248, 0.3))",
              animation: `${pulse} 3s ease-in-out infinite`,
            }}
          />
        </div>

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
              backgroundColor: "#1a2a3a",
              border: "2px solid rgba(255, 255, 255, 0.08)",
              boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
            }}
          >
            {!item.photo && (
              <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "#8da8be" }}>
                {item.matricule ? item.matricule.toString().slice(-2) : "?"}
              </span>
            )}
          </Avatar>
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
              boxShadow: `0 0 12px ${statusColor}88`,
              animation: `${pulse} 2s ease-in-out infinite`,
            }}
          />
        </div>

        <div style={{ minWidth: 0, paddingRight: 60, flex: 1 }}>
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
                padding: "3px 10px",
                borderRadius: 6,
                backgroundColor: typeConfig.bg,
                border: `1px solid ${typeConfig.border}`,
                color: typeConfig.color,
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                animation: `${pulse} 3s ease-in-out infinite`,
              }}
            >
              <span>{typeConfig.label}</span>
            </div>
          </div>

          <div
            style={{
              color: "rgba(255, 255, 255, 0.65)",
              fontSize: "0.82rem",
              marginTop: 10,
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
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px 14px",
            borderRadius: 8,
            backgroundColor: `${statusColor}1a`,
            border: `1px solid ${statusColor}33`,
            transition: "all 0.3s ease",
          }}
        >
          <span
            style={{
              color: statusColor,
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {item.status || "Inconnu"}
          </span>
        </div>

        <div
          style={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "0.8rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.2)" }} />
          <span>{item.date}</span>
          <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>•</span>
          <span style={{ color: "#7fd8ff", fontWeight: 600 }}>{item.time}</span>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Helper Component: Skeleton Row amélioré
// ----------------------------------------------------------------------

const HistorySkeletonRow = ({ isLast }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "12px 10px",
      borderBottom: !isLast ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
      animation: `${slideIn} 0.4s ease both`,
    }}
  >
    <Skeleton
      variant="circular"
      width={45}
      height={45}
      sx={{
        bgcolor: "rgba(255,255,255,0.06)",
        flexShrink: 0,
        animation: `${shimmerGradient} 1.5s linear infinite`,
        background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)",
        backgroundSize: "200% 100%",
      }}
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <Skeleton
        variant="text"
        width="55%"
        height={18}
        sx={{
          bgcolor: "rgba(255,255,255,0.06)",
          animation: `${shimmerGradient} 1.5s linear infinite 0.2s`,
          background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)",
          backgroundSize: "200% 100%",
        }}
      />
      <Skeleton
        variant="text"
        width="35%"
        height={14}
        sx={{
          bgcolor: "rgba(255,255,255,0.04)",
          marginTop: 0.3,
          animation: `${shimmerGradient} 1.5s linear infinite 0.4s`,
          background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)",
          backgroundSize: "200% 100%",
        }}
      />
    </div>
    <Skeleton
      variant="rounded"
      width={50}
      height={20}
      sx={{
        bgcolor: "rgba(255,255,255,0.06)",
        flexShrink: 0,
        borderRadius: "10px",
        animation: `${shimmerGradient} 1.5s linear infinite 0.6s`,
        background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)",
        backgroundSize: "200% 100%",
      }}
    />
  </div>
);

// ----------------------------------------------------------------------
// Component 2: ProfileHistoryCard (amélioré)
// ----------------------------------------------------------------------

const ProfileHistoryCard = ({
  history = [],
  selectedItem,
  onSelectItem,
  statusColors = DEFAULT_STATUS_COLORS,
  height = 440,
  loading = false,
  skeletonRows = 6
}) => {
 
  const [hoveredItem, setHoveredItem] = useState(null);

 
  const showSkeleton = loading ;

  return (
    <div
      style={{
        width: 520,
        height,
        minWidth: 280,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "rgba(18, 26, 36, 0.8)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: 16,
        fontFamily: "'Roboto Mono', monospace",
        boxSizing: "border-box",
        padding: "24px 24px 28px 24px",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
        transition: "all 0.3s ease",
        animation: `${scaleIn} 0.5s cubic-bezier(0.4, 0, 0.2, 1) both`,
      }}
    >
      {/* Effet de bordure supérieure */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.2), rgba(34, 197, 94, 0.2), transparent)",
          opacity: 0.6,
        }}
      />

      {/* En-tête avec compteur */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        
          <Typography
            sx={{
              color: "#f0f4f8",
              fontFamily: "'Roboto Mono', monospace",
              fontSize: "1.05rem",
              fontWeight: 700,
              letterSpacing: "0.3px",
            }}
          >
             Récent
          </Typography>
        </div>

      </div>

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
            gap: 16,
            color: "rgba(255, 255, 255, 0.3)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: `${float} 3s ease-in-out infinite`,
            }}
          >
            <HistoryIcon sx={{ fontSize: "2.5rem", opacity: 0.3 }} />
          </div>
          <Typography
            sx={{
              fontFamily: "'Roboto Mono', monospace",
              fontSize: "0.85rem",
              color: "rgba(255, 255, 255, 0.4)",
              letterSpacing: "0.5px",
            }}
          >
            Aucun historique récent.
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Roboto Mono', monospace",
              fontSize: "0.7rem",
              color: "rgba(255, 255, 255, 0.15)",
              letterSpacing: "0.3px",
            }}
          >
            Les pointages apparaîtront ici
          </Typography>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: 4,
            paddingLeft: 4,
            marginRight: 2,
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.08) transparent",
          }}
          className="profile-history-scroll"
        >
          {history.map((item, index) => {
            const statusColor = statusColors[item.status] ?? "#9fb8c9";
            const isLast = index === history.length - 1;
            const isSelected = selectedItem?.id === item.id;
            const isHovered = hoveredItem === item.id;
            const typeConfig = getTypeConfig(item.type_pointage);

            return (
              <div
                key={item.id || index}
                onClick={() => onSelectItem?.(item)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 10px",
                  cursor: "pointer",
                  borderRadius: 10,
                  backgroundColor: isSelected
                    ? "rgba(56, 189, 248, 0.1)"
                    : isHovered
                      ? "rgba(255, 255, 255, 0.03)"
                      : "transparent",
                  borderBottom: !isLast ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: isSelected ? "scale(1.01)" : "scale(1)",
                  boxShadow: isSelected ? "0 4px 20px rgba(56, 189, 248, 0.06)" : "none",
                  position: "relative",
                  animation: `${slideIn} 0.4s ease both ${index * 0.05}s`,
                }}
              >
                {/* Indicateur de sélection */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "15%",
                      height: "70%",
                      width: 3,
                      borderRadius: "0 4px 4px 0",
                      background: "linear-gradient(180deg, #38bdf8, #22c55e)",
                      animation: `${glowPulse} 2s ease-in-out infinite`,
                    }}
                  />
                )}

                {/* Avatar + Status Indicator */}
                <div style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
                  <Avatar
                    src={item.photo}
                    sx={{
                      width: 45,
                      height: 45,
                      backgroundColor: "#1a2a3a",
                      border: isSelected
                        ? "2px solid rgba(56, 189, 248, 0.3)"
                        : "1px solid rgba(255,255,255,0.06)",
                      transition: "all 0.3s ease",
                      boxShadow: isSelected ? "0 0 20px rgba(56, 189, 248, 0.1)" : "none",
                    }}
                  >
                    {!item.photo && (
                      <span style={{ fontSize: "1rem", fontWeight: 600, color: "#8da8be" }}>
                        {item.matricule ? item.matricule.toString().slice(-2) : "?"}
                      </span>
                    )}
                  </Avatar>
                  <span
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: statusColor,
                      border: "2px solid #121a24",
                      boxShadow: `0 0 8px ${statusColor}66`,
                      animation: `${pulse} 2s ease-in-out infinite`,
                    }}
                  />
                </div>

                {/* Identity Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        color: isSelected ? "#ffffff" : "#e8edf2",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: "color 0.3s ease",
                      }}
                    >
                      {formatMatricule(item.matricule)}
                    </span>
                    {item.nom && (
                      <span
                        style={{
                          color: "rgba(255,255,255,0.25)",
                          fontSize: "0.7rem",
                          fontWeight: 400,
                        }}
                      >
                        {item.nom}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <AccessTimeIcon sx={{ fontSize: 10, color: "rgba(255,255,255,0.12)" }} />
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.3)",
                        fontSize: "0.68rem",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {item.date}
                    </span>
                  </div>
                </div>

                {/* Type Tag & Time */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  <Tooltip
                    title={typeConfig.label}
                    arrow
                    placement="top"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: "rgba(18, 26, 36, 0.95)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "0.7rem",
                          fontFamily: "'Roboto Mono', monospace",
                          color: "#e0e8f0",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        },
                      },
                      arrow: {
                        sx: {
                          color: "rgba(18, 26, 36, 0.95)",
                        },
                      },
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: isSelected
                          ? typeConfig.bg
                          : "rgba(255,255,255,0.02)",
                        color: isSelected ? typeConfig.color : "rgba(255,255,255,0.25)",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        flexShrink: 0,
                        userSelect: "none",
                        transition: "all 0.3s ease",
                        border: isSelected
                          ? `1px solid ${typeConfig.color}33`
                          : "1px solid rgba(255,255,255,0.03)",
                        transform: isHovered ? "scale(1.1)" : "scale(1)",
                      }}
                    >
                      {typeConfig.symbol}
                    </div>
                  </Tooltip>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        color: isSelected ? "#7fd8ff" : "rgba(255,255,255,0.5)",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        fontFamily: "monospace",
                        transition: "color 0.3s ease",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {item.time}
                    </span>
                    {item.duree && (
                      <span
                        style={{
                          color: "rgba(255,255,255,0.12)",
                          fontSize: "0.55rem",
                          fontWeight: 400,
                        }}
                      >
                        {item.duree}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Styles CSS pour la scrollbar personnalisée
const scrollStyles = `
  .profile-history-scroll::-webkit-scrollbar {
    width: 3px;
  }
  .profile-history-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .profile-history-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    transition: background 0.3s ease;
  }
  .profile-history-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

// Injection des styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = scrollStyles;
  document.head.appendChild(styleSheet);
}

export default ProfileHistoryCard;