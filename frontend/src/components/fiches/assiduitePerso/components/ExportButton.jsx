import React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { Tooltip, Spin } from "antd";

const ExportButton = ({ loadingPdf1, exportExcel }) => (
  <Tooltip title="Exporter en Excel" arrow>
    <Box
      onClick={exportExcel}
      aria-label="Exporter en Excel"
      sx={{
        display: "inline-flex",
        cursor: "pointer",
      }}
    >
      <IconButton
        size="large"
        disabled={loadingPdf1}
        sx={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          backgroundColor: "#F8F9FA",
          border: "1px solid #E9ECEF",
          color: "#1B6979",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: "#EDF2F7",
            transform: "scale(1.05)",
          },
        }}
      >
        {loadingPdf1 ? (
          <Spin size="default" />
        ) : (
          <i className="fa-solid fa-download" style={{ fontSize: "0.8rem" }}></i>
        )}
      </IconButton>
    </Box>
  </Tooltip>
);

export default ExportButton;