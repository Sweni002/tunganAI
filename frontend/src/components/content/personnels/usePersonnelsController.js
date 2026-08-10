import { useState, useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../AuthContext";
import { socket } from "../../../socket";

const API_URL = import.meta.env.VITE_API_URL;

export function usePersonnelsController() {
  const navigate = useNavigate();
  const [divisions, setDivisions] = useState([]);
  const [personnels, setPersonnels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSupp, setLoadingSupp] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const location = useLocation();
  const [snackMessage, setSnackMessage] = useState("");
  const [snackError, setSnackError] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectionType] = useState("checkbox");
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRecord, setMenuRecord] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(null);
  const open = Boolean(menuAnchor);
  const { fetchMe } = useContext(AuthContext);
  const [admin, setAdmin] = useState(null);
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const scrollBtnsRef = useRef({});
  const [loadingPage, setLoadingPage] = useState(true);
  const isFetching = useRef(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = scrollRef.current;
      const atStart = scrollLeft <= 10;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 10;
      setShowLeft(!atStart);
      setShowRight(!atEnd);
    }
  };

  useEffect(() => {
    socket.on("personnel_update", (data) => {
      console.log("🔔 Personnel mis à jour :", data);
      setRefreshKey((prev) => prev + 1);
    });

    return () => {
      socket.off("personnel_update");
    };
  }, []);

  useEffect(() => {
    console.log("scrollRef.current", scrollRef.current);
    updateScrollButtons();
    const refCurrent = scrollRef.current;
    if (refCurrent) {
      refCurrent.addEventListener("scroll", updateScrollButtons);
    }
    return () => {
      if (refCurrent) {
        refCurrent.removeEventListener("scroll", updateScrollButtons);
        console.log("Listener scroll supprimé");
      }
    };
  }, []);

  useEffect(() => {
    const refCurrent = scrollRef.current;
    if (!refCurrent) return;

    updateScrollButtons();

    refCurrent.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      refCurrent.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [divisions]);

  useEffect(() => {
    const fetchAdmin = async () => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        const data = await fetchMe();
        setAdmin(data);
        console.log("me1 : ", data);
      } catch (err) {
        console.error("Erreur fetchMe:", err);
        setAdmin(null);
      } finally {
        isFetching.current = false;
      }
    };
    fetchAdmin();
  }, []);

  const voirFicheAssiduite = (record) => {
    console.log("Matricule :", record.matricule);
    handleMenuClose();
    navigate("/global/assiduite", { state: { matricule: record.matricule } });
  };

  const filteredPersonnels = personnels.filter((p) => {
    const lower = searchText.toLowerCase();

    const matchesSearch =
      p.matricule.toLowerCase().includes(lower) ||
      p.nom.toLowerCase().includes(lower) ||
      p.prenom.toLowerCase().includes(lower) ||
      p.email.includes(searchText);

    if (!selectedDivision) return matchesSearch;

    return matchesSearch && p.iddiv === selectedDivision;
  });

  const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });

    if (response.status === 401) {
      navigate("/login");
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Erreur inconnue");
    }

    return response.json();
  };

  useEffect(() => {
    const snackMsg = sessionStorage.getItem("snackMessage");
    const snackErr = sessionStorage.getItem("snackError") === "true";

    if (snackMsg) {
      setSnackMessage(snackMsg);
      setSnackError(snackErr);
      setOpenSnack(true);

      sessionStorage.removeItem("snackMessage");
      sessionStorage.removeItem("snackError");
    }
  }, []);

  const goAjout = () => {
    if (!admin || !admin.responsable || !admin.responsable.idrh) return;

    navigate("/global/ajout_perso", {
      state: { idrh: admin.responsable.idrh, idserv: admin.responsable.idserv },
    });
  };

  useEffect(() => {
    if (!admin || !admin.responsable || !admin.responsable.idrh) {
      console.log("Admin pas encore chargé, on attend...");
      return;
    }

    const idserv = admin.responsable.idserv;
    setLoading(true);
    setLoadingPage(true);

    const fetchDivisions = fetchWithAuth(
      `${API_URL}/api/divisions/with_count?idserv=${idserv}`
    );

    const fetchPersonnels = fetchWithAuth(
      `${API_URL}/api/personnels/service/${admin.responsable.idserv}`
    );

    Promise.all([fetchDivisions, fetchPersonnels])
      .then(([divisionsData, personnelsData]) => {
        if (Array.isArray(divisionsData)) {
          setDivisions(divisionsData);
        } else {
          console.error("Erreur divisions:", divisionsData);
          setDivisions([]);
        }

        if (Array.isArray(personnelsData)) {
          console.log("perso ! ", personnelsData);
          setPersonnels(personnelsData);
          setErrorMsg(null);
        } else if (personnelsData.error) {
          setErrorMsg(personnelsData.error);
          setPersonnels([]);
        } else {
          setErrorMsg("Format inattendu pour personnels");
          setPersonnels([]);
        }
      })
      .catch((err) => {
        console.error("Erreur fetch divisions/personnels:", err);
        setDivisions([]);
        setPersonnels([]);
        setErrorMsg(err.message);
      })
      .finally(() => {
        setLoading(false);
        setLoadingPage(false);
      });
  }, [admin, refreshKey]);

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
    console.log(recordToDelete.idserv);
    fetchWithAuth(`${API_URL}/api/personnels/${recordToDelete.idpers}`, {
      method: "DELETE",
    })
      .then(() => {
        setSnackMessage("Personnel supprimé avec succès");
        setSnackError(false);
        setOpenSnack(true);
        setPersonnels((prev) => prev.filter((p) => p.idpers !== recordToDelete.idpers));
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

  const handleMenuClick = (event, record) => {
    setMenuAnchor(event.currentTarget);
    setSelectedRecord(record);
    setMenuRecord(record);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuRecord(null);
  };

  return {
    navigate,
    divisions,
    personnels,
    loading,
    loadingSupp,
    errorMsg,
    snackMessage,
    snackError,
    openSnack,
    setOpenSnack,
    confirmOpen,
    setConfirmOpen,
    recordToDelete,
    refreshKey,
    selectionType,
    menuAnchor,
    menuRecord,
    searchText,
    setSearchText,
    selectedDivision,
    setSelectedDivision,
    open,
    admin,
    scrollRef,
    showLeft,
    showRight,
    scrollBtnsRef,
    loadingPage,
    selectedRecord,
    scroll,
    voirFicheAssiduite,
    filteredPersonnels,
    goAjout,
    handleDeleteClick,
    handleConfirmDelete,
    handleMenuClick,
    handleMenuClose,
    API_URL,
  };
}