import React, { useContext, useEffect, useRef, useState } from "react";
// ⚠️ Ajuster les chemins des assets en fonction de l'emplacement final du dossier AjoutAuto/
import Perso from "../../../assets/v4.jpg";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import SnackbarContent from '@mui/material/SnackbarContent';
import { AuthContext } from "../../../AuthContext";

import {
  localStyles,
  getResponsiveStyles,
  styleCard,
  styleContainer,
  styleSary1,
  styleSary1Img,
} from "./styles";
import { BootstrapDialog2 } from "./components/BootstrapDialogs";
import MatriculeSelectDialog from "./components/MatriculeSelectDialog";
import AbsenceForm from "./components/AbsenceForm";
import ResultModal from "./components/ResultModal";
import { useIsMobile } from "./hooks/useIsMobile";
import { useFetchWithAuth } from "./hooks/useFetchWithAuth";
import { useAdminMe } from "./hooks/useAdminMe";
import { useTypes } from "./hooks/useTypes";
import { useDivisionsAndPersonnels } from "./hooks/useDivisionsAndPersonnels";
import PageHeader from "../autorisations_absences/components/PageHeader";

const API_URL = import.meta.env.VITE_API_URL;

const AjoutAuto = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);

  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageURL, setSelectedImageURL] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const fileInputRef = useRef(null);
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
  const [loading, setLoading] = useState(false);
  const [searchMatricule, setSearchMatricule] = useState("");
  const [snackMessage, setSnackMessage] = useState(""); // état pour le message
  const [selectedType, setSelectedType] = useState(null);
  const [anchorElType, setAnchorElType] = useState(null);
  const openType = Boolean(anchorElType);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchPers, setSearchPers] = useState("");
  const [selectedPers, setSelectedPers] = useState(null);
  const [isOneDayAbsence, setIsOneDayAbsence] = useState(true);
  const typeDivRef = useRef(null);
  const [typeTouched, setTypeTouched] = useState(false);
  const [demiJournee, setDemiJournee] = useState("complete"); // ← valeur par défaut
  // 'matin', 'apres-midi' ou ''
  const selectRef = useRef(null);
  const [openSelect, setOpenSelect] = useState(false);
  const dateDebutRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openResultModal, setOpenResultModal] = useState(false);
  const [resultType, setResultType] = useState("success"); // success | error
  const [modalMessage, setModalMessage] = useState("");
  const openDate = Boolean(anchorEl);

  const [anchorEl2, setAnchorEl2] = useState(null);

  const openDate2 = Boolean(anchorEl2);

  const { fetchMe } = useContext(AuthContext);

  const [errors, setErrors] = useState({
    matricule: false,
    demiJournee: false,
    type: false,
    motif: false,
    dateDebut: false,
    dateFin: false,
    // autres champs...
  });

  // --- Hooks extraits (logique strictement identique à l'original) ---
  const fetchWithAuth = useFetchWithAuth();
  const admin = useAdminMe(fetchMe);
  const types = useTypes(fetchWithAuth, setLoading, setErrors);
  const { divisions, personnels, errorMsg } = useDivisionsAndPersonnels(
    admin,
    fetchWithAuth,
    setLoading
  );

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

  const chargerLoading = () => {
    setLoading(true);
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

  const filteredDivisions = divisions.filter((div) =>
    div.nomdivision.toLowerCase().includes(search.toLowerCase())
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

  const createAutorisation = async () => {
    if (!validateForm()) return;

    setLoading(true);

    // Vérification des dates uniquement si "un seul jour" n’est pas coché
    if (!isOneDayAbsence && new Date(dateDebut) > new Date(dateFin)) {
      setSnackMessage("La date de début ne peut pas être postérieure à la date de fin.");
      setIsSuccess(false);
      setLoading(false);
      setOpenSnack(true);
      return;
    }

    // 🔹 Demi-journée à envoyer
    // ✅ Si un seul jour, on envoie ce que l'utilisateur a choisi
    // ✅ Sinon, on n'envoie pas la valeur, l'API décidera du dernier jour
    const demi_journee_finale = demiJournee || "complete";

    const formData = {
      idpers: selectedMatricule.idpers,
      motif,
      type: selectedType.idtype,
      date_debut: dateDebut,
      date_fin: isOneDayAbsence ? dateDebut : dateFin,
      demi_journee: demi_journee_finale, // ⚠️ undefined si plusieurs jours
    };

    console.log("donnee envoyer :", formData);

    try {
      const data = await fetchWithAuth(`${API_URL}/api/autorisations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      setSnackMessage(data.message || "Action réussie.");

      setLoading(false);
      setModalMessage(data.message || "Création réussie !");
      setResultType("success");
      setOpenResultModal(true);

      // Réinitialisation des champs
      setSelectedMatricule(null);
      setMotif('');
      setDateDebut('');
      setDateFin('');
      setSelectedType(null);
      setDemiJournee(""); // réinitialise le type

    } catch (error) {
      setSnackMessage("Erreur lors de l'ajout : " + error.message);
      setResultType("error");
      setModalMessage(error.message || "Erreur lors de la création");
      setOpenResultModal(true);

      setLoading(false);
    }
  };

  const { stylePersonnels } = getResponsiveStyles(isMobile);

  return (
    <div style={stylePersonnels} style={{ maxWidth: "88%", margin: "0 auto" }}>
      <style>{localStyles}</style>

      <PageHeader
        title="Ajout d'une autorisation"
        subtitle="Création d'une nouvelle demande d'autorisation d'absence"
        show={true}
        onBackClick={goBack}
      />

      <div style={styleCard}>
        <div style={styleContainer}>
          <div style={styleSary1}>
            <img src={Perso} alt="" style={styleSary1Img} />
          </div>

          <AbsenceForm
            selectedMatricule={selectedMatricule}
            setOpenMatriculeDialog={setOpenMatriculeDialog}
            errors={errors}
            setErrors={setErrors}
            anchorElType={anchorElType}
            openType={openType}
            setAnchorElType={setAnchorElType}
            types={types}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            typeDivRef={typeDivRef}
            setTypeTouched={setTypeTouched}
            motif={motif}
            setMotif={setMotif}
            isOneDayAbsence={isOneDayAbsence}
            setIsOneDayAbsence={setIsOneDayAbsence}
            dateDebut={dateDebut}
            setDateDebut={setDateDebut}
            anchorEl={anchorEl}
            setAnchorEl={setAnchorEl}
            openDate={openDate}
            dateFin={dateFin}
            setDateFin={setDateFin}
            anchorEl2={anchorEl2}
            setAnchorEl2={setAnchorEl2}
            openDate2={openDate2}
            demiJournee={demiJournee}
            setDemiJournee={setDemiJournee}
            loading={loading}
            onSubmit={() => {
              if (validateForm()) {
                createAutorisation();
              }
            }}
          />
        </div>
      </div>

      <MatriculeSelectDialog
        open={openMatriculeDialog}
        onClose={() => setOpenMatriculeDialog(false)}
        searchPers={searchPers}
        setSearchPers={setSearchPers}
        loading={loading}
        errorMsg={errorMsg}
        personnels={personnels}
        onSelectPersonnel={(p) => {
          setSelectedMatricule(p);
          setErrors((prev) => ({ ...prev, matricule: false }));
          setOpenMatriculeDialog(false);
        }}
      />

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

      <ResultModal
        open={openResultModal}
        onClose={() => setOpenResultModal(false)}
        resultType={resultType}
        message={modalMessage}
      />
    </div>
  );
};

export default AjoutAuto;