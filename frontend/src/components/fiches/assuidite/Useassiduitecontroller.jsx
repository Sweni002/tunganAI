import { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { socket } from "../../../socket"; // ⚠️ adapte le chemin selon l'emplacement réel du dossier Assiduites
import { AuthContext } from "../../../AuthContext"; // ⚠️ adapte le chemin selon l'emplacement réel du dossier Assiduites
import { createFetchWithAuth } from "./useFetchWithAuth";

dayjs.locale("fr");

const API_URL = import.meta.env.VITE_API_URL;

/**
 * useAssiduiteController
 * Reproduit EXACTEMENT la logique de l'ancien composant monolithique Assiduites,
 * y compris :
 * - le code mort conservé à l'identique (ex: matricules, loadingSupp, dateDebutFiltre,
 *   dateFinFiltre, anchorEl1/anchorEl2, handleOpenDebut/handleOpenFin, popperRef...)
 *   qui existait déjà dans l'original sans être branché à l'UI
 * - les deux effets de fetch des personnels qui se chevauchent (l'un piloté par
 *   selectedDivision/moisAll/anneeAll, l'autre par la présence de `anchorEl`)
 * - le fait que `isMobile` n'a PAS de listener resize dans l'original (valeur figée
 *   au montage)
 * - le fait que le menu d'actions de ligne ("long-menu") ne s'ouvre jamais car rien
 *   n'appelle setMenuAnchor dans l'original
 */
export function useAssiduiteController() {
  const navigate = useNavigate();
  const navigate2 = useNavigate(); // conservé (non utilisé ailleurs, comme dans l'original)
  const location = useLocation();
  const { fetchMe } = useContext(AuthContext);

  const fetchWithAuth = createFetchWithAuth(navigate);

  // ---- États ----
  const [assiduiteAll, setAssiduiteAll] = useState(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [moisAll, setMoisAll] = useState(new Date().getMonth() + 1);
  const [anneeAll, setAnneeAll] = useState(2026);
  const [openMatriculeDialog, setOpenMatriculeDialog] = useState(false);
  const [selectedMatricule, setSelectedMatricule] = useState(null);
  const [matricules, setMatricules] = useState([]);
  const [searchPers, setSearchPers] = useState("");
  const [divisions, setDivisions] = useState([]);
  const [personnels, setPersonnels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSupp, setLoadingSupp] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [errorMsg, setErrorMsg] = useState(null);
  const isFetching = useRef(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackError, setSnackError] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [assiduiteByDivision, setAssiduiteByDivision] = useState(null);
  const [loadingByDivision, setLoadingByDivision] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);

  const [selectionType] = useState("checkbox");
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRecord, setMenuRecord] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(null);
  const open = Boolean(menuAnchor); // menu d'actions de ligne ("long-menu")

  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const dateInputRef = useRef(null);
  const [dateDebutFiltre, setDateDebutFiltre] = useState("");
  const [dateFinFiltre, setDateFinFiltre] = useState("");
  const [filteredByDatePersonnels, setFilteredByDatePersonnels] = useState([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingMatricule, setLoadingMatricule] = useState(false);
  const [loadingPdf1, setLoadingPdf1] = useState(false);
  const [open1, setOpen] = useState(false); // pilote le DatePicker du mois
  const anchorRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null); // popover matricule + déclencheur du 2e effet de fetch

  const matriculeTransmis = location.state?.matricule || null;
  const [anchorEl1, setAnchorEl1] = useState(null);
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [anchorEl3, setAnchorEl3] = useState(null);
  const open3 = Boolean(anchorEl3);
  const [ready, setReady] = useState(false);

  const handleClick3 = (event) => setAnchorEl3(event.currentTarget);
  const handleClose3 = () => setAnchorEl3(null);

  const popperRef = useRef(null);
  const popperRef2 = useRef(null);
  const [pickerType, setPickerType] = useState(null); // "debut" ou "fin"

  const openPopper = Boolean(anchorEl1);
  const [types, setTypes] = useState([]);
  const openPopper2 = Boolean(anchorEl2);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const scrollBtnsRef = useRef({});
  const [admin, setAdmin] = useState(null);
  const [idrh, setIdrh] = useState(null);
  const [idserv, setidserv] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // ---- Scroll horizontal des divisions ----
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

  // ---- Socket temps réel ----
  useEffect(() => {
    socket.on("pointage_update", (data) => {
      console.log("🔔 Pointage reçu :", data);
      setRefreshKey((prev) => prev + 1);
    });

    return () => {
      socket.off("pointage_update");
    };
  }, []);

  // ---- Utilisateur connecté + idrh/idserv ----
  useEffect(() => {
    const fetchAdmin = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        const data = await fetchMe();
        setAdmin(data);

        if (location.state?.idrh || location.state?.idserv) {
          setIdrh(location.state.idrh);
          setidserv(location.state.idserv);
        } else if (data?.responsable?.idrh || data?.responsable?.idserv) {
          setIdrh(data.responsable.idrh);
          setidserv(data.responsable.idserv);
        }

        console.log(
          "idrh utilisé :",
          location.state?.idrh || data?.responsable?.idrh,
        );
      } catch (err) {
        console.error("Erreur fetchMe:", err);
        navigate("/login");
        setAdmin(null);
        setIdrh(null);
        setidserv(null);
      } finally {
        isFetching.current = false;
      }
    };

    fetchAdmin();
  }, [fetchMe, location.state]);

  // ---- Boutons de scroll (montage) ----
  useEffect(() => {
    updateScrollButtons();
    const refCurrent = scrollRef.current;
    if (refCurrent) {
      refCurrent.addEventListener("scroll", updateScrollButtons);
    }
    return () => {
      if (refCurrent) {
        refCurrent.removeEventListener("scroll", updateScrollButtons);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Types d'absence (colonnes dynamiques du tableau) ----
  useEffect(() => {
    setLoadingPage(true);
    fetch(`${API_URL}/api/types/`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setTypes(data);
        setLoadingPage(false);
      })
      .catch((err) => console.error(err));
  }, []);

  // ---- Boutons de scroll (après chargement des divisions) ----
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisions]);

  // ---- Divisions ----
  useEffect(() => {
    if (!idrh) {
      console.log("Admin pas encore chargé, on attend...");
      return;
    }

    setLoading(true);

    const fetchDivisions = fetchWithAuth(
      `${API_URL}/api/divisions/with_count?idserv=${idserv}`,
    );

    Promise.all([fetchDivisions])
      .then(([divisionsData]) => {
        if (Array.isArray(divisionsData)) {
          console.log("divisions ! ", divisionsData);
          setDivisions(divisionsData);
        } else {
          console.error("Erreur divisions:", divisionsData);
          setDivisions([]);
        }
      })
      .catch((err) => {
        console.error("Erreur fetch divisions/personnels:", err);
        setDivisions([]);
        setPersonnels([]);
        setErrorMsg(err.message);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idserv]);

  // ---- Personnels (fiche assiduité) ----
  useEffect(() => {
    if (!idrh) {
      return;
    }
    console.log(
      "Fetch avec selectedDivision:",
      selectedDivision,
      moisAll,
      anneeAll,
    );
    console.log("Mois :", selectedDate);

    const fetchData = async () => {
      setLoading(true);

      try {
        const url = selectedDivision
          ? `${API_URL}/api/fiches_assiduite/by_division?iddiv=${selectedDivision}&mois=${moisAll}&annee=${anneeAll}&idserv=${idserv}`
          : `${API_URL}/api/fiches_assiduite/all?mois=${moisAll}&annee=${anneeAll}&idserv=${idserv}`;

        const data = await fetchWithAuth(url);
        console.log("Données reçues:", data.data);

        setPersonnels(Array.isArray(data.data) ? data.data : []);
        setReady(true);
      } catch (e) {
        console.error(e);
        setPersonnels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDivision, moisAll, anneeAll, refreshKey, idserv]);

  // ---- Personnels (rafraîchissement lié à l'ouverture du popover matricule) ----
  useEffect(() => {
    console.log("Mois", moisAll);
    if (!idrh) {
      return;
    }
    if (anchorEl) {
      setLoading(true);

      fetchWithAuth(
        `${API_URL}/api/fiches_assiduite/all?mois=${moisAll}&annee=${anneeAll}&idserv=${idserv}`,
      )
        .then((data) => {
          setPersonnels(Array.isArray(data.data) ? data.data : []);
          console.log("datae", data);
          setErrorMsg(null);
        })
        .catch((e) => setErrorMsg(e.message))
        .finally(() => {
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorEl, moisAll, anneeAll, refreshKey, idserv]);

  // ---- Filtrage local (division / matricule / recherche texte) ----
  const filteredPersonnels = personnels.filter((p) => {
    if (selectedDivision) {
      const divisionObj = divisions.find(
        (d) => String(d.iddiv) === String(selectedDivision),
      );
      if (!divisionObj || p.division !== divisionObj.nomdivision) return false;
    }

    if (selectedMatricule) {
      const selected =
        typeof selectedMatricule === "string"
          ? selectedMatricule
          : selectedMatricule.matricule;
      return p.matricule === selected;
    }

    const lower = searchText.toLowerCase();
    return (
      (p.matricule && p.matricule.toLowerCase().includes(lower)) ||
      (p.nom && p.nom.toLowerCase().includes(lower)) ||
      (p.prenom && p.prenom.toLowerCase().includes(lower))
    );
  });

  // ---- Sélection d'un matricule (filtre + détail) ----
  const handleSelectMatricule = async (p) => {
    setSelectedMatricule(p);
    setSearchPers("");
    setAnchorEl(null);
    setLoadingMatricule(true);

    try {
      const data = await fetchWithAuth(
        `${API_URL}/api/fiches_assiduite/all_by_matricule?matricule=${encodeURIComponent(p.matricule)}&mois=${moisAll}&annee=${anneeAll}&idserv=${idserv}`,
      );
      setAssiduiteAll(data.data[0] || null);
      setErrorMsg(null);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoadingMatricule(false);
    }
  };

  // ---- Snackbar restauré depuis sessionStorage (ex: après redirection) ----
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

  // ---- Export Excel ----
  const exportExcel = async (type) => {
    if (!selectedDate) {
      setSnackMessage("Sélectionner une date pour exporter le fichier Excel.");
      setSnackError(true);
      setOpenSnack(true);
      return;
    }

    setLoadingPdf1(true);

    const dateObj = new Date(selectedDate);
    const mois = dateObj.getMonth() + 1;
    const annee = dateObj.getFullYear();

    let url;

    if (selectedDivision) {
      url = `${API_URL}/api/fiches_assiduite/generer-excel-rh/division?iddiv=${selectedDivision}&mois=${mois}&annee=${annee}&idserv=${idserv}&type=${type}`;
    } else {
      url = `${API_URL}/api/fiches_assiduite/generer-excel-rh?mois=${mois}&annee=${annee}&idserv=${idserv}&type=${type}`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/login");
        throw new Error("Session expirée, veuillez vous reconnecter.");
      }

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;

      const suffixDivision = selectedDivision
        ? `_division_${selectedDivision}`
        : "";
      const suffixType =
        type === "bureau"
          ? "_agent_bureau"
          : type === "surface"
            ? "_agent_surface"
            : "_tout";

      link.download = `fiche_assiduite${suffixDivision}${suffixType}_${mois}_${annee}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);

      setSnackMessage("Exportation réussie");
      setSnackError(false);
      setOpenSnack(true);
    } catch (error) {
      console.error("Erreur export excel:", error);
      setSnackMessage(error.message || "Erreur lors de l'export");
      setSnackError(true);
      setOpenSnack(true);
    } finally {
      setLoadingPdf1(false);
    }
  };

  const handleExport = (type) => {
    handleClose3();
    exportExcel(type);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuRecord(null);
  };

  // ---- Popovers date début/fin : non câblés dans l'UI d'origine, conservés à l'identique ----
  const handleOpenFin = (event) => {
    setPickerType("fin");
    setAnchorEl2(event.currentTarget);
  };
  const handleOpenDebut = (event) => {
    setPickerType("debut");
    setAnchorEl(event.currentTarget);
  };

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, "selectedRows: ", selectedRows);
    },
    getCheckboxProps: (record) => ({
      disabled: false,
      name: record.nom,
    }),
  };

  return {
    API_URL,
    navigate,
    navigate2,
    location,

    assiduiteAll, setAssiduiteAll,
    loadingAll, setLoadingAll,
    moisAll, setMoisAll,
    anneeAll, setAnneeAll,
    openMatriculeDialog, setOpenMatriculeDialog,
    selectedMatricule, setSelectedMatricule,
    matricules, setMatricules,
    searchPers, setSearchPers,
    divisions, setDivisions,
    personnels, setPersonnels,
    loading, setLoading,
    loadingSupp, setLoadingSupp,
    isMobile,
    errorMsg, setErrorMsg,
    isFetching,
    snackMessage, setSnackMessage,
    snackError, setSnackError,
    openSnack, setOpenSnack,
    confirmOpen, setConfirmOpen,
    recordToDelete, setRecordToDelete,
    assiduiteByDivision, setAssiduiteByDivision,
    loadingByDivision, setLoadingByDivision,
    loadingPage,

    selectionType,
    menuAnchor, setMenuAnchor,
    menuRecord, setMenuRecord,
    searchText, setSearchText,
    selectedDivision, setSelectedDivision,
    open,

    selectedDate, setSelectedDate,
    dateInputRef,
    dateDebutFiltre, setDateDebutFiltre,
    dateFinFiltre, setDateFinFiltre,
    filteredByDatePersonnels, setFilteredByDatePersonnels,
    loadingPdf, setLoadingPdf,
    loadingMatricule,
    loadingPdf1,
    open1, setOpen,
    anchorRef,
    anchorEl, setAnchorEl,

    matriculeTransmis,
    anchorEl1, setAnchorEl1, openPopper,
    anchorEl2, setAnchorEl2, openPopper2,
    anchorEl3, open3, handleClick3, handleClose3,
    ready,

    popperRef, popperRef2,
    pickerType, setPickerType,

    types,

    selectedRecord, setSelectedRecord,
    scrollRef,
    showLeft, showRight,
    scrollBtnsRef,
    admin,
    idrh, idserv,
    refreshKey,

    scroll,

    fetchWithAuth,
    filteredPersonnels,
    handleSelectMatricule,
    exportExcel,
    handleExport,
    handleMenuClose,
    handleOpenFin, handleOpenDebut,
    rowSelection,
  };
}