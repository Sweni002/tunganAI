import { useState } from "react";

export const useSnackbar = () => {
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbarState({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbarState(prev => ({ ...prev, open: false }));
  };

  return {
    snackbarState,
    showSnackbar,
    handleCloseSnackbar
  };
};