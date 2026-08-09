import React from "react";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";

export default function PersonnelsSnackbar({ openSnack, setOpenSnack, snackMessage }) {
  return (
    <Snackbar
      open={openSnack}
      autoHideDuration={4000}
      onClose={() => setOpenSnack(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <SnackbarContent
        sx={{ p: 1, px: 3, fontSize: "0.75rem", color: "white" }}
        message={<span>{snackMessage}</span>}
      />
    </Snackbar>
  );
}