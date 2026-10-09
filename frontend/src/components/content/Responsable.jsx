import React, { useState ,useEffect} from 'react';
import {  Table } from 'antd';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import styles from './responsables.module.css';
import { EditOutlined } from '@ant-design/icons';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Avatar from '@mui/material/Avatar';
import { useLocation, useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';
import SnackbarContent from '@mui/material/SnackbarContent';
 import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { styled } from "@mui/material/styles";
import { Spin } from "antd";
import { Tooltip } from 'antd';
import Link from '@mui/material/Link';
import { ThreeDot } from "react-loading-indicators";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { CiSearch } from "react-icons/ci";

const ITEM_HEIGHT = 48;
const API_URL = import.meta.env.VITE_API_URL;


const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: theme.spacing(1.5),
    width: "100%",
    maxWidth: "400px",
  },
}));

const Responsable = () => {
  const navigate=useNavigate()
   const navigate2=useNavigate()
   const [divisions, setDivisions] = useState([]);
 const [personnels, setPersonnels] = useState([]);
  const [loading, setLoading] = useState(false);
   const [loadingSupp, setLoadingSupp] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
const location = useLocation();
const [snackMessage, setSnackMessage] = useState('');
const [snackError, setSnackError] = useState(false);
const [openSnack, setOpenSnack] = useState(false);
const [confirmOpen, setConfirmOpen] = useState(false);
const [recordToDelete, setRecordToDelete] = useState(null);
// Dernier responsable d'un service : suppression des personnels à confirmer explicitement
const [dernierRh, setDernierRh] = useState(null); // { record, message, nb }

  const [selectionType] = useState('checkbox');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRecord, setMenuRecord] = useState(null);
  const [searchText, setSearchText] = useState('');
const [selectedDivision, setSelectedDivision] = useState(null);
  const open = Boolean(menuAnchor);

const [loadingPage, setLoadingPage] = useState(true);

  const [selectedRecord, setSelectedRecord] = useState(null);


  
  const voirFicheAssiduite = (record) => {
    console.log("Matricule :", record.matricule);
    handleMenuClose()
     navigate('/global/assiduite', { state: { matricule: record.matricule } });
    // Navigate ou autre logique ici
  }
function formatPhoneNumber(num) {
  if (!num) return '-';
  // Supposons que num est une chaîne de chiffres, exemple: "0385416529"
  // On peut insérer les espaces comme ça : "038 54 165 29"
  return num.replace(/(\d{3})(\d{2})(\d{3})(\d{2})/, '$1 $2 $3 $4');
}
const filteredPersonnels = personnels.filter(p => {
  const lower = searchText.toLowerCase();

  // Vérifie correspondance texte
  const matchesSearch =
    p.matricule.toLowerCase().includes(lower) ||
    p.nom.toLowerCase().includes(lower) ||
    p.prenom.toLowerCase().includes(lower) ||
    p.email.includes(searchText);

  // Si aucune division sélectionnée, on affiche tout
  if (!selectedDivision) return matchesSearch;

  // Sinon, on filtre aussi par division
  return matchesSearch && p.iddiv === selectedDivision;
});

  const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
    });

    if (response.status === 401) {
      navigate('/login');  // Redirige ici
      throw new Error('Session expirée, veuillez vous reconnecter.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erreur inconnue');
    }

    return response.json();
  };

useEffect(() => {
  const snackMsg = sessionStorage.getItem('snackMessage');
  const snackErr = sessionStorage.getItem('snackError') === 'true';

  if (snackMsg) {
    setSnackMessage(snackMsg);
    setSnackError(snackErr);
    setOpenSnack(true);

    // Nettoyage après affichage
    sessionStorage.removeItem('snackMessage');
    sessionStorage.removeItem('snackError');
  }
}, []);


  const goAjout=()=>{
    navigate("/global/ajout_respo")
  }


useEffect(() => {
    setLoading(true);
    setLoadingPage(true)
    fetchWithAuth(`${API_URL}/api/responsables/`)
      .then((data) => {
        if (Array.isArray(data)) {
          setPersonnels(data);
          console.log(data)
          setErrorMsg(null);
        } else if (data.error) {
          setErrorMsg(data.error);
          setPersonnels([]);
        } else {
          setErrorMsg('Format de données inattendu');
          setPersonnels([]);
        }
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setPersonnels([]);
      })
      .finally(() => {setLoading(false);
        setLoadingPage(false)
      });
  }, []);

const handleDeleteClick = (record) => {
  setRecordToDelete(record);
  setConfirmOpen(true);
};

const supprimerResponsable = async (record, confirmerPersonnels = false) => {
    setLoadingSupp(true);
    try {
      const response = await fetch(`${API_URL}/api/responsables/${record.idrh}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmer_suppression_personnels: confirmerPersonnels }),
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      const data = await response.json().catch(() => ({}));

      // Dernier responsable du service : on demande confirmation avant de supprimer ses personnels
      if (response.status === 409 && data.code === 'dernier_rh') {
        setConfirmOpen(false);
        setDernierRh({ record, message: data.error, nb: data.nb_personnels });
        return;
      }

      if (!response.ok) throw new Error(data.error || 'Erreur inconnue');

      setSnackMessage(data.message || 'Responsable supprimé avec succès');
      setSnackError(false);
      setOpenSnack(true);
      setPersonnels((prev) => prev.filter((p) => p.idrh !== record.idrh));
      setConfirmOpen(false);
      setDernierRh(null);
      setRecordToDelete(null);
    } catch (err) {
      console.error('Erreur suppression :', err);
      setSnackMessage(err.message || 'Erreur inconnue');
      setSnackError(true);
      setOpenSnack(true);
      setConfirmOpen(false);
      setDernierRh(null);
      setRecordToDelete(null);
    } finally {
      setLoadingSupp(false);
    }
  };

const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    supprimerResponsable(recordToDelete, false);
  };

  const handleMenuClick = (event, record) => {
    setMenuAnchor(event.currentTarget);
    setSelectedRecord(record)
    setMenuRecord(record);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuRecord(null);
  };
const columns = [
 
  {
    title: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        
      </div>
    ),
    dataIndex: 'image',
    key: 'image',
    render: (text, record) => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Avatar
          alt={`${record.prenom} ${record.nom}`}
          src={`${API_URL}/uploads/${record.image}`}
          sx={{ width: 50, height: 50 }}
        />
      </div>
    ),
  },
   {
    title: 'Matricule',
    dataIndex: 'matricule',
    key: 'matricule',
   textAlign:"center"
  },
  {
    title: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        Nom & prénom
      </div>
    ),
    key: 'nomprenomdivision',
   
    render: (_, record) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {record.nom}
        <label htmlFor=""> {record.prenom}</label>
         </div>
    ),
  },
 {
  title: (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      Email
    </div>
  ),
  dataIndex: 'email',
  key: 'email',
  render: (text) => (
    <div style={{ textAlign: 'center' }}>
   {text}
    </div>
  ),
}
,
  {
   title: (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      Service
    </div>
  ),
    dataIndex: 'nomservice',
    key: 'nomservice',
     render: (_, record) => (
     <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
 
        <strong style={{textAlign:"center"}}>{record.nomservice}</strong>
           </div>
    ),
  },

  {
    title: '',
    key: 'actions',
    render: (_, record) => (
      <div style={{ display: 'flex', width: "70%", alignItems: "center", justifyContent: "space-between" }}>
       
        <Tooltip title='Modifier'  >
      
        <div className={styles.iconCircle}      onClick={() => navigate('/global/modifier_respo', { state: { record } })}    
          >
                    
                
                          
              <IconButton
                                aria-label="more"
                                id="long-button"
                                     aria-haspopup="true"
                                size="small"
                              >

          <EditOutlined
            style={{ color: '#1B6979', fontSize: "1.0rem" }}
    />
    </IconButton>
         
        </div>
        </Tooltip>
          <Tooltip title='Supprimer'  >
        
    
        <div className={styles.iconCircle}    onClick={() => handleDeleteClick(record)}>
          
            <IconButton
                                aria-label="more"
                                id="long-button"
                                     aria-haspopup="true"
                                size="small"
                              >
                              
                              <i
            className="fa-regular fa-trash-can"
            style={{ color: '#ff4d4f', fontSize: "1.0rem", cursor: 'pointer' }}
                ></i>
                </IconButton>
            
        </div>
            </Tooltip>
         </div>
    ),
  },
];

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    },
    getCheckboxProps: record => ({
      disabled: false,
      name: record.nom,
    }),
  };

  if (loadingPage) {
    return (
      <div
        style={{
          height: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Modal
          open={loadingPage}
          aria-labelledby="loading-modal"
          aria-describedby="loading-data"
          disableEscapeKeyDown
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
                           borderRadius: 2,
              px: 4,
              py: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              minWidth: 260,
            }}
          >
       <ThreeDot
        color="#ffffffff"
        size="medium"
            textColor="#555"
      />
          </Box>
        </Modal>
      </div>
    );
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
            Responsable
          </Link>

          <Typography sx={{ color: "text.primary", fontSize: "0.9rem" }}>
            Liste
          </Typography>
        </Breadcrumbs>
      </div>
      ·
      <div className={styles.cardTab}>
        <div className={styles.searchBar}>
          <button onClick={goAjout}>
            <div
              className={styles.jk}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "white",
                fontSize: "0.9rem",
              }}
            >
              <i
                className="fa-solid fa-plus"
                style={{ fontSize: "0.9rem" }}
              ></i>
              <span>Ajouter</span>
            </div>
          </button>
          <div className={styles.searchB}>
            <input
              type="text"
              placeholder="Rechercher ..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <CiSearch  size={22}/>
          </div>
        </div>

        <div className={`${styles.tableau} ${styles.shadowedTable}`}>
          <Table
            pagination={{ position: ["bottomCenter"], pageSize: 10 }} // 🔥 pagination par 10
            scroll={{ y: 540 }}
            loading={loading}
            rowSelection={{ type: selectionType, ...rowSelection }}
            columns={columns}
            dataSource={filteredPersonnels.map((p) => ({
              ...p,
              key: p.idpers,
            }))}
            rowClassName={() => styles.largeRow}
            onHeaderRow={() => ({ className: styles.largeHeader })}
          />
        </div>
      </div>
      <Menu
        id="long-menu"
        anchorEl={menuAnchor}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: "30ch",
          },
        }}
        MenuListProps={{
          "aria-labelledby": "long-button",
        }}
      >
        <MenuItem
          onClick={() => {
            voirFicheAssiduite(selectedRecord); // 👈 utilisez selectedRecord
            handleMenuClose();
          }}
        >
          <i
            class="fa-solid fa-eye"
            style={{ marginRight: 12, color: "#1890ff" }}
          ></i>
          <span style={{ fontSize: 18 }}>Voir fiche d’assiduité</span>
        </MenuItem>
      </Menu>
      <Snackbar
        open={openSnack}
        autoHideDuration={4000}
        onClose={() => setOpenSnack(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <SnackbarContent
          sx={{
            p: 1,
            px: 3,
            fontSize: "0.8rem",
            color: "white",
          }}
          message={<span>{snackMessage}</span>}
        />
      </Snackbar>
      <BootstrapDialog
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="customized-dialog-title"
        open={confirmOpen}
      >
        <div
          style={{
            margin: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <h3 style={{ fontSize: "0.9rem" }}>Suppression...</h3>
          <label
            htmlFor="id
     "
            style={{ fontSize: "0.8rem", color: "#676767" }}
          >
            Voulez-vous vraiment supprimer ce responsable ?
          </label>
          <div className={styles.supp}>
            <div className={styles.supp1}>
              <button onClick={() => setConfirmOpen(false)}>Non</button>
            </div>
            <div className={styles.supp2}>
              <button onClick={handleConfirmDelete}>
                {" "}
                {loadingSupp ? <Spin size="small" /> : "Oui"}
              </button>
            </div>
          </div>
        </div>
      </BootstrapDialog>

      {/* ---------- Dernier responsable du service : confirmation renforcée ---------- */}
      <Dialog
        open={Boolean(dernierRh)}
        onClose={loadingSupp ? undefined : () => setDernierRh(null)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="dernier-rh-titre"
        slotProps={{ paper: { sx: { borderRadius: '28px', p: 1 } } }}
      >
        <DialogTitle id="dernier-rh-titre" sx={{ fontSize: '1rem', fontWeight: 700, color: '#9e192b' }}>
          Dernier responsable du service
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#44545a', lineHeight: 1.7 }}>
            {dernierRh?.message}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#9e192b', fontWeight: 600, mt: 2 }}>
            Cette action supprime définitivement ces personnels, leurs photos et leurs pointages.
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#676767', mt: 2 }}>
            Pour les conserver, ajoutez d'abord un autre responsable à ce service.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDernierRh(null)} disabled={loadingSupp} sx={{ textTransform: 'none' }}>
            Annuler
          </Button>
          <Button
            variant="contained"
            color="error"
            disableElevation
            disabled={loadingSupp}
            onClick={() => supprimerResponsable(dernierRh.record, true)}
            sx={{ textTransform: 'none' }}
          >
            {loadingSupp ? <Spin size="small" /> : `Supprimer le responsable et ${dernierRh?.nb ?? ''} personnel(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Responsable;
