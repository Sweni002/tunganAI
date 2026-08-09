import { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { socket } from "../../../socket"; // ⚠️ adapte le chemin selon l'emplacement réel du dossier AssuiditePerso
import { AuthContext } from "../../../AuthContext"; // ⚠️ adapte le chemin selon l'emplacement réel du dossier AssuiditePerso
import { createFetchWithAuth } from "./useFetchWithAuth";

dayjs.locale("fr");

const API_URL = import.meta.env.VITE_API_URL;

// Seuil "mobile" demandé : 700px (l'original utilisait 768px)
const MOBILE_BREAKPOINT = 700;

/**
 * useAssuiditePersoController
 * Reproduit EXACTEMENT la logique de l'ancien composant monolithique AssuiditePerso,
 * y compris le code mort conservé à l'identique (matricules, searchPers, divisions/
 * selectedDivision jamais alimentés, menuAnchor/menuRecord, scrollRef et ses handlers
 * sans UI de scroll associée, anchorEl1/anchorEl2, popperRef, dateDebutFiltre/dateFinFiltre...).
 *
 * Seul changement volontaire : le seuil isMobile passe de 768px à 700px, comme demandé.
 */
export function useAssuiditePersoController() {
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
  const [filtrages, setFiltrages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSupp, setLoadingSupp] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
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
  const open = Boolean(menuAnchor); // jamais utilisé par un Menu dans cette page (conservé)

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
  const [anchorEl, setAnchorEl] = useState(null); // jamais renseigné dans cette page (conservé)
  const isFetching = useRef(false);

  const matriculeTransmis = location.state?.matricule || null;
  const [anchorEl1, setAnchorEl1] = useState(null);
  const [anchorEl2, setAnchorEl2] = useState(null);
  const popperRef = useRef(null);
  const popperRef2 = useRef(null);
  const [pickerType, setPickerType] = useState(null); // "debut" ou "fin"

  const openPopper = Boolean(anchorEl1);
  const [types, setTypes] = useState([]);
  const openPopper2 = Boolean(anchorEl2);

  const [openRetardModal, setOpenRetardModal] = useState(false);
  const [selectedRetardDates, setSelectedRetardDates] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const scrollBtnsRef = useRef({});
  const [idpers, setidpers] = useState(null);
  const [ready, setReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---- Scroll horizontal (vestige : aucune UI de scroll dans cette page) ----
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

  // ---- Utilisateur connecté + idpers ----
  useEffect(() => {
    const fetchAdmin = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        const data = await fetchMe();
        setAdmin(data);

        if (location.state?.idpers) {
          setidpers(location.state.idpers);
        } else if (data?.personnel?.idpers) {
          setidpers(data.personnel.idpers);
        }

        console.log(
          "idpers utilisé :",
          location.state?.idpers || data?.personnel?.idpers,
        );
      } catch (err) {
        console.error("Erreur fetchMe:", err);
        navigate("/login");
        setAdmin(null);
        setidpers(null);
      } finally {
        isFetching.current = false;
      }
    };

    fetchAdmin();
  }, [fetchMe, location.state]);

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

  // ---- Export Excel (fiche mensuelle) ----
  const exportExcel = async () => {
    if (!selectedDate) {
      setSnackMessage("Sélectionner une date pour exporter le PDF.");
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
      url = `${API_URL}/api/fiches_assiduite/pdf/division?iddiv=${selectedDivision}&mois=${mois}&annee=${annee}&idpers=${idpers}`;
    } else {
      url = `${API_URL}/api/fiches_assiduite/generer-excel-rh_personnel?mois=${mois}&annee=${annee}&idpers=${idpers}`;
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

      const suffix = selectedDivision ? `_division_${selectedDivision}` : "";
      link.download = `fiche_assiduite${suffix}_${mois}_${annee}.xlsx`;

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

  // ---- Boutons de scroll (montage) — vestige sans UI associée ----
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

  // ---- Types d'absence (colonnes dynamiques) ----
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

  // ---- Boutons de scroll (après changement de "divisions") — vestige ----
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

  // ---- Filtrage local du tableau principal ----
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

  // ---- Filtrage local du tableau "détails de retard" (modal) ----
  const filteredFiltrage = filtrages.filter((p) => {
    if (selectedDivision && String(p.divisionId) !== String(selectedDivision)) {
      return false;
    }
    const lower = searchText.toLowerCase();
    return (
      (p.matricule && p.matricule.toLowerCase().includes(lower)) ||
      (p.nom && p.nom.toLowerCase().includes(lower)) ||
      (p.prenom && p.prenom.toLowerCase().includes(lower))
    );
  });

  // ---- Fiche d'assiduité personnelle (tableau principal) ----
  useEffect(() => {
    if (!idpers) {
      console.log("idpers pas encore chargé, on attend...");
      return;
    }

    console.log("Fetch avec selectedDivision:", selectedDivision, moisAll, anneeAll);
    console.log("Mois :", selectedDate);

    const fetchData = async () => {
      setLoading(true);

      try {
        const url = `${API_URL}/api/fiches_assiduite/all_personnel?mois=${moisAll}&annee=${anneeAll}&idpers=${idpers}`;

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
  }, [moisAll, anneeAll, refreshKey, idpers]);

  // ---- Rafraîchissement lié à `anchorEl` — jamais déclenché dans cette page (conservé) ----
  useEffect(() => {
    console.log("Mois", moisAll);
    if (!idpers) {
      return;
    }
    if (anchorEl) {
      setLoading(true);

      fetchWithAuth(
        `${API_URL}/api/fiches_assiduite/all_personnel?mois=${moisAll}&annee=${anneeAll}&idpers=${idpers}`,
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
  }, [anchorEl, moisAll, anneeAll, refreshKey, idpers]);

  // ---- Détails de retard (modal) ----
  const fetchRetardDetails = async (datesArray) => {
    if (!datesArray || datesArray.length === 0) return;
    setOpenRetardModal(true);

    const formattedDates = datesArray
      .map((dateStr) => {
        const cleanDate = dateStr.trim().split(" ")[0];
        const parts = cleanDate.split("/");
        if (parts.length !== 3) return null;
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
      })
      .filter(Boolean);

    setOpenRetardModal(true);
    const datesParam = formattedDates.join(",");

    // ✅ Note : l'API correcte côté backend est /par_dates_personnel (pas "personnelles")
    const url = `${API_URL}/api/pointage/facial/par_dates_personnelles?idpers=${idpers}&dates=${datesParam}`;

    try {
      setLoading(true);

      const response = await fetchWithAuth(url);
      const result = Array.isArray(response.data) ? response.data : response;

      console.log("resultat back :", result);

      const mapped = result.map((p) => ({
        key: p.id,
        idpointage: p.id,
        idpers: p.idpers,
        nom: p.nom || "Inconnu",
        prenom: p.prenom || "",
        matricule: p.matricule || "",
        division: p.division || "",
        divisionId: p.divisionId || null,
        date: p.date,
        nomabbr: p.nomabbr || null,

        matin: {
          entree: p.matin?.entree,
          sortie: p.matin?.sortie,
          retard: p.matin?.retard,
          absence: p.matin?.absence,
        },
        apresmidi: {
          entree: p.apresmidi?.entree,
          sortie: p.apresmidi?.sortie,
          retard: p.apresmidi?.retard,
          absence: p.apresmidi?.absence,
        },
        role: p.personnel?.role || "",
        heure_entree_unique: p.heure_entree_unique,
        heure_sortie_unique: p.heure_sortie_unique || null,
        absence_surface: p.absence_surface || null,
        absence_unique: p.absence_unique || null,

        retard_matin_minutes: p.retard_matin_minutes || 0,
        retard_soir_minutes: p.retard_soir_minutes || 0,

        statut: p.absence ? "Absent" : "Présent",
        heure_entree_soir: p.apresmidi?.entree,
        heure_sortie_soir: p.apresmidi?.sortie,
        absence_soir: p.apresmidi?.absence,
        absence_matin_abbr: p.absence_matin_abbr || null,
        absence_soir_abbr: p.absence_soir_abbr || null,
        justificatif: p.justificatif || null,
      }));

      console.log("resultat retard :", mapped);
      setFiltrages(mapped);
    } catch (err) {
      console.error("Erreur chargement retard:", err);
      setFiltrages([]);
    } finally {
      setLoading(false);
    }
  };

  // ---- Snackbar restauré depuis sessionStorage ----
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

  // ---- Export Excel des pointages du modal "détails de retard" ----
  const downloadPDF = async () => {
    if (!selectedRetardDates || selectedRetardDates.length === 0) {
      setSnackMessage(
        "Veuillez cliquer sur un nombre de retard pour sélectionner les dates.",
      );
      setSnackError(true);
      setOpenSnack(true);
      return;
    }

    setLoadingPdf(true);

    const formattedDates = selectedRetardDates
      .map((dateStr) => {
        const cleanDate = dateStr.trim().split(" ")[0];
        const parts = cleanDate.split("/");
        if (parts.length !== 3) return null;
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
      })
      .filter(Boolean);

    const datesParam = formattedDates.join(",");
    const url = `${API_URL}/api/pointage/facial/excel/dates/personnel2/${idpers}?dates=${datesParam}`;

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
      link.download = `pointages_${formattedDates[0]}_au_${formattedDates[formattedDates.length - 1]}.xlsx`;
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
      setLoadingPdf(false);
    }
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
    navigate, navigate2, location,

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
    filtrages, setFiltrages,
    loading, setLoading,
    loadingSupp, setLoadingSupp,
    errorMsg, setErrorMsg,
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
    loadingMatricule, setLoadingMatricule,
    loadingPdf1,
    open1, setOpen,
    anchorRef,
    anchorEl, setAnchorEl,
    isFetching,

    matriculeTransmis,
    anchorEl1, setAnchorEl1, openPopper,
    anchorEl2, setAnchorEl2, openPopper2,

    popperRef, popperRef2,
    pickerType, setPickerType,

    types,

    openRetardModal, setOpenRetardModal,
    selectedRetardDates, setSelectedRetardDates,
    admin,
    selectedRecord, setSelectedRecord,
    scrollRef,
    showLeft, showRight,
    scrollBtnsRef,
    idpers,
    ready,
    refreshKey,

    isMobile,

    scroll,

    fetchWithAuth,
    filteredPersonnels,
    filteredFiltrage,
    exportExcel,
    fetchRetardDetails,
    downloadPDF,
    rowSelection,
  };
}