import React from "react";
import { Modal, Box } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import BeatLoader from "react-spinners/BeatLoader";
import Webcam from "react-webcam";
import {
  styleScannerFrame,
  cornerTlHorizontal,
  cornerTlVertical,
  cornerTrHorizontal,
  cornerTrVertical,
  cornerBlHorizontal,
  cornerBlVertical,
  cornerBrHorizontal,
  cornerBrVertical,
} from "../styles";

// JSX et styles inline strictement identiques à la modale webcam
// de AjoutPerso.jsx d'origine.
const WebcamCaptureModal = ({
  open,
  onClose,
  webcamRef,
  canvasRef,
  webcamReady,
  webcamLoading,
  capturing,
  scanning,
  handleCapture,
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          backgroundColor: "transparent",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Close icon */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 70,
            right: "27%",
            color: "white",
            zIndex: 10,
          }}
        >
          <CloseIcon sx={{ fontSize: "2.5rem" }} />
        </IconButton>

        {/* Webcam */}
        <Box
          sx={{
            backgroundColor: "transparent",

            width: "80vw",
            maxWidth: "700px",
            position: "relative",
            p: 0, // pas de padding
            m: 0, // pas de margin
            display: "flex",
            flexDirection: "column",
          }}
        >
          {webcamLoading && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <BeatLoader color="#00c4cc" />
            </Box>
          )}

          {/* Webcam */}
          <Box sx={{ position: "relative", width: "100%", m: 0, p: 0, mb: 3 }}>
            {!webcamReady && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 5,
                }}
              >
                <span className="ajout-perso-loader2"></span>
              </Box>
            )}
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              style={{
                width: "100%",
                aspectRatio: "4 / 3",
                display: "block",
              }} // block pour enlever gap inline
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />

            <div style={styleScannerFrame}>
              <div style={cornerTlHorizontal}></div>
              <div style={cornerTlVertical}></div>

              <div style={cornerTrHorizontal}></div>
              <div style={cornerTrVertical}></div>

              <div style={cornerBlHorizontal}></div>
              <div style={cornerBlVertical}></div>

              <div style={cornerBrHorizontal}></div>
              <div style={cornerBrVertical}></div>

              {scanning && <div style={{ position: "absolute" }}></div>}
            </div>
          </Box>
          <Button
            fullWidth
            onClick={handleCapture}
            disabled={capturing}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",

              borderRadius: "35px",
              color: "white",
              fontSize: "1.0rem",
              fontWeight: 500,
              textTransform: "none",
              transition: "all 0.3s ease",
              display: "flex", // 🔹 nécessaire pour centrer le loader
              alignItems: "center",
              justifyContent: "center", // 🔹 centrer horizontalement
              height: "50px", // 🔹 fixe la hauteur du bouton
              "&:hover": {
                opacity: 0.9,
                backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
              },
            }}
          >
            {capturing ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  color: "white",
                }}
              >
                <span className="ajout-perso-loader"></span>
              </Box>
            ) : (
              <>Capturer</>
            )}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default WebcamCaptureModal;