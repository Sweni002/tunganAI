import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const InfoRow = ({ label, children }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.4 }}>
    <Typography sx={{ fontSize: "0.7rem", color: "#718096" }}>{label}</Typography>
    <Box
      sx={{
        fontSize: "0.78rem",
        color: "#2D3748",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      {children}
    </Box>
  </Box>
);

/**
 * Reproduit la logique de statut des colonnes "columns2" (vue bureau) :
 * 1. abbr → absence justifiée (bleu, italique)
 * 2. absence sans entrée → absence non justifiée (rouge)
 * 3. absence sans sortie → sortie non enregistrée (rouge)
 * 4. sinon → "---"
 */
function getStatut(absence, abbr, entree, sortie) {
  if (abbr) {
    return { text: abbr, color: "#1890ff", italic: true };
  }
  if (absence && !entree) {
    return { text: "Absence non justifiée", color: "#e53e3e" };
  }
  if (absence && !sortie) {
    return { text: "Sortie non enregistrée", color: "#e53e3e" };
  }
  return { text: "---", color: "#A0AEC0" };
}

const HalfDaySection = ({ title, entree, sortie, retard, retardMinutes, absence, abbr }) => {
  const statut = getStatut(absence, abbr, entree, sortie);

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: "0.68rem",
          fontWeight: 700,
          color: "#4A5568",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          mb: 0.5,
        }}
      >
        {title}
      </Typography>

      <InfoRow label="Entrée">{entree ?? "---"}</InfoRow>
      <InfoRow label="Sortie">{sortie ?? "---"}</InfoRow>
      <InfoRow label="Retard">
        {retard ? (
          <>
            <CheckCircleIcon sx={{ fontSize: 14, color: "#FFA500" }} />
            {retardMinutes ? `${retardMinutes} min` : ""}
          </>
        ) : (
          "---"
        )}
      </InfoRow>
      <InfoRow label="Statut">
        <span style={{ color: statut.color, fontStyle: statut.italic ? "italic" : "normal" }}>
          {statut.text}
        </span>
      </InfoRow>
    </Box>
  );
};

const RetardCardBureau = ({ record }) => {
  const dateLabel = record.date ? new Date(record.date).toLocaleDateString("fr-FR") : "—";

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
      <CardContent sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
            borderBottom: "1px solid #EDF2F7",
            pb: 1,
          }}
        >
          <Typography sx={{ fontWeight: 700, color: "#1A202C", fontSize: "0.9rem" }}>
            {dateLabel}
          </Typography>
          {(record.nom || record.prenom) && (
            <Typography sx={{ fontSize: "0.72rem", color: "#718096" }}>
              {record.nom} {record.prenom}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <HalfDaySection
            title="Matin"
            entree={record.matin?.entree}
            sortie={record.matin?.sortie}
            retard={record.matin?.retard}
            retardMinutes={record.retard_matin_minutes}
            absence={record.matin?.absence}
            abbr={record.absence_matin_abbr}
          />
          <Divider orientation="vertical" flexItem />
          <HalfDaySection
            title="Après-midi"
            entree={record.apresmidi?.entree}
            sortie={record.apresmidi?.sortie}
            retard={record.apresmidi?.retard}
            retardMinutes={record.retard_soir_minutes}
            absence={record.apresmidi?.absence}
            abbr={record.absence_soir_abbr}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default RetardCardBureau;
