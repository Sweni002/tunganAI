import Breadcrumbs from '@mui/material/Breadcrumbs';
import React, { useEffect, useRef, useState } from "react";
import styles from "./ajout_service.module.css";
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
import { useNavigate } from "react-router-dom";
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

const AjoutService = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageURL, setSelectedImageURL] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const fileInputRef = useRef(null);
   const [services, setServices] = useState([]);
 const [divisions, setDivisions] = useState([]);
  const [addresse, setAddresse] = useState([]);
  const [search, setSearch] = useState("");
const [selectedDivision, setSelectedDivision] = useState(null); // état sélection
 const [openSnack, setOpenSnack] = useState(false);
const [msg, setMsg] = useState("");
const [nom, setNom] = useState("");
const [code, setCode] = useState("");
const [sigle, setsigle] = useState("");

const [loading ,setLoading] =useState(false)
const [preview, setPreview] = useState(null);


const [errors, setErrors] = useState({
  nom: false,
  sigle: false,
addresse:false,
  logo: false ,
  code:false


});


useEffect(() => {
  setServices([
    "Alaotra-Mangoro",
    "Amoron’i Mania",
    "Analamanga",
    "Analanjirofo",
    "Androy",
    "Anosy",
    "Atsimo-Andrefana",
    "Atsimo-Atsinanana",
    "Atsinanana",
    "Betsiboka",
    "Boeny",
    "Bongolava",
    "Diana",
    "Fitovinany",
    "Haute Matsiatra",
    "Ihorombe",
    "Itasy",
    "Melaky",
    "Menabe",
    "Sava",
    "Sofia",
    "Vakinankaratra",
    "Vatovavy"
  ]);
}, []);



 const  chargerLoading= () => {
  setLoading(true);
};
const handleCreateService = async () => {
  if (!validateForm()) return;
  
  setLoading(true);
setMsg("")
  const formData = new FormData();
  formData.append("nom", nom);
  formData.append("code_service", code);
  formData.append("sigle", sigle);
  formData.append("addresse", addresse);
  if (fileInputRef.current.files[0]) {
    formData.append("logo", fileInputRef.current.files[0]);
  }

  try {
    const response = await fetch(`${API_URL}/api/services/`, {
      method: "POST",
      body: formData,   // ⚡ FormData pour fichier
      credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
      
        setMsg(data.error)
          setOpenSnack(true);

      setLoading(false);
      return;
    }

    setOpenSnack(true);
    setLoading(false);
setMsg(data.message)
    // Réinitialiser les champs
    setCode("")
    setNom("");
    setsigle("");
    setAddresse("");
    setSelectedImage(null);
    setPreview(null);

  } catch (error) {
     setMsg(error.message || "Erreur interne")
       setOpenSnack(true);

   console.error("Erreur d'ajout :", error);
    alert("Une erreur est survenue lors de l'ajout.");
    setLoading(false);
  }
};

 
const validateForm = () => {
  const newErrors = {
     nom: !nom.trim(),
     code:!code.trim(),
    sigle: !sigle.trim(),
      logo: !preview,
      addresse: !addresse
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
        navigate("/global/service"); // navigation seulement ici
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
          <Link
            underline="hover"
            color="inherit"
          
            sx={{ fontSize: "0.9rem" }}
          >
            Service
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
                Code service <span style={{ color: "red" }}>*</span>
              </label>
              <TextField
                placeholder="Entrez le code du service"
                variant="standard"
                fullWidth
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errors.code) {
                    setErrors((prev) => ({ ...prev, code: false }));
                  }
                }}
                error={!!errors.code}
                helperText={errors.code ? "Le code du service est requis." : ""}
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
                Nom du service <span style={{ color: "red" }}>*</span>
              </label>
              <TextField
                placeholder="Entrez le nom du service"
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
                helperText={errors.nom ? "Le nom du service est requis." : ""}
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
                Sigle <span style={{ color: "red" }}>*</span>
              </label>
              <TextField
                placeholder="ex: SRSP , BNI, ..."
                variant="standard"
                fullWidth
                value={sigle}
                onChange={(e) => {
                  setsigle(e.target.value);
                  if (errors.sigle) {
                    setErrors((prev) => ({ ...prev, sigle: false }));
                  }
                }}
                error={!!errors.sigle}
                helperText={errors.sigle ? "Le sigle est requis." : ""}
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
                Addresse <span style={{ color: "red" }}>*</span>
              </label>
              <FormControl variant="standard" fullWidth sx={{ mt: 1, mb: 2 }}>
                <Select
                  value={addresse}
                  onChange={(e) => {
                    setAddresse(e.target.value);
                    if (errors.addresse) {
                      setErrors((prev) => ({ ...prev, addresse: false }));
                    }
                  }}
                  error={!!errors.addresse}
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "0.85rem",
                  }}
                >
                  <MenuItem
                    value=""
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: "0.85rem",
                    }}
                  >
                    <em>-- Sélectionnez une adresse --</em>
                  </MenuItem>

                  {services.map((region, index) => (
                    <MenuItem
                      key={index}
                      value={region}
                      sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "0.85rem",
                      }}
                    >
                      {region}
                    </MenuItem>
                  ))}
                </Select>

                {errors.addresse && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{ color: "brown" }}
                  >
                    L'adresse est requise.
                  </Typography>
                )}
              </FormControl>
            </div>

            <div className={styles.inputM}>
              <label htmlFor="matricule">
                Logo <span style={{ color: "red" }}>*</span>
              </label>
              <span>Merci de selectionner un fichier JPEG , JPG ou PNG</span>

              <div className={styles.logos}>
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
                    transform: "scale(1)", // léger zoom au hover
                    transition: "all 0.3s ease",
                  }}
                >
                  <i class="fa-solid fa-upload"></i>
                  {preview ? "Modifier" : "Add files"}
                </Button>
                {errors.logo && (
                  <p
                    style={{
                      color: "brown",
                      fontSize: "0.8rem",
                      marginTop: "4px",
                    }}
                  >
                    La logo est requise.
                  </p>
                )}
              </div>
            </div>

            <div className={styles.btn}>
              <Button
                variant="contained"
                disabled={loading}
                fullWidth
                onClick={() => {
                  if (validateForm()) {
                    handleCreateService();
                  }
                }}
                sx={{
                  fontFamily: " 'Poppins', sans-serif",
                  backgroundColor: "#14535f",
                  fontSize: "0.9rem",
                  mb: 1,
                  display: "flex",
                  gap: 2,
                  py: 1.0,
                  borderRadius: "4px",
                  justifyContent: "center",
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
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>
        </div>

        <DialogContent
          style={{
            minHeight: 300, // hauteur minimale fixe
            maxHeight: 400, // hauteur max (scroll si plus)
            overflowY: "auto", // scroll vertical si besoin
          }}
        >
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
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <SnackbarContent
          sx={{
            p: 1,
            px: 3,
            fontSize: "17px",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            justifyContent: "space-between", // espace entre message et action
            alignItems: "center",
            gap: 3, // espace entre éléments flex (message/action)
          }}
          message={
            <span style={{ marginRight: 8, fontSize: "0.9rem" }}>{msg}.</span>
          }
          action={action}
        />
      </Snackbar>
    </div>
  );
};

export default AjoutService;
