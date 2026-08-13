// src/pages/Login/PointagePage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    CircularProgress,
} from "@mui/material";

import { useFacePointage } from "../services/useFacePointage";
import PointagePageDesktop from "./PointagePageDesktop";
import PointagePageMobile from "./PointagePageMobile";
import MacAgentInstallationCard from "./MacAgentInstallationCard";
import Loading from "../../pointage/Loading";
import SplashScreen from "../../../SplashScreen";

// ---------------------------------------------------------------
// Orchestrateur : appelle les hooks partagés UNE SEULE FOIS (webcam,
// face-api, background, historique), puis délègue le rendu à
// PointagePageDesktop ou PointagePageMobile selon la taille d'écran.
// ---------------------------------------------------------------
const PointagePageContent = () => {
    const navigate = useNavigate();
    const isLargeScreen = useMediaQuery({ minWidth: 1200 });
    const [valueBtn, setValueBtn] = useState("entree");



    const {
        modelsLoaded,
        loadingModels,
        scanning,
        webcamReady,
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
        canvasRef,
        webcamRef,
        processingStep,
        history,
        historyLoading,
        handleClick,
        handleStartPointage,
        closeSnackbar,
        closeModal,
        macAgentInstalled,
        macAgentChecking,
        openMacAgentInstaller,
        macAgentInstalling,
        handleInstallMacAgent,
    } = useFacePointage();

    const handleChangeBtn = (event, newValue) => {
        setValueBtn(newValue);
        if (newValue === "entree") handleClick("entree");
        else if (newValue === "logout") handleClick("logout");
    };

    const goBack = () => navigate("/login", { replace: true });
    const goHome = () => navigate("/", { replace: true });

    const sharedProps = {
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
    };

  if (macAgentChecking) {
  return (
    <SplashScreen 
      
    />
  );
}

    if (!macAgentInstalled) {
        return (
            <MacAgentInstallationCard
                macAgentInstalling={macAgentInstalling}
                handleInstallMacAgent={handleInstallMacAgent}
            />
        );
    }

    if (isLargeScreen) {
        return <PointagePageDesktop {...sharedProps} goHome={goHome} />;
    }

    return <PointagePageMobile {...sharedProps} valueBtn={valueBtn} handleChangeBtn={handleChangeBtn} />;
};

const PointagePage = () => {
    return <PointagePageContent />;
};

export default PointagePage;