import React, { useEffect, useState } from "react";
import {
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  Stack,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  TextField
} from "@mui/material";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { WbSunny, NightlightRound, Save } from "@mui/icons-material";
import dayjs from "dayjs";
import { data, useNavigate } from "react-router-dom";
import Perso from "../../assets/v4.jpg";
import styles from "./ajoutHoraire.module.css";
import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";
import { Popper, InputAdornment } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Lottie from "lottie-react";
import SuccessLottie from '../../assets/success.json';
import ErrorLottie from '../../assets/error.json';
import { styled } from "@mui/material/styles";
import DialogActions from '@mui/material/DialogActions';


const API_URL = import.meta.env.VITE_API_URL;


const BootstrapDialog2 = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: theme.spacing(0),
    width: "100%",
    maxWidth: "370px",
  },
}));


const AjoutHoraire = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [loading, setLoading] = useState(false);
    const [openResultModal, setOpenResultModal] = useState(false);
  const [resultType, setResultType] = useState("success"); // success | error
  const [modalMessage, setModalMessage] = useState("");

  // Horaires matin
  const [openTimePickerMatinDeb, setOpenTimePickerMatinDeb] = useState(false);
  const handleCloseTimePickerMatinDeb = () => setOpenTimePickerMatinDeb(false);
  const [openTimePickerMatinFin, setOpenTimePickerMatinFin] = useState(false);
  const handleCloseTimePickerMatinFin = () => setOpenTimePickerMatinFin(false);
  const [openTimePickerSortieDeb, setOpenTimePickerSortieDeb] = useState(false);
  const handleCloseTimePickerSortieDeb = () => setOpenTimePickerSortieDeb(false);
  const [openTimePickerSortieFin, setOpenTimePickerSortieFin] = useState(false);
  const handleCloseTimePickerSortieFin = () => setOpenTimePickerSortieFin(false);

  
// Horaires soir
 const [openTimePickerMSoirDeb, setOpenTimePickerSoirDeb] = useState(false);
 const handleCloseTimePickerSoirDeb = () => setOpenTimePickerSoirDeb(false);
 const [openTimePickerSoirFin, setOpenTimePickerSoirFin] = useState(false);
 const handleCloseTimePickerSoirFin = () => setOpenTimePickerSoirFin(false);
 const [openTimePickerSortieSoirDeb, setOpenTimePickerSortieSoirDeb] = useState(false);
 const handleCloseTimePickerSortieSoirDeb = () => setOpenTimePickerSortieSoirDeb(false);
 const [openTimePickerSortieSoirFin, setOpenTimePickerSortieSoirFin] = useState(false);
 const handleCloseTimePickerSortieSoirFin = () => setOpenTimePickerSortieSoirFin(false);

  
const isEmpty = (v) => v === null || v === undefined || v === "";

const validateForm = () => {
  const newErrors = {
    service: !selectedService,

    matin: {
      eDeb: isEmpty(matin.eDeb),
      eFin: isEmpty(matin.eFin),
      sDeb: isEmpty(matin.sDeb),
      sFin: isEmpty(matin.sFin),
    },

    soir: {
      eDeb: isEmpty(soir.eDeb),
      eFin: isEmpty(soir.eFin),
      sDeb: isEmpty(soir.sDeb),
      sFin: isEmpty(soir.sFin),
    },
  };

  const hasError =
    newErrors.service ||
    Object.values(newErrors.matin).some(Boolean) ||
    Object.values(newErrors.soir).some(Boolean);

  setErrors(newErrors);
  return !hasError;
};

  const [matin, setMatin] = useState({
    eDeb: null,
    eFin: null,
    sDeb: null,
    sFin: null,
  });
  const [soir, setSoir] = useState({
    eDeb: null,
    eFin: null,
    sDeb: null,
    sFin: null,
  });
  const [errors, setErrors] = useState({ service: false });

  const formatTime = (val) => (val ? dayjs(val).format("HH:mm") : null);

  const goBack = () => navigate(-1);

  useEffect(() => {
    fetch(`${API_URL}/api/services/`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
      })
      .catch((err) => console.error("Erreur fetch services :", err));
  }, []);

  const handleSubmit = async () => {
    if (!selectedService) {
      setErrors({ service: true });
      return;
    }
  if (!validateForm()) {
    alert("Veuillez remplir tous les champs horaires.");
    return;
  } 
  setLoading(true)
  
    const payload = {
      idserv: selectedService,
      entree_matin_debut: formatTime(matin.eDeb),
      entree_matin_fin: formatTime(matin.eFin),
      sortie_matin_debut: formatTime(matin.sDeb),
      sortie_matin_fin: formatTime(matin.sFin),
      entree_soir_debut: formatTime(soir.eDeb),
      entree_soir_fin: formatTime(soir.eFin),
      sortie_soir_debut: formatTime(soir.sDeb),
      sortie_soir_fin: formatTime(soir.sFin),
    };

    console.log(payload)
  try {
  const res = await fetch(`${API_URL}/api/horaires`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json(); // ✅ IMPORTANT

  if (!res.ok) {
    throw new Error(data.error || "Erreur lors de l'enregistrement");
  }

  setModalMessage(data.message || "Horaires créés avec succès !");
  setResultType("success");
  setOpenResultModal(true);
setSelectedService("");
  setMatin({
    eDeb: null,
    eFin: null,
    sDeb: null,
    sFin: null,
  });

  setSoir({
    eDeb: null,
    eFin: null,
    sDeb: null,
    sFin: null,
  });


} catch (err) {

    console.log(err.message);
  setModalMessage(err.message);
  setResultType("error");
  setOpenResultModal(true);

} finally {
  setLoading(false);
}
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={styles.services}>
        <div className={styles.card}>
          <div className={styles.container}>
            <div className={styles.retour} onClick={goBack}>
              <IconButton size="large">
                <i className="fa-solid fa-arrow-left"></i>
              </IconButton>
            </div>

            <div className={styles.sary1}>
              <img src={Perso} alt="Illustration" />
            </div>

            <div className={styles.form}>
              {/* SÉLECTION DU SERVICE */}
              <div className={styles.inputM}>
                <label>
                  Service <span style={{ color: "red" }}>*</span>
                </label>
                <FormControl variant="standard" fullWidth sx={{ mb: 3 }}>
                  <Select
                    value={selectedService}
                    displayEmpty
                    onChange={(e) => {
                      setSelectedService(e.target.value);
                      setErrors({ service: false });
                    }}
                    error={errors.service}
                  >
                    <MenuItem disabled value=""></MenuItem>
                    {services.map((serv) => (
                      <MenuItem key={serv.idserv} value={serv.idserv}>
                        {serv.nom}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.service && (
                    <Typography
                      variant="caption"
                      sx={{ color: "brown", mt: 0.5 }}
                    >
                      Veuillez choisir un service.
                    </Typography>
                  )}
                </FormControl>
              </div>
              {/* SECTION MATIN */}
              <Box sx={{ mb: 7 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <WbSunny sx={{ color: "#ffa726", fontSize: "1.2rem" }} />
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{
                      color: "#333",
                      fontSize: "0.9rem",
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    Horaires du Matin
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 3,
                  }}
                >
                  {/* ITEM */}
                  <Box sx={{ width: { xs: "100%", sm: "calc(50% - 12px)" } }}>
                    <TextField
                      label="Entrée (Début)"
                      placeholder="Entrée (Début)"
                      value={
                        matin.eDeb ? dayjs(matin.eDeb).format("HH:mm") : ""
                      }
                      onClick={() => setOpenTimePickerMatinDeb(true)}
                      readOnly
                      error={errors.heureSortie}
                      helperText={
                        errors.heureSortie ? "L'heure est requise." : ""
                      }
                      variant="standard"
                      fullWidth
                      sx={{
                        mt: 1,
                        mb: 2,
                        fontFamily:
                          " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",

                        width: "100%",
                        "& .MuiInputBase-input": {
                          padding: "10px 1px", // padding interne uniforme
                          fontSize: "0.9rem", // ← augmente la taille du texte
                          fontWeight: 500,
                          "@media (max-width:600px)": {
                            padding: "5px 0px !important", // mobile → réduit
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily:
                            " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                          fontSize: "0.8rem", // ← augmente la taille du texte
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
                              onClick={() => setOpenTimePickerMatinDeb(true)}
                              size="large"
                            >
                              <i
                                className="fa-solid fa-sun"
                                style={{ fontSize: "1.0rem" }}
                              ></i>
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Dialog
                      open={openTimePickerMatinDeb}
                      onClose={handleCloseTimePickerMatinDeb}
                    >
                      <DialogContent sx={{ p: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f9fafb",
                            p: 4, // padding = 4 * 8px = 32px (comme Tailwind p-4)
                          }}
                        >
                          {" "}
                          {/* p: 0 pour que le picker prenne toute la place */}
                          <StaticTimePicker
                            orientation="landscape" // mode paysage
                            ampm={false} // format 24h
                            open={openTimePickerMatinDeb}
                            value={matin.eDeb ? dayjs(matin.eDeb) : dayjs()}
                            onOpen={() => setOpenTimePickerMatinDeb(true)}
                            onChange={(v) => setMatin({ ...matin, eDeb: v })}
                            onClose={() => setOpenTimePickerMatinDeb(false)}
                            minutesStep={5}
                            localeText={{
                              toolbarTitle: "RÉGLER L'HEURE",
                              cancelButtonLabel: "Annuler", // ← bouton Annuler en français
                              okButtonLabel: "OK", // ← bouton OK (tu peux mettre "Valider" si tu veux)
                            }}
                            sx={{
                              width: {
                                xs: 800, // mobile → largeur plus large
                                sm: 700, // tablette / desktop → encore plus large
                              },
                              "& .MuiPickersTimePickerToolbar-root": {
                                minWidth: "100%", // toolbar prend toute la largeur
                              },
                              "& .MuiPickersTimePicker-root, & .MuiPickersClock-root":
                                {
                                  width: "100%", // horloge et picker prennent toute la largeur
                                },
                            }}
                          />
                        </Box>
                      </DialogContent>
                    </Dialog>
                  </Box>

                  <Box sx={{ width: { xs: "100%", sm: "calc(50% - 12px)" } }}>
                    <TextField
                      label="Entrée (Fin)"
                      placeholder="Entrée (Fin)"
                      value={
                        matin.eFin ? dayjs(matin.eFin).format("HH:mm") : ""
                      }
                      onClick={() => setOpenTimePickerMatinFin(true)}
                      readOnly
                      error={errors.heureSortie}
                      helperText={
                        errors.heureSortie ? "L'heure est requise." : ""
                      }
                      variant="standard"
                      fullWidth
                      sx={{
                        mt: 1,
                        mb: 2,
                        fontFamily:
                          " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",

                        width: "100%",
                        "& .MuiInputBase-input": {
                          padding: "10px 1px", // padding interne uniforme
                          fontSize: "0.9rem", // ← augmente la taille du texte
                          fontWeight: 500,
                          "@media (max-width:600px)": {
                            padding: "5px 0px !important", // mobile → réduit
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily:
                            " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                          fontSize: "0.8rem", // ← augmente la taille du texte
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
                              onClick={() => setOpenTimePickerMatinFin(true)}
                              size="large"
                            >
                              <i
                                className="fa-solid fa-sun"
                                style={{ fontSize: "1.0rem" }}
                              ></i>
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Dialog
                      open={openTimePickerMatinFin}
                      onClose={handleCloseTimePickerMatinFin}
                    >
                      <DialogContent sx={{ p: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f9fafb",
                            p: 4, // padding = 4 * 8px = 32px (comme Tailwind p-4)
                          }}
                        >
                          {" "}
                          {/* p: 0 pour que le picker prenne toute la place */}
                          <StaticTimePicker
                            orientation="landscape" // mode paysage
                            ampm={false} // format 24h
                            open={openTimePickerMatinFin}
                            value={matin.eFin ? dayjs(matin.eFin) : dayjs()}
                            onOpen={() => setOpenTimePickerMatinFin(true)}
                            onChange={(v) => setMatin({ ...matin, eFin: v })}
                            onClose={() => setOpenTimePickerMatinFin(false)}
                            minutesStep={5}
                            localeText={{
                              toolbarTitle: "RÉGLER L'HEURE",
                              cancelButtonLabel: "Annuler", // ← bouton Annuler en français
                              okButtonLabel: "OK", // ← bouton OK (tu peux mettre "Valider" si tu veux)
                            }}
                            sx={{
                              width: {
                                xs: 800, // mobile → largeur plus large
                                sm: 700, // tablette / desktop → encore plus large
                              },
                              "& .MuiPickersTimePickerToolbar-root": {
                                minWidth: "100%", // toolbar prend toute la largeur
                              },
                              "& .MuiPickersTimePicker-root, & .MuiPickersClock-root":
                                {
                                  width: "100%", // horloge et picker prennent toute la largeur
                                },
                            }}
                          />
                        </Box>
                      </DialogContent>
                    </Dialog>
                  </Box>

                  <Box sx={{ width: { xs: "100%", sm: "calc(50% - 12px)" } }}>
                    <TextField
                      label="Sortie (Début)"
                      placeholder="Sortie (Début)"
                      value={
                        matin.sDeb ? dayjs(matin.sDeb).format("HH:mm") : ""
                      }
                      onClick={() => setOpenTimePickerSortieDeb(true)}
                      readOnly
                      error={errors.heureSortie}
                      helperText={
                        errors.heureSortie ? "L'heure est requise." : ""
                      }
                      variant="standard"
                      fullWidth
                      sx={{
                        mt: 1,
                        mb: 2,
                        fontFamily:
                          " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",

                        width: "100%",
                        "& .MuiInputBase-input": {
                          padding: "10px 1px", // padding interne uniforme
                          fontSize: "0.9rem", // ← augmente la taille du texte
                          fontWeight: 500,
                          "@media (max-width:600px)": {
                            padding: "5px 0px !important", // mobile → réduit
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily:
                            " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                          fontSize: "0.8rem", // ← augmente la taille du texte
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
                              onClick={() => setOpenTimePickerSortieDeb(true)}
                              size="large"
                            >
                              <i
                                className="fa-solid fa-sun"
                                style={{ fontSize: "1.0rem" }}
                              ></i>
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Dialog
                      open={openTimePickerSortieDeb}
                      onClose={handleCloseTimePickerSortieDeb}
                    >
                      <DialogContent sx={{ p: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f9fafb",
                            p: 4, // padding = 4 * 8px = 32px (comme Tailwind p-4)
                          }}
                        >
                          {" "}
                          {/* p: 0 pour que le picker prenne toute la place */}
                          <StaticTimePicker
                            orientation="landscape" // mode paysage
                            ampm={false} // format 24h
                            open={openTimePickerSortieDeb}
                            value={matin.sDeb ? dayjs(matin.sDeb) : dayjs()}
                            onOpen={() => setOpenTimePickerSortieDeb(true)}
                            onChange={(v) => setMatin({ ...matin, sDeb: v })}
                            onClose={() => setOpenTimePickerSortieDeb(false)}
                            minutesStep={5}
                            localeText={{
                              toolbarTitle: "RÉGLER L'HEURE",
                              cancelButtonLabel: "Annuler", // ← bouton Annuler en français
                              okButtonLabel: "OK", // ← bouton OK (tu peux mettre "Valider" si tu veux)
                            }}
                            sx={{
                              width: {
                                xs: 800, // mobile → largeur plus large
                                sm: 700, // tablette / desktop → encore plus large
                              },
                              "& .MuiPickersTimePickerToolbar-root": {
                                minWidth: "100%", // toolbar prend toute la largeur
                              },
                              "& .MuiPickersTimePicker-root, & .MuiPickersClock-root":
                                {
                                  width: "100%", // horloge et picker prennent toute la largeur
                                },
                            }}
                          />
                        </Box>
                      </DialogContent>
                    </Dialog>
                  </Box>
                  <Box sx={{ width: { xs: "100%", sm: "calc(50% - 12px)" } }}>
                    <TextField
                      label="Sortie (Fin)"
                      placeholder="Sortie (Fin)"
                      value={
                        matin.sFin ? dayjs(matin.sFin).format("HH:mm") : ""
                      }
                      onClick={() => setOpenTimePickerSortieFin(true)}
                      readOnly
                      error={errors.heureSortie}
                      helperText={
                        errors.heureSortie ? "L'heure est requise." : ""
                      }
                      variant="standard"
                      fullWidth
                      sx={{
                        mt: 1,
                        mb: 2,
                        fontFamily:
                          " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",

                        width: "100%",
                        "& .MuiInputBase-input": {
                          padding: "10px 1px", // padding interne uniforme
                          fontSize: "0.9rem", // ← augmente la taille du texte
                          fontWeight: 500,
                          "@media (max-width:600px)": {
                            padding: "5px 0px !important", // mobile → réduit
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily:
                            " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                          fontSize: "0.8rem", // ← augmente la taille du texte
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
                              onClick={() => setOpenTimePickerSortieFin(true)}
                              size="large"
                            >
                              <i
                                className="fa-solid fa-sun"
                                style={{ fontSize: "1.0rem" }}
                              ></i>
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Dialog
                      open={openTimePickerSortieFin}
                      onClose={handleCloseTimePickerSortieFin}
                    >
                      <DialogContent sx={{ p: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f9fafb",
                            p: 4, // padding = 4 * 8px = 32px (comme Tailwind p-4)
                          }}
                        >
                          {" "}
                          {/* p: 0 pour que le picker prenne toute la place */}
                          <StaticTimePicker
                            orientation="landscape" // mode paysage
                            ampm={false} // format 24h
                            open={openTimePickerSortieFin}
                            value={matin.sFin ? dayjs(matin.sFin) : dayjs()}
                            onOpen={() => setOpenTimePickerSortieFin(true)}
                            onChange={(v) => setMatin({ ...matin, sFin: v })}
                            onClose={() => setOpenTimePickerSortieFin(false)}
                            minutesStep={5}
                            localeText={{
                              toolbarTitle: "RÉGLER L'HEURE",
                              cancelButtonLabel: "Annuler", // ← bouton Annuler en français
                              okButtonLabel: "OK", // ← bouton OK (tu peux mettre "Valider" si tu veux)
                            }}
                            sx={{
                              width: {
                                xs: 800, // mobile → largeur plus large
                                sm: 700, // tablette / desktop → encore plus large
                              },
                              "& .MuiPickersTimePickerToolbar-root": {
                                minWidth: "100%", // toolbar prend toute la largeur
                              },
                              "& .MuiPickersTimePicker-root, & .MuiPickersClock-root":
                                {
                                  width: "100%", // horloge et picker prennent toute la largeur
                                },
                            }}
                          />
                        </Box>
                      </DialogContent>
                    </Dialog>
                  </Box>
                </Box>
              </Box>

              {/* SECTION SOIR */}
              <Box sx={{ mb: 5 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <NightlightRound
                    sx={{ color: "#5c6bc0", fontSize: "1.2rem" }}
                  />
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{
                      fontSize: "0.9rem",

                      color: "#333",
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    Horaires du Soir
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 3,
                  }}
                >
                  <Box sx={{ width: { xs: "100%", sm: "calc(50% - 12px)" } }}>
                    <TextField
                      label="Entrée (Début)"
                      placeholder="Entrée (Début)"
                      value={soir.eDeb ? dayjs(soir.eDeb).format("HH:mm") : ""}
                      onClick={() => setOpenTimePickerSoirDeb(true)}
                      readOnly
                      error={errors.heureSortie}
                      helperText={
                        errors.heureSortie ? "L'heure est requise." : ""
                      }
                      variant="standard"
                      fullWidth
                      sx={{
                        mt: 1,
                        mb: 2,
                        fontFamily:
                          " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",

                        width: "100%",
                        "& .MuiInputBase-input": {
                          padding: "10px 1px", // padding interne uniforme
                          fontSize: "0.9rem", // ← augmente la taille du texte
                          fontWeight: 500,
                          "@media (max-width:600px)": {
                            padding: "5px 0px !important", // mobile → réduit
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily:
                            " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                          fontSize: "0.8rem", // ← augmente la taille du texte
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
                              onClick={() => setOpenTimePickerSoirDeb(true)}
                              size="large"
                            >
                              <i
                                className="fa-solid fa-moon"
                                style={{ fontSize: "1.0rem" }}
                              ></i>
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Dialog
                      open={openTimePickerMSoirDeb}
                      onClose={handleCloseTimePickerSoirDeb}
                    >
                      <DialogContent sx={{ p: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f9fafb",
                            p: 4, // padding = 4 * 8px = 32px (comme Tailwind p-4)
                          }}
                        >
                          {" "}
                          {/* p: 0 pour que le picker prenne toute la place */}
                          <StaticTimePicker
                            orientation="landscape" // mode paysage
                            ampm={false} // format 24h
                            open={openTimePickerMSoirDeb}
                            value={soir.eDeb ? dayjs(soir.eDeb) : dayjs()}
                            onOpen={() => setOpenTimePickerSoirDeb(true)}
                            onChange={(v) => setSoir({ ...soir, eDeb: v })}
                            onClose={() => setOpenTimePickerSoirDeb(false)}
                            minutesStep={5}
                            localeText={{
                              toolbarTitle: "RÉGLER L'HEURE",
                              cancelButtonLabel: "Annuler", // ← bouton Annuler en français
                              okButtonLabel: "OK", // ← bouton OK (tu peux mettre "Valider" si tu veux)
                            }}
                            sx={{
                              width: {
                                xs: 800, // mobile → largeur plus large
                                sm: 700, // tablette / desktop → encore plus large
                              },
                              "& .MuiPickersTimePickerToolbar-root": {
                                minWidth: "100%", // toolbar prend toute la largeur
                              },
                              "& .MuiPickersTimePicker-root, & .MuiPickersClock-root":
                                {
                                  width: "100%", // horloge et picker prennent toute la largeur
                                },
                            }}
                          />
                        </Box>
                      </DialogContent>
                    </Dialog>
                  </Box>

                  <Box sx={{ width: { xs: "100%", sm: "calc(50% - 12px)" } }}>
                    <TextField
                      label="Entrée (Fin)"
                      placeholder="Entrée (Fin)"
                      value={soir.eFin ? dayjs(soir.eFin).format("HH:mm") : ""}
                      onClick={() => setOpenTimePickerSoirFin(true)}
                      readOnly
                      error={errors.heureSortie}
                      helperText={
                        errors.heureSortie ? "L'heure est requise." : ""
                      }
                      variant="standard"
                      fullWidth
                      sx={{
                        mt: 1,
                        mb: 2,
                        fontFamily:
                          " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",

                        width: "100%",
                        "& .MuiInputBase-input": {
                          padding: "10px 1px", // padding interne uniforme
                          fontSize: "0.9rem", // ← augmente la taille du texte
                          fontWeight: 500,
                          "@media (max-width:600px)": {
                            padding: "5px 0px !important", // mobile → réduit
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily:
                            " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                          fontSize: "0.8rem", // ← augmente la taille du texte
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
                              onClick={() => setOpenTimePickerSoirFin(true)}
                              size="large"
                            >
                              <i
                                className="fa-solid fa-moon"
                                style={{ fontSize: "1.0rem" }}
                              ></i>
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Dialog
                      open={openTimePickerSoirFin}
                      onClose={handleCloseTimePickerSoirFin}
                    >
                      <DialogContent sx={{ p: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f9fafb",
                            p: 4, // padding = 4 * 8px = 32px (comme Tailwind p-4)
                          }}
                        >
                          {" "}
                          {/* p: 0 pour que le picker prenne toute la place */}
                          <StaticTimePicker
                            orientation="landscape" // mode paysage
                            ampm={false} // format 24h
                            open={openTimePickerSoirFin}
                            value={soir.eFin ? dayjs(soir.eFin) : dayjs()}
                            onOpen={() => setOpenTimePickerSoirFin(true)}
                            onChange={(v) => setSoir({ ...soir, eFin: v })}
                            onClose={() => setOpenTimePickerSoirFin(false)}
                            minutesStep={5}
                            localeText={{
                              toolbarTitle: "RÉGLER L'HEURE",
                              cancelButtonLabel: "Annuler", // ← bouton Annuler en français
                              okButtonLabel: "OK", // ← bouton OK (tu peux mettre "Valider" si tu veux)
                            }}
                            sx={{
                              width: {
                                xs: 800, // mobile → largeur plus large
                                sm: 700, // tablette / desktop → encore plus large
                              },
                              "& .MuiPickersTimePickerToolbar-root": {
                                minWidth: "100%", // toolbar prend toute la largeur
                              },
                              "& .MuiPickersTimePicker-root, & .MuiPickersClock-root":
                                {
                                  width: "100%", // horloge et picker prennent toute la largeur
                                },
                            }}
                          />
                        </Box>
                      </DialogContent>
                    </Dialog>
                  </Box>

                  <Box sx={{ width: { xs: "100%", sm: "calc(50% - 12px)" } }}>
                    <TextField
                      label="Sortie (Début)"
                      placeholder="Sortie (Début)"
                      value={soir.sDeb ? dayjs(soir.sDeb).format("HH:mm") : ""}
                      onClick={() => setOpenTimePickerSortieSoirDeb(true)}
                      readOnly
                      error={errors.heureSortie}
                      helperText={
                        errors.heureSortie ? "L'heure est requise." : ""
                      }
                      variant="standard"
                      fullWidth
                      sx={{
                        mt: 1,
                        mb: 2,
                        fontFamily:
                          " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",

                        width: "100%",
                        "& .MuiInputBase-input": {
                          padding: "10px 1px", // padding interne uniforme
                          fontSize: "0.9rem", // ← augmente la taille du texte
                          fontWeight: 500,
                          "@media (max-width:600px)": {
                            padding: "5px 0px !important", // mobile → réduit
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily:
                            " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                          fontSize: "0.8rem", // ← augmente la taille du texte
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
                              onClick={() => openTimePickerSortieSoirDeb(true)}
                              size="large"
                            >
                              <i
                                className="fa-solid fa-moon"
                                style={{ fontSize: "1.0rem" }}
                              ></i>
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Dialog
                      open={openTimePickerSortieSoirDeb}
                      onClose={handleCloseTimePickerSortieSoirDeb}
                    >
                      <DialogContent sx={{ p: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f9fafb",
                            p: 4, // padding = 4 * 8px = 32px (comme Tailwind p-4)
                          }}
                        >
                          {" "}
                          {/* p: 0 pour que le picker prenne toute la place */}
                          <StaticTimePicker
                            orientation="landscape" // mode paysage
                            ampm={false} // format 24h
                            open={openTimePickerSortieSoirDeb}
                            value={soir.sDeb ? dayjs(soir.sDeb) : dayjs()}
                            onOpen={() => setOpenTimePickerSortieSoirDeb(true)}
                            onChange={(v) => setSoir({ ...soir, sDeb: v })}
                            onClose={() =>
                              setOpenTimePickerSortieSoirDeb(false)
                            }
                            minutesStep={5}
                            localeText={{
                              toolbarTitle: "RÉGLER L'HEURE",
                              cancelButtonLabel: "Annuler", // ← bouton Annuler en français
                              okButtonLabel: "OK", // ← bouton OK (tu peux mettre "Valider" si tu veux)
                            }}
                            sx={{
                              width: {
                                xs: 800, // mobile → largeur plus large
                                sm: 700, // tablette / desktop → encore plus large
                              },
                              "& .MuiPickersTimePickerToolbar-root": {
                                minWidth: "100%", // toolbar prend toute la largeur
                              },
                              "& .MuiPickersTimePicker-root, & .MuiPickersClock-root":
                                {
                                  width: "100%", // horloge et picker prennent toute la largeur
                                },
                            }}
                          />
                        </Box>
                      </DialogContent>
                    </Dialog>
                  </Box>
                  <Box sx={{ width: { xs: "100%", sm: "calc(50% - 12px)" } }}>
                    <TextField
                      label="Sortie (Fin)"
                      placeholder="Sortie (Fin)"
                      value={soir.sFin ? dayjs(soir.sFin).format("HH:mm") : ""}
                      onClick={() => setOpenTimePickerSortieSoirFin(true)}
                      readOnly
                      error={errors.heureSortie}
                      helperText={
                        errors.heureSortie ? "L'heure est requise." : ""
                      }
                      variant="standard"
                      fullWidth
                      sx={{
                        mt: 1,
                        mb: 2,
                        fontFamily:
                          " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",

                        width: "100%",
                        "& .MuiInputBase-input": {
                          padding: "10px 1px", // padding interne uniforme
                          fontSize: "0.9rem", // ← augmente la taille du texte
                          fontWeight: 500,
                          "@media (max-width:600px)": {
                            padding: "5px 0px !important", // mobile → réduit
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily:
                            " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                          fontSize: "0.8rem", // ← augmente la taille du texte
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
                              onClick={() =>
                                setOpenTimePickerSortieSoirFin(true)
                              }
                              size="large"
                            >
                              <i
                                className="fa-solid fa-moon"
                                style={{ fontSize: "1.0rem" }}
                              ></i>
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Dialog
                      open={openTimePickerSortieSoirFin}
                      onClose={handleCloseTimePickerSortieSoirFin}
                    >
                      <DialogContent sx={{ p: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#f9fafb",
                            p: 4, // padding = 4 * 8px = 32px (comme Tailwind p-4)
                          }}
                        >
                          {" "}
                          {/* p: 0 pour que le picker prenne toute la place */}
                          <StaticTimePicker
                            orientation="landscape" // mode paysage
                            ampm={false} // format 24h
                            open={openTimePickerSortieSoirFin}
                            value={soir.sFin ? dayjs(soir.sFin) : dayjs()}
                            onOpen={() => setOpenTimePickerSortieSoirFin(true)}
                            onChange={(v) => setSoir({ ...soir, sFin: v })}
                            onClose={() =>
                              setOpenTimePickerSortieSoirFin(false)
                            }
                            minutesStep={5}
                            localeText={{
                              toolbarTitle: "RÉGLER L'HEURE",
                              cancelButtonLabel: "Annuler", // ← bouton Annuler en français
                              okButtonLabel: "OK", // ← bouton OK (tu peux mettre "Valider" si tu veux)
                            }}
                            sx={{
                              width: {
                                xs: 800, // mobile → largeur plus large
                                sm: 700, // tablette / desktop → encore plus large
                              },
                              "& .MuiPickersTimePickerToolbar-root": {
                                minWidth: "100%", // toolbar prend toute la largeur
                              },
                              "& .MuiPickersTimePicker-root, & .MuiPickersClock-root":
                                {
                                  width: "100%", // horloge et picker prennent toute la largeur
                                },
                            }}
                          />
                        </Box>
                      </DialogContent>
                    </Dialog>
                  </Box>
                </Box>
              </Box>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                fullWidth
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
                    <span className={styles.loader}></span>
                  </div>
                ) : (
                  <>
                    <i
                      className="fa-solid fa-plus"
                      style={{ fontSize: "1.1rem" }}
                    ></i>
                    <span>Sauvegarder</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>


                  <BootstrapDialog2
                    open={openResultModal}
                    onClose={() => setOpenResultModal(false)}
                    PaperProps={{ style: { textAlign: "center", padding: 10 } }}
                  >
                    <DialogContent>
                      <Lottie
                        animationData={
                          resultType === "success" ? SuccessLottie : ErrorLottie
                        }
                        loop={false}
                        style={{ width: 250, height: 170, margin: "0 auto" }}
                      />
                      <Typography
                        variant="h7"
                        sx={{ mt: 4, fontFamily: "'Poppins', sans-serif" }}
                      >
                        {modalMessage}
                      </Typography>
                    </DialogContent>
                    <DialogActions>
                      <Button
                    onClick={() => setOpenResultModal(false)}
                             variant="contained"
                        sx={{
                          backgroundColor: "transparent",
                          borderRadius: 4,
                          border: "none",
                          color: "#238a8aff",
                          p: 1.5,
                          letterSpacing: 2,
                          fontWeight: "boldy",
                        }}
                      >
                        ok
                      </Button>
                    </DialogActions>
                  </BootstrapDialog2>

    </LocalizationProvider>
  );
};

export default AjoutHoraire;
