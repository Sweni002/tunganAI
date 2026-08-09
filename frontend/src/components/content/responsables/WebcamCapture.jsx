// src/pages/Responsable/components/WebcamCapture.jsx

import React, { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Webcam from "react-webcam";
import Modal from "@mui/material/Modal";
import BeatLoader from "react-spinners/BeatLoader";
import styles from "./ajout_perso.module.css";
import { useFaceDetection } from "./hooks/useFaceDetection";
import { dataURLtoFile } from "./utils/helpers";
// ✅ Plus d'import de lib de détection ici : tout passe par useFaceDetection.

const WebcamCapture = ({
    open,
    onClose,
    onCaptureSuccess,
    onCaptureError
}) => {
    const webcamRef = useRef(null);
    const { canvasRef, modelsLoaded, drawFaceBoxes, detectFace } = useFaceDetection();
    const [webcamReady, setWebcamReady] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [scanning, setScanning] = useState(true);

    useEffect(() => {
        if (open) {
            const checkVideo = setInterval(() => {
                const video = webcamRef.current?.video;
                if (video && video.readyState === 4) {
                    setWebcamReady(true);
                    clearInterval(checkVideo);
                }
            }, 100);
            return () => clearInterval(checkVideo);
        }
    }, [open]);

    // Dessiner les contours des visages
    // 🐛 drawFaceBoxes retiré des dépendances : il n'est pas mémoïsé côté
    // hook, donc sa référence change à chaque render et l'intervalle était
    // détruit puis recréé en boucle.
    useEffect(() => {
        if (!modelsLoaded || !webcamReady) return;

        const interval = setInterval(async () => {
            if (webcamRef.current?.video?.readyState === 4) {
                const video = webcamRef.current.video;
                await drawFaceBoxes(video, canvasRef.current);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [modelsLoaded, webcamReady]);

    const handleCapture = async () => {
        if (!webcamRef.current) return;

        setCapturing(true);

        // Laisse React mettre à jour le bouton et afficher le loader
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const video = webcamRef.current.video;

        if (!video || video.readyState !== 4) {
            setCapturing(false);
            return;
        }

        try {
            const detection = await detectFace(video);

            if (!detection) {
                onCaptureError("Aucun visage détecté.");
                setCapturing(false);
                return;
            }

            const imageSrc = webcamRef.current.getScreenshot();
            const imageFile = dataURLtoFile(imageSrc, "webcam.jpg");

            // ⚠️ Signature géométrique MediaPipe, pas une empreinte d'identité.
            // Le parent ne doit PAS l'envoyer comme `faceapi_descriptor` sur un
            // POST/PUT de personnel ou de responsable : ça écraserait l'empreinte
            // de référence par un vecteur non discriminant. Le serveur recalcule
            // l'embedding à partir de `imageFile`.
            const faceDescriptor = detection.descriptor; // déjà un Array JS

            onCaptureSuccess(imageSrc, imageFile, faceDescriptor);

            setCapturing(false);
            onClose();
        } catch (error) {
            console.error(error);
            onCaptureError("Erreur lors de la capture");
            setCapturing(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "transparent",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: 70,
                        right: "27%",
                        color: "white",
                        zIndex: 10,
                    }}
                >
                    <CloseIcon sx={{ fontSize: "2.5rem" }} />
                </IconButton>

                <Box
                    sx={{
                        backgroundColor: "transparent",
                        width: "80vw",
                        maxWidth: "700px",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Box sx={{ position: "relative", width: "100%", mb: 3 }}>
                        {!webcamReady && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    zIndex: 5,
                                }}
                            >
                                <span className={styles.loader2}></span>
                            </Box>
                        )}

                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "user" }}
                            style={{
                                width: "100%",
                                aspectRatio: "4 / 3",
                                display: "block",
                            }}
                        />

                        <canvas
                            ref={canvasRef}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                            }}
                        />

                        <div className={styles.scannerFrame}>
                            <div className={`${styles.corner} ${styles.tl_horizontal}`}></div>
                            <div className={`${styles.corner} ${styles.tl_vertical}`}></div>
                            <div className={`${styles.corner} ${styles.tr_horizontal}`}></div>
                            <div className={`${styles.corner} ${styles.tr_vertical}`}></div>
                            <div className={`${styles.corner} ${styles.bl_horizontal}`}></div>
                            <div className={`${styles.corner} ${styles.bl_vertical}`}></div>
                            <div className={`${styles.corner} ${styles.br_horizontal}`}></div>
                            <div className={`${styles.corner} ${styles.br_vertical}`}></div>
                            {scanning && <div className={styles.scanLine}></div>}
                        </div>
                    </Box>

                    <Button
                        fullWidth
                        onClick={handleCapture}
                        disabled={capturing || !webcamReady}
                        sx={{
                            fontFamily: "'Poppins', sans-serif",
                            backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
                            py: 1.5,
                            borderRadius: "33px",
                            color: "white",
                            fontSize: "1.0rem",
                            fontWeight: 500,
                            textTransform: "none",
                            transition: "all 0.3s ease",
                            height: "53px",
                            "&:hover": {
                                opacity: 0.9,
                                backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
                            },
                        }}
                    >
                        {capturing ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <span className={styles.loader}></span>
                            </Box>
                        ) : (
                            "Capturer"
                        )}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default WebcamCapture;