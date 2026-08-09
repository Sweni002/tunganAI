import React from "react";
import styles from "../ajout_service.module.css";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Spin } from "antd";
import { SERVICES_LIST } from "../hooks/serviceConstants";

const ServiceForm = ({
  formState,
  errors,
  preview,
  loading,
  onInputChange,
  onFileChange,
  onAddressSelect,
  onSubmit,
  onValidate,
  onBack,
  setFormState
}) => {
  const fileInputRef = React.useRef(null);

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = () => {
    if (onValidate()) {
      onSubmit();
    }
  };

  return (
    <div className={styles.form}>
      {/* Code Service */}
      <div className={styles.inputM}>
        <label htmlFor="code">
          Code service <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          id="code"
          placeholder="Entrez le code du service"
          variant="standard"
          fullWidth
          value={formState.code}
          onChange={(e) => onInputChange('code', e.target.value)}
          error={!!errors.code}
          helperText={errors.code ? "Le code du service est requis." : ""}
          sx={{
            mt: 1,
            mb: 2,
            width: "100%",
            "& .MuiInputBase-input": {
              padding: "8px 1px",
              fontSize: "0.9rem",
              fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
              "@media (max-width:600px)": {
                padding: "5px 0px !important",
              },
            },
          }}
        />
      </div>

      {/* Nom Service */}
      <div className={styles.inputM}>
        <label htmlFor="nom">
          Nom du service <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          id="nom"
          placeholder="Entrez le nom du service"
          variant="standard"
          fullWidth
          value={formState.nom}
          onChange={(e) => onInputChange('nom', e.target.value)}
          error={!!errors.nom}
          helperText={errors.nom ? "Le nom du service est requis." : ""}
          sx={{
            mt: 1,
            mb: 2,
            width: "100%",
            "& .MuiInputBase-input": {
              padding: "8px 1px",
              fontSize: "0.9rem",
              fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
              "@media (max-width:600px)": {
                padding: "5px 0px !important",
              },
            },
          }}
        />
      </div>

      {/* Sigle */}
      <div className={styles.inputM}>
        <label htmlFor="sigle">
          Sigle <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          id="sigle"
          placeholder="ex: SRSP, BNI, ..."
          variant="standard"
          fullWidth
          value={formState.sigle}
          onChange={(e) => onInputChange('sigle', e.target.value)}
          error={!!errors.sigle}
          helperText={errors.sigle ? "Le sigle est requis." : ""}
          sx={{
            mt: 1,
            mb: 2,
            width: "100%",
            "& .MuiInputBase-input": {
              padding: "8px 1px",
              fontSize: "0.9rem",
              fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
              "@media (max-width:600px)": {
                padding: "5px 0px !important",
              },
            },
          }}
        />
      </div>

      {/* Adresse */}
      <div className={styles.inputM}>
        <label htmlFor="addresse">
          Adresse <span style={{ color: "red" }}>*</span>
        </label>
        <FormControl variant="standard" fullWidth sx={{ mt: 1, mb: 2 }}>
          <Select
            id="addresse"
            value={formState.addresse}
            onChange={(e) => onAddressSelect(e.target.value)}
            error={!!errors.addresse}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.85rem",
            }}
          >
            <MenuItem value="" sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.85rem" }}>
              <em>-- Sélectionnez une adresse --</em>
            </MenuItem>
            {SERVICES_LIST.map((region, index) => (
              <MenuItem
                key={index}
                value={region}
                sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.85rem" }}
              >
                {region}
              </MenuItem>
            ))}
          </Select>
          {errors.addresse && (
            <Typography color="error" variant="caption" sx={{ color: "brown" }}>
              L'adresse est requise.
            </Typography>
          )}
        </FormControl>
      </div>

      {/* Logo Upload */}
      <div className={styles.inputM}>
        <label>
          Logo <span style={{ color: "red" }}>*</span>
        </label>
        <span>Merci de sélectionner un fichier JPEG, JPG ou PNG</span>

        <div className={styles.logos}>
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
            onClick={handleFileSelect}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.75rem",
              mb: 1,
              display: "flex",
              gap: 1,
              px: 2,
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
          {errors.logo && (
            <p style={{ color: "brown", fontSize: "0.8rem", marginTop: "4px" }}>
              Le logo est requis.
            </p>
          )}
        </div>
      </div>

      {/* ================= BOUTONS ================= */}
      <div
        className={styles.btn}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* Précédent */}
        <Button
          variant="outlined"
          disabled={loading}
          onClick={onBack}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: "#14535f",
            borderColor: "#14535f",
            fontSize: "0.75rem",
            mb: 1,
            display: "flex",
            gap: 1.5,
            py: 1.0,
            px: 3,
            minWidth: "140px",
            borderRadius: "4px",
            justifyContent: "center",
            textTransform: "none",
            transition: "all 0.3s ease",
          }}
        >
          <i className="fa-solid fa-arrow-left" style={{ fontSize: "1rem" }}></i>
          <span>Précédent</span>
        </Button>

        {/* Suivant */}
        <Button
          variant="contained"
          disabled={loading}
          onClick={handleSubmit}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            backgroundColor: "#14535f",
            fontSize: "0.75rem",
            mb: 1,
            display: "flex",
            gap: 1.5,
            py: 1.0,
            px: 3,
            minWidth: "140px",
            borderRadius: "4px",
            justifyContent: "center",
            border: "none",
            textTransform: "none",
            transition: "all 0.3s ease",
          }}
        >
          {loading ? (
            <Spin size="large" />
          ) : (
            <>
              <span>Suivant</span>
              <i className="fa-solid fa-arrow-right" style={{ fontSize: "1rem" }}></i>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ServiceForm;