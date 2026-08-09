import Breadcrumbs from '@mui/material/Breadcrumbs';
import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "./ajout_perso.module.css";
import Perso from "../../assets/v3.png";
import Logo from "../../assets/1.png";
import Avatar from "@mui/material/Avatar";
import { styled } from "@mui/material/styles";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Alert from "@mui/material/Alert";
import { useLocation, useNavigate } from "react-router-dom";
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import SnackbarContent from '@mui/material/SnackbarContent';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Spin } from "antd";
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { AuthContext } from '../../AuthContext';
import BeatLoader from "react-spinners/BeatLoader";
import MuiAlert from '@mui/material/Alert';
import { Modal, Box } from "@mui/material";
import Webcam from "react-webcam";
import CircularProgress from '@mui/material/CircularProgress';
import {
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import Lottie from "lottie-react";
import SuccessLottie from '../../assets/success.json';
import ErrorLottie from '../../assets/error.json';
import DialogActions from '@mui/material/DialogActions';
import { getFaceLandmarker, landmarksToBox, nextTimestamp } from '../login/services/mediapipeService';

const API_URL = import.meta.env.VITE_API_URL;

// ⚙️ Passe à true si <Webcam mirrored /> est utilisé
const MIRRORED = false;

const AlertSnackbar = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "30px",
    padding: theme.spacing(4),
    width: "100%",
    maxWidth: "500px",
  },
}));


const ModPerso = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageURL, setSelectedImageURL] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [services, setServices] = useState([]);   // liste des divisions
  const [selectedService, setSelectedService] = useState(""); // division sélectionnée
  const [webcamLoading, setWebcamLoading] = useState(false);

  const [divisions, setDivisions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(null);
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
  const [admin, setAdmin] = useState(null);

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
  });
  const { state } = useLocation();
  const record = state?.record;
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // 🔄 Refs MediaPipe
  const landmarkerRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  const chargerLoading = () => {
    setLoading(true);
  };

  const [selectedRole, setSelectedRole] = useState("bureau");
  const [capturing, setCapturing] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [scanning, setScanning] = useState(false);

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });

  const [openWeb, setOpenWeb] = useState(false);
  const webcamRef = useRef(null);

  function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  // ------------------------------------------------------------------
  // Capture : la détection valide qu'un visage est présent.
  //
  // ⚠️ Le descripteur n'est plus calculé ni envoyé. MediaPipe ne produit
  // pas d'équivalent au vecteur 128-D de face-api, et ce formulaire fait
  // un PUT : il METTRAIT À JOUR l'empreinte de référence du personnel.
  // Y écrire une signature géométrique casserait sa reconnaissance, en
  // silence, et pour lui seul. L'image continue de partir : le serveur
  // peut recalculer l'embedding à partir d'elle.
  // ------------------------------------------------------------------
  const handleCapture = async () => {
    if (!webcamRef.current) return;
    setCapturing(true);

    const video = webcamRef.current.video;
    if (video.readyState !== 4) {
      setCapturing(false);
      return;
    }
    setWebcamLoading(true);

    let landmarks = null;
    try {
      const landmarker = landmarkerRef.current;
      if (!landmarker) throw new Error("Modèle facial non initialisé");
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
      setCapturing(false);
      return;
    }

    // ✅ Conversion image -> File
    const imageSrc = webcamRef.current.getScreenshot();
    const imageFile = dataURLtoFile(imageSrc, "webcam.jpg");

    setPreview(imageSrc);
    setSelectedImage(imageFile);
    setWebcamLoading(false);
    setOpenWeb(false);
    setCapturing(false);
  };

  // ------------------------------------------------------------------
  // Initialisation du modèle MediaPipe
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    getFaceLandmarker()
      .then((lm) => {
        if (cancelled) return;
        landmarkerRef.current = lm;
        setModelsLoaded(true);
      })
      .catch((err) => {
        console.error("Erreur chargement du modèle facial :", err);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const checkVideo = setInterval(() => {
      const video = webcamRef.current?.video;
      if (video && video.readyState === 4) {
        setWebcamReady(true);
        clearInterval(checkVideo);
      }
    }, 100);

    return () => clearInterval(checkVideo);
  }, []);

  // ------------------------------------------------------------------
  // Overlay de détection
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!modelsLoaded) return;

    const interval = setInterval(() => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || video.readyState !== 4 || !canvas || !landmarker) return;
      if (video.currentTime === lastVideoTimeRef.current) return;
      lastVideoTimeRef.current = video.currentTime;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (scanning) return;

      try {
        const result = landmarker.detectForVideo(video, nextTimestamp());

        (result.faceLandmarks || []).forEach((landmarks) => {
          let { x, y, width, height } = landmarksToBox(landmarks, canvas.width, canvas.height);
          if (MIRRORED) x = canvas.width - x - width;

          context.strokeStyle = "white";
          context.lineWidth = 1;
          context.strokeRect(x, y, width, height);
        });
      } catch (err) {
        console.error("Erreur détection visages :", err);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [modelsLoaded, scanning]);


  const handleCreateResponsable = async () => {
    setLoading(true);
    setMsg("");
    if (!record.idrh || !record.idpers) {
      navigate(-1);
    }

    const formData = new FormData();
    formData.append("matricule", matricule);
    formData.append("nom", nom);
    formData.append("prenom", prenom);
    formData.append("email", email);
    formData.append("iddiv", selectedService);
    formData.append("idrh", record.idrh);
    formData.append("role", selectedRole);

    // ❌ faceapi_descriptor n'est plus envoyé — voir la note sur handleCapture.

    formData.append("mot_de_passe", ""); // optionnel
    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      const response = await fetch(`${API_URL}/api/personnels/${record.idpers}`, {
        method: "PUT",
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

      setLoading(false);

      // Reset
      setMatricule("");
      setNom("");
      setPrenom("");
      setEmail("");
      setSelectedService("");
      setSelectedImage(null);
      setPreview(null);
      setSelectedRole('bureau');
      setSelectedImageURL(null);
      sessionStorage.setItem("snackMessage", data.message);
      sessionStorage.setItem("snackError", "false");
      navigate("/global/personnel");
    } catch (error) {
      console.error("Erreur d'ajout :", error);
      setMsg(error.message);
      setOpenSnack(true);
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!record) {
      navigate(-1);
    }

    if (record) {
      setNom(record.nom || "");
      setMatricule(record.matricule || "");
      setPrenom(record.prenom || "");
      setEmail(record.email || "");
      setSelectedRole(record.role || 'bureau');
      setSelectedService(record.iddiv || "");
      if (record.image) {
        setPreview(`${API_URL}/uploads/${record.image}`);
      } else {
        setPreview(null);
      }
    }
  }, [record]);


  useEffect(() => {
    const fetchAdminAndDivisions = async () => {
      try {
        const data = await fetchMe();
        setAdmin(data);

        if (!data || !data.responsable || !data.responsable.idrh) {
          navigate("/login");
          return;
        }

        const res = await fetch(
          `${API_URL}/api/divisions/by_service?idserv=${data.responsable.idserv}`,
          { credentials: "include" },
        );
        const divData = await res.json();

        if (Array.isArray(divData)) {
          setServices(divData);
        } else {
          console.error("Réponse API invalide :", divData);
        }
      } catch (err) {
        console.error("Erreur fetch admin ou divisions :", err);
        navigate("/login");
      }
    };

    fetchAdminAndDivisions();
  }, []);


  const validateForm = () => {
    const newErrors = {
      matricule: !matricule.trim(),
      nom: !nom.trim(),
      prenom: !prenom.trim(),
      email: !email.trim(),
      // 🐛 Corrigé : `services` est la liste, toujours truthy.
      services: !selectedService,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleCloseSnack = (event, reason) => {
    setOpenSnack(false);
  };

  const action = (
    <>
      <Button color="primary" size="medium" onClick={() => {
        setOpenSnack(false);
        navigate("/global/responsable");
      }}
        sx={{ p: 1, fontSize: 17 }}>
        Voir
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleCloseSnack}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            color: '#f44336',
          },
          transition: 'background-color 0.3s, color 0.3s',
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

    setSelectedImage(file);

    const previewURL = URL.createObjectURL(file);
    setPreview(previewURL);

    // 🔹 Détection sur image statique (runningMode: "IMAGE")
    // Sert uniquement à prévenir l'utilisateur si la photo ne contient
    // pas de visage exploitable.
    const img = new Image();
    img.onload = async () => {
      try {
        const landmarker = await getImageFaceLandmarker();
        const result = landmarker.detect(img);

        if (!result.faceLandmarks?.[0]) {
          setSnackbarMessage("Aucun visage détecté dans l'image.");
          setSnackbarSeverity("warning");
          setSnackbarOpen(true);
        }
      } catch (err) {
        console.error("Erreur détection visage :", err);
      }
    };
    img.onerror = () => {
      console.error("Impossible de charger l'aperçu de l'image");
    };
    img.src = previewURL;
  };


  function handleSelectDivision(div) {
    setSelectedDivision(div);
    setErrors(prev => ({ ...prev, division: false }));
    handleClose();
  }


  return (
    <div className={styles.personnels}>
      <div className={styles.break}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" sx={{ fontSize: "0.9rem" }}>
            Personnels
          </Link>

          <Typography sx={{ color: "text.primary", fontSize: "0.9rem" }}>
            Ajout
          </Typography>
        </Breadcrumbs>
      </div>

      <div className={styles.card}>
        <div className={styles.container}>
          <div className={styles.retour} onClick={goBack}>
            <IconButton
              aria-label="more"
              id="long-button"
              aria-haspopup="true"
              size="large"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </IconButton>
          </div>
          <div className={styles.sary}>
            <div className={styles.sary1}>
              <img src={Perso} alt="" />
            </div>
          </div>

          <div className={styles.form}>
            <div className={styles.inputM}>
              <label htmlFor="matricule">
                Role <span style={{ color: "red" }}>*</span>
              </label>
              <FormControl sx={{ mt: 2.7, mb: 0 }}>
                <RadioGroup
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  row
                  sx={{
                    m: 0,
                    p: 0,
                    alignItems: "center",
                    gap: 5,
                    "& .MuiFormControlLabel-root": {
                      m: 0,
                      height: 26,
                    },
                    "& .MuiRadio-root": {
                      p: 0.2,
                      height: 26,
                      width: 26,
                    },
                    "& .MuiSvgIcon-root": {
                      fontSize: 18,
                    },
                  }}
                >
                  <FormControlLabel
                    value="bureau"
                    control={
                      <Radio
                        disableRipple
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 25,
                          },
                          "&.Mui-checked": {
                            color: "#1b6979",
                          },
                        }}
                      />
                    }
                    label="Agents de bureau"
                    sx={{
                      columnGap: 0.5,
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.85rem",
                        lineHeight: 1,
                        fontFamily: " 'Poppins', sans-serif",
                      },
                    }}
                  />

                  <FormControlLabel
                    value="surface"
                    control={
                      <Radio
                        sx={{
                          "& .MuiSvgIcon-root": {
                            fontSize: 24,
                          },
                          "&.Mui-checked": {
                            color: "#1b6979",
                          },
                        }}
                      />
                    }
                    label="Agents de surface"
                    sx={{
                      columnGap: 0.5,
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.85rem",
                        lineHeight: 1,
                        fontFamily: " 'Poppins', sans-serif",
                      },
                    }}
                  />
                </RadioGroup>
              </FormControl>
              {errors.role && (
                <p
                  style={{
                    color: "brown",
                    fontSize: "0.8rem",
                    marginTop: "4px",
                  }}
                >
                  Role est requise.
                </p>
              )}
            </div>

            <div className={styles.inputM}>
              <label htmlFor="matricule">
                Matricule <span style={{ color: "red" }}>*</span>
              </label>
              <TextField
                placeholder="Entrez le matricule"
                variant="standard"
                fullWidth
                value={matricule}
                onChange={(e) => {
                  let value = e.target.value;

                  // 🔒 Supprime tout sauf les chiffres
                  value = value.replace(/\D/g, "");

                  // 🔒 Limite à 6 chiffres
                  if (value.length > 6) return;

                  setMatricule(value);

                  // 🔒 Validation
                  if (/^\d{6}$/.test(value)) {
                    setErrors((prev) => ({ ...prev, matricule: false }));
                  } else {
                    setErrors((prev) => ({ ...prev, matricule: true }));
                  }
                }}
                error={!!errors.matricule}
                helperText={
                  errors.matricule
                    ? "Le matricule doit contenir exactement 6 chiffres."
                    : ""
                }
                sx={{
                  mt: 1,
                  mb: 2,
                  width: "100%",
                  "& .MuiInputBase-input": {
                    padding: "8px 1px",
                    fontSize: "0.9rem",
                    fontFamily:
                      "system-ui, Avenir, Helvetica, Arial, sans-serif",
                    "@media (max-width:600px)": {
                      padding: "5px 0px !important",
                    },
                  },
                }}
              />
            </div>
            <div className={styles.inputM}>
              <label htmlFor="matricule">
                Nom <span style={{ color: "red" }}>*</span>
              </label>
              <TextField
                placeholder="Entrez le nom"
                variant="standard"
                fullWidth
                value={nom}
                onChange={(e) => {
                  setNom(e.target.value);
                  if (errors.nom) {
                    setErrors((prev) => ({ ...prev, nom: false }));
                  }
                }}
                error={!!errors.nom}
                helperText={errors.nom ? "Le nom est requis." : ""}
                sx={{
                  mt: 1,
                  mb: 2,
                  width: "100%",
                  "& .MuiInputBase-input": {
                    padding: "8px 1px",
                    fontSize: "0.9rem",
                    fontFamily:
                      "system-ui, Avenir, Helvetica, Arial, sans-serif",
                    "@media (max-width:600px)": {
                      padding: "5px 0px !important",
                    },
                  },
                }}
              />
            </div>

            <div className={styles.inputM}>
              <label htmlFor="matricule">
                Prenom <span style={{ color: "red" }}>*</span>
              </label>
              <TextField
                placeholder="Entrez le prenom"
                variant="standard"
                fullWidth
                value={prenom}
                onChange={(e) => {
                  setPrenom(e.target.value);
                  if (errors.prenom) {
                    setErrors((prev) => ({ ...prev, prenom: false }));
                  }
                }}
                error={!!errors.prenom}
                helperText={errors.prenom ? "Le prenom est requis." : ""}
                sx={{
                  mt: 1,
                  mb: 2,
                  width: "100%",
                  "& .MuiInputBase-input": {
                    padding: "8px 1px",
                    fontSize: "0.9rem",
                    fontFamily:
                      "system-ui, Avenir, Helvetica, Arial, sans-serif",
                    "@media (max-width:600px)": {
                      padding: "5px 0px !important",
                    },
                  },
                }}
              />
            </div>

            <div className={styles.inputM}>
              <label htmlFor="matricule">
                Email professionelle <span style={{ color: "red" }}>*</span>
              </label>
              <TextField
                placeholder="Entrez un email valide"
                variant="standard"
                fullWidth
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: false }));
                  }
                }}
                // 🐛 Corrigé : pointait sur errors.prenom
                error={!!errors.email}
                helperText={errors.email ? "L'email est requis." : ""}
                sx={{
                  mt: 1,
                  mb: 2,
                  width: "100%",
                  "& .MuiInputBase-input": {
                    padding: "8px 1px",
                    // 🐛 Corrigé : "0.rem" était une valeur CSS invalide
                    fontSize: "0.9rem",
                    fontFamily:
                      "system-ui, Avenir, Helvetica, Arial, sans-serif",
                    "@media (max-width:600px)": {
                      padding: "5px 0px !important",
                    },
                  },
                }}
              />
            </div>

            <div className={styles.inputM}>
              <label htmlFor="matricule">
                Division <span style={{ color: "red" }}>*</span>
              </label>
              <FormControl variant="standard" fullWidth sx={{ mt: 1, mb: 2 }}>
                <Select
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    if (errors.services) {
                      setErrors((prev) => ({ ...prev, services: false }));
                    }
                  }}
                  error={!!errors.services}
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "0.85rem",
                  }}
                >
                  {services.map((serv) => (
                    <MenuItem
                      key={serv.iddiv}
                      value={serv.iddiv}
                      sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "0.85rem",
                      }}
                    >
                      {serv.nomdivision}
                    </MenuItem>
                  ))}
                </Select>

                {errors.services && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{ color: "brown" }}
                  >
                    Division est requis.
                  </Typography>
                )}
              </FormControl>
            </div>

            <div className={styles.inputM}>
              <label htmlFor="matricule">Photo</label>
              <span>Merci de selectionner un fichier JPEG , JPG ou PNG</span>

              <div className={styles.photos}>
                {preview && (
                  <div className={styles.img1}>
                    <img src={preview} alt="preview" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />

                <Button
                  variant="text"
                  onClick={handleChooseFile}
                  sx={{
                    fontFamily: " 'Poppins', sans-serif",
                    fontSize: "0.75rem",
                    mb: 1,
                    display: "flex",
                    gap: 1,
                    px: 2,
                    borderRadius: "4px",
                    border: "none",
                    textTransform: "none",
                    textDecoration: "underline",
                    transform: "scale(1)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <i className="fa-solid fa-upload"></i>
                  {preview ? "Modifier" : "Add files"}
                </Button>

                <Button
                  variant="text"
                  onClick={() => setOpenWeb(true)}
                  sx={{
                    fontFamily: " 'Poppins', sans-serif",
                    fontSize: "0.75rem",
                    mb: 1,
                    display: "flex",
                    gap: 1,
                    px: 1.0,
                    borderRadius: "4px",
                    border: "none",
                    textTransform: "none",
                    textDecoration: "none",
                    transform: "scale(1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      textDecoration: "underline",
                      backgroundColor: "transparent",
                      transform: "scale(1.02)",
                    },
                  }}
                >
                  <i
                    className="fa-solid fa-camera-rotate"
                    style={{ fontSize: "0.9rem" }}
                  ></i>
                  Prendre une photo
                </Button>
                {errors.photo && (
                  <p
                    style={{
                      color: "brown",
                      fontSize: "0.8rem",
                      marginTop: "4px",
                    }}
                  >
                    La photo est requise.
                  </p>
                )}
              </div>
            </div>

            <div className={styles.btn}>
              <Button
                variant="contained"
                fullWidth
                disabled={loading}
                onClick={() => {
                  if (validateForm()) {
                    handleCreateResponsable();
                  }
                }}
                sx={{
                  "&.Mui-disabled": {
                    backgroundColor: "#14535f",
                    color: "#fff",
                    opacity: 0.7,
                  },
                  fontFamily: " 'Poppins', sans-serif",
                  backgroundColor: "#14535f",
                  fontSize: "0.9rem",
                  mb: 1,
                  display: "flex",
                  gap: 2,
                  py: 1.1,
                  borderRadius: "4px",
                  justifyContent: "center",
                  border: "none",
                  textTransform: "none",
                  transform: "scale(1)",
                  transition: "all 0.3s ease",
                }}
              >
                {loading ? (
                  <span className={styles.loader}></span>
                ) : (
                  <>
                    <i
                      className="fa-solid fa-plus"
                      style={{ fontSize: "1.1rem" }}
                    ></i>
                    <span>Sauvegarder</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={openWeb} onClose={() => setOpenWeb(false)}>
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
            onClick={() => setOpenWeb(false)}
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
              p: 0,
              m: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {webcamLoading && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <BeatLoader color="#00c4cc" />
              </Box>
            )}

            <Box
              sx={{ position: "relative", width: "100%", m: 0, p: 0, mb: 3 }}
            >
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
              disabled={capturing}
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "53px",
                "&:hover": {
                  opacity: 0.9,
                  backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
                },
              }}
            >
              {capturing ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    color: "white",
                  }}
                >
                  <span className={styles.loader}></span>
                </Box>
              ) : (
                <>Capturer</>
              )}
            </Button>
          </Box>
        </Box>
      </Modal>

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
            fontSize: "17px",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 3,
          }}
          message={
            <span style={{ marginRight: 8, fontSize: "0.9rem" }}>{msg}</span>
          }
          action={action}
        />
      </Snackbar>
    </div>
  );
};

export default ModPerso;