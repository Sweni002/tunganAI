import React from "react";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Checkbox, FormControlLabel } from "@mui/material";
import { Select, MenuItem, FormControl, Menu } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import dayjs from "dayjs";
import { Popper, InputAdornment, Box } from "@mui/material";
import { StaticDatePicker } from "@mui/x-date-pickers";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import {
  styleForm,
  styleInputM,
  styleInputMLabel,
  styleInputMSpan,
  styleInputDiv,
  styleDateContainer,
  styleDateField,
  styleDateFieldLabel,
  styleDateFields,
  styleDateFieldsLabel,
  styleBtn,
} from "../styles";

// JSX, validations et styles inline strictement identiques à la section
// formulaire de AjoutAuto.jsx d'origine.
const AbsenceForm = ({
  selectedMatricule,
  setOpenMatriculeDialog,
  errors,
  setErrors,

  anchorElType,
  openType,
  setAnchorElType,
  types,
  selectedType,
  setSelectedType,
  typeDivRef,
  setTypeTouched,

  motif,
  setMotif,

  isOneDayAbsence,
  setIsOneDayAbsence,

  dateDebut,
  setDateDebut,
  anchorEl,
  setAnchorEl,
  openDate,

  dateFin,
  setDateFin,
  anchorEl2,
  setAnchorEl2,
  openDate2,

  demiJournee,
  setDemiJournee,

  loading,
  onSubmit,
}) => {
  return (
    <div style={styleForm}>
      <div style={styleInputM}>
        <label htmlFor="matricule" style={styleInputMLabel}>
          Matricule <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          onClick={() => setOpenMatriculeDialog(true)}
          placeholder="Selectionner un personnel"
          variant="standard"
          fullWidth
          value={
            selectedMatricule
              ? `${selectedMatricule.matricule} - ${selectedMatricule.nom}`
              : ""
          }
          error={errors.matricule} // ← true seulement si champ invalide
          helperText={errors.matricule ? "Le matricule est requis." : ""} // ← helper text seulement si erreur
          sx={{
            mt: 1,
            mb: 2,
            width: "100%",
            "& .MuiInputBase-root": {
              paddingRight: "10px", // évite que le texte touche l’icône
            },

            "& .MuiInputBase-input": {
              padding: "8px 1px",
              fontSize: "0.9rem",
              fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
              "@media (max-width:600px)": {
                padding: "5px 0px !important",
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <IconButton
                size="large"
                disableRipple
                onClick={() => setOpenMatriculeDialog(true)}
                sx={{
                  padding: 0,
                  marginLeft: "4px",
                  color: "#555",
                  "&:hover": {
                    backgroundColor: "transparent",
                  },
                }}
              >
                <i
                  className="fa-solid fa-chevron-down"
                  style={{ fontSize: "0.8rem" }}
                />
              </IconButton>
            ),
          }}
        />
      </div>
      <Menu
        anchorEl={anchorElType}
        open={openType}
        onClose={() => setAnchorElType(null)}
        PaperProps={{
          style: {
            minWidth: typeDivRef.current
              ? typeDivRef.current.offsetWidth
              : 200,
          },
        }}
        sx={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "0.85rem",
        }}
      >
        {types.map((t) => (
          <MenuItem
            key={t.idtype}
            onClick={() => {
              setSelectedType(t);
              setAnchorElType(null);
              setErrors((prev) => ({ ...prev, type: false })); // ← important
            }}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.85rem",
            }}
          >
            {t.nomtype}
          </MenuItem>
        ))}
      </Menu>

      <div style={styleInputM}>
        <label htmlFor="matricule" style={styleInputMLabel}>
          Type d'absence <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          ref={typeDivRef}
          onClick={(e) => {
            setAnchorElType(e.currentTarget);
            setTypeTouched(true); // ✅ l'utilisateur a interagi
          }}
          placeholder="Selectionner une type"
          variant="standard"
          fullWidth
          value={selectedType ? selectedType.nomtype : ""}
          error={errors.type} // true si erreur
          helperText={errors.type ? "Le type d'absence est requis." : ""}
          sx={{
            mt: 1,
            mb: 2,
            width: "100%",
            "& .MuiInputBase-root": {
              paddingRight: "10px", // évite que le texte touche l’icône
            },

            "& .MuiInputBase-input": {
              padding: "8px 1px",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.9rem",
              "@media (max-width:600px)": {
                padding: "5px 0px !important",
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <IconButton
                size="large"
                disableRipple
                onClick={(e) => {
                  setAnchorElType(e.currentTarget);
                  setTypeTouched(true); // ✅ l'utilisateur a interagi
                }}
                sx={{
                  padding: 0,
                  marginLeft: "4px",
                  color: "#555",
                  "&:hover": {
                    backgroundColor: "transparent",
                  },
                }}
              >
                <i
                  className="fa-solid fa-chevron-down"
                  style={{ fontSize: "0.8rem" }}
                />
              </IconButton>
            ),
          }}
        />
      </div>

      <div style={styleInputM}>
        <label htmlFor="matricule" style={styleInputMLabel}>
          Motif <span style={{ color: "red" }}>*</span>
        </label>
        <TextField
          placeholder="Entrez le motif"
          variant="standard"
          fullWidth
          value={motif}
          onChange={(e) => {
            setMotif(e.target.value);
            if (errors.motif) {
              setErrors((prev) => ({ ...prev, motif: false }));
            }
          }}
          error={errors.motif}
          helperText={errors.motif ? "Le motif est requis." : ""}
          sx={{
            mt: 1,
            mb: 2,
            width: "100%",
            "& .MuiInputBase-root": {
              paddingRight: "10px", // évite que le texte touche l’icône
            },

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

      <div style={styleInputDiv}>
        <FormControlLabel
          control={
            <Checkbox
              checked={isOneDayAbsence}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsOneDayAbsence(checked);
                if (checked) {
                  setDateFin(dateDebut); // synchronise date fin
                }
              }}
              color="primary"
            />
          }
          label="Un seul jour d'absence"
          TypographyProps={{
            variant: "body2", // utilise une taille plus petite
            sx: {
              fontFamily: "Poppins, sans-serif",

              fontSize: "0.75rem", // taille personnalisée
              fontWeight: "bold",
              color: "#333",
            },
          }}
          sx={{
            fontWeight: "bold",
            color: "#333",
            fontSize: "0.9rem",
            fontFamily: "Poppins, sans-serif",
          }}
        />
      </div>

      {/* Dates début et fin */}
      <div style={styleDateContainer}>
        <div style={styleDateField}>
          <label htmlFor="dateDebut" style={styleDateFieldLabel}>
            {isOneDayAbsence ? "Date" : "Date début"}{" "}
            <span style={{ color: "red" }}>*</span>
          </label>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <TextField
              onClick={(e) => setAnchorEl(e.currentTarget)}
              value={dateDebut ? dayjs(dateDebut).format("DD/MM/YYYY") : ""}
              placeholder="Selectionner une date"
              error={errors.dateDebut}
              helperText={errors.dateDebut ? "Le date est requis." : ""}
              variant="standard"
              fullWidth
              sx={{
                mt: 1,
                mb: 2,
                fontFamily:
                  " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",

                width: "100%",
                "& .MuiInputBase-input": {
                  padding: "8px 1px", // padding interne uniforme
                  fontSize: "0.9rem", // ← augmente la taille du texte
                  fontWeight: 500,
                  "@media (max-width:600px)": {
                    padding: "5px 0px !important", // mobile → réduit
                  },
                },
                "& .MuiInputLabel-root": {
                  fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
                },
              }}
              InputLabelProps={{
                style: {
                  fontSize: "1.0rem",
                  letterSpacing: "1px",
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={(e) => setAnchorEl(e.currentTarget)}
                      size="large"
                    >
                      <CalendarTodayIcon style={{ fontSize: "1.0rem" }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Popper open={openDate} anchorEl={anchorEl} placement="bottom-start">
              <ClickAwayListener
                onClickAway={() => {
                  setAnchorEl(null);
                  setAnchorEl2(null);
                }}
              >
                <Box sx={{ bgcolor: "background.paper", boxShadow: 2 }}>
                  <StaticDatePicker
                    displayStaticWrapperAs="desktop"
                    value={dateDebut} // ← doit être un objet Date / dayjs
                    onChange={(newValue) => {
                      setDateDebut(newValue);

                      setAnchorEl(null); // ferme le popper après sélection
                      if (errors.dateDebut) {
                        setErrors((prev) => ({
                          ...prev,
                          dateDebut: false,
                        }));
                      }
                    }}
                  />
                </Box>
              </ClickAwayListener>
            </Popper>
          </LocalizationProvider>
        </div>

        {!isOneDayAbsence && (
          <div style={styleDateField}>
            <label htmlFor="dateFin" style={styleDateFieldLabel}>
              Date fin <span style={{ color: "red" }}>*</span>
            </label>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TextField
                onClick={(e) => setAnchorEl2(e.currentTarget)}
                value={dateFin ? dayjs(dateFin).format("DD/MM/YYYY") : ""}
                placeholder="Selectionner une date"
                variant="standard"
                error={isOneDayAbsence && !dateFin} // ← condition
                helperText={
                  isOneDayAbsence && !dateFin
                    ? "La date de fin est requise."
                    : ""
                } // ← condition
                fullWidth
                sx={{
                  mt: 1,
                  mb: 2,
                  fontFamily:
                    " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",

                  width: "100%",
                  "& .MuiInputBase-input": {
                    padding: "8px 1px", // padding interne uniforme
                    fontSize: "0.9rem", // ← augmente la taille du texte
                    fontWeight: 500,
                    "@media (max-width:600px)": {
                      padding: "5px 0px !important", // mobile → réduit
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontFamily:
                      "system-ui, Avenir, Helvetica, Arial, sans-serif",
                  },
                }}
                InputLabelProps={{
                  style: {
                    fontSize: "1.0rem",
                    letterSpacing: "1px",
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        size="large"
                      >
                        <CalendarTodayIcon style={{ fontSize: "1.0rem" }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Popper
                open={openDate2}
                anchorEl={anchorEl2}
                placement="bottom-start"
              >
                <ClickAwayListener
                  onClickAway={() => {
                    setAnchorEl(null);
                    setAnchorEl2(null);
                  }}
                >
                  <Box sx={{ bgcolor: "background.paper", boxShadow: 2 }}>
                    <StaticDatePicker
                      displayStaticWrapperAs="desktop"
                      value={dateFin} // ← doit être un objet Date / dayjs
                      onChange={(newValue) => {
                        setDateFin(newValue);
                        setAnchorEl2(null); // ferme le popper après sélection
                        if (errors.dateFin) {
                          setErrors((prev) => ({
                            ...prev,
                            dateFin: false,
                          }));
                        }
                      }}
                    />
                  </Box>
                </ClickAwayListener>
              </Popper>
            </LocalizationProvider>
          </div>
        )}
        {isOneDayAbsence && (
          <div style={styleDateField}>
            <label htmlFor="demiJournee" style={styleDateFieldLabel}>
              Demi-journée <span style={{ color: "red" }}>*</span>
            </label>

            <FormControl
              variant="standard"
              fullWidth
              error={!!errors.demiJournee} // affiche l'erreur si nécessaire
              sx={{ mt: 1, mb: 2 }}
            >
              <Select
                labelId="demi-journee-label"
                onChange={(e) => setDemiJournee(e.target.value)}
                displayEmpty
                value={
                  selectedMatricule?.role === "surface"
                    ? "complete" // force Absence complète
                    : demiJournee
                }
                disabled={selectedMatricule?.role === "surface"} // désactive le Select
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.9rem",
                }}
              >
                <MenuItem
                  value="complete"
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "0.85rem",
                  }}
                >
                  Absence complète
                </MenuItem>
                <MenuItem
                  value="matin"
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "0.85rem",
                  }}
                >
                  Matin
                </MenuItem>
                <MenuItem
                  value="apres-midi"
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "0.85rem",
                  }}
                >
                  Après-midi
                </MenuItem>
              </Select>
              {errors.demiJournee && (
                <Typography variant="caption" color="error">
                  Veuillez sélectionner une demi-journée.
                </Typography>
              )}
            </FormControl>
          </div>
        )}
      </div>
      {!isOneDayAbsence && (
        <div style={styleDateFields}>
          <label htmlFor="demiJournee" style={styleDateFieldsLabel}>
            Demi-journée <span style={{ color: "red" }}>*</span>
          </label>

          <FormControl
            variant="standard"
            fullWidth
            error={!!errors.demiJournee}
            sx={{ mt: 1, mb: 2 }}
          >
            <Select
              onChange={(e) => setDemiJournee(e.target.value)}
              value={
                selectedMatricule?.role === "surface"
                  ? "complete" // force Absence complète
                  : demiJournee
              }
              disabled={selectedMatricule?.role === "surface"} // désactive le Select
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "0.9rem",
              }}
            >
              <MenuItem
                value="complete"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.85rem",
                }}
              >
                Absence complète
              </MenuItem>
              <MenuItem
                value="matin"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.85rem",
                }}
              >
                Matin
              </MenuItem>
            </Select>

            {errors.demiJournee && (
              <Typography variant="caption" color="error">
                Veuillez sélectionner une demi-journée.
              </Typography>
            )}
          </FormControl>
        </div>
      )}

      <div style={styleBtn}>
        <Button
          variant="contained"
          disabled={loading}
          fullWidth
          onClick={onSubmit}
          sx={{
            fontFamily: " 'Poppins', sans-serif",
            backgroundColor: "#14535f",
            fontSize: "0.9rem",
            mb: 1,
            display: "flex",
            gap: 2,

            height: 43,
            "&.Mui-disabled": {
              backgroundColor: "#14535f",
              color: "#fff", // optionnel (texte blanc)
              opacity: 0.7, // optionnel (effet disabled léger)
            },
            borderRadius: "4px",
            justifyContent: "center",
            border: "none",
            textTransform: "none",
            transform: "scale(1)", // léger zoom au hover
            transition: "all 0.3s ease",
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
              <span className="ajout-auto-loader"></span>
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

export default AbsenceForm;