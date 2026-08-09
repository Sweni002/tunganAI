// historiques/index.jsx
import React, { useMemo, useState } from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import styles from '../presences.module.css';
import MobilePresence from '../MobilePresence';

import { usePersonnelIdentity } from './hooks/usePersonnelIdentity';
import { useHistoriquePointages } from './hooks/useHistoriquePointages';
import { useExportExcel } from './hooks/useExportExcel';
import { buildColumns, buildColumnsSurface } from './utils/columns';

import FiltrePeriode from './components/FiltrePeriode';
import Toolbar from './components/Toolbar';
import HistoriqueTable from './components/HistoriqueTable';

// Réutilisés tels quels depuis le module presences/ (logiques génériques)
import { useSnackbar } from '../presences/hooks/useSnackbar';
import { useDatePickerPoppers } from '../presences/hooks/useDatePickerPoppers';
import { useSocketRefresh } from '../presences/hooks/useSocketRefresh';
import { createFetchWithAuth } from '../presences/utils/fetchWithAuth';
import AppSnackbar from '../presences/components/AppSnackbar';
import FullPageLoader from '../presences/components/FullPageLoader';

import dayjs from 'dayjs';
import PageHeader from '../../content/autorisations_absences/components/PageHeader';

const Historique = () => {
    // --- Identité / contexte ---
    const { admin, idpers, navigate } = usePersonnelIdentity();
    const fetchWithAuth = useMemo(() => createFetchWithAuth(navigate), [navigate]);

    // --- Notifications ---
    const { snackMessage, openSnack, showSnack, closeSnack } = useSnackbar();

    // --- Filtres ---
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [dateDebutFiltre, setDateDebutFiltre] = useState('');
    const [dateFinFiltre, setDateFinFiltre] = useState('');
    const [searchText, setSearchText] = useState('');

    // --- Pointages (source de vérité unique + loading fiable) ---
    const { personnels, loading, loadingPage, triggerRefresh, filtrerParDates } = useHistoriquePointages({
        idpers,
        selectedDate,
        dateDebutFiltre,
        dateFinFiltre,
        fetchWithAuth,
        showSnack,
    });

    // --- Rafraîchissement temps réel (socket) ---
    useSocketRefresh(triggerRefresh);

    // --- Export Excel ---
    const { downloadPDF, exportExcel, loadingPdf, loadingPdf1 } = useExportExcel({
        idpers,
        selectedDivision: null,
        navigate,
        showSnack,
    });

    // --- Poppers date pickers (début / fin) ---
    const poppers = useDatePickerPoppers();

    // --- Colonnes (mémoïsées) ---
    const columns = useMemo(() => buildColumns(), []);
    const columnsSurface = useMemo(() => buildColumnsSurface(), []);

    const rowSelection = {
        onChange: () => { },
        getCheckboxProps: (record) => ({ disabled: false, name: record.nom }),
    };

    // --- Filtrage local (recherche texte) ---
    const filteredPersonnels = useMemo(() => {
        const lower = searchText.toLowerCase();
        return personnels.filter(
            (p) =>
                (p.matricule && p.matricule.toLowerCase().includes(lower)) ||
                (p.nom && p.nom.toLowerCase().includes(lower)) ||
                (p.prenom && p.prenom.toLowerCase().includes(lower))
        );
    }, [personnels, searchText]);

    // --- Handlers filtre par plage ---
    const handleFiltrerParDates = () => {
        if (!dateDebutFiltre || !dateFinFiltre) {
            showSnack('Veuillez sélectionner les deux dates', true);
            return;
        }
        const debut = dayjs(dateDebutFiltre);
        const fin = dayjs(dateFinFiltre);
        if (fin.isBefore(debut)) {
            showSnack('La date de fin doit être après la date de début', true);
            return;
        }
        filtrerParDates(dateDebutFiltre, dateFinFiltre);
    };

    const handleResetFiltre = () => {
        setDateDebutFiltre('');
        setDateFinFiltre('');
        // useHistoriquePointages se recharge automatiquement sur selectedDate
        // dès que dateDebutFiltre/dateFinFiltre repassent à vide.
    };

    // --- Responsive ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loadingPage) {
        return <FullPageLoader open={loadingPage} />;
    }

    if (isMobile) {
        return (
            <MobilePresence
                personnels={personnels}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                loading={loading}
                setLoading={() => { }}
            />
        );
    }

    const isSurface = admin?.personnel?.role === 'surface';

    return (
        <div className={styles.personnels} style={{ maxWidth: "88%", margin: "0 auto" }}>
            <PageHeader
                title="Historique"
                subtitle="Historique des pointages et présences"
            />

            <FiltrePeriode
                dateDebutFiltre={dateDebutFiltre}
                setDateDebutFiltre={setDateDebutFiltre}
                dateFinFiltre={dateFinFiltre}
                setDateFinFiltre={setDateFinFiltre}
                poppers={poppers}
                onFiltrer={handleFiltrerParDates}
                onReset={handleResetFiltre}
                downloadPDF={() => downloadPDF(dateDebutFiltre, dateFinFiltre)}
                loadingPdf={loadingPdf}
            />

            <div className={styles.cardTab}>
                <Toolbar
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    setDateDebutFiltre={setDateDebutFiltre}
                    setDateFinFiltre={setDateFinFiltre}
                    searchText={searchText}
                    setSearchText={setSearchText}
                    onExportJour={() => exportExcel(selectedDate)}
                    loadingPdf1={loadingPdf1}
                />

                <HistoriqueTable
                    loading={loading}
                    isSurface={isSurface}
                    columns={columns}
                    columnsSurface={columnsSurface}
                    dataSource={filteredPersonnels.map((p) => ({ ...p, key: p.idpointage }))}
                    rowSelection={rowSelection}
                />
            </div>

            <AppSnackbar open={openSnack} message={snackMessage} onClose={closeSnack} />
        </div>
    );
};

export default Historique;
