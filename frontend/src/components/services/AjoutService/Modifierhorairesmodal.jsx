// ModifierHorairesModal.jsx
// ---------------------------------------------------------------------------
// Modal de modification des horaires d'un service.
// - En-tête : logo + nom du service + code
// - Deux sections (Matin / Soir), chacune avec plage d'entrée et de sortie
// - TimePicker MUI (24h, locale fr, pas de 5 min, bornes 05h-19h)
// - Validation locale identique au backend avant l'appel PUT /api/horaires/<idserv>
//
// Usage dans Service.jsx :
//   <ModifierHorairesModal
//     open={horaireModalOpen}
//     service={serviceToEdit}          // le record du tableau (idserv, nom, logo, horaires)
//     onClose={() => setHoraireModalOpen(false)}
//     onSaved={(idserv, horaires) => ...}   // maj de la ligne du tableau
//     showSnackbar={(msg, isError) => ...}
//   />
// ---------------------------------------------------------------------------
import React, { useState, useEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import { styled } from "@mui/material/styles";
import { Spin } from "antd";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import "dayjs/locale/fr";

const API_URL = import.meta.env.VITE_API_URL;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const stringToDayjs = (value) => (value ? dayjs(`2000-01-01T${value}`) : null);
const dayjsToString = (value) =>
  value && value.isValid() ? value.format("HH:mm") : "";

// Bornes autorisées : 05h00 – 19h00
const MIN_TIME = dayjs("2000-01-01T05:00");
const MAX_TIME = dayjs("2000-01-01T19:00");

// "07:10 - 08:10" -> ["07:10", "08:10"] (format renvoyé par GET /api/services/)
const splitPlage = (plage) => {
  if (!plage) return ["", ""];
  const [debut, fin] = plage.split(" - ");
  return [debut || "", fin || ""];
};

const EMPTY_STATE = {
  entreeMatinDebut: "", entreeMatinFin: "",
  sortieMatinDebut: "", sortieMatinFin: "",
  entreeSoirDebut: "", entreeSoirFin: "",
  sortieSoirDebut: "", sortieSoirFin: "",
};

const FIELD_MAP = {
  entreeMatinDebut: "entree_matin_debut",
  entreeMatinFin: "entree_matin_fin",
  sortieMatinDebut: "sortie_matin_debut",
  sortieMatinFin: "sortie_matin_fin",
  entreeSoirDebut: "entree_soir_debut",
  entreeSoirFin: "entree_soir_fin",
  sortieSoirDebut: "sortie_soir_debut",
  sortieSoirFin: "sortie_soir_fin",
};

// ---------------------------------------------------------------------------
// Styles (niveau module — perf)
// ---------------------------------------------------------------------------
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: theme.spacing(3),
    width: "100%",
    maxWidth: "860px",
  },
}));

const timeFieldSx = {
  width: "100%",
  "& .MuiInputBase-input": {
    padding: "8px 1px",
    fontSize: "0.85rem",
    fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
    cursor: "pointer",
  },
  "& .MuiIconButton-root": {
    cursor: "pointer",
    color: "#3390a2",
    "& svg": { fontSize: "1rem" },
  },
};

const popperSx = {
  "& .MuiMultiSectionDigitalClockSection-item.Mui-selected": {
    backgroundColor: "#3390a2",
    "&:hover": { backgroundColor: "#2a7c8c" },
  },
  "& .MuiClock-pin, & .MuiClockPointer-root, & .MuiClockPointer-thumb": {
    backgroundColor: "#3390a2",
    borderColor: "#3390a2",
  },
  "& .MuiButton-root": {
    color: "#3390a2",
    fontFamily: "'Poppins', sans-serif",
    textTransform: "none",
  },
};

// ---------------------------------------------------------------------------
// Plage : De [heure] -- À [heure]
// ---------------------------------------------------------------------------
const TimeRangeField = ({ label, fieldDebut, fieldFin, values, errors, onChange }) => (
  <div style={{ flex: 1, minWidth: "210px" }}>
    <label
      style={{
        fontSize: "0.78rem",
        fontFamily: "'Poppins', sans-serif",
        color: "#555",
      }}
    >
      {label} <span style={{ color: "red" }}>*</span>
    </label>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
      <TimePicker
        value={stringToDayjs(values[fieldDebut])}
        onChange={(v) => onChange(fieldDebut, dayjsToString(v))}
        ampm={false}
        minutesStep={5}
        minTime={MIN_TIME}
        maxTime={MAX_TIME}
        skipDisabled
        slotProps={{
          textField: {
            variant: "standard",
            fullWidth: true,
            error: !!errors[fieldDebut],
            placeholder: "hh:mm",
            sx: timeFieldSx,
          },
          popper: { sx: popperSx },
          field: { clearable: false },
        }}
      />
      <span style={{ color: "#999", fontSize: "0.8rem" }}>--</span>
      <TimePicker
        value={stringToDayjs(values[fieldFin])}
        onChange={(v) => onChange(fieldFin, dayjsToString(v))}
        ampm={false}
        minutesStep={5}
        minTime={stringToDayjs(values[fieldDebut]) || MIN_TIME}
        maxTime={MAX_TIME}
        skipDisabled
        slotProps={{
          textField: {
            variant: "standard",
            fullWidth: true,
            error: !!errors[fieldFin],
            placeholder: "hh:mm",
            sx: timeFieldSx,
          },
          popper: { sx: popperSx },
          field: { clearable: false },
        }}
      />
    </div>
  </div>
);

// Carte de section Matin / Soir
const PeriodeSection = ({ icon, iconBg, iconColor, title, children }) => (
  <div
    style={{
      border: "1px solid #e6e9ea",
      borderLeft: "3px solid #3390a2",
      borderRadius: "8px",
      padding: "12px 14px 14px",
      marginBottom: "24px",
      backgroundColor: "#fcfdfd",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          backgroundColor: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className={icon} style={{ fontSize: "0.75rem", color: iconColor }}></i>
      </div>
      <Typography
        sx={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#14535f",
        }}
      >
        {title}
      </Typography>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>{children}</div>
  </div>
);

// ---------------------------------------------------------------------------
// Le modal
// ---------------------------------------------------------------------------
const ModifierHorairesModal = ({ open, service, onClose, onSaved, showSnackbar }) => {
  const [values, setValues] = useState(EMPTY_STATE);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Pré-remplissage à l'ouverture depuis record.horaires
  // (format liste : { entree_matin: "07:10 - 08:10", ... } ou null)
  useEffect(() => {
    if (!open || !service) return;
    const h = service.horaires;
    if (h) {
      const [emD, emF] = splitPlage(h.entree_matin);
      const [smD, smF] = splitPlage(h.sortie_matin);
      const [esD, esF] = splitPlage(h.entree_soir);
      const [ssD, ssF] = splitPlage(h.sortie_soir);
      setValues({
        entreeMatinDebut: emD, entreeMatinFin: emF,
        sortieMatinDebut: smD, sortieMatinFin: smF,
        entreeSoirDebut: esD, entreeSoirFin: esF,
        sortieSoirDebut: ssD, sortieSoirFin: ssF,
      });
    } else {
      setValues(EMPTY_STATE); // service sans horaires : formulaire vierge
    }
    setErrors({});
  }, [open, service]);

  const handleChange = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: false } : prev));
  }, []);

  // Validation identique au backend (requis, 05h-19h, début<fin, chevauchement)
  const validate = () => {
    const v = values;
    const newErrors = {};
    let message = null;

    Object.keys(FIELD_MAP).forEach((field) => {
      const val = v[field];
      const invalid = !val || val < "05:00" || val > "19:00";
      newErrors[field] = invalid;
      if (invalid && !message) {
        message = !val
          ? "Toutes les plages horaires sont requises."
          : "Les heures doivent être comprises entre 05h00 et 19h00.";
      }
    });

    const plages = [
      ["entreeMatinDebut", "entreeMatinFin"],
      ["sortieMatinDebut", "sortieMatinFin"],
      ["entreeSoirDebut", "entreeSoirFin"],
      ["sortieSoirDebut", "sortieSoirFin"],
    ];
    plages.forEach(([d, f]) => {
      if (v[d] && v[f] && v[d] >= v[f]) {
        newErrors[d] = true;
        newErrors[f] = true;
        if (!message) message = "Chaque heure de fin doit être après l'heure de début.";
      }
    });

    if (v.sortieMatinFin && v.entreeSoirDebut && v.sortieMatinFin > v.entreeSoirDebut) {
      newErrors.sortieMatinFin = true;
      newErrors.entreeSoirDebut = true;
      if (!message) message = "Chevauchement entre les horaires du matin et du soir.";
    }

    setErrors(newErrors);
    const ok = !Object.values(newErrors).some(Boolean);
    if (!ok && message) showSnackbar(message, true);
    return ok;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const payload = {};
    Object.entries(FIELD_MAP).forEach(([front, back]) => {
      payload[back] = values[front];
    });

    try {
      const response = await fetch(`${API_URL}/api/services-horaires/${service.idserv}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        showSnackbar(data.error || "Erreur lors de la mise à jour des horaires", true);
        return;
      }

      showSnackbar(data.message || "Horaires mis à jour avec succès", false);
      // Renvoie les plages au format liste pour rafraîchir la ligne du tableau
      onSaved(service.idserv, {
        entree_matin: `${values.entreeMatinDebut} - ${values.entreeMatinFin}`,
        sortie_matin: `${values.sortieMatinDebut} - ${values.sortieMatinFin}`,
        entree_soir: `${values.entreeSoirDebut} - ${values.entreeSoirFin}`,
        sortie_soir: `${values.sortieSoirDebut} - ${values.sortieSoirFin}`,
      });
      onClose();
    } catch (err) {
      showSnackbar(err.message || "Erreur interne", true);
    } finally {
      setSaving(false);
    }
  };

  if (!service) return null;

  return (
    <StyledDialog open={open} onClose={saving ? undefined : onClose}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        <div style={{ padding: "14px 16px" }}>
          {/* ============ EN-TÊTE : logo + nom du service ============ */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar
              src={service.logo ? `data:image/png;base64,${service.logo}` : undefined}
              alt={service.nom}
              sx={{ width: 56, height: 56, border: "1px solid #e6e9ea" }}
            >
              {service.sigle?.[0] || service.nom?.[0]}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  color: "#14535f",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {service.nom}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.72rem",
                  color: "#8a8a8a",
                }}
              >
                {service.sigle} · Code {service.code_service} — Modification des horaires
              </Typography>
            </div>
            <IconButton size="small" onClick={onClose} disabled={saving} sx={{ cursor: "pointer" }}>
              <i className="fa-solid fa-xmark" style={{ fontSize: "0.9rem", color: "#8a8a8a" }}></i>
            </IconButton>
          </div>

          <Divider sx={{ my: 3.5 }} />

          {/* ============ MATIN ============ */}
          <PeriodeSection
            icon="fa-solid fa-sun"
            iconBg="rgba(245, 166, 35, 0.12)"
            iconColor="#e8971a"
            title="Matin"
          >
            <TimeRangeField
              label="Heure d'entrée"
              fieldDebut="entreeMatinDebut"
              fieldFin="entreeMatinFin"
              values={values}
              errors={errors}
              onChange={handleChange}
            />
            <TimeRangeField
              label="Heure de sortie"
              fieldDebut="sortieMatinDebut"
              fieldFin="sortieMatinFin"
              values={values}
              errors={errors}
              onChange={handleChange}
            />
          </PeriodeSection>

          {/* ============ SOIR ============ */}
          <PeriodeSection
            icon="fa-solid fa-moon"
            iconBg="rgba(90, 103, 216, 0.12)"
            iconColor="#5a67d8"
            title="Soir"
          >
            <TimeRangeField
              label="Heure d'entrée"
              fieldDebut="entreeSoirDebut"
              fieldFin="entreeSoirFin"
              values={values}
              errors={errors}
              onChange={handleChange}
            />
            <TimeRangeField
              label="Heure de sortie"
              fieldDebut="sortieSoirDebut"
              fieldFin="sortieSoirFin"
              values={values}
              errors={errors}
              onChange={handleChange}
            />
          </PeriodeSection>

          {/* ============ BOUTONS ============ */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 13,
            }}
          >
            <Button
              variant="outlined"
              disabled={saving}
              onClick={onClose}
              sx={{
                fontFamily: "'Poppins', sans-serif",
                color: "#3390a2",
                borderColor: "#3390a2",
                fontSize: "0.78rem",
                px: 3,
                py: 0.8,
                minWidth: "120px",
                borderRadius: "4px",
                textTransform: "none",
                cursor: "pointer",
              }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              disabled={saving}
              onClick={handleSave}
              sx={{
                fontFamily: "'Poppins', sans-serif",
                backgroundColor: "#3390a2",
                fontSize: "0.78rem",
                px: 3,
                py: 0.8,
                minWidth: "120px",
                borderRadius: "4px",
                textTransform: "none",
                display: "flex",
                gap: 1,
                cursor: "pointer",
              }}
            >
              {saving ? (
                <Spin size="small" />
              ) : (
                <>
                  <i className="fa-solid fa-check" style={{ fontSize: "0.85rem" }}></i>
                  <span>Enregistrer</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </LocalizationProvider>
    </StyledDialog>
  );
};

export default ModifierHorairesModal;