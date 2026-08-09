import React from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Radio, RadioGroup, FormControlLabel } from "@mui/material";
import {
  styleForm,
  styleInputM,
  styleInputMLabel,
  styleInputMSpan,
  stylePhotos,
  styleImg1,
  styleImg1Img,
  styleBtn,
} from "../styles";

// JSX, validations et styles inline strictement identiques à la section
// formulaire de AjoutPerso.jsx d'origine.
const PersonnelForm = ({
  selectedRole,
  setSelectedRole,
  errors,
  setErrors,
  matricule,
  setMatricule,
  nom,
  setNom,
  prenom,
  setPrenom,
  email,
  setEmail,
  showPassword,
  setShowPassword,
  password,
  setPassword,
  selectedService,
  setSelectedService,
  services,
  preview,
  fileInputRef,
  handleFileChange,
  handleChooseFile,
  setOpenWeb,
  loading,
  onSubmit,
}) => {
  return (
    <div style={styleForm}>
      <div style={styleInputM}>
        <label htmlFor="matricule" style={styleInputMLabel}>
          Role <span style={{ color: "red" }}>*</span>
        </label>
        <FormControl sx={{ mt: 2.7, mb: 0 }}>
          <RadioGroup
            value={selectedRole} // ← ajout
            onChange={(e) => setSelectedRole(e.target.value)} // ← ajout
            row
            sx={{
              m: 0,
              p: 0,
              alignItems: "center",
              gap: 5,
              "& .MuiFormControlLabel-root": {
                m: 0,
                height: 26, // 🔥 hauteur réelle
              },
              "& .MuiRadio-root": {
                p: 0.2, // supprime padding interne
                height: 26,
                width: 26,
              },
              "& .MuiSvgIcon-root": {
                fontSize: 18, // réduit taille du cercle
              },
            }}
          >
            <FormControlLabel
              value="bureau"
              control={
                <Radio
                  disableRipple
                  sx={{
                    "& .MuiSvgIcon-root": {
                      fontSize: 25, // 🔥 augmente taille du cercle
                    },
                    "&.Mui-checked": {
                      color: "#1b6979",
                    },
                  }}
                />
              }
              label="Agents de bureau"
              sx={{
                columnGap: 0.5, // 🔥 espace entre radio et texte

                "& .MuiFormControlLabel-label": {
                  fontSize: "0.85rem",
                  lineHeight: 1,
                  fontFamily: " 'Poppins', sans-serif",
                },
              }}
            />

            <FormControlLabel
              value="surface"
              control={
                <Radio
                  sx={{
                    "& .MuiSvgIcon-root": {
                      fontSize: 24, // 🔥 augmente taille du cercle
                    },
                    "&.Mui-checked": {
                      color: "#1b6979",
                    },
                  }}
                />
              }
              label="Agents de surface"
              sx={{
                columnGap: 0.5, // 🔥 espace entre radio et texte

                "& .MuiFormControlLabel-label": {
                  fontSize: "0.85rem",
                  lineHeight: 1,
                  fontFamily: " 'Poppins', sans-serif",
                },
              }}
            />
          </RadioGroup>
        </FormControl>
        {errors.role && (
          <p
            style={{
              color: "brown",
              fontSize: "0.8rem",
              marginTop: "4px",
            }}
          >
            Role est requise.
          </p>
        )}
      </div>

      <div style={styleInputM}>
        <label htmlFor="matricule" style={styleInputMLabel}>
          Matricule <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          placeholder="Entrez le matricule"
          variant="standard"
          fullWidth
          value={matricule}
          onChange={(e) => {
            let value = e.target.value;

            // 🔒 Supprime tout sauf les chiffres
            value = value.replace(/\D/g, "");

            // 🔒 Limite à 6 chiffres
            if (value.length > 6) return;

            setMatricule(value);

            // 🔒 Validation
            if (/^\d{6}$/.test(value)) {
              setErrors((prev) => ({ ...prev, matricule: false }));
            } else {
              setErrors((prev) => ({ ...prev, matricule: true }));
            }
          }}
          error={!!errors.matricule}
          helperText={
            errors.matricule
              ? "Le matricule doit contenir exactement 6 chiffres."
              : ""
          }
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
      <div style={styleInputM}>
        <label htmlFor="matricule" style={styleInputMLabel}>
          Nom <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          placeholder="Entrez le nom"
          variant="standard"
          fullWidth
          value={nom}
          onChange={(e) => {
            setNom(e.target.value);
            if (errors.nom) {
              setErrors((prev) => ({ ...prev, nom: false }));
            }
          }}
          error={!!errors.nom}
          helperText={errors.nom ? "Le nom est requis." : ""}
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

      <div style={styleInputM}>
        <label htmlFor="matricule" style={styleInputMLabel}>
          Prenom <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          placeholder="Entrez le prenom"
          variant="standard"
          fullWidth
          value={prenom}
          onChange={(e) => {
            setPrenom(e.target.value);
            if (errors.prenom) {
              setErrors((prev) => ({ ...prev, prenom: false }));
            }
          }}
          error={!!errors.prenom}
          helperText={errors.prenom ? "Le prenom est requis." : ""}
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

      <div style={styleInputM}>
        <label htmlFor="matricule" style={styleInputMLabel}>
          Email professionelle <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          placeholder="Entrez un email valide"
          variant="standard"
          fullWidth
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) {
              setErrors((prev) => ({ ...prev, email: false }));
            }
          }}
          error={!!errors.prenom}
          helperText={errors.email ? "L'email est requis." : ""}
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

      <div style={styleInputM}>
        <label htmlFor="matricule" style={styleInputMLabel}>
          Mot de passe par defaut <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          placeholder="Mot de passe par defaut"
          variant="standard"
          type={showPassword ? "text" : "password"} // 🔥 toggle ici
          fullWidth
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) {
              setErrors((prev) => ({ ...prev, password: false }));
            }
          }}
          error={!!errors.password} // 🔥 correction
          helperText={errors.password ? "Le mot de passe est requis." : ""}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                  size="small" // 🔥 réduit la zone cliquable
                >
                  {showPassword ? (
                    <VisibilityOff sx={{ fontSize: 18 }} /> // 🔥 taille icône
                  ) : (
                    <Visibility sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
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

      <div style={styleInputM}>
        <label htmlFor="matricule" style={styleInputMLabel}>
          Division <span style={{ color: "red" }}>*</span>
        </label>
        <FormControl variant="standard" fullWidth sx={{ mt: 1, mb: 2 }}>
          <Select
            value={selectedService}
            onChange={(e) => {
              setSelectedService(e.target.value);
              if (errors.services) {
                setErrors((prev) => ({ ...prev, services: false }));
              }
            }}
            error={!!errors.services}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.85rem",
            }}
          >
            {services.map((serv) => (
              <MenuItem
                key={serv.iddiv}
                value={serv.iddiv}
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.85rem",
                }}
              >
                {serv.nomdivision}
              </MenuItem>
            ))}
          </Select>

          {errors.services && (
            <Typography color="error" variant="caption" sx={{ color: "brown" }}>
              Division est requis.
            </Typography>
          )}
        </FormControl>
      </div>

      <div style={styleInputM}>
        <label htmlFor="matricule" style={styleInputMLabel}>
          Photo
        </label>
        <span style={styleInputMSpan}>
          Merci de selectionner un fichier JPEG , JPG ou PNG ou prendre une photo
        </span>

        <div style={stylePhotos}>
          {preview && (
            <div style={styleImg1}>
              <img src={preview} alt="preview" style={styleImg1Img} />
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <Button
            variant="text"
            onClick={handleChooseFile}
            sx={{
              fontFamily: " 'Poppins', sans-serif",

              fontSize: "0.75rem",
              mb: 1,
              display: "flex",
              gap: 1,
              px: 1.0,
              borderRadius: "4px",
              border: "none",
              textTransform: "none",
              textDecoration: "nonz",
              transform: "scale(1)", // léger zoom au hover
              transition: "all 0.3s ease",
              "&:hover": {
                textDecoration: "underline", // 👈 underline au hover
                backgroundColor: "transparent", // optionnel (évite le gris MUI)
                transform: "scale(1.02)", // petit bonus si tu veux
              },
            }}
          >
            <i className="fa-solid fa-upload" style={{ fontSize: "0.9rem" }}></i>
            {preview ? "Modifier" : "Add files"}
          </Button>

          <Button
            variant="text"
            onClick={() => setOpenWeb(true)}
            sx={{
              fontFamily: " 'Poppins', sans-serif",

              fontSize: "0.75rem",
              mb: 1,
              display: "flex",
              gap: 1,
              px: 1.0,
              borderRadius: "4px",
              border: "none",
              textTransform: "none",
              textDecoration: "none",
              transform: "scale(1)", // léger zoom au hover
              transition: "all 0.3s ease",
              "&:hover": {
                textDecoration: "underline", // 👈 underline au hover
                backgroundColor: "transparent", // optionnel (évite le gris MUI)
                transform: "scale(1.02)", // petit bonus si tu veux
              },
            }}
          >
            <i className="fa-solid fa-camera-rotate" style={{ fontSize: "0.9rem" }}></i>
            Prendre une photo
          </Button>
          {errors.photo && (
            <p
              style={{
                color: "brown",
                fontSize: "0.8rem",
                marginTop: "4px",
              }}
            >
              La photo est requise.
            </p>
          )}
        </div>
      </div>
      <div style={styleBtn}>
        <Button
          variant="contained"
          fullWidth
          disabled={loading}
          onClick={onSubmit}
          sx={{
            fontFamily: " 'Poppins', sans-serif",
            backgroundColor: "#14535f",
            fontSize: "0.9rem",
            mb: 1,
            display: "flex",
            gap: 2,
            height: 41,
            py: 1.1,
            borderRadius: "4px",
            justifyContent: "center",
            border: "none",
            textTransform: "none",
            transform: "scale(1)", // léger zoom au hover
            transition: "all 0.3s ease",
            "&.Mui-disabled": {
              backgroundColor: "#14535f",
              color: "#fff", // optionnel (texte blanc)
              opacity: 0.7, // optionnel (effet disabled léger)
            },
          }}
        >
          {loading ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span className="ajout-perso-loader"></span>
            </div>
          ) : (
            <>
              <i className="fa-solid fa-plus" style={{ fontSize: "1.1rem" }}></i>
              <span>Sauvegarder</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PersonnelForm;