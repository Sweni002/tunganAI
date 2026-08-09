// src/pages/Login/PointagePageMobile.jsx

import React from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import PointageView from "./PointageView";
import styles from "./login.module.css";

const PointagePageMobile = ({
    valueBtn,
    handleChangeBtn,
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
}) => {
    return (
        <div className={styles.loginWrapper} style={{ fontFamily: "'Roboto Mono', monospace" }}>
            <Box
                sx={{
                    width: "100%",
                    position: "absolute",
                    top: 5,
                    left: "52%",
                    zIndex: 1000,
                    transform: "translateX(-50%)",
                    maxWidth: 300,
                }}
            >
                <Tabs value={valueBtn} onChange={handleChangeBtn} variant="fullWidth">
                    <Tab
                        value="entree"
                        label="Entrée"
                        sx={{
                            fontSize: "0.7rem",
                            cursor: "pointer",
                            color: "rgb(255, 255, 255)",
                            fontFamily: "'Roboto Mono', monospace",
                            "&.Mui-selected": { color: "white", fontWeight: "bold" },
                        }}
                    />
                    <Tab
                        value="logout"
                        label="Sortie"
                        sx={{
                            fontSize: "0.7rem",
                            cursor: "pointer",
                            color: "rgb(255, 255, 255)",
                            fontFamily: "'Roboto Mono', monospace",
                            "&.Mui-selected": { color: "white" },
                        }}
                    />
                </Tabs>
            </Box>

            <PointageView
                processingStep={processingStep}
                webcamRef={webcamRef}
                canvasRef={canvasRef}
                webcamReady={webcamReady}
                loadingModels={loadingModels}
                isLargeScreen={false}
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
            />
        </div>
    );
};

export default PointagePageMobile;