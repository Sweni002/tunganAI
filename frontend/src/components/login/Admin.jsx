import React, { useContext, useEffect, useRef, useState } from 'react'
import styles from './admin.module.css';
import Logo from '../../assets/finances.png';
import Logo1 from '../../assets/v1.jpg';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import FilledInput from '@mui/material/FilledInput';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Button from '@mui/material/Button';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Spin } from 'antd';
import {useNavigate} from "react-router-dom"
import bgImage from '../../assets/logo4.jpg';
import Alert from '@mui/material/Alert';
import { AuthContext } from '../../AuthContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { styled } from "@mui/material/styles";
import Webcam from "react-webcam";
import Typography from '@mui/material/Typography';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import { Tooltip } from 'antd';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import BeatLoader from "react-spinners/BeatLoader";
import * as faceapi from "face-api.js"; // ✅ lib de détection
import CloseIcon from "@mui/icons-material/Close";
import Lottie from "lottie-react";
import Hello from '../../assets/hello.json';
import Face from '../../assets/face.json';
import SuccessLottie from '../../assets/face.json';
import ErrorLottie from '../../assets/error.json';


const AlertSnackbar = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "15px",
    padding: theme.spacing(2),
    width: "100%",
    maxWidth: "400px",
  
  },
}));
// helpers
function getEyeAspectRatio(eye) {
  // eye = array of points [{x,y}, ...] (6 points)
  // EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
  const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
  const A = dist(eye[1], eye[5]);
  const B = dist(eye[2], eye[4]);
  const C = dist(eye[0], eye[3]);
  return (A + B) / (2.0 * C);
}

const Admin = () => {
   const { login } = useContext(AuthContext);
  const [active, setActive] = useState(""); // "logout", "entree", "sortie"
const [pointageStarted, setPointageStarted] = useState(false);
const [startingPointage, setStartingPointage] = useState(false);
 const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [mdp, setMdp] = useState("");
const [nom, setNom] = useState("");
const [submitted, setSubmitted] = useState(false);
const [submittedMdp, setSubmittedMdp] = useState(false);
const [loginError, setLoginError] = useState(""); // Pour stocker le message d'erreur
 const [hovered, setHovered] = useState(false);
const [pageLoading, setPageLoading] = useState(true);
const navigation=useNavigate()
  const [role, setRole] = useState("admin"); 
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState("");

const [confirmOpen, setConfirmOpen] = useState(false);
const navigate=useNavigate()
const [hoverPresence, setHoverPresence] = useState(false);
const [hoverCapture, setHoverCapture] = useState(false);
const webcamRef = React.useRef(null);
const [snackbarSeverity, setSnackbarSeverity] = useState("warning");
  const [showPointage, setShowPointage] = useState(false);
  const [showSecond, setShowSecond] = useState(false);
  const [currentLottie, setCurrentLottie] = useState(1); // 1 ou 2
const [modalOpen, setModalOpen] = useState(false);
const [modalMessage, setModalMessage] = useState("");
const [modalType, setModalType] = useState("success"); // "success" ou "error"
const [scanning, setScanning] = useState(false);

   useEffect(() => {
    let timer;
    if (currentLottie === 1) {
      // Affiche le premier Lottie pendant 5s
      timer = setTimeout(() => setCurrentLottie(2), 10000);
    } else if (currentLottie === 2) {
      // Affiche le second Lottie pendant 10s
      timer = setTimeout(() => {
        // ici tu peux soit boucler, soit rester sur le 2ᵉ
        setCurrentLottie(1); 
      }, 12000);
    }
    return () => clearTimeout(timer);
  }, [currentLottie]);


useEffect(() => {
  // Simuler le temps de chargement de la page (ou attendre tes données)
  const timer = setTimeout(() => {
    setPageLoading(false);
  }, 1500); // 1,5s ou le temps nécessaire

  return () => clearTimeout(timer);
}, []);


useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models"; // 📂 mets le dossier des modèles dans /public/models
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);


useEffect(() => {
    if (!modelsLoaded) return;

    const interval = setInterval(async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (!scanning) {
          // Détection des visages uniquement si scanning === false
          const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions()
          );
          const displaySize = {
            width: video.videoWidth,
            height: video.videoHeight,
          };
          faceapi.matchDimensions(canvas, displaySize);
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          resizedDetections.forEach((detection) => {
            const box = detection.box;
            context.strokeStyle = "white"; 
            context.lineWidth = 1;
            context.strokeRect(box.x, box.y, box.width, box.height);
          });
        } else {
          // Si scanning === true, on affiche un cadre fixe vert au centre
        
        }
      }
    }, 100);

    return () => clearInterval(interval);
}, [modelsLoaded, scanning]);

  const captureAndSendFrame = async () => {
  if (!webcamRef.current) return;
  const video = webcamRef.current.video;
  if (video.readyState !== 4) return;
setPointageStarted(true)
setStartingPointage(true)
  const imageSrc = webcamRef.current.getScreenshot(); // JPEG
  if (!imageSrc) return;

  const res = await fetch(imageSrc);
  const blob = await res.blob();

  const formData = new FormData();
  formData.append("image", blob, "frame.jpg");

  const response = await fetch("https://192.168.0.115:5000/api/pointage/liveness", {
    method: "POST",
    body: formData,
     credentials: "include" // <- envoie les cookies de session

  });

  const data = await response.json();
  return data; // { vivacite: true/false, message: "..." }
};


const handleStartPointage = async () => {
  if (!active) {
    setSnackbarMessage("Veuillez choisir Entrée ou Sortie avant de démarrer le pointage !");
    setSnackbarSeverity("warning");
    setSnackbarOpen(true);
    return;
  }

  if (!webcamRef.current) return;
  const video = webcamRef.current.video;
  if (video.readyState !== 4) return;

  // 👁️ Détection du visage (client-side)
  const detections = await faceapi.detectAllFaces(
    video,
    new faceapi.TinyFaceDetectorOptions()
  );

  if (detections.length === 0) {
    setSnackbarMessage("Aucun visage détecté. Veuillez vous placer devant la caméra.");
    setSnackbarSeverity("warning");
    setSnackbarOpen(true);
    return;
  }

  if (detections.length > 1) {
    setSnackbarMessage("Plusieurs visages détectés. Veuillez être seul devant la caméra.");
    setSnackbarSeverity("warning");
    setSnackbarOpen(true);
    return;
  }

  // ✅ Capture si un seul visage
    setScanning(true);
  setPointageStarted(true);
  setStartingPointage(true);

  try {
    const imageSrc = webcamRef.current.getScreenshot();
    const res = await fetch(imageSrc);
    const blob = await res.blob();

    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");

    // 🔥 Choix dynamique de l'URL selon active
    const url =
      active === "logout"
        ? "https://192.168.0.115:5000/api/pointage/facial_client_sortie"
        : "https://192.168.0.115:5000/api/pointage/facial_client";

    const resp = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await resp.json();
    console.log("Résultat API:", data);

    // --- Gestion du message retourné ---
    if (!resp.ok) {
      setModalType("error");
  setModalMessage(data.error || "Erreur lors du pointage");
 } else {
      setModalType("success");
  setModalMessage(data.message || "Pointage effectué avec succès !");
    }

    setModalOpen(true); 

  } catch (err) {
    console.error("Erreur réseau :", err);
    setSnackbarMessage("Erreur de connexion avec le serveur.");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  } finally {
    setStartingPointage(false);
    setPointageStarted(false);
        setScanning(false);
  }
};






  const handleClick = (type) => {
  if (type === active) {
    setActive(""); // désactive si déjà actif
  } else {
    setActive(type); // active sinon
  }
  console.log(type === active ? "désactivé" : type);
};


const openDialog=()=>{
  setConfirmOpen(true) 
}

const closeDialog=()=>{
setConfirmOpen(false)

}
const [loading ,setLoading] =useState(false)
  const handleClickShowPassword = () => setShowPassword((show) => !show);

    
  useEffect(() => {
    document.body.style.background = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${bgImage}) no-repeat center center fixed `;
    document.body.style.backgroundSize = 'cover';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.userSelect = 'none';
  
    // Nettoyage quand on quitte la page
    return () => {
      document.body.style.background = '';
      document.body.style.backgroundSize = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.userSelect = '';
    };
  }, []);
  
  const handleMouseDownPassword = (event) => {
  event.preventDefault();
};

const handleMouseUpPassword = (event) => {
  event.preventDefault();
};

const goPointage = async () => {
    if (!nom.trim() && !mdp.trim()) {
    setLoginError("Veuillez entrer le matricule et le mot de passe !");
    return;
  }
  if (!nom.trim()) {
    setLoginError("Veuillez entrer votre matricule !");
    return;
  }
  if (!mdp.trim()) {
    setLoginError("Veuillez entrer votre mot de passe !");
    return;
  }
  setLoading(true);
 try {
  const data = await login(nom, mdp); // ⚡ login pour responsable
  const userRole = data.role
   // rôle renvoyé par le backend
console.log("Role : " ,data.role)

  if (userRole === "admin") {
    navigate("/global/service"); // redirection si rôle admin
  } 

} catch (err) {
  console.error("Erreur réseau :", err);
  setLoginError(err.message);  
} finally {
  setLoading(false); 
}

};



  return (
    <div  className={styles.loginWrapper} style={{fontFamily: "'Poppins', sans-serif"}}>
    
    
  <div className={styles.leftPanel}
    style={{
       backgroundSize: 'cover',
    transition: "all 0.3s ease",
    position: "relative"
  }}
  >
 
    <div className={styles.loginH}>
    
   <div className={styles.login1}>
  <img src={Logo} alt="" />

   
      </div>
 
   
</div>

<div className={styles.container}>
 
 <div className={styles.card}>
         {loginError && (
  <Alert severity="error" fullWidth sx={{ fontSize: "0.9rem", padding: 1, display: "flex"  ,width :"100%" ,
      fontFamily:" 'Poppins', sans-serif" ,

  }}
   action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setLoginError(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }>
    {loginError}
  </Alert>
)}
     <div className={styles.cards}>
   <div className={styles.gauche}>
 <div className={styles.left}>
   <h2>Ha , te revoilà !</h2>
   <span>Heureux de te revoir</span>
  </div>
   
    <div className={styles.form}>
     <div className={styles.input1}>

<Box sx={{ p: 2 /* padding 16px */ }}>
        <TextField id="standard-basic" 
          fullWidth label="Matricule"
           value={nom}
   onChange={(e) => {
    setNom(e.target.value);
    if (loginError) setLoginError(""); // 🔥 efface l’erreur dès qu’on tape
  }}
          variant="standard"
           InputLabelProps={{
    style: {
      
      fontSize: '1.1rem',
          letterSpacing: '1px', // ← ici pour espacement des lettres
 fontFamily:" 'Poppins', sans-serif" ,

    
      
    },
  }}
 
            InputProps={{
    endAdornment: (
      <InputAdornment position="end">
       <i class="fa-solid fa-user-check" style={{
        fontSize : "1.2rem"  ,color :"gray"
       }}></i>
      </InputAdornment>
    ),
  }}   inputProps={{
    style: {
      padding: '6px', 
      fontSize : 20 // padding intérieur autour du texte
    },
  }}
  error={submitted && nom.trim() === ""}
  helperText={submitted && nom.trim() === "" ? "Nom est vide" : ""}
/>
 </Box>
   <Box sx={{ p: 2}}>
                <TextField
                
                  id="standard-password"
                  fullWidth
                  label="Mot de passe"
                  variant="standard"
                        value={mdp}
   onChange={(e) => {
    setMdp(e.target.value);
    if (loginError) setLoginError(""); // 🔥 efface l’erreur dès qu’on tape
  }}
                  type={showPassword ? 'text' : 'password'}
                  InputLabelProps={{
                    style: { fontSize: '1.1rem' ,
                          letterSpacing: '1px', // ← ici pour espacement des lettres
                           fontFamily:" 'Poppins', sans-serif" ,


                     },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                        >
                          {showPassword ? <i class="fa-solid fa-eye"
                          style={{
        fontSize : "1.2rem"  ,color :"gray"
       }}></i> : 
                          <i class="fa-solid fa-eye-slash"
                          style={{
        fontSize : "1.2rem"  ,color :"gray"
       }}></i>}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: { padding: '6px', fontSize: 20 },
                  }}
            error={submittedMdp && mdp.trim() === ""}
  helperText={submittedMdp && mdp.trim() === "" ? "Mot de passe est vide" : ""}
     />
              </Box>

       <div className={styles.oublie} onClick={()=> navigation("/oublie")}>
   <p>Mot de passe oubié ?
   </p>
    </div>
    <div className={styles.btn}>
   <Button variant="outlined" 

   disabled={loading}

   
    sx={{
   fontFamily:" 'Poppins', sans-serif" ,
        width: "100%",
        backgroundColor: "rgb(51, 94, 143)",
        color: "white",
        fontWeight: "bold",
        fontSize: "1.0rem",
        mb:1,
        paddingY: 1.1,
        borderRadius: "4px",
        border: "none",
        textTransform: "none",
        boxShadow: hovered
          ? "0 4px 20px rgba(51, 94, 143, 0.6)" // shadow quand survol
          : "0 2px 5px rgba(0,0,0,0.2)", // shadow normal
        transform: hovered ? "scale(1.05)" : "scale(1)", // léger zoom au hover
        transition: "all 0.3s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
  
              onClick={goPointage} >
                  {loading ? <Spin size="large" /> : "Se connecter"}

              </Button>

    </div>
 

      </div>  
    
    
    </div>
  
    </div>

<div className={styles.droite}>
    <div className={styles.lotties}>
    <div className={currentLottie === 1 ? styles.jsonLott : styles.jsonLotts}>
      {currentLottie === 1 ? (
        <Lottie animationData={Hello} loop={true} />
      ) : (
        <Lottie animationData={Face} loop={true} />
      )}
    </div>
     <div className={styles.merci} style={{width:"85%"}}>
   <h2>Espace Administrateur</h2>
<label>
  Entrez vos identifiants pour accéder à votre compte 

</label>
     </div>
 
    </div>
  
</div>

     </div>

 
 
 </div>


</div>
  </div>


    </div>
  )
}

export default Admin