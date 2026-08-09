import React from "react";
import {
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Box,
  Typography,
  Paper,
  Divider,
  Alert,
  Button,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { CiSearch } from "react-icons/ci";
import {
  UsersIcon,
  DoorOpenIcon,
  ClockCounterClockwiseIcon,
  MoonStarsIcon,
  SunDimIcon,
} from "@phosphor-icons/react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { fr } from "date-fns/locale";
import EventIcon from "@mui/icons-material/Event";
import DateRangeIcon from "@mui/icons-material/DateRange";
import Lottie from "lottie-react";
import SuccessLottie from "../../../../assets/success.json";
import ErrorLottie from "../../../../assets/error.json";
import styles from "../conge.module.css";

const BootstrapDialog2 = styled(Dialog)(({ theme, $step }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: theme.spacing(3),
    width: "100%",
    maxWidth: $step === "form" ? "850px" : $step === "success" ? "440px" : "600px",
  },
}));

const AutorisationDialog = ({
  open,
  onClose,
  step,
  setStep,
  loadingSelect,
  personnels,
  searchPers,
  setSearchPers,
  selectedMatricule,
  setSelectedMatricule,
  selected,
  setSelected,
  periode,
  setPeriode,
  isRange,
  setIsRange,
  dateDebut2,
  setDateDebut2,
  dateFin2,
  setDateFin2,
  motif,
  setMotif,
  formError,
  resultType,
  modalMessage,
  handleValider,
  resetDialogState,
  API_URL,
}) => {
  const options = [
    { id: "sortie", label: "Autoriser à sortir", icon: <DoorOpenIcon size={27} /> },
    { id: "retard", label: "Autoriser le retard", icon: <ClockCounterClockwiseIcon size={27} /> },
  ];

  const periodeOptions = [
    { id: "matin", label: "Matin", icon: <SunDimIcon size={27} /> },
    { id: "apres_midi", label: "Après-midi", icon: <MoonStarsIcon size={27} /> },
  ];

  return (
    <BootstrapDialog2
      $step={step}
      onClose={() => {
        onClose();
        resetDialogState();
      }}
      open={open}
    >
      <div style={{ position: "relative" }}>
        {loadingSelect && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: "blur(4px)",
              background: "rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <span className={styles.loader}></span>
          </div>
        )}

        {step === "list" && (
          <div>
            <div className={styles.dialo}>
              <TextField
                placeholder="Sélectionner un personnel..."
                value={searchPers}
                onChange={(e) => setSearchPers(e.target.value)}
                variant="standard"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CiSearch size={30} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mt: 0,
                  mb: 0,
                  width: "100%",
                  "& .MuiInputBase-root": { paddingRight: "10px" },
                  "& .MuiInputBase-input": {
                    padding: "17px 1px",
                    fontSize: "1rem",
                    fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
                  },
                }}
              />
            </div>
            <DialogContent style={{ minHeight: 300, maxHeight: 400, overflowY: "auto" }}>
              <div className={styles.liste}>
                {personnels
                  .filter((p) =>
                    `${p.nom} ${p.prenom} ${p.matricule}`
                      .toLowerCase()
                      .includes(searchPers.toLowerCase())
                  )
                  .map((p) => (
                    <div
                      key={p.idpers}
                      className={styles.liste1}
                      onClick={() => {
                        setSelectedMatricule(p);
                        setStep("form");
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div className={styles.liste2}>
                        <h4>{p.nom} {p.prenom}</h4>
                        <p style={{ fontSize: "0.85rem", color: "#666" }}>{p.matricule}</p>
                      </div>
                      <i className="fa-solid fa-user-check"></i>
                    </div>
                  ))}
                {personnels.length === 0 && <p>Aucun personnel trouvé.</p>}
              </div>
            </DialogContent>
          </div>
        )}

        {step === "form" && selectedMatricule && (
          <div style={{ position: "relative" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "#ffffff" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                  <Avatar
                    sx={{ width: 70, height: 70 }}
                    src={`${API_URL}/uploads/${selectedMatricule.image}`}
                  >
                    {selectedMatricule.nom?.[0]}
                  </Avatar>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                      {selectedMatricule.nom} {selectedMatricule.prenom}
                    </span>
                    <span style={{ fontSize: "0.9rem", color: "#777" }}>
                      {selectedMatricule.matricule}
                    </span>
                  </div>
                </div>
                <Tooltip title="Liste personnels">
                  <IconButton onClick={() => setStep("list")} size="large" disabled={loadingSelect}>
                    <UsersIcon size={26} color="#245297" />
                  </IconButton>
                </Tooltip>
              </div>
              <Divider sx={{ pt: 1 }} />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                padding: 17,
                maxHeight: "75vh",
                overflowY: "auto",
              }}
            >
              {/* Type d'autorisation */}
              <div>
                <label style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "bold" }}>
                  Type d'autorisation <span style={{ color: "#d32f2f" }}>*</span>
                </label>
                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  {options.map((option) => {
                    const isSelected = selected === option.id;
                    return (
                      <Paper
                        key={option.id}
                        onClick={() => setSelected(option.id)}
                        elevation={0}
                        sx={{
                          width: 180,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          p: 2,
                          borderRadius: 3,
                          border: "2px solid",
                          borderColor: isSelected ? "primary.main" : "#e0e0e0",
                          bgcolor: isSelected ? "action.selected" : "background.paper",
                          transition: "all 0.1s ease-in-out",
                          "&:active": { transform: "scale(0.97)" },
                          "&:hover": { bgcolor: isSelected ? "action.selected" : "#f9f9f9" },
                        }}
                      >
                        <Box sx={{ mb: 1 }}>{option.icon}</Box>
                        <Typography variant="body2" sx={{ textAlign: "center" }}>
                          {option.label}
                        </Typography>
                      </Paper>
                    );
                  })}
                </Box>
              </div>

              {/* Période */}
              <div>
                <label style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "bold" }}>
                  Période <span style={{ color: "#d32f2f" }}>*</span>
                </label>
                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  {periodeOptions.map((option) => {
                    const isSelected = periode === option.id;
                    return (
                      <Paper
                        key={option.id}
                        onClick={() => setPeriode(option.id)}
                        elevation={0}
                        sx={{
                          width: 180,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          p: 2,
                          borderRadius: 3,
                          border: "2px solid",
                          borderColor: isSelected ? "primary.main" : "#e0e0e0",
                          bgcolor: isSelected ? "action.selected" : "background.paper",
                          transition: "all 0.1s ease-in-out",
                          "&:active": { transform: "scale(0.97)" },
                        }}
                      >
                        <Box sx={{ mb: 1 }}>{option.icon}</Box>
                        <Typography variant="body2">{option.label}</Typography>
                      </Paper>
                    );
                  })}
                </Box>
              </div>

              {/* Durée */}
              <div>
                <label style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "bold" }}>
                  Durée <span style={{ color: "#d32f2f" }}>*</span>
                </label>
                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  {[
                    { id: false, label: "Une seule journée", icon: <EventIcon fontSize="small" /> },
                    { id: true, label: "Plusieurs jours", icon: <DateRangeIcon fontSize="small" /> },
                  ].map((option) => (
                    <Paper
                      key={option.label}
                      onClick={() => setIsRange(option.id)}
                      elevation={0}
                      sx={{
                        flex: 1,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        p: 2,
                        borderRadius: 3,
                        border: "2px solid",
                        borderColor: isRange === option.id ? "primary.main" : "#e0e0e0",
                        bgcolor: isRange === option.id ? "action.selected" : "background.paper",
                        transition: "all 0.1s ease-in-out",
                        "&:active": { transform: "scale(0.97)" },
                      }}
                    >
                      <Box sx={{ mb: 1 }}>{option.icon}</Box>
                      <Typography variant="body2">{option.label}</Typography>
                    </Paper>
                  ))}
                </Box>
              </div>

              {/* Dates */}
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <div style={{ marginTop: "10px" }}>
                  <label style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "16px" }}>
                    Date <span style={{ color: "#d32f2f" }}>*</span>
                  </label>
                  <Box sx={{ display: "flex", gap: 3 }}>
                    <DatePicker
                      label="Du"
                      value={dateDebut2}
                      onChange={(newValue) => setDateDebut2(newValue)}
                      slotProps={{
                        textField: {
                          variant: "outlined",
                          sx: {
                            width: "100%",
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "13px",
                              "& fieldset": { borderRadius: "13px", borderWidth: "2px", borderColor: "#e0e0e0" },
                              "&:hover fieldset": { borderColor: "primary.main" },
                              "&.Mui-focused fieldset": { borderColor: "primary.main" },
                            },
                          },
                        },
                      }}
                    />
                    {isRange && (
                      <DatePicker
                        label="Au"
                        value={dateFin2}
                        minDate={dateDebut2}
                        onChange={(newValue) => setDateFin2(newValue)}
                        slotProps={{
                          textField: {
                            variant: "outlined",
                            sx: {
                              width: "100%",
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 3,
                                "& fieldset": { borderWidth: "2px", borderColor: "#e0e0e0" },
                                "&:hover fieldset": { borderColor: "primary.main" },
                                "&.Mui-focused fieldset": { borderColor: "primary.main" },
                              },
                            },
                          },
                        }}
                      />
                    )}
                  </Box>
                </div>
              </LocalizationProvider>

              {/* Motif */}
              <div style={{ marginTop: "24px" }}>
                <label style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "12px" }}>
                  Motif de l'autorisation <span style={{ color: "#d32f2f" }}>*</span>
                </label>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Saisissez le motif ici..."
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "7px",
                      "& fieldset": { borderWidth: "1px", borderColor: "#bebcbc" },
                      "&:hover fieldset": { borderColor: "primary.main" },
                      "&.Mui-focused fieldset": { borderColor: "primary.main" },
                    },
                  }}
                />
              </div>

              {formError && (
                <Alert severity="error" variant="standard">
                  {formError}
                </Alert>
              )}

              <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "30px" }}>
                <Button
                  variant="outlined"
                  sx={{ px: 3, py: 1.2, fontSize: "0.8rem", borderRadius: "2px" }}
                  onClick={onClose}
                >
                  Annuler
                </Button>
                <Button
                  variant="contained"
                  onClick={handleValider}
                  disabled={loadingSelect}
                  sx={{
                    background: "#3754b1",
                    px: 5,
                    py: 1.2,
                    fontSize: "0.9rem",
                    borderRadius: "2px",
                    "&:hover": { background: "#15535f" },
                  }}
                >
                  Valider
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "success" && (
          <div style={{ padding: 30, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 15 }}>
            <Lottie
              animationData={resultType === "success" ? SuccessLottie : ErrorLottie}
              loop={false}
              style={{ width: 250, height: 170, margin: "0 auto" }}
            />
            <Typography variant="h7" sx={{ mt: 1 }}>
              {modalMessage}
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                onClose();
                resetDialogState();
              }}
              sx={{ mt: 4 }}
            >
              Fermer
            </Button>
          </div>
        )}
      </div>
    </BootstrapDialog2>
  );
};

export default AutorisationDialog;