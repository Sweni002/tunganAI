// src/pages/Responsable/AjoutRespo.jsx

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";
import CloseIcon from "@mui/icons-material/Close";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { ThreeDot } from "react-loading-indicators";

// Composants
import ResponsableForm from "./ResponsableForm";
import PhotoUpload from "./PhotoUpload";
import WebcamCapture from "./WebcamCapture";
import DivisionSelector from "./DivisionSelector";

// Hooks
import { useResponsableForm } from "./hooks/useResponsableForm";
import { useServicesAndDivisions } from "./hooks/useServicesAndDivisions";
import { useFaceDetection } from "./hooks/useFaceDetection";

// Services
import { responsableService } from "./service/responsableService";

// Utils
import { generatePassword, dataURLtoFile } from "./utils/helpers";

// Styles
import styles from "./ajout_perso.module.css";
import Perso from "../../../assets/v3.png";

const API_URL = import.meta.env.VITE_API_URL;

const AjoutRespo = () => {
  const navigate = useNavigate();
  const { formData, errors, setErrors, validateForm, updateField, resetForm } = useResponsableForm();
  const {
    services,
    divisions,
    loadingDivisions,
    selectedService,
    setSelectedService,
    selectedDivision,
    setSelectedDivision,
  } = useServicesAndDivisions();

  const { detectFaceFromImage, setFaceDescriptor } = useFaceDetection();
  
  const [loading, setLoading] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [openWebcam, setOpenWebcam] = useState(false);
  const [openDivisionDialog, setOpenDivisionDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("warning");

  // Générer le mot de passe par défaut
  React.useEffect(() => {
    updateField("password", generatePassword());
  }, []);

  const handleCreateResponsable = async () => {
    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append("matricule", formData.matricule);
    formDataToSend.append("nom", formData.nom);
    formDataToSend.append("prenom", formData.prenom);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("iddiv", formData.selectedDivision);
    formDataToSend.append("idserv", formData.selectedService);
    formDataToSend.append("mot_de_passe", formData.password);
    
    if (formData.selectedImage) {
      formDataToSend.append("image", formData.selectedImage);
    }
    if (formData.faceDescriptor) {
      formDataToSend.append("faceapi_descriptor", JSON.stringify(formData.faceDescriptor));
    }

    try {
      const data = await responsableService.createResponsable(formDataToSend);
      setSnackbarMsg(data.message || "Responsable ajouté avec succès");
      setOpenSnack(true);
      resetForm();
    } catch (error) {
      setSnackbarMsg(error.message || "Erreur lors de l'ajout");
      setOpenSnack(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      alert("Format non supporté. Utilisez JPEG, JPG ou PNG.");
      return;
    }

    updateField("selectedImage", file);
    const previewURL = URL.createObjectURL(file);
    updateField("preview", previewURL);

    // Détection faciale
    try {
      const img = new Image();
      img.src = previewURL;
      img.onload = async () => {
        const detection = await detectFaceFromImage(img);
        if (!detection) {
          setSnackbarMessage("Aucun visage détecté dans l'image.");
          setSnackbarSeverity("warning");
          setSnackbarOpen(true);
          setFaceDescriptor(null);
          updateField("faceDescriptor", null);
          return;
        }
        const descriptorArray = Array.from(detection.descriptor);
        setFaceDescriptor(descriptorArray);
        updateField("faceDescriptor", descriptorArray);
      };
    } catch (err) {
      console.error("Erreur détection visage :", err);
      setFaceDescriptor(null);
      updateField("faceDescriptor", null);
    }
  };

  const handleWebcamCaptureSuccess = (imageSrc, imageFile, faceDescriptor) => {
    updateField("preview", imageSrc);
    updateField("selectedImage", imageFile);
    updateField("faceDescriptor", faceDescriptor);
    setFaceDescriptor(faceDescriptor);
  };

  const handleWebcamCaptureError = (message) => {
    setSnackbarMessage(message);
    setSnackbarSeverity("warning");
    setSnackbarOpen(true);
  };

  const handleServiceChange = (e) => {
    const value = e.target.value;
    setSelectedService(value);
    setSelectedDivision(null);
    updateField("selectedService", value);
    updateField("selectedDivision", null);
  };

  const handleDivisionChange = (e) => {
    const value = e.target.value;
    setSelectedDivision(value);
    updateField("selectedDivision", value);
  };

  const goBack = () => navigate(-1);

  const handleCloseSnack = () => setOpenSnack(false);

  const snackbarAction = (
    <>
      <Button 
        color="primary" 
        size="medium" 
        onClick={() => {
          setOpenSnack(false);
          navigate("/global/responsable");
        }}
        sx={{ p: 1, fontSize: 17 }}
      >
        Voir
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleCloseSnack}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            color: '#f44336',
          },
          transition: 'background-color 0.3s, color 0.3s',
        }}
      >
        <CloseIcon fontSize="medium" />
      </IconButton>
    </>
  );

  return (
    <div className={styles.personnels}>
      {/* Breadcrumbs */}
      <div className={styles.break}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" sx={{ fontSize: "0.9rem" }}>
            Responsable
          </Link>
          <Typography sx={{ color: "text.primary", fontSize: "0.9rem" }}>
            Ajout
          </Typography>
        </Breadcrumbs>
      </div>

      {/* Card principal */}
      <div className={styles.card}>
        <div className={styles.container}>
          <div className={styles.retour} onClick={goBack}>
            <IconButton size="large">
              <i className="fa-solid fa-arrow-left"></i>
            </IconButton>
          </div>

          <div className={styles.sary}>
            <div className={styles.sary1}>
              <img src={Perso} alt="" />
            </div>
          </div>

          <ResponsableForm
            formData={formData}
            errors={errors}
            updateField={updateField}
            services={services}
            divisions={divisions}
            selectedService={selectedService}
            selectedDivision={selectedDivision}
            onServiceChange={handleServiceChange}
            onDivisionChange={handleDivisionChange}
          >
            <PhotoUpload
              preview={formData.preview}
              onFileChange={handleFileChange}
              onOpenWebcam={() => setOpenWebcam(true)}
              error={errors.photo}
            />
          </ResponsableForm>

          {/* Bouton sauvegarder */}
          <div className={styles.btn}>
            <Button
              variant="contained"
              fullWidth
              disabled={loading}
              onClick={() => {
                if (validateForm()) {
                  handleCreateResponsable();
                }
              }}
              sx={{
                "&.Mui-disabled": {
                  backgroundColor: "#14535f",
                  color: "#fff",
                  opacity: 0.7,
                },
                fontFamily: "'Poppins', sans-serif",
                backgroundColor: "#14535f",
                fontSize: "0.9rem",
                mb: 1,
                display: "flex",
                gap: 2,
                py: 1.0,
                borderRadius: "4px",
                justifyContent: "center",
                border: "none",
                textTransform: "none",
                transition: "all 0.3s ease",
              }}
            >
              {loading ? (
                <span className={styles.loader}></span>
              ) : (
                <>
                  <i className="fa-solid fa-plus" style={{ fontSize: "1.1rem" }}></i>
                  <span>Sauvegarder</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Division Selector Dialog */}
      <DivisionSelector
        open={openDivisionDialog}
        onClose={() => setOpenDivisionDialog(false)}
        divisions={divisions}
        onSelect={(div) => {
          setSelectedDivision(div.iddiv);
          updateField("selectedDivision", div.iddiv);
          setOpenDivisionDialog(false);
        }}
        loading={loadingDivisions}
      />

      {/* Snackbar */}
      <Snackbar
        open={openSnack}
        autoHideDuration={5000}
        onClose={handleCloseSnack}
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
          }}
          message={<span style={{ marginRight: 8, fontSize: "0.9rem" }}>{snackbarMsg}</span>}
          action={snackbarAction}
        />
      </Snackbar>

      {/* Loading modal pour divisions */}
      {loadingDivisions && (
        <Modal open={loadingDivisions} disableEscapeKeyDown>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              borderRadius: 2,
              px: 4,
              py: 3,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ThreeDot color="#ffffff" size="medium" />
          </Box>
        </Modal>
      )}

      {/* Webcam Modal */}
      <WebcamCapture
        open={openWebcam}
        onClose={() => setOpenWebcam(false)}
        onCaptureSuccess={handleWebcamCaptureSuccess}
        onCaptureError={handleWebcamCaptureError}
      />

      {/* Snackbar pour erreurs */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ zIndex: 2000 }}
      >
        <MuiAlert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </div>
  );
};

// Composant MuiAlert (si non importé)
const MuiAlert = React.forwardRef((props, ref) => (
  <AlertSnackbar ref={ref} {...props} />
));

const AlertSnackbar = React.forwardRef((props, ref) => (
  <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
));

export default AjoutRespo;