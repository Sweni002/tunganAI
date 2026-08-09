import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import frLocale from "date-fns/locale/fr";
import { TextField, InputAdornment, IconButton, Popper, Box } from "@mui/material";
import { ClickAwayListener } from "@mui/material";
import { StaticDatePicker } from "@mui/x-date-pickers";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Button from "@mui/material/Button";
import styles from "../conge.module.css";

const Filters = ({
  dateDebutFiltre,
  setDateDebutFiltre,
  dateFinFiltre,
  setDateFinFiltre,
  anchorEl,
  anchorEl2,
  pickerType,
  handleOpenDatePicker,
  handleClosePicker,
  handleFiltrerParDates,
  handleResetFiltre,
  idserv,
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
      {/* 👈 marginTop réduit ici (ex: 0 ou 4px) */}
      <div className={styles.filtreContainer} style={{ marginTop: "18px" ,maxWidth:"90%" }}>
        <div className={styles.filtreGroup}>
          <div className={styles.champ}>
            <label>
              Date début <span style={{ color: "red" }}>*</span>
            </label>
            <TextField
              onClick={handleOpenDatePicker("debut")}
              value={
                dateDebutFiltre
                  ? dateDebutFiltre.toLocaleDateString()
                  : "Sélectionner une date"
              }
              variant="standard"
              fullWidth
              sx={{
                mt: 1,
                mb: 2,
                fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                width: "100%",
                "& .MuiInputBase-input": {
                  color: dateDebutFiltre ? "#000" : "#9e9e9e",
                  padding: "8px 1px",
                  fontSize: "0.85rem",
                  "@media (max-width:600px)": {
                    padding: "5px 0px !important",
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={handleOpenDatePicker("debut")} size="large">
                      <CalendarTodayIcon style={{ fontSize: "1.0rem" }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Popper open={Boolean(anchorEl)} anchorEl={anchorEl} placement="bottom-start">
              <ClickAwayListener onClickAway={handleClosePicker}>
                <Box sx={{ bgcolor: "background.paper", p: 1, boxShadow: 3 }}>
                  <StaticDatePicker
                    displayStaticWrapperAs="desktop"
                    value={dateDebutFiltre}
                    onChange={(newValue) => {
                      setDateDebutFiltre(newValue);
                      handleClosePicker();
                    }}
                  />
                </Box>
              </ClickAwayListener>
            </Popper>
          </div>

          <div className={styles.champ}>
            <label>
              Date fin <span style={{ color: "red" }}>*</span>
            </label>
            <TextField
              onClick={handleOpenDatePicker("fin")}
              value={
                dateFinFiltre
                  ? dateFinFiltre.toLocaleDateString()
                  : "Sélectionner une date"
              }
              variant="standard"
              fullWidth
              sx={{
                mt: 1,
                mb: 2,
                fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                width: "100%",
                "& .MuiInputBase-input": {
                  color: dateFinFiltre ? "#000" : "#9e9e9e",
                  padding: "8px 1px",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  "@media (max-width:600px)": {
                    padding: "5px 0px !important",
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={handleOpenDatePicker("fin")} size="large">
                      <CalendarTodayIcon style={{ fontSize: "1.0rem" }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Popper open={Boolean(anchorEl2)} anchorEl={anchorEl2} placement="bottom-start">
              <ClickAwayListener onClickAway={handleClosePicker}>
                <Box sx={{ bgcolor: "background.paper", p: 1, boxShadow: 3 }}>
                  <StaticDatePicker
                    displayStaticWrapperAs="desktop"
                    value={dateFinFiltre}
                    onChange={(newValue) => {
                      setDateFinFiltre(newValue);
                      handleClosePicker();
                    }}
                  />
                </Box>
              </ClickAwayListener>
            </Popper>
          </div>

          <Button
            variant="contained"
            sx={{
              background: "#1b6979",
              p: 1.2,
              pl: 3,
              pr: 3,
              fontSize: "0.75rem",
              fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
              "@media (max-width:1369px)": {
                py: 0.8,
              },
            }}
            onClick={() => handleFiltrerParDates(idserv)}
          >
            Filtrer
          </Button>

          <Button
            onClick={() => handleResetFiltre(idserv)}
            variant="outlined"
            disabled={!dateDebutFiltre || !dateFinFiltre}
            color="secondary"
            sx={{
              p: 1.2,
              pl: 3,
              pr: 3,
              fontSize: "0.75rem",
              fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
              "@media (max-width:1369px)": {
                py: 0.8,
              },
            }}
            startIcon={<i className="fa-solid fa-eye-slash" style={{ fontSize: "0.9rem" }}></i>}
          >
            Réinitialiser
          </Button>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default Filters;