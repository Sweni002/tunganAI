import React from "react";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";

const ExportSnackbar = ({ openSnack, setOpenSnack, snackMessage }) => (
  <Snackbar
    open={openSnack}
    autoHideDuration={4000}
    onClose={() => setOpenSnack(false)}
    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
  >
    <SnackbarContent
      sx={{ p: 1, px: 3, fontSize: "0.8rem", color: "white" }}
      message={<span>{snackMessage}</span>}
    />
  </Snackbar>
);

export default ExportSnackbar;
