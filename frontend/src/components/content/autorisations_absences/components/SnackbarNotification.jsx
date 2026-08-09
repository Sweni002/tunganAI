import React from "react";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";

const SnackbarNotification = ({
  open,
  message,
  onClose,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <SnackbarContent
        sx={{
          p: 1,
          px: 3,
          fontSize: "0.8rem",
          color: "white",
        }}
        message={<span>{message}</span>}
      />
    </Snackbar>
  );
};

export default SnackbarNotification;