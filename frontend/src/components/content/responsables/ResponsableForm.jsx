// src/pages/Responsable/components/ResponsableForm.jsx

import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Typography from "@mui/material/Typography";
import styles from "./ajout_perso.module.css";

const ResponsableForm = ({ 
  formData, 
  errors, 
  updateField,
  services,
  divisions,
  selectedService,
  selectedDivision,
  onServiceChange,
  onDivisionChange,
  children // Pour PhotoUpload
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.form}>
      {/* Matricule */}
      <div className={styles.inputM}>
        <label>
          Matricule <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          placeholder="Entrez le matricule"
          variant="standard"
          fullWidth
          value={formData.matricule}
          onChange={(e) => updateField("matricule", e.target.value)}
          error={!!errors.matricule}
          helperText={errors.matricule ? "Le matricule est requis." : ""}
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

      {/* Nom */}
      <div className={styles.inputM}>
        <label>
          Nom <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          placeholder="Entrez le nom"
          variant="standard"
          fullWidth
          value={formData.nom}
          onChange={(e) => updateField("nom", e.target.value)}
          error={!!errors.nom}
          helperText={errors.nom ? "Le nom est requis." : ""}
          sx={textFieldStyles}
        />
      </div>

      {/* Prénom */}
      <div className={styles.inputM}>
        <label>
          Prenom <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          placeholder="Entrez le prenom"
          variant="standard"
          fullWidth
          value={formData.prenom}
          onChange={(e) => updateField("prenom", e.target.value)}
          error={!!errors.prenom}
          helperText={errors.prenom ? "Le prenom est requis." : ""}
          sx={textFieldStyles}
        />
      </div>

      {/* Email */}
      <div className={styles.inputM}>
        <label>
          Email professionelle <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          placeholder="Entrez un email valide"
          variant="standard"
          fullWidth
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          error={!!errors.email}
          helperText={errors.email ? "L'email est requis." : ""}
          sx={textFieldStyles}
        />
      </div>

      {/* Mot de passe */}
      <div className={styles.inputM}>
        <label>
          Mot de passe par defaut <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          placeholder="Mot de passe par defaut"
          variant="standard"
          type={showPassword ? "text" : "password"}
          fullWidth
          value={formData.password}
          onChange={(e) => updateField("password", e.target.value)}
          error={!!errors.password}
          helperText={errors.password ? "Le mot de passe est requis." : ""}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(prev => !prev)}
                  edge="end"
                  size="small"
                >
                  {showPassword ? (
                    <VisibilityOff sx={{ fontSize: 18 }} />
                  ) : (
                    <Visibility sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={textFieldStyles}
        />
      </div>

      {/* Service */}
      <div className={styles.inputM}>
        <label>
          Service <span style={{ color: "red" }}>*</span>
        </label>
        <FormControl variant="standard" fullWidth sx={{ mt: 1, mb: 2 }}>
          <Select
            value={selectedService}
            onChange={onServiceChange}
            error={!!errors.services}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.85rem",
            }}
          >
            {services.map((serv) => (
              <MenuItem
                key={serv.idserv}
                value={serv.idserv}
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.85rem",
                }}
              >
                {serv.nom}
              </MenuItem>
            ))}
          </Select>
          {errors.services && (
            <Typography color="error" variant="caption" sx={{ color: "brown" }}>
              Service est requis.
            </Typography>
          )}
        </FormControl>
      </div>

      {/* Division (affiché si service sélectionné) */}
      {selectedService && (
        <div className={styles.inputM} style={{ marginTop: 20 }}>
          <label>
            Division <span style={{ color: "red" }}>*</span>
          </label>
          <FormControl variant="standard" fullWidth sx={{ mt: 1, mb: 2 }}>
            <Select
              value={selectedDivision || ""}
              onChange={onDivisionChange}
              error={!!errors.division}
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "0.85rem",
              }}
            >
              {divisions.map((div) => (
                <MenuItem
                  key={div.iddiv}
                  value={div.iddiv}
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "0.85rem",
                  }}
                >
                  {div.nomdivision}
                </MenuItem>
              ))}
            </Select>
            {errors.division && (
              <Typography color="error" variant="caption" sx={{ color: "brown" }}>
                Division est requis.
              </Typography>
            )}
          </FormControl>
        </div>
      )}

      {/* PhotoUpload */}
      {children}
    </div>
  );
};

const textFieldStyles = {
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
};

export default ResponsableForm;