import { Breadcrumb } from "antd";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "./ajout_conge.module.css";
import Perso from "../../assets/v4.jpg";
import Logo from "../../assets/1.png";
import Avatar from "@mui/material/Avatar";
import { styled } from "@mui/material/styles";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Alert from "@mui/material/Alert";
import { useLocation, useNavigate } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import SnackbarContent from "@mui/material/SnackbarContent";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Spin } from "antd";
import { Checkbox } from "@mui/material";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Menu,
  RadioGroup,
  Radio,
  FormLabel,
  FormControlLabel,
} from "@mui/material";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

import {
  TimePicker,
  MobileTimePicker,
  StaticTimePicker,
} from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Popper, InputAdornment, Box } from "@mui/material";
import { StaticDatePicker } from "@mui/x-date-pickers";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { AuthContext } from "../../AuthContext";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { fr } from "date-fns/locale";
import { ThreeDot } from "react-loading-indicators";
const API_URL = import.meta.env.VITE_API_URL;

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: theme.spacing(3),
    width: "100%",
    maxWidth: "500px",
  },
}));

const ModPointage = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageURL, setSelectedImageURL] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [divisions, setDivisions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(null); // état sélection
  const [openSnack, setOpenSnack] = useState(false);
  const [matricule, setMatricule] = useState("");
  const [motif, setMotif] = useState("");
  const [dateDebut, setDateDebut] = useState(null); // null initialement
  const [dateFin, setDateFin] = useState("");
  const [openMatriculeDialog, setOpenMatriculeDialog] = useState(false);
  const [selectedMatricule, setSelectedMatricule] = useState(null);
  const [matricules, setMatricules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMatricule, setSearchMatricule] = useState("");
  const [personnels, setPersonnels] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [snackMessage, setSnackMessage] = useState(""); // état pour le message
  const [selectedType, setSelectedType] = useState(null);
  const [anchorElType, setAnchorElType] = useState(null);
  const openType = Boolean(anchorElType);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchPers, setSearchPers] = useState("");
  const [selectedPers, setSelectedPers] = useState(null);
  const [isOneDayAbsence, setIsOneDayAbsence] = useState(true);
  const [types, setTypes] = useState([]);
  const typeDivRef = useRef(null);
  const [typeTouched, setTypeTouched] = useState(false);
  const [demiJournee, setDemiJournee] = useState("complete"); // ← valeur par défaut
  // 'matin', 'apres-midi' ou ''
  const selectRef = useRef(null);
  const [openSelect, setOpenSelect] = useState(false);
  const dateDebutRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const { state } = useLocation();
  const record = state?.menuRecord; // Ajoute une vérification au cas où
  const [heureEntree, setHeureEntree] = useState(null); // stocke Date objet
  const [openTimePicker, setOpenTimePicker] = useState(false);
const [heureEntree1, setHeureEntree1] = useState(null);
const [heureSortie1, setHeureSortie1] = useState(null);
  const handleOpenTimePicker = () => {
    if (absencePeriode === "matin") return;
    setOpenTimePicker(true);
  };
  const isFetching = useRef(false);

  const handleCloseTimePicker = () => setOpenTimePicker(false);

  const [heureEntreeSoir, setHeureEntreeSoir] = useState(null); // stocke Date objet
  const [openTimePickerEntreeSoir, setOpenTimePickerEntreeSoir] =
    useState(false);

  const handleOpenTimePickerEntreeSoir = () => {
    if (absencePeriodeSoir === "soir") return;
    setOpenTimePickerEntreeSoir(true);
  };

  const handleCloseTimePickerEntreeSoir = () =>
    setOpenTimePickerEntreeSoir(false);

  const [heureSortie, setHeureSortie] = useState(null); // stocke Date objet
  const [openTimePickerSortie, setOpenTimePickerSortie] = useState(false);

  const handleOpenTimePickerSortie = () => {
    if (absencePeriode === "matin") return;
    setOpenTimePickerSortie(true);
  };

  const handleCloseTimePickerSortie = () => setOpenTimePickerSortie(false);

  const [heureSortieSoir, setHeureSortieSoir] = useState(null); // stocke Date objet
  const [openTimePickerSortieSoir, setOpenTimePickerSortieSoir] =
    useState(false);
  const [openTimeSurface, setOpenSurface] =
    useState(false);
      const [openTimeSurface2, setOpenSurface2] = useState(false);
  const handleOpenTimePickerSortieSoir = () => {
    if (absencePeriodeSoir === "soir") return;
    setOpenTimePickerSortieSoir(true);
  };
  const handleCloseTimePickerSortieSoir = () =>
    setOpenTimePickerSortieSoir(false);
  const openDate = Boolean(anchorEl);

    const handleOpenSurface = () => {
      if (absenceSurface) return;
      setOpenSurface(true);
    };


       const handleOpenSurface2 = () => {
         if (absenceSurface) return;
         setOpenSurface2(true);
       };
      const handleCloseTimeSurface = () => setOpenSurface(false);
  const handleCloseTimeSurface2 = () => setOpenSurface2(false);

  const popperRef = React.useRef(null);
  const [absencePeriode, setAbsencePeriode] = useState("");
  const [absencePeriodeSoir, setAbsencePeriodeSoir] = useState("");
  const [absenceSurface, setAbsenceSurface] = useState(false);
  const [anchorEl2, setAnchorEl2] = useState(null);
const isSurface = selectedMatricule?.role === "surface";
  const openDate2 = Boolean(anchorEl2);

  const popperRef2 = React.useRef(null);
  const { fetchMe } = useContext(AuthContext);
  const [admin, setAdmin] = useState(null);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // fermer
  const handleCloseDate = () => {
    setAnchorEl(null);
  };

  const [errors, setErrors] = useState({
    matricule: false,
    demiJournee: false,
    type: false,
    motif: false,
    dateDebut: false,
    dateFin: false,
    // autres champs...
  });

  const validateForm = () => {
    const newErrors = {
      matricule: !selectedMatricule,
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  useEffect(() => {
    if (record) {
      console.log("record =", record);
      setSelectedMatricule({
        idpers: record.idpers,
        matricule: record.matricule,
        nom: record.nom,
        prenom: record.prenom,
        role: record.role,
      });
        console.log("c est", record.role);
const isSurface = record.role === "surface";

 if (isSurface) {
 
   if (record.absence_unique) {
 
    setAbsenceSurface(true)
        setHeureEntree1(null);
        setHeureSortie1(null)
   } else {
     setAbsenceSurface(false);
     setHeureEntree1(record.heure_entree_unique || null);

   setHeureSortie1(record.heure_sortie_unique || null);

   }
 } else{

      if (record.matin?.absence) {
        setAbsencePeriode("matin");
      } else {
        setAbsencePeriode(""); // aucun coché
      }
      if (record.apresmidi?.absence) {
        setAbsencePeriodeSoir("soir");
      } else {
        setAbsencePeriodeSoir(""); // aucun coché
      }

   
    }
       if (record.date) {
         setDateDebut(dayjs(record.date));

         // Initialisation de l'heure d'entrée
         if (record.matin?.entree) {
           const fullDateTime = dayjs(`${record.date}T${record.matin.entree}`);
           setHeureEntree(fullDateTime);
         }
         if (record.apresmidi?.entree) {
           const fullDateTime = dayjs(
             `${record.date}T${record.apresmidi.entree}`,
           );
           setHeureEntreeSoir(fullDateTime);
         }
         // Initialisation de l'heure de sortie
         if (record.matin?.sortie) {
           const fullDateTimeSortie = dayjs(
             `${record.date}T${record.matin.sortie}`,
           );
           setHeureSortie(fullDateTimeSortie);
         }

         if (record.apresmidi?.sortie) {
           const fullDateTimeSortie = dayjs(
             `${record.date}T${record.apresmidi.sortie}`,
           );
           setHeureSortieSoir(fullDateTimeSortie);
         }
            if (record.heure_entree_unique) {
              const fullDateTimeSortie = dayjs(
                `${record.date}T${record.heure_entree_unique}`,
              );
              setHeureEntree1(fullDateTimeSortie);
            }
             if (record.heure_sortie_unique) {
               const fullDateTimeSortie = dayjs(
                 `${record.date}T${record.heure_sortie_unique}`,
               );
               setHeureSortie1(fullDateTimeSortie);
             }
       }
    }
  }, [record]);
  useEffect(() => {
    const fetchAdmin = async () => {
            if (isFetching.current) return; // Stop si déjà en cours
            isFetching.current = true;

      try {
        const data = await fetchMe(); // ⚠️ Assure-toi que fetchMe renvoie {id, nom, role, ...}
        setAdmin(data);
        console.log("me1 : ", data);
      } catch (err) {
        console.error("Erreur fetchMe:", err);
        setAdmin(null); // si non authentifié
      } finally {
        isFetching.current = false;
      }
    };
    fetchAdmin();
  }, []);

  const chargerLoading = () => {
    setLoading(true);
  };

  const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });

    if (response.status === 401) {
      navigate("/login"); // Redirige ici
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Erreur inconnue");
    }

    return response.json();
  };

  const handleCloseSnack = (event, reason) => {
    if (reason === "clickaway") {
      // Si on clique hors du snackbar, on ferme juste le snackbar, pas de navigation
      setOpenSnack(false);
      return;
    }
    // Si on ferme le snackbar avec le bouton "close" (croix), on ferme juste le snackbar
    setOpenSnack(false);
  };
  const action = (
    <>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleCloseSnack}
        sx={{
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.1)", // couleur au survol (exemple gris clair)
            color: "#f44336", // changer la couleur de l'icône au hover (ex: rouge)
          },
          transition: "background-color 0.3s, color 0.3s",
        }}
      >
        <CloseIcon fontSize="medium" />
      </IconButton>
    </>
  );
  const filteredMatricules = matricules.filter(
    (m) =>
      m.nom.toLowerCase().includes(searchMatricule.toLowerCase()) ||
      m.prenom.toLowerCase().includes(searchMatricule.toLowerCase()) ||
      m.matricule.toLowerCase().includes(searchMatricule.toLowerCase()),
  );

  const handleOpenMatriculeDialog = () => {
    setOpenMatriculeDialog(true);
  };

  const handleCloseMatriculeDialog = () => {
    setOpenMatriculeDialog(false);
  };

  useEffect(() => {
    if (!admin || !admin.responsable || !admin.responsable.idrh) {
      console.log("Admin pas encore chargé, on attend...");
      return;
    }

    const idserv = admin.responsable.idserv;
    setLoading(true);

    // Fetch divisions et personnels en parallèle
    const fetchDivisions = fetchWithAuth(
      `${API_URL}/api/divisions/with_count?idserv=${idserv}`,
    );

    const fetchPersonnels = fetchWithAuth(
      `${API_URL}/api/personnels/service/${admin.responsable.idserv}`,
    );

    Promise.all([fetchDivisions, fetchPersonnels])
      .then(([divisionsData, personnelsData]) => {
        // ---- Divisions ----
        if (Array.isArray(divisionsData)) {
          setDivisions(divisionsData);
        } else {
          console.error("Erreur divisions:", divisionsData);
          setDivisions([]);
        }

        // ---- Personnels ----
        if (Array.isArray(personnelsData)) {
          console.log("perso ! ", personnelsData);
          setPersonnels(personnelsData);
          setErrorMsg(null);
        } else if (personnelsData.error) {
          setErrorMsg(personnelsData.error);
          setPersonnels([]);
        } else {
          setErrorMsg("Format inattendu pour personnels");
          setPersonnels([]);
        }
      })
      .catch((err) => {
        console.error("Erreur fetch divisions/personnels:", err);
        setDivisions([]);
        setPersonnels([]);
        setErrorMsg(err.message);
      })
      .finally(() => setLoading(false));
  }, [admin]); // s'exécute seulement quand 'admin' change

  const filteredDivisions = divisions.filter((div) =>
    div.nomdivision.toLowerCase().includes(search.toLowerCase()),
  );
  const CustomSelectIcon = () => (
    <IconButton
      aria-label="more"
      size="large"
      onClick={() => setOpenSelect(true)} // ouvre le Select
      style={{ cursor: "pointer" }}
    >
      <i
        className="fa-solid fa-chevron-down"
        style={{ color: "#1B6979", fontSize: "15px" }}
      ></i>
    </IconButton>
  );

  const goBack = () => {
    navigate(-1);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClickOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const parseHour = (timeStr, defaultHour = 8, defaultMinute = 0) => {
    if (!timeStr)
      return dayjs().hour(defaultHour).minute(defaultMinute).second(0);
    const [h, m] = timeStr.split(":");
    const result = dayjs().hour(parseInt(h)).minute(parseInt(m)).second(0);
    return result.isValid()
      ? result
      : dayjs().hour(defaultHour).minute(defaultMinute).second(0);
  };
  const formatTime = (value) => {
    if (!value) return null;
    return dayjs(value).format("HH:mm");
  };

  useEffect(() => {
    if (absencePeriode === "matin") {
      setHeureEntree(null);
      setHeureSortie(null);
    }
  }, [absencePeriode]);

  useEffect(() => {
    if (absencePeriodeSoir === "soir") {
      setHeureEntreeSoir(null);
      setHeureSortieSoir(null);
    }
  }, [absencePeriodeSoir]);

const handleSubmit = async () => {
  if (!record || !admin) return;

  setLoading(true);

  // Vérifie si le rôle est "surface"
  const isSurface = selectedMatricule?.role === "surface";

  // Payload commun
  const payload = {
    idpointage: record.idpointage,
    idserv: admin?.responsable?.idserv,
  };

  let endpoint = `${API_URL}/api/pointage/update_pointage_responsable`;

  if (isSurface) {
    endpoint = `${API_URL}/api/pointage/update_pointage_unique`;

    // Pour agents de surface : heure d'entrée unique ou absence unique
    if (absenceSurface) {
      payload.absence_unique = true;
      payload.heure_entree_unique = null;
          payload.heure_sortie_unique = null;
    } else if (heureEntree1 ||  heureSortie1) {
      payload.heure_entree_unique = formatTime(heureEntree1);
       payload.heure_sortie_unique = formatTime(heureSortie1);
      payload.absence_unique = false;
    } else {
      // Si aucun info fournie : erreur
      setSnackMessage(
        "Veuillez renseigner l'heure d'entrée ou sortie ou cocher l'absence.",
      );
      setIsSuccess(false);
      setOpenSnack(true);
      setLoading(false);
      return;
    }
  } else {
    // Pour les autres rôles : matin/soir
    payload.idserv = admin.responsable.idserv;

    payload.heure_entree_matin =
      absencePeriode === "matin" ? null : formatTime(heureEntree);
    payload.heure_sortie_matin =
      absencePeriode === "matin" ? null : formatTime(heureSortie);

    payload.heure_entree_soir =
      absencePeriodeSoir === "soir" ? null : formatTime(heureEntreeSoir);
    payload.heure_sortie_soir =
      absencePeriodeSoir === "soir" ? null : formatTime(heureSortieSoir);

    payload.absence_matin = absencePeriode === "matin";
    payload.absence_soir = absencePeriodeSoir === "soir";
  }

  try {
    console.log("fuseau",payload)
    const res = await fetchWithAuth(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSuccess(true);
    sessionStorage.setItem(
      "snackMessage",
      res.message || "Pointage mis à jour avec succès",
    );
    sessionStorage.setItem("snackError", "false");
    navigate("/global/fiche_presence", {
      state: {
        idrh: admin?.responsable?.idrh,
        idserv: admin?.responsable?.idserv,
      },
    });
  } catch (err) {
    console.error(err);
    setSnackMessage(err.message || "Erreur lors de la mise à jour");
    setIsSuccess(false);
    setOpenSnack(true);
  } finally {
    setLoading(false);
  }
};

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <div className={styles.personnels}>
        <div className={styles.break}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link underline="hover" color="inherit" sx={{ fontSize: "0.9rem" }}>
              Fiche de présence
            </Link>

            <Typography sx={{ color: "text.primary", fontSize: "0.9rem" }}>
              Modifier
            </Typography>
          </Breadcrumbs>
        </div>

        <div className={styles.card}>
          <div className={styles.container}>
            <div className={styles.retour} onClick={goBack}>
              <IconButton
                aria-label="more"
                id="long-button"
                aria-haspopup="true"
                size="large"
              >
                <i className="fa-solid fa-arrow-left"></i>
              </IconButton>
            </div>

            <div className={styles.sary1}>
              <img src={Perso} alt="" />
            </div>

            <div className={styles.form}>
              <div className={styles.inputM}>
                <label htmlFor="matricule">
                  Matricule <span style={{ color: "red" }}>*</span>
                </label>
                <TextField
                  placeholder="Selectionner un personnel"
                  variant="standard"
                  readOnly
                  fullWidth
                  value={
                    selectedMatricule
                      ? `${selectedMatricule.matricule} - ${selectedMatricule.nom}`
                      : ""
                  }
                  error={errors.matricule} // ← true seulement si champ invalide
                  helperText={
                    errors.matricule ? "Le matricule est requis." : ""
                  } // ← helper text seulement si erreur
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
                      fontFamily:
                        "system-ui, Avenir, Helvetica, Arial, sans-serif",
                      "@media (max-width:600px)": {
                        padding: "5px 0px !important",
                      },
                    },
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
              ></Menu>

              <div className={styles.inputM}>
                <label htmmatinlFor="dateDebut">
                  Date pointage
                  <span style={{ color: "red" }}>*</span>
                </label>
                <TextField
                  value={dateDebut ? dayjs(dateDebut).format("DD/MM/YYYY") : ""}
                  readOnly
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
                />
              </div>
              {!isSurface && (
                <>
                  <div className={styles.dateContainer}>
                    <div className={styles.dateField}>
                      <label htmlFor="heure_entree">
                        Entrée matin
                        <span style={{ color: "red" }}>*</span>
                      </label>
                      <TextField
                        disabled={absencePeriode === "matin"}
                        placeholder="Sélectionner une heure"
                        value={
                          heureEntree ? dayjs(heureEntree).format("HH:mm") : ""
                        }
                        onClick={handleOpenTimePicker}
                        readOnly
                        error={errors.heureEntree}
                        helperText={
                          errors.heureEntree
                            ? "L'heure d'entrée est requise."
                            : ""
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
                                onClick={handleOpenTimePicker}
                                size="large"
                                disabled={absencePeriode === "matin"}
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
                        open={openTimePicker}
                        onClose={handleCloseTimePicker}
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
                              open={openTimePicker}
                              onOpen={() => setOpenTimePicker(true)}
                              onClose={() => setOpenTimePicker(false)}
                              value={
                                heureEntree ||
                                (record?.matin?.entree
                                  ? (() => {
                                      const [h, m] =
                                        record.matin.entree.split(":");
                                      return dayjs()
                                        .hour(parseInt(h))
                                        .minute(parseInt(m))
                                        .second(0);
                                    })()
                                  : dayjs().hour(6).minute(0).second(0)) // valeur par défaut
                              }
                              onChange={(newValue) => setHeureEntree(newValue)}
                              minutesStep={5}
                              minTime={dayjs().hour(4).minute(0).second(0)}
                              maxTime={dayjs().hour(12).minute(0).second(0)}
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
                    </div>{" "}
                    <div className={styles.dateField}>
                      <label htmlFor="heure_entree">
                        Sortie matin
                        <span style={{ color: "red" }}>*</span>
                      </label>
                      <TextField
                        placeholder="Sélectionner une heure"
                        disabled={absencePeriode === "matin"}
                        value={
                          heureSortie ? dayjs(heureSortie).format("HH:mm") : ""
                        }
                        onClick={handleOpenTimePickerSortie}
                        readOnly
                        error={errors.heureSortie}
                        helperText={
                          errors.heureSortie
                            ? "L'heure de sortie est requise."
                            : ""
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
                                onClick={handleOpenTimePickerSortie}
                                size="large"
                                disabled={absencePeriode === "matin"}
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
                        open={openTimePickerSortie}
                        onClose={handleCloseTimePickerSortie}
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
                              open={openTimePickerSortie}
                              value={
                                heureSortie && dayjs(heureSortie).isValid()
                                  ? dayjs(heureSortie)
                                  : record?.matin?.sortie
                                    ? (() => {
                                        const [h, m] =
                                          record.matin.sortie.split(":");
                                        return dayjs()
                                          .hour(parseInt(h))
                                          .minute(parseInt(m))
                                          .second(0);
                                      })()
                                    : dayjs().hour(11).minute(0).second(0)
                              }
                              onOpen={() => setOpenTimePickerSortie(true)}
                              onClose={() => setOpenTimePickerSortie(false)}
                              onChange={(newValue) => setHeureSortie(newValue)}
                              minutesStep={5}
                              minTime={dayjs().hour(4).minute(0).second(0)}
                              maxTime={dayjs().hour(13).minute(0).second(0)}
                              disabled={absencePeriode === "matin"}
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
                    </div>{" "}
                  </div>

                  <div className={styles.dateContainer}>
                    <div className={styles.dateField}>
                      <label htmlFor="heure_entree">
                        Entrée soir
                        <span style={{ color: "red" }}>*</span>
                      </label>
                      <TextField
                        disabled={absencePeriodeSoir === "soir"}
                        placeholder="Sélectionner une heure"
                        value={
                          heureEntreeSoir
                            ? dayjs(heureEntreeSoir).format("HH:mm")
                            : ""
                        }
                        onClick={handleOpenTimePickerEntreeSoir}
                        readOnly
                        error={errors.heureEntreeSoir}
                        helperText={
                          errors.heureEntreeSoir
                            ? "L'heure d'entrée soir est requise."
                            : ""
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
                                onClick={handleOpenTimePickerEntreeSoir}
                                size="large"
                                disabled={absencePeriodeSoir === "soir"}
                              >
                                <i
                                  className="fa-solid fa-cloud-sun"
                                  style={{ fontSize: "1.0rem" }}
                                ></i>
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <Dialog
                        open={openTimePickerEntreeSoir}
                        onClose={handleCloseTimePickerEntreeSoir}
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
                              open={openTimePickerEntreeSoir}
                              onOpen={() => setOpenTimePickerEntreeSoir(true)}
                              onClose={() => setOpenTimePickerEntreeSoir(false)}
                              value={
                                heureEntreeSoir ||
                                (record?.apresmidi?.entree
                                  ? (() => {
                                      const [h, m] =
                                        record.apresmidi.entree.split(":");
                                      return dayjs()
                                        .hour(parseInt(h))
                                        .minute(parseInt(m))
                                        .second(0);
                                    })()
                                  : dayjs().hour(13).minute(0).second(0)) // valeur par défaut
                              }
                              onChange={(newValue) =>
                                setHeureEntreeSoir(newValue)
                              }
                              minutesStep={5}
                              minTime={dayjs().hour(12).minute(0).second(0)}
                              maxTime={dayjs().hour(15).minute(0).second(0)}
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
                    </div>{" "}
                    <div className={styles.dateField}>
                      <label htmlFor="heure_entree">
                        Sortie soir
                        <span style={{ color: "red" }}>*</span>
                      </label>
                      <TextField
                        disabled={absencePeriodeSoir === "soir"}
                        placeholder="Sélectionner une heure"
                        value={
                          heureSortieSoir
                            ? dayjs(heureSortieSoir).format("HH:mm")
                            : ""
                        }
                        onClick={handleOpenTimePickerSortieSoir}
                        readOnly
                        error={errors.heureSortieSoir}
                        helperText={
                          errors.heureSortieSoir
                            ? "L'heure de sortie soir est requise."
                            : ""
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
                                onClick={handleOpenTimePickerSortie}
                                size="large"
                                disabled={absencePeriodeSoir === "soir"}
                              >
                                <i
                                  className="fa-solid fa-cloud-sun"
                                  style={{ fontSize: "1.0rem" }}
                                ></i>
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <Dialog
                        open={openTimePickerSortieSoir}
                        onClose={handleCloseTimePickerSortieSoir}
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
                              open={openTimePickerSortieSoir}
                              value={
                                heureSortieSoir &&
                                dayjs(heureSortieSoir).isValid()
                                  ? dayjs(heureSortieSoir)
                                  : record?.apresmidi?.sortie
                                    ? (() => {
                                        const [h, m] =
                                          record.apresmidi.sortie.split(":");
                                        return dayjs()
                                          .hour(parseInt(h))
                                          .minute(parseInt(m))
                                          .second(0);
                                      })()
                                    : dayjs().hour(13).minute(0).second(0)
                              }
                              onOpen={() => setOpenTimePickerSortieSoir(true)}
                              onClose={() => setOpenTimePickerSortieSoir(false)}
                              onChange={(newValue) =>
                                setHeureSortieSoir(newValue)
                              }
                              minutesStep={5}
                              minTime={dayjs().hour(15).minute(0).second(0)}
                              maxTime={dayjs().hour(18).minute(0).second(0)}
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
                    </div>{" "}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 15,
                      fontFamily: " 'Poppins', sans-serif",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={absencePeriode === "matin"}
                          onChange={(e) =>
                            setAbsencePeriode(e.target.checked ? "matin" : "")
                          }
                        />
                      }
                      label="Absent le matin"
                      sx={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 15,
                      fontFamily: " 'Poppins', sans-serif",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={absencePeriodeSoir === "soir"}
                          onChange={(e) =>
                            setAbsencePeriodeSoir(
                              e.target.checked ? "soir" : "",
                            )
                          }
                        />
                      }
                      label="Absent le soir"
                      sx={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>
                </>
              )}
              {selectedMatricule?.role === "surface" && (
                <>
                  <div className={styles.dateContainer}>
                    <div className={styles.dateField1}>
                      <label htmlFor="heure_entree">
                        Heure entrée
                        <span style={{ color: "red" }}>*</span>
                      </label>
                      <TextField
                        disabled={absenceSurface}
                        placeholder="Sélectionner une heure"
                        value={
                          heureEntree1
                            ? dayjs(heureEntree1).format("HH:mm")
                            : ""
                        }
                        onClick={handleOpenSurface}
                        readOnly
                        error={errors.heureEntree1}
                        helperText={
                          errors.heureEntree1
                            ? "L'heure d'entrée est requise."
                            : ""
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
                                onClick={handleOpenSurface}
                                size="large"
                                disabled={absenceSurface}
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
                        open={openTimeSurface}
                        onClose={handleCloseTimeSurface}
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
                              open={openTimeSurface}
                              onOpen={() => setOpenSurface(true)}
                              onClose={() => setOpenSurface(false)}
                              value={
                                heureEntree1 ||
                                (record?.heure_entree_unique
                                  ? (() => {
                                      const [h, m] =
                                        record.heure_entree_unique.split(":");
                                      return dayjs()
                                        .hour(parseInt(h))
                                        .minute(parseInt(m))
                                        .second(0);
                                    })()
                                  : dayjs().hour(6).minute(0).second(0)) // valeur par défaut
                              }
                              onChange={(newValue) => setHeureEntree1(newValue)}
                              minutesStep={5}
                              minTime={dayjs().hour(4).minute(0).second(0)}
                              maxTime={dayjs().hour(21).minute(0).second(0)}
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
                    </div>{" "}
                    <div className={styles.dateField1}>
                      <label htmlFor="heure_entree">
                        Heure de sortie
                        <span style={{ color: "red" }}>*</span>
                      </label>
                      <TextField
                        disabled={absenceSurface}
                        placeholder="Sélectionner une heure"
                        value={
                          heureSortie1
                            ? dayjs(heureSortie1).format("HH:mm")
                            : ""
                        }
                        onClick={handleOpenSurface2}
                        readOnly
                        error={errors.heureSortie1}
                        helperText={
                          errors.heureSortie1
                            ? "L'heure d'entrée est requise."
                            : ""
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
                                onClick={handleOpenSurface2}
                                size="large"
                                disabled={absenceSurface}
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
                        open={openTimeSurface2}
                        onClose={handleCloseTimeSurface2}
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
                              open={openTimeSurface2}
                              onOpen={() => setOpenSurface2(true)}
                              onClose={() => setOpenSurface2(false)}
                              value={
                                heureSortie1 ||
                                (record?.heure_sortie_unique
                                  ? (() => {
                                      const [h, m] =
                                        record.heure_sortie_unique.split(":");
                                      return dayjs()
                                        .hour(parseInt(h))
                                        .minute(parseInt(m))
                                        .second(0);
                                    })()
                                  : dayjs().hour(6).minute(0).second(0)) // valeur par défaut
                              }
                              onChange={(newValue) => setHeureSortie1(newValue)}
                              minutesStep={5}
                              minTime={dayjs().hour(8).minute(0).second(0)}
                              maxTime={dayjs().hour(21).minute(0).second(0)}
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
                    </div>{" "}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 15,
                      fontFamily: " 'Poppins', sans-serif",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={absenceSurface}
                          onChange={(e) => setAbsenceSurface(e.target.checked)}
                        />
                      }
                      label="Absent"
                      sx={{ fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>
                </>
              )}
              <div className={styles.btn}>
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
                        height:43,
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
        <BootstrapDialog
          onClose={() => setOpenMatriculeDialog(false)}
          open={openMatriculeDialog}
        >
          <div className={styles.dialog}>
            <input
              type="text"
              placeholder="Rechercher un personnel..."
              value={searchPers}
              onChange={(e) => setSearchPers(e.target.value)}
            />
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>

          <DialogContent
            style={{
              minHeight: 300,
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            {loading ? (
              <p>Chargement...</p>
            ) : errorMsg ? (
              <p style={{ color: "red" }}>{errorMsg}</p>
            ) : (
              <div className={styles.liste}>
                {personnels
                  .filter((p) =>
                    `${p.nom} ${p.prenom} ${p.matricule}`
                      .toLowerCase()
                      .includes(searchPers.toLowerCase()),
                  )
                  .map((p) => (
                    <div
                      key={p.idpers}
                      className={styles.liste1}
                      onClick={() => {
                        setSelectedMatricule(p);
                        setErrors((prev) => ({ ...prev, matricule: false }));
                        setOpenMatriculeDialog(false);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div className={styles.liste2}>
                        <h4>
                          {p.nom} {p.prenom}
                        </h4>
                        <p style={{ fontSize: "0.85rem", color: "#666" }}>
                          {p.matricule}
                        </p>
                      </div>
                      <i className="fa-solid fa-user-check"></i>
                    </div>
                  ))}
                {personnels.length === 0 && <p>Aucun personnel trouvé.</p>}
              </div>
            )}
          </DialogContent>
        </BootstrapDialog>

        <Snackbar
          open={openSnack}
          autoHideDuration={8000}
          onClose={handleCloseSnack}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <SnackbarContent
            sx={{
              p: 1,
              px: 3,
              fontSize: "0.8rem",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 3,
            }}
            message={<span style={{ marginRight: 8 }}>{snackMessage}</span>}
            action={action}
          />
        </Snackbar>
      </div>
    </LocalizationProvider>
  );
};

export default ModPointage;
