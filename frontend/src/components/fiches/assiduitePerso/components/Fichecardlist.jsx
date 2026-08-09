import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import FicheCard from "./FicheCard";

const FicheCardList = ({
  filteredPersonnels,
  types,
  fetchRetardDetails,
  setSelectedRetardDates,
  loading,
  ready,
}) => {
  if (loading || !ready) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          py: 6,
        }}
      >
        <CircularProgress size={28} sx={{ color: "#1B6979" }} />
        <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
          Chargement...
        </Typography>
      </Box>
    );
  }

  if (!filteredPersonnels.length) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
          Aucune donnée d'assiduité pour cette période.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ p: 1.5 }}>
      {filteredPersonnels.map((record) => (
        <FicheCard
          key={record.idpointage || record.matricule}
          record={record}
          types={types}
          fetchRetardDetails={fetchRetardDetails}
          setSelectedRetardDates={setSelectedRetardDates}
        />
      ))}
    </Stack>
  );
};

export default FicheCardList;