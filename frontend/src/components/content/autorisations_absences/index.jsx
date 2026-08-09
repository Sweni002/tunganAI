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

import styles from "./conge.module.css";
import { useAutorisations } from "./hooks/useAutorisations";
import { useFilters } from "./hooks/useFilters";
import { useDelete } from "./hooks/useDelete";
import { getColumns } from "./constants/columns";
import Filters from "./components/Filters";
import SearchBar from "./components/SearchBar";
import DataTable from "./components/DataTable";
import DeleteDialog from "./components/DeleteDialog";
import SnackbarNotification from "./components/SnackbarNotification";
import PageHeader from "./components/PageHeader";

const Autorisations = () => {
    const navigate = useNavigate();
    const location = useLocation();
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
    } = useAutorisations(admin);

    // Hook pour les filtres
    const {
        dateDebutFiltre,
        setDateDebutFiltre,
        dateFinFiltre,
        setDateFinFiltre,
        selectedDate,
        setSelectedDate,
        pickerType,
        anchorEl,
        anchorEl2,
        handleFiltrerParDates,
        handleResetFiltre,
        handleFiltrerParDateUnique,
        handleOpenDatePicker,
        handleClosePicker,
    } = useFilters(setConges, setSnackMessage, setSnackError, setOpenSnack);

    // Hook pour la suppression
    const {
        loadingSupp,
        confirmOpen,
        handleDeleteClick,
        handleConfirmDelete,
        setConfirmOpen,
    } = useDelete(setConges, setSnackMessage, setSnackError, setOpenSnack);

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

    // Navigation
    const goAjout = () => {
        navigate("/global/ajout_auto");
    };

    // Filtrage des congés
    const filteredConges = conges.filter((c) => {
        const lower = searchText.toLowerCase();
        const nom = c.nom?.toLowerCase() || "";
        const prenom = c.prenom?.toLowerCase() || "";
        const matricule = c.matricule?.toLowerCase() || "";
        const motif = c.motif?.toLowerCase() || "";

        const matchesSearch =
            matricule.includes(lower) ||
            nom.includes(lower) ||
            prenom.includes(lower) ||
            motif.includes(lower);

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
            
            {/* Header avec styles inline */}

            <PageHeader
                title="Autorisations"
                subtitle="Gérez toutes les autorisations d'absence de votre équipe"
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
                pickerType={pickerType}
                handleOpenDatePicker={handleOpenDatePicker}
                handleClosePicker={handleClosePicker}
                handleFiltrerParDates={handleFiltrerParDates}
                handleResetFiltre={handleResetFiltre}
                idserv={admin?.responsable?.idserv}
            />

            <div className={styles.cardTab} style={{ border: 'none', maxWidth: "95%" }}>
                <SearchBar
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    handleFiltrerParDateUnique={handleFiltrerParDateUnique}
                    searchText={searchText}
                    setSearchText={setSearchText}
                    dateInputRef={dateInputRef}
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
        </div>
    );
};

export default Autorisations;