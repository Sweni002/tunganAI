import React, { useState } from "react";
import styles from "./service.module.css";
import ModifierHorairesModal from "../AjoutService/Modifierhorairesmodal";
import MacAddressesDrawer from "./MacAddressesDrawer"; // <-- nouveau

import { useServiceList } from "../hooks/useServiceList";
import ServiceSearchBar from "./ServiceSearchBar";
import ServiceTable from "./ServiceTable";
import ServiceActionsMenu from "./ServiceActionsMenu";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import ServiceListSnackbar from "./ServiceListSnackbar";
import LoadingOverlay from "./LoadingOverlay";
import PageHeader from "../../content/autorisations_absences/components/PageHeader";

const Service = () => {
    const {
        filteredservices,
        loading,
        loadingSupp,
        loadingPage,
        snackMessage,
        openSnack,
        setOpenSnack,
        showSnackbar,
        confirmOpen,
        setConfirmOpen,
        handleDeleteClick,
        handleConfirmDelete,
        menuAnchor,
        menuOpen,
        selectedRecord,
        handleMenuClose,
        voirFicheAssiduite,
        searchText,
        setSearchText,
        horaireModalOpen,
        setHoraireModalOpen,
        serviceToEdit,
        setServiceToEdit,
        applyHorairesUpdate,
        goAjout,
        navigate,
    } = useServiceList();

    // État d'ouverture du drawer des adresses MAC, + le service concerné
    const [macDrawerOpen, setMacDrawerOpen] = useState(false);
    const [serviceForMac, setServiceForMac] = useState(null);

    const handleOpenMacDrawer = (record) => {
        setServiceForMac(record);
        setMacDrawerOpen(true);
    };

    const handleCloseMacDrawer = () => {
        setMacDrawerOpen(false);
        // On garde serviceForMac le temps de l'animation de fermeture du Drawer,
        // pas besoin de le remettre à null immédiatement.
    };

    if (loadingPage) {
        return <LoadingOverlay open={loadingPage} />;
    }

    return (
        <div className={styles.services} style={{ maxWidth: "88%", margin: "0 auto" }}>
            <PageHeader
                title="Services"
                subtitle="Consultez et gérez la liste des services"
                showButton
                buttonLabel="Nouveau Service"
                onButtonClick={goAjout}
            />
            <div className={styles.cardTab} style={{ border: "none" }}>
                <ServiceSearchBar searchText={searchText} onSearchChange={setSearchText} />

                <ServiceTable
                    services={filteredservices}
                    loading={loading}
                    onEdit={(record) => navigate("/global/modifier_service", { state: { record } })}
                    onDelete={handleDeleteClick}
                    onEditHoraires={(record) => {
                        setServiceToEdit(record);
                        setHoraireModalOpen(true);
                    }}
                    onManageMacAddresses={handleOpenMacDrawer}
                />
            </div>

            <ServiceActionsMenu
                anchorEl={menuAnchor}
                open={menuOpen}
                onClose={handleMenuClose}
                onVoirFicheAssiduite={() => voirFicheAssiduite(selectedRecord)}
            />

            <ServiceListSnackbar
                open={openSnack}
                message={snackMessage}
                onClose={() => setOpenSnack(false)}
            />

            <DeleteConfirmDialog
                open={confirmOpen}
                loading={loadingSupp}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
            />

            <ModifierHorairesModal
                open={horaireModalOpen}
                service={serviceToEdit}
                onClose={() => setHoraireModalOpen(false)}
                onSaved={(idserv, horaires) => applyHorairesUpdate(idserv, horaires)}
                showSnackbar={showSnackbar}
            />

            {/* Drawer des adresses MAC */}
            <MacAddressesDrawer
                open={macDrawerOpen}
                onClose={handleCloseMacDrawer}
                service={serviceForMac}
                showSnackbar={showSnackbar}
            />
        </div>
    );
};

export default Service;