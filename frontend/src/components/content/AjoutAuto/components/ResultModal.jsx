import React from "react";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Lottie from "lottie-react";
// ⚠️ Ajuster le chemin des assets en fonction de l'emplacement final du dossier AjoutAuto/
import SuccessLottie from "../../../../assets/success.json";
import ErrorLottie from "../../../../assets/error.json";
import { BootstrapDialog2 } from "./BootstrapDialogs";

const ResultModal = ({ open, onClose, resultType, message }) => {
  return (
    <BootstrapDialog2
      open={open}
      onClose={onClose}
      PaperProps={{ style: { textAlign: "center", padding: 10 } }}
    >
      <DialogContent>
        <Lottie
          animationData={resultType === "success" ? SuccessLottie : ErrorLottie}
          loop={false}
          style={{ width: 250, height: 170, margin: "0 auto" }}
        />
        <Typography variant="h7" sx={{ mt: 4, fontFamily: "'Poppins', sans-serif" }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: "transparent",
            borderRadius: 4,
            border: "none",
            color: "#238a8aff",
            p: 1.5,
            letterSpacing: 2,
            fontWeight: "boldy",
          }}
        >
          ok
        </Button>
      </DialogActions>
    </BootstrapDialog2>
  );
};

export default ResultModal;