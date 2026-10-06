// src/pages/Login/PointagePageDesktop.jsx

import React, { useState } from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import HomeIcon from "@mui/icons-material/Home";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";

import styles from "./pointageDesktop.module.css";
import PointageView from "./PointageView";
import DataChartsColumn from "./DataChartsColumn";
import ProfileHistoryCard, { HistoryDetailCard } from "./ProfileHistoryCard";
import DashboardControlsBar from "./DashboardControlsBar";
import LogoImg from '../../../assets/logo1.png';
import PerformanceMetricsSection from "./FruitStatsGrid.jsx";
import PerformanceMetricsSparklineCard from "./FruitStatsGrid.jsx";
import GrapeStatCard from "./FruitStatsGrid.jsx";
import FruitStatsGrid from "./FruitStatsGrid.jsx";

const PointagePageDesktop = ({
    goHome,
    goBack,
    processingStep,
    webcamRef,
    canvasRef,
    webcamReady,
    loadingModels,
    scanning,
    active,
    pointageStarted,
    startingPointage,
    sendingToServer,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    modalOpen,
    modalMessage,
    modalType,
    closeSnackbar,
    closeModal,
    handleClick,
    handleStartPointage,
    modelsLoaded,
    history,
    historyLoading,
}) => {
    const items = history || [];

    // Convertit une entrée { date: "dd/mm/yyyy", time: "HH:mm" } en objet Date exploitable pour la comparaison.
    const parseDateTime = (item) => {
        if (!item?.date) return new Date(0);

        const [day, month, year] = item.date.split("/").map(Number);
        const [hours, minutes] = (item.time || "00:00").split(":").map(Number);

        return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
    };

    // On regarde la date/heure de chaque entrée pour déterminer la plus récente,
    // plutôt que de se fier à l'ordre du tableau. Si items est vide, lastItem reste null.
    const lastItem =
        items.length > 0
            ? items.reduce((mostRecent, current) =>
                parseDateTime(current) > parseDateTime(mostRecent) ? current : mostRecent
            )
            : null;

    // Sélection de l'historique pilotée ici, affichée au-dessus de ProfileHistoryCard.
    const [selectedItem, setSelectedItem] = useState(null);

    // Si aucun historique n'est sélectionné, on affiche l'entrée la plus récente (date/heure).
    // Vaut null si items est vide, ce qui masque HistoryDetailCard plus bas.
    const displayedItem = selectedItem ?? lastItem;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Barre du haut : logo à gauche, accueil à droite */}
                <header className={styles.topBar}>
                    <img src={LogoImg} alt="Tongan'Ai Logo" className={styles.logo} />

                    <IconButton
                        className={styles.homeBtn}
                        onClick={goHome}
                        aria-label="revenir à l'accueil"
                    >
                        <HomeIcon sx={{ fontSize: "1.6rem" }} />
                    </IconButton>
                </header>

                {/* Contenu principal : caméra + contrôles | détail + historique */}
                <main className={styles.layout}>
                    <div className={`${styles.cameraCol} ${displayedItem ? "" : styles.cameraAlone}`}>
                        <div className={styles.cameraCard}>
                            <PointageView
                                processingStep={processingStep}
                                webcamRef={webcamRef}
                                canvasRef={canvasRef}
                                webcamReady={webcamReady}
                                loadingModels={loadingModels}
                                isLargeScreen
                                scanning={scanning}
                                active={active}
                                pointageStarted={pointageStarted}
                                startingPointage={startingPointage}
                                sendingToServer={sendingToServer}
                                snackbarOpen={snackbarOpen}
                                snackbarMessage={snackbarMessage}
                                snackbarSeverity={snackbarSeverity}
                                modalOpen={modalOpen}
                                modalMessage={modalMessage}
                                modalType={modalType}
                                onCloseSnackbar={closeSnackbar}
                                onCloseModal={closeModal}
                                onHandleClick={handleClick}
                                onStartPointage={handleStartPointage}
                                onGoBack={goBack}
                                modelsLoaded={modelsLoaded}
                                containerStyle={{
                                    width: "100%",
                                    maxWidth: "100%",
                                    height: "100%",
                                    borderRadius: 10,
                                    overflow: "hidden",
                                }}
                                hideActionBar
                            />
                        </div>

                        <DashboardControlsBar
                            active={active}
                            startingPointage={startingPointage}
                            modelsLoaded={modelsLoaded}
                            onHandleClick={handleClick}
                            onStartPointage={handleStartPointage}
                        />
                    </div>

                    {/* Colonne détail + historique : affichée UNIQUEMENT s'il y a un item à montrer */}
                    {displayedItem && (
                        <aside className={styles.sideCol}>
                            <HistoryDetailCard
                                item={displayedItem}
                                onClose={() => setSelectedItem(null)}
                            />

                            <ProfileHistoryCard
                                history={items}
                                loading={historyLoading}
                                selectedItem={displayedItem}
                                onSelectItem={setSelectedItem}
                            />
                        </aside>
                    )}
                </main>

                {/* Statistiques : s'alignent avec la colonne caméra quand elle est seule */}
                <section className={`${styles.stats} ${displayedItem ? "" : styles.statsAlone}`}>
                    <FruitStatsGrid refreshKey={items.length} />
                </section>
            </div>
        </div>
    );
};

export default PointagePageDesktop;