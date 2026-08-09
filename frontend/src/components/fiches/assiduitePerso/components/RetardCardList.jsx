import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import RetardCardBureau from "./RetardCardBureau";
import RetardCardSurface from "./RetardCardSurface";

const RetardCardList = ({ dataSource, variant, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 4 }}>
        <CircularProgress size={26} sx={{ color: "#1B6979" }} />
        <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }}>Chargement...</Typography>
      </Box>
    );
  }

  if (!dataSource.length) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
          Aucun pointage trouvé pour ces dates.
        </Typography>
      </Box>
    );
  }

  const CardComponent = variant === "surface" ? RetardCardSurface : RetardCardBureau;

  return (
    <Stack spacing={1.5}>
      {dataSource.map((record) => (
        <CardComponent key={record.idpointage} record={record} />
      ))}
    </Stack>
  );
};

export default RetardCardList;
