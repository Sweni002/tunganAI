// src/pages/Login/PointagePageDesktop.jsx

import React, { useState } from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import HomeIcon from "@mui/icons-material/Home";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";

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
        <div
            style={{
                width: "100%",
                minHeight: "100vh",
                backgroundColor: "#0a1420",
                backgroundImage: "radial-gradient(circle at 20% 10%, rgba(79,216,255,0.06), transparent 40%)",
                fontFamily: "'Roboto Mono', monospace",
                padding: "20px 28px",
                boxSizing: "border-box",
            }}
        >

            {/* Barre du haut style "Carte Sombre Premium" */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 16,
                    padding: "12px 24px",
                    marginBottom: 24,
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                }}
            >
                {/* Zone Gauche : Logo + Titre */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <img
                        src={LogoImg}
                        alt="Tongan'Ai Logo"
                        style={{
                            height: 40,
                            width: 'auto',
                            display: 'block'
                        }}
                    />
                    <Typography
                        variant="h6"
                        component="h1"
                        sx={{
                            color: "#e8f6f8",
                            fontFamily: "'Roboto Mono', monospace",
                            fontWeight: 700,
                            letterSpacing: "1.5px",
                            textTransform: "uppercase",
                            background: "linear-gradient(90deg, #e8f6f8 0%, #7fd8ff 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        TONGAN'AI
                    </Typography>
                </div>

                {/* Zone Droite : Action unique Accueil */}
                <Box>
                    <IconButton
                        onClick={goHome}
                        aria-label="revenir à l'accueil"
                        sx={{
                            color: "#7fd8ff",
                            backgroundColor: "rgba(127, 216, 255, 0.05)",
                            padding: "10px",
                            transition: "all 0.3s ease-in-out",
                            "&:hover": {
                                color: "#ffffff",
                                backgroundColor: "rgba(127, 216, 255, 0.15)",
                                transform: "translateY(-2px) scale(1.05)",
                                boxShadow: "0 0 15px rgba(127, 216, 255, 0.3)",
                            },
                            "&:active": {
                                transform: "scale(0.95)",
                            }
                        }}
                    >
                        <HomeIcon sx={{ fontSize: "1.6rem" }} />
                    </IconButton>
                </Box>
            </div>

            {/* Contenu principal : caméra+contrôles  | détail + historique */}
            <div style={{ display: "flex", gap: 18, alignItems: "stretch" }}>
                {/* Colonne caméra */}
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        ...(displayedItem
                            ? {}
                            : {
                                maxWidth: 1300, margin: "0 auto",

                            }),
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 12,
                            height: 450,
                        }}
                    >

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
                    <div
                        style={{
                            width: 520,
                            minWidth: 280,
                            flexShrink: 0,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
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
                    </div>
                )}


            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    maxWidth: displayedItem ? "100%" : 1300, // S'aligne avec la colonne caméra quand elle est seule
                    margin: "0 auto",
                }}
            >
                <FruitStatsGrid />
            </div>
        </div>
    );
};

export default PointagePageDesktop;