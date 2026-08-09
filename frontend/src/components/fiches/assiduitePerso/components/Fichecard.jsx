import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

/**
 * Tuile de statistique sobre et élégante.
 * `position: relative` est nécessaire pour ancrer correctement le chevron
 * (position: absolute) DANS la tuile plutôt que dans un ancêtre positionné.
 */
const StatTile = ({ label, value, dates, icon, onOpenDetails }) => {
  const hasDates = Array.isArray(dates) && dates.length > 0;
  const clickable = hasDates && typeof onOpenDetails === "function";

  return (
    <ButtonBase
      onClick={() => clickable && onOpenDetails(dates)}
      disabled={!clickable}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        borderRadius: 2,
        backgroundColor: "#F8F9FA",
        border: "1px solid #E9ECEF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        py: 1.5,
        px: 1,
        minHeight: 75,
        fontFamily: "'Poppins', sans-serif",
        opacity: clickable ? 1 : 0.6,
        transition: "all 0.2s ease",
        "&:hover": clickable ? { backgroundColor: "#EDF2F7" } : {},
      }}
    >
      {icon && <Box sx={{ color: "#4A5568", display: "flex", mb: 0.25 }}>{icon}</Box>}
      <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#2D3748", lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.65rem",
          color: "#718096",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Typography>
      {clickable && (
        <ChevronRightIcon
          sx={{ fontSize: 14, position: "absolute", bottom: 4, right: 4, color: "#A0AEC0" }}
        />
      )}
    </ButtonBase>
  );
};

const FicheCard = ({ record, types, fetchRetardDetails, setSelectedRetardDates }) => {
  const handleOpenDetails = (dates) => {
    const cleaned = dates.map((d) => d.replace(/\s+(matin|après-midi)$/, ""));
    fetchRetardDetails(cleaned);
    setSelectedRetardDates(cleaned);
  };

  return (
    <Card
      elevation={0}
      sx={{ borderRadius: 3, border: "1px solid #E2E8F0", mb: 2, fontFamily: "'Poppins', sans-serif" }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* En-tête de la carte */}
        <Box sx={{ mb: 2, borderBottom: "1px solid #EDF2F7", pb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, color: "#1A202C", fontSize: "0.95rem" }}>
            {record.nom || "Collaborateur"}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#718096" }}>
            Matricule : {record.matricule}
          </Typography>
        </Box>

        {/* Grille CSS à colonnes strictement égales (1fr 1fr) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1.5,
          }}
        >
          <StatTile
            label="Retards"
            value={record.retards?.nombre ?? 0}
            dates={record.retards?.dates}
            icon={<AccessTimeIcon fontSize="small" />}
            onOpenDetails={handleOpenDetails}
          />

          <StatTile
            label="Volume (min)"
            value={`${record.total_retard_minutes ?? 0} min`}
            icon={<AccessTimeIcon fontSize="small" />}
          />

          <StatTile
            label="JA Non Justif."
            value={record.absences?.non_justifiees?.nombre ?? 0}
            dates={record.absences?.non_justifiees?.dates}
            icon={<WarningAmberIcon fontSize="small" />}
            onOpenDetails={handleOpenDetails}
          />

          {types.map((type) => {
            const abs = record.absences_par_type?.find((a) => a.idtype === type.idtype) || {
              nombre: 0,
              dates: [],
            };
            return (
              <StatTile
                key={type.idtype}
                label={type.nomtype}
                value={abs.nombre}
                dates={abs.dates}
                icon={<EventBusyIcon fontSize="small" />}
                onOpenDetails={handleOpenDetails}
              />
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export default FicheCard;