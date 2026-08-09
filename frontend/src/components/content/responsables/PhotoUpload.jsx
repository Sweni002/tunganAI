// src/pages/Responsable/components/PhotoUpload.jsx

import React, { useRef } from "react";
import Button from "@mui/material/Button";
import styles from "./ajout_perso.module.css";

const PhotoUpload = ({ 
  preview, 
  onFileChange, 
  onOpenWebcam, 
  error 
}) => {
  const fileInputRef = useRef(null);

  const handleChooseFile = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={styles.inputM}>
      <label htmlFor="matricule">
        Photo <span style={{ color: "red" }}>*</span>
      </label>
      <span>Merci de selectionner un fichier JPEG, JPG ou PNG</span>

      <div className={styles.photos}>
        {preview && (
          <div className={styles.img1}>
            <img src={preview} alt="preview" />
          </div>
        )}
        
        <input
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={onFileChange}
        />

        <Button
          variant="text"
          onClick={handleChooseFile}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.8rem",
            mb: 1,
            display: "flex",
            gap: 1,
            py: 2,
            borderRadius: "4px",
            border: "none",
            textTransform: "none",
            textDecoration: "underline",
            transition: "all 0.3s ease",
          }}
        >
          <i className="fa-solid fa-upload"></i>
          {preview ? "Modifier" : "Add files"}
        </Button>

        <Button
          variant="text"
          onClick={onOpenWebcam}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.75rem",
            mb: 1,
            display: "flex",
            gap: 1,
            px: 1.0,
            borderRadius: "4px",
            border: "none",
            textTransform: "none",
            textDecoration: "none",
            transition: "all 0.3s ease",
            "&:hover": {
              textDecoration: "underline",
              backgroundColor: "transparent",
              transform: "scale(1.02)",
            },
          }}
        >
          <i className="fa-solid fa-camera-rotate" style={{ fontSize: "0.9rem" }}></i>
          Prendre une photo
        </Button>

        {error && (
          <p style={{ color: "brown", fontSize: "0.8rem", marginTop: "4px" }}>
            La photo est requise.
          </p>
        )}
      </div>
    </div>
  );
};

export default PhotoUpload;