import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../AuthContext"; // ⚠️ adapte le chemin selon l'emplacement réel du dossier Header
import { socket } from "../../../socket"; // ⚠️ adapte le chemin selon l'emplacement réel du dossier Header

const API_URL = import.meta.env.VITE_API_URL;

/**
 * useHeaderController
 * Concentre exactement la même logique que l'ancien composant Header monolithique :
 * - récupération / rafraîchissement de l'utilisateur connecté (admin/responsable/personnel)
 * - écoute socket "personnel_update"
 * - gestion du mode sombre
 * - gestion responsive (mobile / desktop)
 * - navigation (tous les "openXxx")
 * - changement de rôle
 * - menu popover "Autorisations" au survol (responsable)
 * - drawer mobile (responsable)
 *
 * NB (correction de bug) : l'ancien code appelait `setAdmin(...)` dans fetchAdmin alors que
 * seul `setUser` était déstructuré du AuthContext (setAdmin n'existait pas → ReferenceError
 * à l'exécution). Ici on utilise bien `setUser`, ce qui est le seul changement de comportement.
 */
export function useHeaderController({
  notifications,
  markAllAsRead,
  setLockDialogOpen,
  setDrawerOpen,
}) {
  const navigate = useNavigate();
  const {
    user: admin,
    setUser,
    fetchMe,
    logout,
    loading: authLoading,
  } = useContext(AuthContext);
  // ---- États ----
  const [isHovered, setIsHovered] = useState(false);
  const [open, setOpen] = useState(false); // dialogue de recherche
  const [menuAnchorEl, setMenuAnchorEl] = useState(null); // menu profil / rôles
  const [openConfirmLogout, setOpenConfirmLogout] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);
  const [expandRole, setExpandRole] = useState(false);
  const isFetching = useRef(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [absMenuAnchor, setAbsMenuAnchor] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [openCertif, setOpenCertif] = useState(false);
  const [drawerOpen2, setDrawerOpen2] = useState(false);
  const [activeMenu, setActiveMenu] = useState("");

  const leaveTimeoutRef = useRef(null);

  // Nav mobile compacte (type "pilule") : responsable ET personnel l'utilisent désormais
  const isMobileResponsable = isMobile && admin?.role === "responsable";
  const isMobilePersonnel = isMobile && admin?.role === "personnel";
  const isMobileCompact = isMobileResponsable || isMobilePersonnel;

  // ---- Petits toggles ----
  const handleAbsClick = (event) => setAbsMenuAnchor(event.currentTarget);
  const handleAbsClose = () => setAbsMenuAnchor(null);
  const toggleRoleExpand = () => setExpandRole((prev) => !prev);
  const toggleCertif = () => setOpenCertif((prev) => !prev);
  const toggleDrawer = () => setDrawerOpen2((prev) => !prev);

  // ---- Popover "Autorisations" au survol (desktop / responsable) ----
  const handleMouseEnter = (event) => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    setAbsMenuAnchor(event.currentTarget);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setAbsMenuAnchor(null);
    }, 100);
  };

  const cancelHoverClose = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
  };

  // ---- Responsive ----
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---- Menu rôles (non utilisé dans le rendu actuel, conservé pour parité) ----
  const openRoleMenu = (event) => setRoleMenuAnchor(event.currentTarget);
  const closeRoleMenu = () => setRoleMenuAnchor(null);

  // ---- Changement de rôle ----
  const handleSwitchRole = async (role) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/switch_role`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        const updatedUser = await fetchMe(true); // force=true pour ignorer le cache de 30s
        setUser(updatedUser);

        closeRoleMenu();
        handleMenuClose();

        if (role === "admin") {
          navigate("/global/service", { replace: true });
        } else if (role === "personnel") {
          navigate("/global/historique", {
            replace: true,
            state: { idpers: updatedUser?.personnel?.idpers },
          });
        } else if (role === "responsable") {
          navigate("/global/fiche_presence", {
            replace: true,
            state: {
              idrh: updatedUser?.responsable?.idrh,
              idserv: updatedUser?.responsable?.idserv,
            },
          });
        }
      }
    } catch (err) {
      console.error("Erreur changement de rôle", err);
    }
  };

  // ---- Mode sombre ----
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // ---- Socket temps réel ----
  useEffect(() => {
    socket.on("personnel_update", (data) => {
      console.log("🔔 Personnel mis à jour header :", data);
      setRefreshKey((prev) => prev + 1);
    });

    return () => {
      socket.off("personnel_update");
    };
  });

  // ---- Rafraîchit les infos user au retour de focus (si > 60s) ----
  useEffect(() => {
    let lastFetch = Date.now();

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFetch > 60000) {
        fetchAdmin();
        lastFetch = now;
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Menu profil ----
  const handleAvatarClick = (event) => setMenuAnchorEl(event.currentTarget);
  const handleMenuClose = () => setMenuAnchorEl(null);
  const handleLogout = async () => logout();

  // ---- Navigation ----
  const openPerso = () => navigate("/global/personnel");
  const openResponsable = () => navigate("/global/responsable");
  const openService = () => navigate("/global/service");
  const openTab = () => navigate("/global/tableau_bord");
  const openHoraires = () => navigate("/global/horaires");

  const openPresences = () => {
    if (!admin.responsable.idrh) return; // sécurité
    navigate("/global/fiche_presence", {
      state: { idrh: admin.responsable.idrh, idserv: admin.responsable.idserv },
    });
  };

  const openConge = () => navigate("/global/autorisation");
  const openAutorisaion = () => navigate("/global/autorisation_sortie");
  const openDiv = () => navigate("/global/division");
  const openType = () => navigate("/global/type");

  const openAssd = () => {
    navigate("/global/assiduite", {
      state: { idrh: admin.responsable.idrh, idserv: admin.responsable.idserv },
    });
  };

  const openAssdPerso = () => {
    navigate("/global/assiduite_perso", {
      state: { idpers: admin.personnel.idpers },
    });
  };

  const openInfo = () => {
    navigate("/global/information", {
      state: { idpers: admin.personnel.idpers },
    });
  };

  const openHisto = () => {
    navigate("/global/historique", {
      state: { idpers: admin.personnel.idpers },
    });
  };

  const handleClose = () => setOpen(false);
  const handleClickOpen = () => setOpen(true);

  // ---- Rôles disponibles ----
  const getOtherRoles = () => {
    if (!admin?.available_roles) return [];
    return admin.available_roles.filter((r) => r !== admin.role);
  };

  // ---- Menu actif (surlignage) ----
  const handleClick = (menuName, action) => {
    setActiveMenu(menuName);
    action();
  };

  return {
    API_URL,
    navigate,
    admin,

    isHovered, setIsHovered,
    open, setOpen, handleClose, handleClickOpen,
    menuAnchorEl, setMenuAnchorEl, handleAvatarClick, handleMenuClose,
    openConfirmLogout, setOpenConfirmLogout,

    darkMode, setDarkMode, toggleDarkMode,

    roleMenuAnchor, openRoleMenu, closeRoleMenu,
    expandRole, toggleRoleExpand,

    isFetching,
    refreshKey,

    absMenuAnchor, setAbsMenuAnchor,
    handleAbsClick, handleAbsClose,
    handleMouseEnter, handleMouseLeave, cancelHoverClose,

    isMobile,
    isMobileResponsable,
    isMobilePersonnel,
    isMobileCompact,

    openCertif, toggleCertif,
    drawerOpen2, setDrawerOpen2, toggleDrawer,

    activeMenu, handleClick,

    handleSwitchRole,
    handleLogout,

    openPerso, openResponsable, openService, openTab, openHoraires,
    openPresences, openConge, openAutorisaion, openDiv, openType,
    openAssd, openAssdPerso, openInfo, openHisto,

    getOtherRoles,

    notifications, markAllAsRead, setLockDialogOpen, setDrawerOpen,
  };
}