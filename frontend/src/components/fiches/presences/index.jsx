// Presences/index.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import styles from './presences.module.css';
import MobilePresence2 from '../MobilePresence2';

import { useAdminAuth } from './hooks/useAdminAuth';
import { useDivisions } from './hooks/useDivisions';
import { usePointages } from './hooks/usePointages';
import { useSnackbar } from './hooks/useSnackbar';
import { useScrollButtons } from './hooks/useScrollButtons';
import { useSocketRefresh } from './hooks/useSocketRefresh';
import { useExportExcel } from './hooks/useExportExcel';
import { useDatePickerPoppers } from './hooks/useDatePickerPoppers';
import { usePersistentToggle } from './hooks/usePersistentToggle';
import { createFetchWithAuth } from './utils/fetchWithAuth';
import { buildColumns, buildColumnsSurface } from './utils/columns';

import DivisionsBar from './components/DivisionsBar';
import DivisionsToggleButton from './components/DivisionsToggleButton';
import StatsCards from './components/StatsCards';
import DateRangeFilter from './components/DateRangeFilter';
import ActionsBar from './components/ActionsBar';
import TabPanel from './components/TabPanel';
import PresenceTable from './components/PresenceTable';
import RowActionsMenu from './components/RowActionsMenu';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import AppSnackbar from './components/AppSnackbar';
import FullPageLoader from './components/FullPageLoader';
import Collapse from '@mui/material/Collapse';
import PageHeader from '../../content/autorisations_absences/components/PageHeader';

const API_URL = import.meta.env.VITE_API_URL;

const Presences = () => {
    // --- Auth / contexte ---
    const { idrh, idserv, navigate } = useAdminAuth();
    const fetchWithAuth = useMemo(() => createFetchWithAuth(navigate), [navigate]);

    // --- Notifications ---
    const { snackMessage, openSnack, showSnack, closeSnack } = useSnackbar();

    // --- Filtres ---
    const [selectedDivision, setSelectedDivision] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [searchText, setSearchText] = useState('');

    // Plage de dates : brouillon (ce qui est dans les champs) vs appliquée
    // (ce qui part au serveur). Sans ça, chaque saisie de date déclenchait
    // une requête avant même le clic sur "Filtrer".
    const [dateDebutInput, setDateDebutInput] = useState('');
    const [dateFinInput, setDateFinInput] = useState('');
    const [plage, setPlage] = useState({ debut: '', fin: '' });

    // --- Onglets (le rôle part au serveur : plus de filtre local) ---
    const [tabValue, setTabValue] = useState(0);
    const role = tabValue === 0 ? 'autres' : 'surface';
    const handleTabChange = useCallback((event, newValue) => setTabValue(newValue), []);

    // --- Divisions ---
    const { divisions } = useDivisions({ idrh, idserv, fetchWithAuth });
    const scrollBtnsRef = React.useRef({});
    const { scrollRef, showLeft, showRight, scroll } = useScrollButtons([divisions]);
    const [showDivisionsBar, setShowDivisionsBar] = usePersistentToggle('presences.showDivisionsBar', true);

    // --- Pointages : source de vérité unique, filtrée côté serveur ---
    const {
        personnels,
        loading,
        initialLoadDone,
        pageIndex,
        hasMore,
        canGoPrev,
        handleNextPage,
        handlePrevPage,
        triggerRefresh,
        supprimerPointageLocalement,
        refreshKey,
    } = usePointages({
        idrh,
        idserv,
        selectedDate,
        selectedDivision,
        dateDebutFiltre: plage.debut,
        dateFinFiltre: plage.fin,
        searchText,
        role,
        fetchWithAuth,
        showSnack,
    });

    // Le loader plein écran ne se coupe qu'au tout premier chargement terminé
    const [loadingPage, setLoadingPage] = useState(true);
    useEffect(() => {
        if (initialLoadDone) setLoadingPage(false);
    }, [initialLoadDone]);

    // --- Rafraîchissement temps réel (socket) ---
    useSocketRefresh(triggerRefresh);

    // --- Export Excel / PDF ---
    const { downloadPDF, downloadPDF1, exportExcel, loadingPdf, loadingPdf1 } = useExportExcel({ idserv, navigate, showSnack });

    // --- Poppers date pickers ---
    const poppers = useDatePickerPoppers();

    // --- Menus export ---
    const [menuExportPeriodeAnchorEl, setMenuExportPeriodeAnchorEl] = useState(null);
    const [menuExportJourAnchorEl, setMenuExportJourAnchorEl] = useState(null);

    // --- Menu actions ligne + suppression ---
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuRecord, setMenuRecord] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [loadingSupp, setLoadingSupp] = useState(false);

    const handleMenuClick = useCallback((event, record) => {
        setMenuAnchor(event.currentTarget);
        setMenuRecord(record);
        setRecordToDelete(record);
    }, []);

    const handleMenuClose = useCallback(() => {
        setMenuAnchor(null);
        setMenuRecord(null);
    }, []);

    const handleModifierPointage = () => {
        if (!menuRecord) return;
        navigate('/global/modifier_pointage', { state: { menuRecord } });
        handleMenuClose();
    };

    const handleConfirmDelete = () => {
        if (!recordToDelete) return;
        setLoadingSupp(true);

        fetchWithAuth(`${API_URL}/api/pointage/facial/${recordToDelete.key}`, { method: 'DELETE' })
            .then((res) => {
                showSnack(res.message, false);
                supprimerPointageLocalement(recordToDelete.key);
            })
            .catch((err) => {
                console.error('Erreur suppression :', err);
                showSnack(err.message || 'Erreur inconnue', true);
            })
            .finally(() => {
                setConfirmOpen(false);
                setRecordToDelete(null);
                setLoadingSupp(false);
            });
    };

    // --- Création d'une fiche vide ---
    const creerPointagesVides = useCallback(
        async (date) => {
            try {
                const response = await fetch(`${API_URL}/api/pointage/creer-vides`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idrh, date: dayjs(date).format('YYYY-MM-DD') }),
                });
                const data = await response.json();

                if (!response.ok) {
                    console.error('Erreur création pointages :', data);
                    showSnack(data.error || 'Erreur lors de la création de la nouvelle fiche', true);
                    return;
                }
                showSnack(data.message, false);
                triggerRefresh();
            } catch (err) {
                console.error('Erreur API :', err);
                showSnack(err.message || 'Erreur lors de la création de la nouvelle fiche', true);
            }
        },
        [idrh, showSnack, triggerRefresh]
    );

    // --- Plage de dates ---
    const handleFiltrerParDates = () => {
        if (!dateDebutInput || !dateFinInput) {
            showSnack('Veuillez sélectionner les deux dates', true);
            return;
        }
        if (dayjs(dateFinInput).isBefore(dayjs(dateDebutInput))) {
            showSnack('La date de fin doit être après la date de début', true);
            return;
        }
        setPlage({ debut: dateDebutInput, fin: dateFinInput });
    };

    // Réinitialise champs + plage appliquée. Idempotent : ActionsBar l'appelle
    // via setDateDebutFiltre('') / setDateFinFiltre('') au changement de date.
    const handleResetFiltre = useCallback(() => {
        setDateDebutInput('');
        setDateFinInput('');
        setPlage({ debut: '', fin: '' });
    }, []);

    // --- Colonnes ---
    const columns = useMemo(() => buildColumns(handleMenuClick), [handleMenuClick]);
    const columnsSurface = useMemo(() => buildColumnsSurface(handleMenuClick), [handleMenuClick]);

    const rowSelection = useMemo(
        () => ({
            onChange: () => { },
            getCheckboxProps: (record) => ({ disabled: false, name: record.nom }),
        }),
        []
    );

    // --- Responsive ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [openSelectPers, setOpenSelectPers] = useState(false);
    const [selectedMatricule, setSelectedMatricule] = useState(null);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loadingPage) {
        return <FullPageLoader open={loadingPage} />;
    }

    if (isMobile) {
        return (
            <MobilePresence2
                personnels={personnels}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                loading={loading}
                setLoading={() => { }}
                openSelectPers={openSelectPers}
                setOpenSelectPers={setOpenSelectPers}
                selectedMatricule={selectedMatricule}
                setSelectedMatricule={setSelectedMatricule}
                exportExcel={(type) => exportExcel(type, selectedDate)}
                loadingPdf1={loadingPdf1}
                setLoadingPdf1={() => { }}
            />
        );
    }

    return (
        <div className={styles.personnels} style={{ maxWidth: '88%', margin: '0 auto' }}>

            <PageHeader
                title="Présences"
                subtitle="Suivi des pointages et présences du personnel"
            />
            <StatsCards
                idserv={idserv}
                iddiv={selectedDivision}
                selectedDate={selectedDate}
                dateDebutFiltre={plage.debut}
                dateFinFiltre={plage.fin}
                fetchWithAuth={fetchWithAuth}
                refreshKey={refreshKey}
            />


            <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'flex-end', width: '100%', maxWidth: 1700 }}>
                <DivisionsToggleButton
                    open={showDivisionsBar}
                    onToggle={() => setShowDivisionsBar((v) => !v)}
                    hasActiveFilter={Boolean(selectedDivision)}
                />
            </div>

            <Collapse
                in={showDivisionsBar}
                timeout={250}
                unmountOnExit
                sx={{ width: '100%', maxWidth: 1700, display: 'flex', alignContent: 'center', justifyContent: 'space-between' }}
            >
                <DivisionsBar
                    divisions={divisions}
                    selectedDivision={selectedDivision}
                    setSelectedDivision={setSelectedDivision}
                    scrollRef={scrollRef}
                    showLeft={showLeft}
                    showRight={showRight}
                    scroll={scroll}
                    scrollBtnsRef={scrollBtnsRef}
                />
            </Collapse>

            <DateRangeFilter
                dateDebutFiltre={dateDebutInput}
                setDateDebutFiltre={setDateDebutInput}
                dateFinFiltre={dateFinInput}
                setDateFinFiltre={setDateFinInput}
                poppers={poppers}
                onFiltrer={handleFiltrerParDates}
                onReset={handleResetFiltre}
                downloadPDF={() => downloadPDF(dateDebutInput, dateFinInput)}
                downloadPDF1={(type) => downloadPDF1(type, dateDebutInput, dateFinInput)}
                loadingPdf={loadingPdf}
                menuExportAnchorEl={menuExportPeriodeAnchorEl}
                openMenuExport={Boolean(menuExportPeriodeAnchorEl)}
                onOpenMenuExport={(e) => setMenuExportPeriodeAnchorEl(e.currentTarget)}
                onCloseMenuExport={() => setMenuExportPeriodeAnchorEl(null)}
            />

            <div className={styles.cardTab} style={{ maxWidth: 1700 }}>
                <ActionsBar
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    setDateDebutFiltre={handleResetFiltre}
                    setDateFinFiltre={handleResetFiltre}
                    searchText={searchText}
                    setSearchText={setSearchText}
                    poppers={poppers}
                    onCreerFicheVide={creerPointagesVides}
                    onExport={(type) => exportExcel(type, selectedDate)}
                    loadingPdf1={loadingPdf1}
                    menuExportJourAnchorEl={menuExportJourAnchorEl}
                    openMenuExportJour={Boolean(menuExportJourAnchorEl)}
                    onOpenMenuExportJour={(e) => setMenuExportJourAnchorEl(e.currentTarget)}
                    onCloseMenuExportJour={() => setMenuExportJourAnchorEl(null)}
                    tabValue={tabValue}
                    onTabChange={handleTabChange}
                />

                <div className={`${styles.tableau} ${styles.shadowedTable}`}>
                    <TabPanel value={tabValue} index={0} loading={false}>
                        <PresenceTable
                            loading={loading}
                            columns={columns}
                            dataSource={personnels}
                            rowSelection={rowSelection}
                            pageIndex={pageIndex}
                            hasMore={hasMore}
                            canGoPrev={canGoPrev}
                            onNextPage={handleNextPage}
                            onPrevPage={handlePrevPage}
                        />
                    </TabPanel>

                    <TabPanel value={tabValue} index={1} loading={false}>
                        <PresenceTable
                            loading={loading}
                            columns={columnsSurface}
                            dataSource={personnels}
                            rowSelection={rowSelection}
                            pageIndex={pageIndex}
                            hasMore={hasMore}
                            canGoPrev={canGoPrev}
                            onNextPage={handleNextPage}
                            onPrevPage={handlePrevPage}
                        />
                    </TabPanel>
                </div>
            </div>

            <RowActionsMenu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                onModifier={handleModifierPointage}
                onDemandeSuppression={() => setConfirmOpen(true)}
            />

            <AppSnackbar open={openSnack} message={snackMessage} onClose={closeSnack} />

            <DeleteConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={loadingSupp}
            />
        </div>
    );
};

export default Presences;