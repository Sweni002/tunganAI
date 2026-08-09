import React, { useState, useEffect, useRef, useContext } from "react";
import { Breadcrumb } from "antd";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../AuthContext";
import { ThreeDot } from "react-loading-indicators";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

import styles from "./conge.module.css";
import { getColumns } from "./constants/columns";
import AutorisationDialog from "./components/AutorisationDialog";
import { useFilters } from "../autorisations_absences/hooks/useFilters";
import { useDelete } from "../autorisations_absences/hooks/useDelete";
import Filters from "../autorisations_absences/components/Filters";
import SearchBar from "../autorisations_absences/components/SearchBar";
import DataTable from "../autorisations_absences/components/DataTable";
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
  } = useFilters(setConges, setSnackMessage, setSnackError, setOpenSnack, "speciales");

  // Hook pour la suppression
  const {
    loadingSupp,
    confirmOpen,
    handleDeleteClick,
    handleConfirmDelete,
    setConfirmOpen,
  } = useDelete(setConges, setSnackMessage, setSnackError, setOpenSnack, "speciales");

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

  // Sélection des lignes
  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      console.log("selectedRowKeys:", selectedRowKeys, "selectedRows:", selectedRows);
    },
    getCheckboxProps: (record) => ({
      disabled: false,
      name: record.nom,
    }),
  };

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
    <div className={styles.personnels} style={{ maxWidth: "88%", margin: "0 auto" }}>
      {/* Header avec styles inline - identique à Autorisations */}
      <PageHeader
        title="Autorisations de sortie"
        subtitle="Gérez toutes les autorisations de sortie de votre équipe"
        showButton
        buttonLabel="Ajouter une autorisation"
        onButtonClick={goAjout}
      />

      <Filters
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
        isSpeciales={true}
      />

      <div className={styles.cardTab} style={{ border: 'none', maxWidth: "95%" }}>
        <SearchBar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          handleFiltrerParDateUnique={handleFiltrerParDateUnique}
          searchText={searchText}
          setSearchText={setSearchText}
          dateInputRef={dateInputRef}
          showAjoutButton={false}
        />

        <DataTable
          loading={loading}
          columns={columns}
          dataSource={filteredConges.map((p) => ({ ...p, key: p.id }))}
          rowSelection={rowSelection}
        />
      </div>

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