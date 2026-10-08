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
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import Switch from "@mui/material/Switch";
import "dayjs/locale/fr";
import m from "./modPointage.module.css";
import PageHeader from "./autorisations_absences/components/PageHeader";
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
  TimeClock,
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

const formatHeure = (valeur) =>
  valeur && dayjs(valeur).isValid() ? dayjs(valeur).format("HH:mm") : null;

/** Champ « heure » : un grand bouton qui ouvre le sélecteur ; la croix efface l'heure. */
const TimeField = ({ label, value, onOpen, onClear }) => {
  const heure = formatHeure(value);
  return (
    <div className={m.timeWrap}>
      <button
        type="button"
        className={`${m.timeField} ${heure ? m.filled : ""}`}
        onClick={onOpen}
        aria-label={`${label} : ${heure ?? "non renseignée"}`}
      >
        <span className={m.timeLabel}>{label}</span>
        <span className={m.timeValue}>{heure ?? "--:--"}</span>
        <i className="fa-regular fa-clock" aria-hidden="true"></i>
      </button>
      {heure && (
        <button type="button" className={m.clear} onClick={onClear} aria-label={`Effacer ${label}`}>
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      )}
    </div>
  );
};

/** Une demi-journée (ou la journée) : entrée / sortie + interrupteur « absent ». */
const PeriodCard = ({ titre, icone, absent, onAbsentChange, absentLabel, children }) => (
  <section className={`${m.period} ${absent ? m.isAbsent : ""}`} aria-label={titre}>
    <header className={m.periodHead}>
      <span className={m.periodTitle}>
        <i className={icone} aria-hidden="true"></i>
        {titre}
      </span>
      <label className={m.absentToggle}>
        <Switch
          size="small"
          color="error"
          checked={absent}
          onChange={(e) => onAbsentChange(e.target.checked)}
        />
        {absentLabel}
      </label>
    </header>
    <div className={m.times}>{children}</div>
    {absent && <p className={m.hint}>Marqué absent : les heures déjà pointées sont conservées.</p>}
  </section>
);

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
  const [heureEntree1, setHeureEntree1] = useState(null);
  const [heureSortie1, setHeureSortie1] = useState(null);
  const isFetching = useRef(false);

  const [heureEntreeSoir, setHeureEntreeSoir] = useState(null); // stocke Date objet
  const [heureSortie, setHeureSortie] = useState(null); // stocke Date objet
  const [heureSortieSoir, setHeureSortieSoir] = useState(null); // stocke Date objet

  // Sélecteur d'heure unique : clé du champ en cours d'édition + heure en cours de réglage
  const [picker, setPicker] = useState(null);
  const [draft, setDraft] = useState(null);
  const [clockView, setClockView] = useState("hours");
  const openPicker = (cle) => {
    setDraft(null);
    setClockView("hours");
    setPicker(cle);
  };
  const openDate = Boolean(anchorEl);

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
  // Valeur AFFICHÉE dans chaque sélecteur (état, sinon heure du pointage, sinon valeur par défaut).
  // Elle sert aussi à OK : sans modification, le sélecteur n'appelle ni onChange ni onAccept.
  const hhmmDuJour = (hhmm) => {
    const [h, m] = hhmm.split(":");
    return dayjs().hour(parseInt(h)).minute(parseInt(m)).second(0);
  };
  const valeurSelecteur = (etat, hhmm, heureDefaut) => {
    if (etat && dayjs(etat).isValid()) return dayjs(etat);
    if (hhmm) return hhmmDuJour(hhmm);
    return dayjs().hour(heureDefaut).minute(0).second(0);
  };
  const valEntreeMatin = valeurSelecteur(heureEntree, record?.matin?.entree, 6);
  const valSortieMatin = valeurSelecteur(heureSortie, record?.matin?.sortie, 11);
  const valEntreeSoir = valeurSelecteur(heureEntreeSoir, record?.apresmidi?.entree, 13);
  const valSortieSoir = valeurSelecteur(heureSortieSoir, record?.apresmidi?.sortie, 13);
  const valEntreeSurface = valeurSelecteur(heureEntree1, record?.heure_entree_unique, 6);
  const valSortieSurface = valeurSelecteur(heureSortie1, record?.heure_sortie_unique, 6);

  const formatTime = (value) => {
    if (!value) return null;
    return dayjs(value).format("HH:mm");
  };

  // Les heures déjà pointées restent affichées (et conservées) même si la demi-journée est
  // marquée « absent » : ex. entrée à 8h00 sans sortie.

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
      payload.heure_entree_unique = formatTime(heureEntree1);
      payload.heure_sortie_unique = formatTime(heureSortie1);
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

    // Les heures sont envoyées même si la demi-journée est marquée absente
    payload.heure_entree_matin = formatTime(heureEntree);
    payload.heure_sortie_matin = formatTime(heureSortie);

    payload.heure_entree_soir = formatTime(heureEntreeSoir);
    payload.heure_sortie_soir = formatTime(heureSortieSoir);

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

  // Réglages de chaque sélecteur d'heure (plages autorisées en heures)
  const PICKERS = {
    // Matin : 6 h – 13 h ; après-midi : 12 h – 19 h
    entreeMatin: { label: "Entrée matin", value: valEntreeMatin, set: setHeureEntree, min: 6, max: 13 },
    sortieMatin: { label: "Sortie matin", value: valSortieMatin, set: setHeureSortie, min: 6, max: 13 },
    entreeSoir: { label: "Entrée après-midi", value: valEntreeSoir, set: setHeureEntreeSoir, min: 12, max: 19 },
    sortieSoir: { label: "Sortie après-midi", value: valSortieSoir, set: setHeureSortieSoir, min: 12, max: 19 },
    entreeSurface: { label: "Heure d'entrée", value: valEntreeSurface, set: setHeureEntree1, min: 4, max: 21 },
    sortieSurface: { label: "Heure de sortie", value: valSortieSurface, set: setHeureSortie1, min: 8, max: 21 },
  };
  const pickerCfg = picker ? PICKERS[picker] : null;

  const initiales = selectedMatricule
    ? `${selectedMatricule.prenom?.[0] ?? ""}${selectedMatricule.nom?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <div className={m.page}>
        <PageHeader
          title="Modifier le pointage"
          subtitle="Corrigez les heures et l'absence de cet agent"
          show
          onBackClick={goBack}
        />

        {/* ---------- Agent + date ---------- */}
        <section className={m.agent} aria-label="Agent">
          <div className={m.avatar} aria-hidden="true">{initiales}</div>
          <div className={m.agentText}>
            <h2 className={m.agentName}>
              {selectedMatricule ? `${selectedMatricule.prenom ?? ""} ${selectedMatricule.nom ?? ""}` : "Agent"}
            </h2>
            <p className={m.agentMeta}>
              {selectedMatricule?.matricule ?? "—"} · {isSurface ? "Agent de surface" : "Agent de bureau"}
            </p>
            {errors.matricule && (
              <p className={m.hint} role="alert">Le matricule est requis.</p>
            )}
          </div>
          <div className={m.dateChip}>
            <i className="fa-regular fa-calendar" aria-hidden="true"></i>
            {dateDebut ? dayjs(dateDebut).locale("fr").format("dddd D MMMM YYYY") : "Date non définie"}
          </div>
        </section>

        {/* ---------- Heures ---------- */}
        <h3 className={m.sectionTitle}>Heures de pointage</h3>

        {isSurface ? (
          <PeriodCard
            titre="Journée"
            icone="fa-solid fa-sun"
            absent={absenceSurface}
            onAbsentChange={setAbsenceSurface}
            absentLabel="Absent"
          >
            <TimeField
              label="Heure d'entrée"
              value={heureEntree1}
              onOpen={() => openPicker("entreeSurface")}
              onClear={() => setHeureEntree1(null)}
            />
            <TimeField
              label="Heure de sortie"
              value={heureSortie1}
              onOpen={() => openPicker("sortieSurface")}
              onClear={() => setHeureSortie1(null)}
            />
          </PeriodCard>
        ) : (
          <div className={m.grid}>
            <PeriodCard
              titre="Matin"
              icone="fa-solid fa-sun"
              absent={absencePeriode === "matin"}
              onAbsentChange={(coche) => setAbsencePeriode(coche ? "matin" : "")}
              absentLabel="Absent le matin"
            >
              <TimeField
                label="Entrée"
                value={heureEntree}
                onOpen={() => openPicker("entreeMatin")}
                onClear={() => setHeureEntree(null)}
              />
              <TimeField
                label="Sortie"
                value={heureSortie}
                onOpen={() => openPicker("sortieMatin")}
                onClear={() => setHeureSortie(null)}
              />
            </PeriodCard>

            <PeriodCard
              titre="Après-midi"
              icone="fa-solid fa-cloud-sun"
              absent={absencePeriodeSoir === "soir"}
              onAbsentChange={(coche) => setAbsencePeriodeSoir(coche ? "soir" : "")}
              absentLabel="Absent le soir"
            >
              <TimeField
                label="Entrée"
                value={heureEntreeSoir}
                onOpen={() => openPicker("entreeSoir")}
                onClear={() => setHeureEntreeSoir(null)}
              />
              <TimeField
                label="Sortie"
                value={heureSortieSoir}
                onOpen={() => openPicker("sortieSoir")}
                onClear={() => setHeureSortieSoir(null)}
              />
            </PeriodCard>
          </div>
        )}

        {/* ---------- Actions ---------- */}
        <div className={m.actions}>
          <Button
            variant="outlined"
            onClick={goBack}
            disabled={loading}
            sx={{ textTransform: "none", fontSize: "0.85rem", px: 4, py: 1.6, color: "#1b6979", borderColor: "#c5d6da" }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleSubmit}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <i className="fa-solid fa-floppy-disk" style={{ fontSize: "0.95rem" }}></i>
              )
            }
            sx={{ textTransform: "none", fontSize: "0.85rem", px: 5, py: 1.6, backgroundColor: "#14535f" }}
          >
            Sauvegarder
          </Button>
        </div>

        {/* ---------- Sélecteur d'heure (un seul pour tous les champs) ---------- */}
        <Dialog
          open={Boolean(pickerCfg)}
          onClose={() => setPicker(null)}
          maxWidth="xs"
          slotProps={{ paper: { className: m.pickerPaper } }}
        >
          {pickerCfg && (
            <div className={m.picker}>
              <h2 className={m.pickerTitle}>{pickerCfg.label}</h2>

              {/* Heure en cours de réglage : un clic bascule entre heures et minutes */}
              <div className={m.pickerDisplay} role="group" aria-label="Heure sélectionnée">
                <button
                  type="button"
                  className={`${m.pickerPart} ${clockView === "hours" ? m.partActive : ""}`}
                  onClick={() => setClockView("hours")}
                  aria-label="Régler les heures"
                >
                  {dayjs(draft ?? pickerCfg.value).format("HH")}
                </button>
                <span className={m.pickerColon} aria-hidden="true">:</span>
                <button
                  type="button"
                  className={`${m.pickerPart} ${clockView === "minutes" ? m.partActive : ""}`}
                  onClick={() => setClockView("minutes")}
                  aria-label="Régler les minutes"
                >
                  {dayjs(draft ?? pickerCfg.value).format("mm")}
                </button>
              </div>

              <div className={m.pickerClock}>
                <TimeClock
                  ampm={false}
                  value={draft ?? pickerCfg.value}
                  onChange={(valeur) => setDraft(valeur)}
                  view={clockView}
                  onViewChange={(vue) => setClockView(vue)}
                  views={["hours", "minutes"]}
                  minutesStep={5}
                  minTime={dayjs().hour(pickerCfg.min).minute(0).second(0)}
                  maxTime={dayjs().hour(pickerCfg.max).minute(0).second(0)}
                />
              </div>

              <div className={m.pickerActions}>
                <Button
                  onClick={() => setPicker(null)}
                  sx={{ textTransform: "none", fontSize: "0.85rem", px: 3, py: 1.2, color: "#1b6979" }}
                >
                  Annuler
                </Button>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => {
                    // OK enregistre l'heure affichée, même sans modification
                    pickerCfg.set(draft ?? pickerCfg.value);
                    setPicker(null);
                  }}
                  sx={{ textTransform: "none", fontSize: "0.85rem", px: 4.5, py: 1.2, backgroundColor: "#14535f" }}
                >
                  OK
                </Button>
              </div>
            </div>
          )}
        </Dialog>

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
