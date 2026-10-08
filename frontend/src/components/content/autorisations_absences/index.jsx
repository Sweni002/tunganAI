import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../AuthContext";

import styles from "../autorisation_sortie/sortie.module.css";
import "../../fiches/presences/m3-expressive.css";
import { useAutorisations } from "./hooks/useAutorisations";
import { useFilters } from "./hooks/useFilters";
import { useDelete } from "./hooks/useDelete";
import { getColumns } from "./constants/columns";
import SortieFilters from "../autorisation_sortie/components/SortieFilters";
import SortieToolbar from "../autorisation_sortie/components/SortieToolbar";
import SortieTable from "../autorisation_sortie/components/SortieTable";
import SortieSummary from "../autorisation_sortie/components/SortieSummary";
import { useAbsenceStats } from "./hooks/useAbsenceStats";
import DeleteDialog from "./components/DeleteDialog";
import SnackbarNotification from "./components/SnackbarNotification";
import PageHeader from "./components/PageHeader";

const Autorisations = () => {
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
        divisions,
        loading,
        loadingPage,
        loadData,
        page,
        setPage,
        pageSize,
        setPageSize,
        total,
        filters,
        applyFilters,
        reload,
        reloadKey,
    } = useAutorisations(admin, searchText);

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
    } = useFilters(applyFilters, setSnackMessage, setSnackError, setOpenSnack);

    // Hook pour la suppression
    const {
        loadingSupp,
        confirmOpen,
        handleDeleteClick,
        handleConfirmDelete,
        setConfirmOpen,
    } = useDelete(reload, setSnackMessage, setSnackError, setOpenSnack);

    // Thème M3 Expressive (aussi pour les menus et sélecteurs de date portalés)
    useEffect(() => {
        document.body.classList.add("m3x-active");
        return () => document.body.classList.remove("m3x-active");
    }, []);

    // Statistiques serveur : filtre de dates appliqué ; refaites après chaque rechargement (ex. suppression)
    const { stats, loading: loadingStats } = useAbsenceStats({
        idserv: admin?.responsable?.idserv,
        filtre: filters,
        refreshKey: reloadKey,
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

    // Navigation
    const goAjout = () => {
        navigate("/global/ajout_auto");
    };

    // Colonnes du tableau
    const columns = getColumns(navigate, handleDeleteClick);

    return (
        <div className={styles.page}>
            <PageHeader
                title="Autorisations"
                subtitle="Gérez toutes les autorisations d'absence de votre équipe"
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
                    onFiltrerParDate={handleFiltrerParDateUnique}
                    searchText={searchText}
                    setSearchText={setSearchText}
                    dateInputRef={dateInputRef}
                    count={total}
                />

                <SortieTable
                    loading={loading || loadingPage}
                    columns={columns}
                    dataSource={conges.map((p) => ({ ...p, key: p.id }))}
                    emptyLabel="Aucune autorisation d'absence à afficher"
                    pagination={{
                        position: ["bottomCenter"],
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50],
                        showTotal: (t, [from, to]) => `${from}-${to} sur ${t}`,
                        onChange: (p, size) => {
                            if (size !== pageSize) setPageSize(size);
                            else setPage(p);
                        },
                    }}
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
        </div>
    );
};

export default Autorisations;