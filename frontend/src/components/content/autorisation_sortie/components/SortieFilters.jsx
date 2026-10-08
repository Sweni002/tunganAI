import React from "react";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { StaticDatePicker } from "@mui/x-date-pickers";
import frLocale from "date-fns/locale/fr";
import { Box, Button, ClickAwayListener, IconButton, InputAdornment, Popper, TextField } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import styles from "../sortie.module.css";

const fieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "20px", backgroundColor: "#f4f8f9", cursor: "pointer" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c5d6da" },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#1b6979", borderWidth: 2 },
  "& .MuiInputBase-input": { padding: "16px 20px", fontSize: "0.85rem", cursor: "pointer" },
};

function DateField({ label, value, anchorEl, onOpen, onClose, onChange }) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      <TextField
        value={value ? dayjs(value).format("DD/MM/YYYY") : ""}
        placeholder="Sélectionner une date"
        onClick={onOpen}
        fullWidth
        sx={fieldSx}
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" onClick={onOpen} aria-label={label}>
                  <CalendarTodayIcon style={{ fontSize: "1.05rem" }} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <Popper open={Boolean(anchorEl)} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1300 }}>
        <ClickAwayListener onClickAway={onClose}>
          <Box sx={{ bgcolor: "background.paper", p: 1, borderRadius: "24px", boxShadow: "0 16px 40px rgba(16,40,46,0.18)" }}>
            <StaticDatePicker
              displayStaticWrapperAs="desktop"
              value={value || null}
              onChange={(newValue) => {
                onChange(newValue);
                onClose();
              }}
            />
          </Box>
        </ClickAwayListener>
      </Popper>
    </div>
  );
}

/** Filtre par période (date début → date fin). */
export default function SortieFilters({
  dateDebutFiltre,
  setDateDebutFiltre,
  dateFinFiltre,
  setDateFinFiltre,
  anchorEl,
  anchorEl2,
  handleOpenDatePicker,
  handleClosePicker,
  handleFiltrerParDates,
  handleResetFiltre,
  idserv,
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
      <section className={styles.card} aria-label="Filtrer par période">
        <div className={styles.cardHead}>
          <div>
            <h2 className={styles.cardTitle}>
              <i className="fa-solid fa-sliders" aria-hidden="true"></i>
              Période
            </h2>
          </div>
          <p className={styles.cardSub}>Choisissez une plage de dates pour affiner la liste</p>
        </div>

        <div className={styles.filterRow}>
          <DateField
            label="Date de début"
            value={dateDebutFiltre}
            anchorEl={anchorEl}
            onOpen={handleOpenDatePicker("debut")}
            onClose={handleClosePicker}
            onChange={setDateDebutFiltre}
          />
          <DateField
            label="Date de fin"
            value={dateFinFiltre}
            anchorEl={anchorEl2}
            onOpen={handleOpenDatePicker("fin")}
            onClose={handleClosePicker}
            onChange={setDateFinFiltre}
          />

          <div className={styles.actions}>
            <Button
              variant="contained"
              disableElevation
              onClick={() => handleFiltrerParDates(idserv)}
              startIcon={<i className="fa-solid fa-filter" style={{ fontSize: "0.85rem" }}></i>}
              sx={{ background: "#1b6979", textTransform: "none", fontSize: "0.8rem", px: 3.5, py: 1.6 }}
            >
              Filtrer
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleResetFiltre(idserv)}
              disabled={!dateDebutFiltre || !dateFinFiltre}
              startIcon={<i className="fa-solid fa-rotate-left" style={{ fontSize: "0.85rem" }}></i>}
              sx={{ textTransform: "none", fontSize: "0.8rem", px: 3.5, py: 1.6, color: "#1b6979", borderColor: "#c5d6da" }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </section>
    </LocalizationProvider>
  );
}
