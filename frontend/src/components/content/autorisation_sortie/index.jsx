import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../AuthContext";
import { ThreeDot } from "react-loading-indicators";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";

import styles from "./sortie.module.css";
import "../../fiches/presences/m3-expressive.css";
import { getColumns } from "./constants/columns";
import AutorisationDialog from "./components/AutorisationDialog";
import { useFilters } from "./hooks/useFilters";
import { useDelete } from "./hooks/useDelete";
import SortieFilters from "./components/SortieFilters";
import SortieToolbar from "./components/SortieToolbar";
import SortieTable from "./components/SortieTable";
import SortieSummary from "./components/SortieSummary";
import { useSortieStats } from "./hooks/useSortieStats";
import DeleteDialog from "../autorisations_absences/components/DeleteDialog";
import SnackbarNotification from "../autorisations_absences/components/SnackbarNotification";
import { useAutorisationForm } from "./hooks/useAutorisationForm";
import { useAutorisations } from "./hooks/useAutorisations";
import PageHeader from "../autorisations_absences/components/PageHeader";

const API_URL = import.meta.env.VITE_API_URL;

const AutorisationSortie = () => {
  const navigate = useNavigate();
  const { fetchMe } = useContext(AuthContext);
  const [admin, setAdmin] = useState(null);
  const [searchText, setSearchText] = useState("");
  const dateInputRef = useRef(null);

  // Thème M3 Expressive (aussi pour les menus, dialogues et sélecteurs de date portalés)
  useEffect(() => {
    document.body.classList.add("m3x-active");
    return () => document.body.classList.remove("m3x-active");
  }, []);

  // États pour les notifications
  const [snackMessage, setSnackMessage] = useState("");
  const [snackError, setSnackError] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);

  // Hook pour les autorisations
  const {
    conges,
    setConges,
    divisions,
    loading,
    loadingPage,
    selectedDivision,
    loadData
  } = useAutorisations(admin, "speciales");

  // Hook pour les filtres
  const {
    dateDebutFiltre,
    setDateDebutFiltre,
    dateFinFiltre,
    setDateFinFiltre,
    selectedDate,
    setSelectedDate,
    anchorEl,
    anchorEl2,
    handleFiltrerParDates,
    handleResetFiltre,
    handleFiltrerParDateUnique,
    handleOpenDatePicker,
    handleClosePicker,
    appliedFilter,
  } = useFilters(setConges, setSnackMessage, setSnackError, setOpenSnack);

  // Hook pour la suppression
  const {
    loadingSupp,
    confirmOpen,
    handleDeleteClick,
    handleConfirmDelete,
    setConfirmOpen,
  } = useDelete(setConges, setSnackMessage, setSnackError, setOpenSnack);

  // Hook pour le formulaire d'autorisation
  const {
    openMatriculeDialog,
    setOpenMatriculeDialog,
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
    resetDialogState,
    handleValider,
    loadPersonnels,
  } = useAutorisationForm(admin, setConges, setSnackMessage, setSnackError, setOpenSnack);

  // Statistiques serveur : refaites à chaque changement de liste (ajout, suppression, filtre)
  const { stats, loading: loadingStats } = useSortieStats({
    idserv: admin?.responsable?.idserv,
    filtre: appliedFilter,
    refreshKey: conges,
  });

  // Récupération de l'admin
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const data = await fetchMe();
        setAdmin(data);
      } catch (err) {
        console.error("Erreur fetchMe:", err);
        navigate("/login");
        setAdmin(null);
      }
    };
    fetchAdmin();
  }, [fetchMe, navigate]);

  // Chargement des données
  useEffect(() => {
    if (admin?.responsable?.idserv) {
      loadData(admin.responsable.idserv);
    }
  }, [admin]);

  // Récupération des messages de session
  useEffect(() => {
    const snackMsg = sessionStorage.getItem("snackMessage");
    const snackErr = sessionStorage.getItem("snackError") === "true";

    if (snackMsg) {
      setSnackMessage(snackMsg);
      setSnackError(snackErr);
      setOpenSnack(true);
      sessionStorage.removeItem("snackMessage");
      sessionStorage.removeItem("snackError");
    }
  }, []);

  const goAjout = () => {
    setOpenMatriculeDialog(true);
    if (admin?.responsable?.idserv) {
      loadPersonnels(admin.responsable.idserv);
    }
  };

  // Filtrage des congés
  const filteredConges = conges.filter((c) => {
    const lower = searchText.toLowerCase();
    const nom = c.personnel?.nom?.toLowerCase() || "";
    const prenom = c.personnel?.prenom?.toLowerCase() || "";
    const matricule = c.personnel?.matricule?.toLowerCase() || "";
    const motif = c.motif?.toLowerCase() || "";
    const type = c.type_autorisation?.toLowerCase() || "";
    const periode = c.periode?.toLowerCase() || "";

    const matchesSearch =
      matricule.includes(lower) ||
      nom.includes(lower) ||
      prenom.includes(lower) ||
      motif.includes(lower) ||
      type.includes(lower) ||
      periode.includes(lower);

    if (!selectedDivision) return matchesSearch;
    return matchesSearch && c.iddiv === selectedDivision;
  });

  // Colonnes du tableau
  const columns = getColumns(navigate, handleDeleteClick);

  if (loadingPage) {
    return (
      <div
        style={{
          height: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Modal open={loadingPage}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              borderRadius: 2,
              px: 4,
              py: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              minWidth: 260,
            }}
          >
            <ThreeDot color="#ffffffff" size="medium" textColor="#555" />
          </Box>
        </Modal>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Autorisations de sortie"
        subtitle="Gérez toutes les autorisations de sortie de votre équipe"
        showButton
        buttonLabel="Ajouter une autorisation"
        onButtonClick={goAjout}
      />

      <SortieSummary stats={stats} loading={loadingStats} />

      <SortieFilters
        dateDebutFiltre={dateDebutFiltre}
        setDateDebutFiltre={setDateDebutFiltre}
        dateFinFiltre={dateFinFiltre}
        setDateFinFiltre={setDateFinFiltre}
        anchorEl={anchorEl}
        anchorEl2={anchorEl2}
        handleOpenDatePicker={handleOpenDatePicker}
        handleClosePicker={handleClosePicker}
        handleFiltrerParDates={handleFiltrerParDates}
        handleResetFiltre={handleResetFiltre}
        idserv={admin?.responsable?.idserv}
      />

      <section className={styles.card} aria-label="Liste des autorisations">
        <SortieToolbar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onFiltrerParDate={(date) => handleFiltrerParDateUnique(date, admin?.responsable?.idserv)}
          searchText={searchText}
          setSearchText={setSearchText}
          dateInputRef={dateInputRef}
          count={filteredConges.length}
        />

        <SortieTable
          loading={loading}
          columns={columns}
          dataSource={filteredConges.map((p) => ({ ...p, key: p.id }))}
        />
      </section>

      <DeleteDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={loadingSupp}
      />

      <SnackbarNotification
        open={openSnack}
        message={snackMessage}
        onClose={() => setOpenSnack(false)}
      />

      <AutorisationDialog
        open={openMatriculeDialog}
        onClose={() => {
          setOpenMatriculeDialog(false);
          resetDialogState();
        }}
        step={step}
        setStep={setStep}
        loadingSelect={loadingSelect}
        personnels={personnels}
        searchPers={searchPers}
        setSearchPers={setSearchPers}
        selectedMatricule={selectedMatricule}
        setSelectedMatricule={setSelectedMatricule}
        selected={selected}
        setSelected={setSelected}
        periode={periode}
        setPeriode={setPeriode}
        isRange={isRange}
        setIsRange={setIsRange}
        dateDebut2={dateDebut2}
        setDateDebut2={setDateDebut2}
        dateFin2={dateFin2}
        setDateFin2={setDateFin2}
        motif={motif}
        setMotif={setMotif}
        formError={formError}
        resultType={resultType}
        modalMessage={modalMessage}
        handleValider={handleValider}
        resetDialogState={resetDialogState}
        API_URL={API_URL}
      />
    </div>
  );
};

export default AutorisationSortie;