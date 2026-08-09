// components/ServiceSnackbar.jsx
import React from "react";
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import SnackbarContent from '@mui/material/SnackbarContent';
import Button from "@mui/material/Button";

const ServiceSnackbar = ({ 
  open, 
  message, 
  severity = "success", 
  onClose, 
  onViewServices 
}) => {
  const action = (
    <>
      {severity === "success" && (
        <Button 
          color="inherit" 
          size="medium" 
          onClick={onViewServices}
          sx={{ p: 1, fontSize: 17, color: 'white' }}
        >
          Voir
        </Button>
      )}
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={onClose}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
          transition: 'background-color 0.3s',
        }}
      >
        <CloseIcon fontSize="medium" />
      </IconButton>
    </>
  );

  const getBackgroundColor = () => {
    switch(severity) {
      case 'error':
        return '#f44336';
      case 'success':
        return '#14535f';
      default:
        return '#14535f';
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <SnackbarContent
        sx={{
          p: 1,
          px: 3,
          fontSize: "17px",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 3,
          backgroundColor: getBackgroundColor(),
          color: 'white',
          borderRadius: '8px'
        }}
        message={
          <span style={{ marginRight: 8, fontSize: "0.95rem" }}>
            {message}
          </span>
        }
        action={action}
      />
    </Snackbar>
  );
};

export default ServiceSnackbar;