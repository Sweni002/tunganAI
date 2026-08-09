import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export const useServiceList = () => {
  const navigate = useNavigate();

  const [divisions, setDivisions] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSupp, setLoadingSupp] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [snackMessage, setSnackMessage] = useState('');
  const [snackError, setSnackError] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRecord, setMenuRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [selectedDivision, setSelectedDivision] = useState(null);

  const [horaireModalOpen, setHoraireModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);

  const menuOpen = Boolean(menuAnchor);

  const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
    });

    if (response.status === 401) {
      navigate('/login');
      throw new Error('Session expirée, veuillez vous reconnecter.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erreur inconnue');
    }

    return response.json();
  };

  // Snackbar potentiellement déposé par une autre page (ex: après une action
  // qui redirige ici) via sessionStorage.
  useEffect(() => {
    const snackMsg = sessionStorage.getItem('snackMessage');
    const snackErr = sessionStorage.getItem('snackError') === 'true';

    if (snackMsg) {
      setSnackMessage(snackMsg);
      setSnackError(snackErr);
      setOpenSnack(true);

      sessionStorage.removeItem('snackMessage');
      sessionStorage.removeItem('snackError');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setLoadingPage(true);
    fetchWithAuth(`${API_URL}/api/services/`)
      .then((data) => {
        if (Array.isArray(data)) {
          setServices(data);
          setErrorMsg(null);
        } else if (data.error) {
          setErrorMsg(data.error);
          setServices([]);
        } else {
          setErrorMsg('Format de données inattendu');
          setServices([]);
        }
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setServices([]);
      })
      .finally(() => {
        setLoading(false);
        setLoadingPage(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredservices = services.filter((p) => {
    const lower = searchText.toLowerCase();

    const matchesSearch =
      p.nom.toLowerCase().includes(lower) ||
      p.code_service.toLowerCase().includes(lower) ||
      p.sigle.toLowerCase().includes(lower) ||
      p.addresse.toLowerCase().includes(lower);

    if (!selectedDivision) return matchesSearch;

    return matchesSearch && p.iddiv === selectedDivision;
  });

  const formatPhoneNumber = (num) => {
    if (!num) return '-';
    return num.replace(/(\d{3})(\d{2})(\d{3})(\d{2})/, '$1 $2 $3 $4');
  };

  const goAjout = () => {
    navigate("/global/ajout_service");
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuRecord(null);
  };

  const voirFicheAssiduite = (record) => {
    handleMenuClose();
    navigate('/global/assiduite', { state: { matricule: record.matricule } });
  };

  const handleMenuClick = (event, record) => {
    setMenuAnchor(event.currentTarget);
    setSelectedRecord(record);
    setMenuRecord(record);
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setLoadingSupp(true);

    if (!recordToDelete) {
      setLoadingSupp(false);
      return;
    }

    fetchWithAuth(`${API_URL}/api/services/${recordToDelete.idserv}`, {
      method: 'DELETE',
    })
      .then(() => {
        setSnackMessage("Service supprimé avec succès");
        setSnackError(false);
        setOpenSnack(true);
        setServices((prev) => prev.filter((p) => p.idserv !== recordToDelete.idserv));
      })
      .catch((err) => {
        console.error("Erreur suppression :", err);
        setSnackMessage(err.message || "Erreur inconnue");
        setSnackError(true);
        setOpenSnack(true);
      })
      .finally(() => {
        setConfirmOpen(false);
        setRecordToDelete(null);
        setLoadingSupp(false);
      });
  };

  const showSnackbar = (msg, isError) => {
    setSnackMessage(msg);
    setSnackError(isError);
    setOpenSnack(true);
  };

  const applyHorairesUpdate = (idserv, horaires) => {
    setServices((prev) =>
      prev.map((s) => (s.idserv === idserv ? { ...s, horaires } : s))
    );
  };

  return {
    divisions,
    setDivisions,
    services,
    filteredservices,
    loading,
    loadingSupp,
    loadingPage,
    errorMsg,

    snackMessage,
    snackError,
    openSnack,
    setOpenSnack,
    showSnackbar,

    confirmOpen,
    setConfirmOpen,
    recordToDelete,
    handleDeleteClick,
    handleConfirmDelete,

    menuAnchor,
    menuOpen,
    menuRecord,
    selectedRecord,
    handleMenuClick,
    handleMenuClose,
    voirFicheAssiduite,

    searchText,
    setSearchText,
    selectedDivision,
    setSelectedDivision,

    horaireModalOpen,
    setHoraireModalOpen,
    serviceToEdit,
    setServiceToEdit,
    applyHorairesUpdate,

    formatPhoneNumber,
    goAjout,
    navigate,
  };
};