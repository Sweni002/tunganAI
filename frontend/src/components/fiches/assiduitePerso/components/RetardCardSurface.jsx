import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const InfoRow = ({ label, children }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.4 }}>
    <Typography sx={{ fontSize: "0.7rem", color: "#718096" }}>{label}</Typography>
    <Box sx={{ fontSize: "0.78rem", color: "#2D3748", fontWeight: 600 }}>{children}</Box>
  </Box>
);

/**
 * Reproduit la logique de statut de la colonne "absence_surface" (vue surface) :
 * 1. absence_surface renseignée → absence justifiée (bleu, italique)
 * 2. absence sans justif ni entrée → absence non justifiée (rouge)
 * 3. absence sans sortie → sortie non enregistrée (rouge)
 * 4. sinon → "---"
 */
function getSurfaceStatut(record) {
  const { absence_unique, absence_surface, heure_entree_unique, heure_sortie_unique } = record;

  if (absence_surface) {
    return { text: absence_surface, color: "#1890ff", italic: true };
  }
  if (absence_unique && !absence_surface && !heure_entree_unique) {
    return { text: "Absence non justifiée", color: "#e53e3e" };
  }
  if (absence_unique && !heure_sortie_unique) {
    return { text: "Sortie non enregistrée", color: "#e53e3e" };
  }
  return { text: "---", color: "#A0AEC0" };
}

const RetardCardSurface = ({ record }) => {
  const dateLabel = record.date ? new Date(record.date).toLocaleDateString("fr-FR") : "—";
  const statut = getSurfaceStatut(record);
  const isPresent = !record.absence_unique && record.heure_entree_unique;

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ mb: 1.5, borderBottom: "1px solid #EDF2F7", pb: 1 }}>
          <Typography sx={{ fontWeight: 700, color: "#1A202C", fontSize: "0.9rem" }}>
            {record.nom || "—"}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "#718096" }}>
            {record.matricule}
            {record.division ? ` · ${record.division}` : ""}
          </Typography>
        </Box>

        <InfoRow label="Date">{dateLabel}</InfoRow>
        <InfoRow label="Entrée">{record.heure_entree_unique ?? "---"}</InfoRow>
        <InfoRow label="Sortie">{record.heure_sortie_unique ?? "---"}</InfoRow>
        <InfoRow label="Présence">
          <span style={{ color: isPresent ? "#2DAC60" : "#A0AEC0" }}>
            {isPresent ? "Présent" : "---"}
          </span>
        </InfoRow>
        <InfoRow label="Absent">
          <span style={{ color: record.absence_unique ? "#e53e3e" : "#A0AEC0" }}>
            {record.absence_unique ? "Absent" : "---"}
          </span>
        </InfoRow>
        <InfoRow label="Statut">
          <span style={{ color: statut.color, fontStyle: statut.italic ? "italic" : "normal" }}>
            {statut.text}
          </span>
        </InfoRow>
      </CardContent>
    </Card>
  );
};

export default RetardCardSurface;
