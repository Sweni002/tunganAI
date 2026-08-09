import { Breadcrumb } from "antd";
import Breadcrumbs from '@mui/material/Breadcrumbs';
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
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import SnackbarContent from '@mui/material/SnackbarContent';
 import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Spin } from "antd";
import { Checkbox, FormControlLabel } from '@mui/material';
import { Select, MenuItem, FormControl, InputLabel,Menu } from '@mui/material';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import dayjs from "dayjs";
import { Popper,InputAdornment ,Box} from "@mui/material";
import { StaticDatePicker } from "@mui/x-date-pickers";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { AuthContext } from "../../AuthContext";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { CiSearch } from "react-icons/ci";


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

const ModAuto = () => {
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
const [matricule, setMatricule] = useState('');
const [motif, setMotif] = useState('');
const [dateDebut, setDateDebut] = useState(null); // null initialement
const [dateFin, setDateFin] = useState('');
const [openMatriculeDialog, setOpenMatriculeDialog] = useState(false);
const [selectedMatricule, setSelectedMatricule] = useState(null);
const [matricules, setMatricules] = useState([]); 
const [loading ,setLoading] =useState(false)
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
  const record = state?.record; // Ajoute une vérification au cas où

  const openDate = Boolean(anchorEl);

 const popperRef = React.useRef(null);

 const [anchorEl2, setAnchorEl2] = useState(null);

  const openDate2 = Boolean(anchorEl2);

 const popperRef2 = React.useRef(null);
const {fetchMe}=useContext(AuthContext)
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
  demiJournee :false ,
  type :false ,
  motif: false,
  dateDebut: false,
  dateFin: false,
  // autres champs...
});

const validateForm = () => {
  const newErrors = {
    matricule: !selectedMatricule, 
    type: !selectedType,
    motif: !motif.trim(),
    demiJournee: isOneDayAbsence && !demiJournee, // uniquement si on sélectionne 1 jour
    dateDebut: !dateDebut, // dateDebut est objet Date/dayjs
    dateFin: !isOneDayAbsence && !dateFin, // dateFin obligatoire si pas 1 jour
  };

  setErrors(newErrors);
  return !Object.values(newErrors).some(Boolean);
};

useEffect(() => {
  if (record) {
    console.log("mpddd",record)
    setMotif(record.motif || '');
    setSelectedType({
      idtype :record.idtype ,
      nomtype :record.nomtype
    })
    setDemiJournee(record.demi_journee || "complete") ;
    console.log("demi_journee :" ,record.demi_journee)
    // Gère les deux cas : un jour ou plusieurs jours
    if (record.date_absence) {
      setDateDebut(record.date_absence.split('T')[0]);
      setDateFin(record.date_absence.split('T')[0]);
      setIsOneDayAbsence(true);
      
    } else {
      setDateDebut(record.date_debut ? record.date_debut.split('T')[0] : '');
      setDateFin(record.date_fin ? record.date_fin.split('T')[0] : '');
      setIsOneDayAbsence(false);
    }

    setSelectedMatricule({
      idpers: record.idpers,
      matricule: record.matricule,
      nom: record.nom,
      prenom: record.prenom,
      role: record.role || "default", // <-- assure que role existe
    });
  }
}, [record]);

 useEffect(() => {
      const fetchAdmin = async () => {
        try {
          const data = await fetchMe(); // ⚠️ Assure-toi que fetchMe renvoie {id, nom, role, ...}
          setAdmin(data);
          console.log("me1 : " , data)
              } catch (err) {
          console.error("Erreur fetchMe:", err);
          setAdmin(null); // si non authentifié
        }
      };
      fetchAdmin();
    }, [])
    
 const  chargerLoading= () => {
  setLoading(true);
};

 const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
    });

    if (response.status === 401) {
      navigate('/login');  // Redirige ici
      throw new Error('Session expirée, veuillez vous reconnecter.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erreur inconnue');
    }

    return response.json();
  };

 const handleCloseSnack = (event, reason) => {
  if (reason === 'clickaway') {
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
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)', // couleur au survol (exemple gris clair)
      color: '#f44336', // changer la couleur de l'icône au hover (ex: rouge)
    },
    transition: 'background-color 0.3s, color 0.3s',
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
    m.matricule.toLowerCase().includes(searchMatricule.toLowerCase())
);

const handleOpenMatriculeDialog = () => {
  setOpenMatriculeDialog(true);
};

const handleCloseMatriculeDialog = () => {
  setOpenMatriculeDialog(false);
};



    useEffect(() => {
    const fetchTypes = async () => {
      try {
        const data = await fetchWithAuth(`${API_URL}/api/types`);
        setTypes(data); // supposé retourner [{idtype, nomtype}, ...]
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTypes();
  }, []);

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
        console.log("perso ! " , personnelsData)
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
    div.nomdivision.toLowerCase().includes(search.toLowerCase())
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

const updateAutorisation = async () => {
  if (!validateForm()) return;
if (!record || !record.id) {
  setSnackMessage("Aucune autorisation sélectionnée.");
  setIsSuccess(false);
  setOpenSnack(true);
  return;
}

  setLoading(true);

  // Vérification des dates uniquement si "un seul jour" n’est pas coché
  if (!isOneDayAbsence && new Date(dateDebut) > new Date(dateFin)) {
    setSnackMessage("La date de début ne peut pas être postérieure à la date de fin.");
    setIsSuccess(false);
    setLoading(false);
    setOpenSnack(true);
    return;
  }
const demi_journee_finale = demiJournee || "complete";

const formData = {
  idpers: selectedMatricule.idpers,
  motif,
  idtype: selectedType.idtype,  // ← Corrigé
   date_debut: dateDebut,
    date_fin: isOneDayAbsence ? dateDebut : dateFin,
    demi_journee: demi_journee_finale, // ⚠️ undefined si plusieurs jours
};

console.log("donnee envoyer :" , formData)
console.log("donnee envoyer :" , record.id)
  try {
    const data = await fetchWithAuth(`${API_URL}/api/autorisations/${record.id}`, {
      method: 'PUT',
      headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
    });

  
    setIsSuccess(true);
   
    setLoading(false);

    // Réinitialisation des champs
    setSelectedMatricule(null);
    setMotif('');
    setDateDebut('');
    setDateFin('');
       setSelectedType(null); 
       setDemiJournee("")// ← réinitialise le type
           sessionStorage.setItem('snackMessage', data.message);
sessionStorage.setItem('snackError', 'false');
navigate("/global/autorisation");


  } catch (error) {
    setSnackMessage("Erreur lors de la mise à jour : " + error.message);
    setIsSuccess(false);
    setOpenSnack(true);
    setLoading(false);
  }
};

  return (
    <div className={styles.personnels}>
      <div className={styles.break}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" sx={{ fontSize: "0.9rem" }}>
            Autorisation
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
                    fontFamily:
                      "system-ui, Avenir, Helvetica, Arial, sans-serif",
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

            <div className={styles.inputM}>
              <label htmlFor="matricule">
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
                    fontSize: "0.9rem",
                    fontFamily: "'Poppins', sans-serif",

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

            <div className={styles.inputM}>
              <label htmlFor="matricule">
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
                    fontFamily:
                      "system-ui, Avenir, Helvetica, Arial, sans-serif",
                    "@media (max-width:600px)": {
                      padding: "5px 0px !important",
                    },
                  },
                }}
              />
            </div>

            <div className={styles.inputDiv}>
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
                    fontSize: "0.75rem", // taille personnalisée
                    fontWeight: "bold",
                    color: "#333",
                  },
                }}
                sx={{ fontWeight: "bold", color: "#333", fontSize: "0.9rem" }}
              />
            </div>

            {/* Dates début et fin */}
            <div className={styles.dateContainer}>
              <div className={styles.dateField}>
                <label htmlFor="dateDebut">
                  {isOneDayAbsence ? "Date" : "Date début"}{" "}
                  <span style={{ color: "red" }}>*</span>
                </label>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TextField
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    value={
                      dateDebut ? dayjs(dateDebut).format("DD/MM/YYYY") : ""
                    }
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
                    open={openDate}
                    anchorEl={anchorEl}
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
                <div className={styles.dateField}>
                  <label htmlFor="dateFin">
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
                              <CalendarTodayIcon
                                style={{ fontSize: "1.0rem" }}
                              />
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
                <div className={styles.dateField}>
                  <label htmlFor="demiJournee">
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
                      value={
                        selectedMatricule?.role === "surface"
                          ? "complete" // force Absence complète
                          : demiJournee
                      }
                      disabled={
                        !selectedMatricule ||
                        selectedMatricule.role === "surface"
                      } // ← désactive si aucun matricule sélectionné
                      onChange={(e) => setDemiJournee(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="complete">Absence complète</MenuItem>
                      <MenuItem value="matin">Matin</MenuItem>
                      <MenuItem value="apres-midi">Après-midi</MenuItem>
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
              <div className={styles.dateFields}>
                <label htmlFor="demiJournee">
                  Demi-journée <span style={{ color: "red" }}>*</span>
                </label>

                <FormControl
                  variant="standard"
                  fullWidth
                  error={!!errors.demiJournee}
                  sx={{ mt: 1, mb: 2 }}
                >
                  <Select
                    value={
                      selectedMatricule?.role === "surface"
                        ? "complete" // force Absence complète
                        : demiJournee
                    }
                    disabled={
                      !selectedMatricule || selectedMatricule.role === "surface"
                    } // ← désactive si aucun matricule sélectionné
                    onChange={(e) => setDemiJournee(e.target.value)}
                  >
                    <MenuItem value="complete">Absence complète</MenuItem>
                    <MenuItem value="matin">Matin</MenuItem>
                  </Select>

                  {errors.demiJournee && (
                    <Typography variant="caption" color="error">
                      Veuillez sélectionner une demi-journée.
                    </Typography>
                  )}
                </FormControl>
              </div>
            )}

            <div className={styles.btn}>
              <Button
                variant="contained"
                disabled={loading}
                fullWidth
                onClick={() => {
                  if (validateForm()) {
                    updateAutorisation();
                  }
                }}
                sx={{
                  fontFamily: " 'Poppins', sans-serif",
                  backgroundColor: "#14535f",
                  fontSize: "0.9rem",
                  mb: 1,
                  display: "flex",
                  gap: 2,
                  py: 1.0,
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
                  <span className={styles.loader}></span>
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
        <div className={styles.dialo}>
          <TextField
            placeholder="Rechercher un personnel..."
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
              "& .MuiInputBase-root": {
                paddingRight: "10px", // évite que le texte touche l’icône
              },

              "& .MuiInputBase-input": {
                padding: "17px 1px",
                fontSize: "1rem",
                fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
                "@media (max-width:600px)": {
                  padding: "5px 0px !important",
                },
              },
            }}
          />
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
  );
};

export default ModAuto;
