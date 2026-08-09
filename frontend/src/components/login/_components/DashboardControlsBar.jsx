// src/pages/Login/DashboardControlsBar.jsx

import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";

// Définition des couleurs actives
const COLOR_MAP = {
  green: {
    main: "#22c55e",
    border: "rgba(34, 197, 94, 0.6)",
    bg: "rgba(34, 197, 94, 0.15)",
    bgHover: "rgba(34, 197, 94, 0.22)",
    borderHover: "rgba(34, 197, 94, 0.8)",
    shadow: "0 0 15px rgba(34, 197, 94, 0.25), inset 0 0 10px rgba(34, 197, 94, 0.1)",
  },
  yellow: {
    main: "#f59e0b",
    border: "rgba(245, 158, 11, 0.6)",
    bg: "rgba(245, 158, 11, 0.15)",
    bgHover: "rgba(245, 158, 11, 0.22)",
    borderHover: "rgba(245, 158, 11, 0.8)",
    shadow: "0 0 15px rgba(245, 158, 11, 0.25), inset 0 0 10px rgba(245, 158, 11, 0.1)",
  },
};

const ControlButton = ({ icon, label, activeColor, disabled, onClick, tooltip }) => {
  const activeTheme = activeColor ? COLOR_MAP[activeColor] : null;

  const content = (
    <Box
      component="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        flex: 1,
        height: "100%", // S'adapte à la hauteur du conteneur parent
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.2,
        padding: "16px 12px",
        borderRadius: "12px",
        border: activeTheme
          ? `1px solid ${activeTheme.border}`
          : "1px solid rgba(255, 255, 255, 0.08)",
        backgroundColor: activeTheme
          ? activeTheme.bg
          : "rgba(255, 255, 255, 0.03)",
        color: activeTheme ? activeTheme.main : "#d1e4e8",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontFamily: "'Roboto Mono', monospace",
        fontSize: "0.78rem",
        fontWeight: 600,
        letterSpacing: "0.5px",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: activeTheme ? activeTheme.shadow : "none",
        outline: "none",
        "&:hover:not(:disabled)": {
          backgroundColor: activeTheme
            ? activeTheme.bgHover
            : "rgba(255, 255, 255, 0.08)",
          borderColor: activeTheme
            ? activeTheme.borderHover
            : "rgba(255, 255, 255, 0.2)",
          transform: "translateY(-2px)",
          color: activeTheme ? activeTheme.main : "#ffffff",
        },
        "&:active:not(:disabled)": {
          transform: "translateY(0)",
        },
      }}
    >
      <Box
        sx={{
          fontSize: "1.3rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 24,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontFamily: "'Roboto Mono', monospace",
          fontSize: "0.72rem",
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  return tooltip ? <Tooltip title={tooltip} arrow>{content}</Tooltip> : content;
};

// Bouton "squelette" reproduisant la structure d'un ControlButton réel
const ControlButtonSkeleton = () => (
  <Box
    sx={{
      flex: 1,
      height: "100%", // S'adapte à la hauteur du conteneur parent
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 1.2,
      padding: "16px 12px",
      borderRadius: "12px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      backgroundColor: "rgba(255, 255, 255, 0.03)",
    }}
  >
    <Skeleton
      variant="circular"
      width={24}
      height={24}
      sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
    />
    <Skeleton
      variant="text"
      width={48}
      height={14}
      sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
    />
  </Box>
);

/**
 * Bandeau "Controls" amélioré pour l'interface de pointage
 */
const DashboardControlsBar = ({
  active,
  startingPointage,
  modelsLoaded,
  onHandleClick,
  onStartPointage,
  minSkeletonDuration = 2000,
  height = 160, // Hauteur personnalisable par prop (160px par défaut)
}) => {
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), minSkeletonDuration);
    return () => clearTimeout(timer);
  }, [minSkeletonDuration]);

  return (
    <Box
      sx={{
        marginTop: 2,
        height: height, // Fixe la hauteur totale du panneau
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "rgba(18, 26, 36, 0.6)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "20px 24px",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }}
    >
      {/* En-tête de la carte */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            color: "#8da8be",
            fontFamily: "'Roboto Mono', monospace",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
          }}
        >
          Panneau de contrôle
        </Typography>

        {/* Status des modèles IA */}
        {showSkeleton ? (
          <Skeleton
            variant="text"
            width={90}
            height={16}
            sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
          />
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: modelsLoaded ? "#00e676" : "#ff9100",
                boxShadow: modelsLoaded
                  ? "0 0 8px #00e676"
                  : "0 0 8px #ff9100",
              }}
            />
            <Typography
              sx={{
                color: modelsLoaded ? "#a0b2c6" : "#ff9100",
                fontFamily: "'Roboto Mono', monospace",
                fontSize: "0.65rem",
              }}
            >
              {modelsLoaded ? "IA Prête" : "Chargement IA..."}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Grille de boutons (remplit l'espace restant) */}
      <Box sx={{ display: "flex", gap: 2, flex: 1, minHeight: 0 }}>
        {showSkeleton ? (
          <>
            <ControlButtonSkeleton />
            <ControlButtonSkeleton />
            <ControlButtonSkeleton />
          </>
        ) : (
          <>
            {/* Entrée : Vert (#22c55e) si actif */}
            <ControlButton
              icon={<i className="fa-solid fa-right-to-bracket" />}
              label="Entrée"
              activeColor={active === "entree" ? "green" : null}
              disabled={startingPointage}
              onClick={() => onHandleClick("entree")}
            />

            {/* Sortie : Jaune (#f59e0b) si actif */}
            <ControlButton
              icon={<i className="fa-solid fa-door-open" />}
              label="Sortie"
              activeColor={active === "logout" ? "yellow" : null}
              disabled={startingPointage}
              onClick={() => onHandleClick("logout")}
            />

            <ControlButton
              icon={
                startingPointage ? (
                  <CircularProgress size={20} thickness={5} sx={{ color: "#4fd8ff" }} />
                ) : (
                  <i className="fa-solid fa-expand" />
                )
              }
              label={startingPointage ? "Vérification..." : "Pointage"}
              activeColor={null}
              disabled={startingPointage || !modelsLoaded}
              onClick={onStartPointage}
              tooltip={!modelsLoaded ? "Veuillez patienter pendant le chargement des modèles" : ""}
            />
          </>
        )}
      </Box>
    </Box>
  );
};

export default DashboardControlsBar;