import React from "react";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export const StatTile = ({ label, value, backgroundColor, dates, icon, onOpenDetails }) => {
  const hasDates = Array.isArray(dates) && dates.length > 0;

  return (
    <ButtonBase
      onClick={() => hasDates && onOpenDetails(dates)}
      disabled={!hasDates}
      sx={{
        width: "100%",
        borderRadius: 3,
        backgroundColor: hasDates ? backgroundColor : "#fcfcfc",
        border: "1px solid",
        borderColor: hasDates ? "transparent" : "#eee",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        py: 1.5,
        position: "relative",
        opacity: hasDates ? 1 : 0.7,
        transition: "all 0.2s ease",
        "&:active": { transform: "scale(0.98)" }
      }}
    >
      {icon && <Box sx={{ mb: 0.5, color: "#1B6979", opacity: 0.8 }}>{icon}</Box>}
      <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#1B6979", lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", textAlign: "center", px: 0.5 }}>
        {label}
      </Typography>
      {hasDates && (
        <ChevronRightIcon sx={{ fontSize: 16, position: "absolute", bottom: 4, right: 4, color: "#1B6979" }} />
      )}
    </ButtonBase>
  );
};