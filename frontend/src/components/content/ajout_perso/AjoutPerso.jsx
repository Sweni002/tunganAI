import React, { useContext, useEffect, useRef, useState } from "react";
// ⚠️ Ajuster les chemins des assets en fonction de l'emplacement final du dossier AjoutPerso/
import Perso from "../../../assets/v3.png";
import Button from "@mui/material/Button";
import { useLocation, useNavigate } from "react-router-dom";
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import SnackbarContent from '@mui/material/SnackbarContent';
import { AuthContext } from '../../../AuthContext';
import { localStyles, getResponsiveStyles, styleContainer, styleSary, styleSary1, styleSary1Img, styleRetour, styleRetourIcon } from "./styles";
import AlertSnackbar from "./components/AlertSnackbar";
import WebcamCaptureModal from "./components/WebcamCaptureModal";
import ResultModal from "./components/ResultModal";
import PersonnelForm from "./components/PersonnelForm";
import { useIsMobile } from "./hooks/useIsMobile";
import { useFaceApiModels } from "./hooks/useFaceApiModels";
import { useWebcamReady } from "./hooks/useWebcamReady";
import { useFaceDetectionOverlay } from "./hooks/useFaceDetectionOverlay";
import { useAdminDivisions } from "./hooks/useAdminDivisions";
import { dataURLtoFile } from "./utils/fileHelpers";
import { generatePassword } from "./utils/password";
import PageHeader from "../autorisations_absences/components/PageHeader";
import { computeLandmarkSignature, getFaceLandmarker, nextTimestamp } from "../../login/services/mediapipeService";

const API_URL = import.meta.env.VITE_API_URL;

// ============================================================================
// ⚠️ DÉCISION D'ENRÔLEMENT
//
// face-api.js produisait un descripteur 128-D discriminant, stocké en base
// sous `faceapi_descriptor` et utilisé pour identifier la personne.
// MediaPipe n'a AUCUN équivalent : il ne fait que de la détection et des
// landmarks, pas de la reconnaissance.
//
// Envoyer une signature géométrique sous le même nom de champ produirait
// des vecteurs de bonne taille mais non discriminants — la base semblerait
// saine alors que la reconnaissance serait cassée.
//
// Par défaut on n'envoie donc plus ce champ : le serveur doit calculer
// l'embedding depuis l'image (c'est déjà ce que fait pointageStep3Recognition,
// qui renvoie `emb` et `score_face`).
//
// Mets à true UNIQUEMENT si tu as vérifié que le backend ne s'en sert pas
// pour du matching.
// ============================================================================
const SEND_FACE_SIGNATURE = false;

const AjoutPerso = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile(768);
    const isTablet = useIsMobile(1068);

    const [webcamLoading, setWebcamLoading] = useState(false);
    const [webcamPreview, setWebcamPreview] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImageURL, setSelectedImageURL] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const fileInputRef = useRef(null);
    const [selectedService, setSelectedService] = useState(""); // service sélectionné
    const [pageLoading, setPageLoading] = useState(true);
    const [divisions, setDivisions] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedDivision, setSelectedDivision] = useState(null); // état sélection
    const [openSnack, setOpenSnack] = useState(false);
    const [matricule, setMatricule] = useState("");
    const [nom, setNom] = useState("");
    const [prenom, setPrenom] = useState("");
    const [tel, setTel] = useState("");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");
    const { fetchMe } = useContext(AuthContext);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("warning");
    const [openResultModal, setOpenResultModal] = useState(false);
    const [resultType, setResultType] = useState("success"); // success | error
    const [modalMessage, setModalMessage] = useState("");
    const [errors, setErrors] = useState({
        matricule: false,
        nom: false,
        prenom: false,
        tel: false,
        division: false,
        services: false,
        photo: false,
        email: false,
        role: false,
        password: false,
    });
    const [selectedRole, setSelectedRole] = useState("bureau"); // valeur par défaut
    const canvasRef = useRef(null);
    const location = useLocation();
    const { idrh, idserv } = location.state || {};
    // 🔄 Renommé : ce n'est plus un descripteur de reconnaissance,
    // seulement une signature géométrique + un marqueur "visage présent".
    const [selectedFaceSignature, setSelectedFaceSignature] = useState(null);
    const [capturing, setCapturing] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [password, setPassword] = useState("");
    const [openWeb, setOpenWeb] = useState(false);
    const webcamRef = useRef(null);

    // --- Hooks extraits (logique strictement identique à l'original) ---
    const modelsLoaded = useFaceApiModels();
    const webcamReady = useWebcamReady(webcamRef);
    useFaceDetectionOverlay({ webcamRef, canvasRef, modelsLoaded, scanning });
    const { admin, services } = useAdminDivisions(fetchMe);

    const chargerLoading = () => {
        setLoading(true);
    };

    useEffect(() => {
        setPassword(generatePassword());
    }, []);

    const handleCapture = async () => {
        if (!webcamRef.current) return;
        setCapturing(true); // active le loader

        const video = webcamRef.current.video;
        if (video.readyState !== 4) {
            setCapturing(false); // désactive le loader
            return;
        }
        setWebcamLoading(true);

        // Détection + landmarks (MediaPipe)
        let landmarks = null;
        try {
            const landmarker = await getFaceLandmarker();
            const result = landmarker.detectForVideo(video, nextTimestamp());
            landmarks = result.faceLandmarks?.[0] || null;
        } catch (err) {
            console.error("Erreur détection visage :", err);
        }

        if (!landmarks) {
            setSnackbarMessage("Aucun visage détecté.");
            setSnackbarSeverity("warning");
            setSnackbarOpen(true);
            setWebcamLoading(false);
            setCapturing(false); // désactive le loader
            return;
        }

        // ✅ Conversion image -> File
        const imageSrc = webcamRef.current.getScreenshot();
        const imageFile = dataURLtoFile(imageSrc, "webcam.jpg");

        // ⚠️ Signature géométrique, PAS un embedding de reconnaissance
        const faceSignature = computeLandmarkSignature(landmarks);

        // Mettre à jour le state
        setPreview(imageSrc);
        setSelectedImage(imageFile);
        setSelectedFaceSignature(faceSignature);
        setWebcamLoading(false);
        setOpenWeb(false);
        setCapturing(false); // désactive le loader
    };

    const handleCreateResponsable = async () => {
        setLoading(true);
        setMsg("");
        if (!idrh) {
            navigate(-1);
        }

        const formData = new FormData();
        formData.append("matricule", matricule);
        formData.append("nom", nom);
        formData.append("prenom", prenom);
        formData.append("email", email);
        formData.append("iddiv", selectedService);
        formData.append("idrh", idrh);
        formData.append("role", selectedRole);

        // ⚠️ Voir le bloc SEND_FACE_SIGNATURE en haut du fichier.
        if (SEND_FACE_SIGNATURE && selectedFaceSignature) {
            formData.append("mediapipe_signature", JSON.stringify(selectedFaceSignature));
        }

        formData.append("mot_de_passe", password);
        if (selectedImage) {
            formData.append("image", selectedImage);
        }

        try {
            const response = await fetch(`${API_URL}/api/personnels/`, {
                method: "POST",
                credentials: "include",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setMsg(data.error);
                setOpenSnack(true);
                setLoading(false);
                return;
            }
            setMsg(data.message);
            setModalMessage(data.message || "Création réussie !");
            setResultType("success");
            setOpenResultModal(true);
            setLoading(false);

            // Reset
            setMatricule("");
            setNom("");
            setPrenom("");
            setEmail("");
            setSelectedService("");
            setSelectedImage(null);
            setPreview(null);
            setSelectedFaceSignature(null);
            setSelectedRole("bureau"); // reset au rôle par défaut
            setPassword(generatePassword());
            setSelectedImageURL(null);
        } catch (error) {
            console.error("Erreur d'ajout :", error);
            setMsg(error.message);
            setModalMessage(error.message || "Erreur d'ajout !");
            // 🐛 Corrigé : c'était "success" alors qu'on est dans le catch
            setResultType("error");
            setOpenResultModal(true);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!idrh) {
            navigate(-1);
        }
    }, [idrh]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const validateForm = () => {
        const newErrors = {
            matricule: !matricule.trim(),
            nom: !nom.trim(),
            prenom: !prenom.trim(),
            email: !email.trim(),
            role: !selectedRole,
            services: !services,
            password: !password,
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    };

    const handleCloseSnack = (event, reason) => {
        setOpenSnack(false);
    };

    const action = (
        <>
            <Button
                color="primary"
                size="medium"
                onClick={() => {
                    setOpenSnack(false);
                    navigate("/global/personnel");
                }}
                sx={{ p: 1, fontSize: 17 }}
            >
                Voir
            </Button>
            <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleCloseSnack}
                sx={{
                    "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.1)",
                        color: "#f44336",
                    },
                    transition: "background-color 0.3s, color 0.3s",
                }}
            >
                <CloseIcon fontSize="medium" />
            </IconButton>
        </>
    );

    const filteredDivisions = divisions.filter((div) =>
        div.nomdivision.toLowerCase().includes(search.toLowerCase())
    );

    const goBack = () => {
        navigate(-1);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleChooseFile = () => {
        fileInputRef.current.click();
    };

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handlePhotoClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowed = ["image/jpeg", "image/jpg", "image/png"];
        if (!allowed.includes(file.type)) {
            alert("Format non supporté. Utilisez JPEG, JPG ou PNG.");
            return;
        }

        if (errors.photo) {
            setErrors((prev) => ({ ...prev, photo: false }));
        }

        // Stocker le fichier pour l'envoi
        setSelectedImage(file);

        // Générer l'aperçu
        const previewURL = URL.createObjectURL(file);
        setPreview(previewURL);

        // 🔹 Détection faciale sur image statique (runningMode: "IMAGE")
        const img = new Image();
        img.onload = async () => {
            try {
                const landmarker = await getImageFaceLandmarker();
                const result = landmarker.detect(img);
                const landmarks = result.faceLandmarks?.[0];

                if (!landmarks) {
                    setSnackbarMessage("Aucun visage détecté dans l'image.");
                    setSnackbarSeverity("warning");
                    setSnackbarOpen(true);
                    setSelectedFaceSignature(null);
                    return;
                }

                setSelectedFaceSignature(computeLandmarkSignature(landmarks));
            } catch (err) {
                console.error("Erreur détection visage :", err);
                setSelectedFaceSignature(null);
            }
        };
        img.onerror = () => {
            console.error("Impossible de charger l'aperçu de l'image");
            setSelectedFaceSignature(null);
        };
        img.src = previewURL;
    };

    function handleSelectDivision(div) {
        setSelectedDivision(div);
        setErrors((prev) => ({ ...prev, division: false }));
        handleClose();
    }

    // ---------------------------------------------------------------------
    // Styles inline
    // ---------------------------------------------------------------------
    const { stylePersonnels, styleCard } = getResponsiveStyles(isMobile, isTablet);

    return (
        // 🐛 Corrigé : il y avait deux attributs `style`, le second écrasait
        // silencieusement stylePersonnels.
        <div style={{ ...stylePersonnels, maxWidth: "88%", margin: "0 auto" }}>
            <style>{localStyles}</style>

            <PageHeader
                title="Ajout d'un personnel"
                subtitle="Création d'une nouvelle fiche dans le répertoire du personnel"
                show={true}
                onBackClick={goBack}
            />

            <div style={styleCard} >
                <div style={styleContainer} >

                    <div style={styleSary}>
                        <div style={styleSary1}>
                            <img src={Perso} alt="" style={styleSary1Img} />
                        </div>
                    </div>

                    <PersonnelForm
                        selectedRole={selectedRole}
                        setSelectedRole={setSelectedRole}
                        errors={errors}
                        setErrors={setErrors}
                        matricule={matricule}
                        setMatricule={setMatricule}
                        nom={nom}
                        setNom={setNom}
                        prenom={prenom}
                        setPrenom={setPrenom}
                        email={email}
                        setEmail={setEmail}
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                        password={password}
                        setPassword={setPassword}
                        selectedService={selectedService}
                        setSelectedService={setSelectedService}
                        services={services}
                        preview={preview}
                        fileInputRef={fileInputRef}
                        handleFileChange={handleFileChange}
                        handleChooseFile={handleChooseFile}
                        setOpenWeb={setOpenWeb}
                        loading={loading}
                        onSubmit={() => {
                            if (validateForm()) {
                                handleCreateResponsable();
                            }
                        }}
                    />
                </div>
            </div>

            <WebcamCaptureModal
                open={openWeb}
                onClose={() => setOpenWeb(false)}
                webcamRef={webcamRef}
                canvasRef={canvasRef}
                webcamReady={webcamReady}
                webcamLoading={webcamLoading}
                capturing={capturing}
                scanning={scanning}
                handleCapture={handleCapture}
            />

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                sx={{ zIndex: 2000 }}
            >
                <AlertSnackbar
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    sx={{ fontFamily: "'Poppins', sans-serif" }}
                >
                    {snackbarMessage}
                </AlertSnackbar>
            </Snackbar>

            <Snackbar
                open={openSnack}
                autoHideDuration={5000}
                onClose={handleCloseSnack}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
                <SnackbarContent
                    sx={{
                        p: 1,
                        px: 3,
                        fontSize: "0.75rem",
                        boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 3,
                    }}
                    message={<span style={{ marginRight: 8, fontSize: "0.8rem" }}>{msg}</span>}
                    action={action}
                />
            </Snackbar>

            <ResultModal
                open={openResultModal}
                onClose={() => setOpenResultModal(false)}
                resultType={resultType}
                message={modalMessage}
            />
        </div>
    );
};

export default AjoutPerso;