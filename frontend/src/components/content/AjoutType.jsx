import Breadcrumbs from '@mui/material/Breadcrumbs';
import React, { useEffect, useRef, useState } from "react";
import styles from "./ajout_type.module.css";
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


const API_URL = import.meta.env.VITE_API_URL;

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "30px",
    padding: theme.spacing(4),
    width: "100%",
    maxWidth: "500px",
  },
}));

const AjoutType = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageURL, setSelectedImageURL] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const fileInputRef = useRef(null);
   const [services, setServices] = useState([]);   // liste des services
const [selectedService, setSelectedService] = useState(""); // service sélectionné

 const [divisions, setDivisions] = useState([]);
  const [addresse, setAddresse] = useState([]);
  const [search, setSearch] = useState("");
const [selectedDivision, setSelectedDivision] = useState(null); // état sélection
 const [openSnack, setOpenSnack] = useState(false);
const [msg, setMsg] = useState("");
const [nom, setNom] = useState("");
const [sigle, setsigle] = useState("");
const [abbreviation, setAbbreviation] = useState("");
const [loading ,setLoading] =useState(false)
const [preview, setPreview] = useState(null);


const [errors, setErrors] = useState({
  nom: false,
abbreviation:false



});




 const  chargerLoading= () => {
  setLoading(true);
};
const createTypes = async () => {
  if (!validateForm()) return;
  
  setLoading(true);
setMsg("")


  try {
    const response = await fetch(`${API_URL}/api/types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ nomtype: nom ,abbreviation:abbreviation}),
      credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
        setMsg(data.error)
          setOpenSnack(true);
      setLoading(false);
      return;
    }
setMsg(data.message)
    setOpenSnack(true);
    setLoading(false);
setMsg(data.message)
    // Réinitialiser les champs
    setNom("");
  setAbbreviation("")
  } catch (error) {

  setMsg(error.message || "Erreur interne")

    setOpenSnack(true)
    console.error("Erreur d'ajout :", error);
      setLoading(false);
  }
};

 
useEffect(() => {
  fetch(`${API_URL}/api/services/`, {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setServices(data);
      } else {
        console.error("Réponse API invalide :", data);
      }
    })
    .catch((err) => console.error("Erreur fetch services :", err));
}, []);


const validateForm = () => {
  const newErrors = {
     nom: !nom.trim(),
   abbreviation:!abbreviation.trim()
        };
  setErrors(newErrors);
  return !Object.values(newErrors).some(Boolean);
};
 const handleCloseSnack = (event, reason) => {
  if (reason === 'clickaway') {
    // Si on clique hors du snackbar, on ferme juste le snackbar, pas de navigation
    setOpenSnack(false);
    return;
  }
  // Si on ferme le snackbar avec le bouton "close" (croix), on ferme juste le snackbar
  setOpenSnack(false);
};
const action = (
  <>
    <Button color="primary" size="medium" onClick={() => {
        setOpenSnack(false);
        navigate("/global/type"); // navigation seulement ici
      }}

      sx={{p : 1 ,fontSize : 17}}>
       Voir
    </Button>
    <IconButton
  size="small"
  aria-label="close"
  color="inherit"
  onClick={handleCloseSnack}
  sx={{
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)', // couleur au survol (exemple gris clair)
      color: '#f44336', // changer la couleur de l'icône au hover (ex: rouge)
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

  const handlelogoClick = () => {
    fileInputRef.current.click();
  };

const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier le type
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      alert("Format non supporté. Utilisez JPEG, JPG ou PNG.");
      return;
    }
if (errors.logo) {
  setErrors(prev => ({ ...prev, logo: false }));
}

    // Générer l'aperçu
    setPreview(URL.createObjectURL(file));
  };

   function handleSelectDivision(div) {
    setSelectedDivision(div);
    setErrors(prev => ({ ...prev, division: false })); // ✅ enlève l'erreur

    handleClose(); // optionnel : fermer le dialog après sélection
  }


  return (
    <div className={styles.personnels}>
      <div className={styles.break}>
    <Breadcrumbs aria-label="breadcrumb">
        <Link underline="hover" color="inherit"  sx={{fontSize:"0.9rem"}}>
          Service
        </Link>
       
        <Typography sx={{ color: 'text.primary',fontSize:"0.9rem" }}>Ajout</Typography>
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
              <label htmlFor="matricule">Nom du type d'absence <span style={{color:"red"}} >*</span></label>
                <TextField
                placeholder="Entrez le nom du type d'absence"
                      variant="standard"
                      fullWidth
                      value={nom}
                      onChange={(e) => {
    setNom(e.target.value);
    if (errors.nom) {
      setErrors(prev => ({ ...prev, nom: false }));
    }
  }}   
    error={!!errors.nom}
        helperText={errors.nom ? "Le nom du type d'absence  est requis." : ""}
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
                   Abbréviation<span style={{ color: "red" }}>*</span>
                 </label>
                 <TextField
                   placeholder="ex: ABS,CNG"
                   variant="standard"
                   fullWidth
                   value={abbreviation}
                   onChange={(e) => {
                     setAbbreviation(e.target.value);
                     if (errors.abbreviation) {
                       setErrors((prev) => ({ ...prev, abbreviation: false }));
                     }
                   }}
                   error={!!errors.abbreviation}
                   helperText={
                     errors.abbreviation
                       ? "Le nom du type d'absence  est requis."
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
   

          

        
            <div className={styles.btn}>
           
               <Button variant='contained'
               disabled={loading}
               fullWidth
 onClick={() => {
  if (validateForm()) {
    createTypes();
  }
}}
  
  sx={{
   fontFamily:" 'Poppins', sans-serif" ,
    backgroundColor:"#14535f",
        fontSize: "0.9rem",
        mb:1,
        display:"flex",
        gap:2,
       py:1.0,
        borderRadius: "4px",
        justifyContent:"center",
            border: "none",
        textTransform: "none",
                transform: "scale(1)", // léger zoom au hover
        transition: "all 0.3s ease",
      }}
  >
         {loading ? (
      <Spin size="large" />
    ) : (
      <>
        <i className="fa-solid fa-plus" style={{fontSize:"1.1rem"}}></i>
        <span>Sauvegarder</span>
      </>
    )}
           </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog pour division */}
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
      >



        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            alignItems: "flex-start",
          }}
        >
          <div className={styles.dialog}>
            <input type="text" placeholder="Rechercher..."
               value={search}
            onChange={(e) => setSearch(e.target.value)}
         />
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>
        </div>

        <DialogContent
        style={{
    minHeight: 300,       // hauteur minimale fixe
    maxHeight: 400,       // hauteur max (scroll si plus)
    overflowY: "auto",    // scroll vertical si besoin
  }}>
          <div className={styles.liste}>
          {filteredDivisions.length > 0 ? (
              filteredDivisions.map((div, i) => (
                <div
                  className={styles.liste1}
                  key={div.iddiv || i}
                  onClick={() => handleSelectDivision(div)} // clic
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.liste2}>
                    <h3>{div.nomdivision}</h3>
                  </div>
                  <i className="fa-solid fa-bars-staggered"></i>
                </div>
              ))
            ) : (
              <p>Aucune division trouvée.</p>
            )}
          </div>
        </DialogContent>
      </BootstrapDialog>
  <Snackbar
  open={openSnack}
  autoHideDuration={5000}
  onClose={handleCloseSnack}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
>
  <SnackbarContent
    sx={{

      p: 1,
      px : 3,
      fontSize: '17px',
      boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      justifyContent: 'space-between',  // espace entre message et action
      alignItems: 'center',
      gap: 3, // espace entre éléments flex (message/action)
    }}
    message={<span style={{ marginRight: 8 ,fontSize:"0.9rem" }}>{msg}.</span>}
    action={action}
  />
</Snackbar>


    </div>
  );
};

export default AjoutType;
