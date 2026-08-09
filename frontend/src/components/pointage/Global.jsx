import React, { useState, Suspense, useEffect, useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Spin, Typography, Tooltip } from 'antd';
import Loading from './Loading';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Fab, Drawer, List, ListItem, ListItemText, Divider, Paper, IconButton, Badge } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { socket } from '../../socket';
import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import { AuthContext } from '../../AuthContext';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';
import { styled } from "@mui/material/styles";
import Dialog from '@mui/material/Dialog';
import LockIcon from '@mui/icons-material/Lock';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { ScanSmileyIcon } from "@phosphor-icons/react";
import { RiNotification2Fill } from "react-icons/ri";
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import { QrCode, CalendarRange, Power, X } from "lucide-react";
import Backdrop from '@mui/material/Backdrop';
import { useOutletContext } from "react-router-dom";
import Header from './header';


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

const Global = () => {
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
      const navigate=useNavigate()

      const { user, fetchMe } = useContext(AuthContext);
  const location = useLocation();
const [lockDialogOpen, setLockDialogOpen] = useState(false);
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState("");
const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  // ⚠️ ne pas afficher Header si on est sur /global/pointages
  const showHeader = location.pathname !== '/global/pointages';

const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
const [openSpeed, setOpenSpeed] = useState(false);
const handleOpenSpeedDial = () => setOpenSpeed(true);
const handleCloseSpeedDial = () => setOpenSpeed(false);
  const [openDateFilter, setOpenDateFilter] = useState(false);

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth <= 768);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);


const actions = [
  {
    // L'icône change dynamiquement selon la page et l'état d'ouverture
    icon:
      location.pathname === "/global/pointages" ? (
        <Power size={20} />
      ) : (
        <FaceRetouchingNaturalIcon sx={{ fontSize: 20 }} />
      ),
    name: location.pathname === "/global/pointages" ? "Quitter" : "Scanner",
    onClick: () => {
      if (location.pathname === "/global/pointages") {
        navigate(-1); // Retourne en arrière si on est déjà sur pointages
      } else {
        navigate("/global/pointages");
      }
    },
  },
  {
    icon: <CalendarRange size={16} />,
    name: "Deux dates",
    onClick: () => {
      setOpenDateFilter(true); // 👈 ouvre le modal
    },
  },
];

  // Charger toutes les notifications depuis l'API
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pointage/notifications`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      setNotifications(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des notifications:", err);
      setNotifications([]);
    }
  };

  
  const markAllAsRead = async () => {
  const unreadNotifications = notifications.filter(n => !n.etat);

  for (const notif of unreadNotifications) {
    try {
      await fetch(`${API_URL}/api/pointage/notifications/${notif.id}/read`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error("Erreur lors du marquage comme lu :", err);
    }
  }

  // Mettre à jour localement l'état pour refléter que toutes sont lues
  setNotifications(prev =>
    prev.map(n => ({ ...n, etat: true }))
  );
};
const markPasswordAsSeen = async () => {
  try {
    await fetch(`${API_URL}/api/auth/password-popup-seen`, {
      method: "PUT",
      credentials: "include",
    });
  } catch (err) {
    console.error("Erreur update password popup:", err);
  }
};

const [passwordDialogShown, setPasswordDialogShown] = useState(false);
useEffect(() => {
  if (!user) return;

  const canChangePassword =
    (user.personnel && user.personnel.can_change_password) ||
    (user.responsable && user.responsable.can_change_password) ||
    (user.admin && user.admin.can_change_password); // 🔹 ajout pour admin

  if (canChangePassword && !passwordDialogShown) {
    setPasswordDialogOpen(true);
    setPasswordDialogShown(true); // ✅ marque comme déjà affiché

      // 🔥 update DB une seule fois
    markPasswordAsSeen();
  }
}, [user, passwordDialogShown]);
useEffect(() => {
  if (!user || !user.responsable) return;

  const fetchNotificationsPeriodically = async () => {
    try {
      const idserv = user.responsable.idserv;
      if (!idserv) return; // Sécurité supplémentaire

      const res = await fetch(
        `${API_URL}/api/pointage/notifications?idserv=${idserv}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!res.ok) throw new Error("Erreur réseau");

      const data = await res.json();
      setNotifications(data || []);
      console.log("ler :", data);
    } catch (err) {
      console.error("Erreur lors du chargement des notifications :", err);
      setNotifications([]);
    }
  };

  fetchNotificationsPeriodically();

  const interval = setInterval(fetchNotificationsPeriodically, 3000);

  const handleSocketUpdate = (data) => {
    if (data) {
      setNotifications((prev) => [
        {
          id: data.idnotif,
          idpointage: data.idpointage,
          idpers: data.idpers,
          description: data.description,
          etat: data.etat,
          created_at: data.date,
        },
        ...prev,
      ]);
    }
  };

  socket.on("pointage_update", handleSocketUpdate);

  return () => {
    clearInterval(interval);
    socket.off("pointage_update", handleSocketUpdate);
  };
}, [user?.responsable?.idserv]); // 🔹 mettre juste idrh en dépendance


const formatDatePlus3 = (dateStr) => {
  const date = new Date(dateStr);

  // ➕ ajouter 3 heures
  date.setHours(date.getHours() + 3);

  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};


const fabIcon =
  location.pathname === "/global/pointages" ? (
    <PowerSettingsNewIcon style={{ color: "white" }} />
  ) : (
    <ScanSmileyIcon size={isMobile ? 23 : 27}  weight="fill" color="white" />
  );


  const unreadCount = Array.isArray(notifications)
    ? notifications.filter(n => !n.etat).length
    : 0;

      const cloturerMatin = async () => {
  try {
    const res = await fetch(
      `${API_URL}/api/pointage/cloture/matin/${user.responsable.idserv}`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erreur lors de la clôture");
    }
  setSnackbarMessage(data.message);
    setSnackbarOpen(true);

    // fermer le dialog
    setLockDialogOpen(false);

  } catch (error) {
    console.error("❌ Erreur clôture matin :", error);
    alert("Erreur lors de la clôture du pointage matin");
  }
};

     const cloturerMidi = async () => {
  try {
    const res = await fetch(
      `${API_URL}/api/pointage/cloture/apres/${user.responsable.idserv}`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erreur lors de la clôture");
    }
  setSnackbarMessage(data.message);
    setSnackbarOpen(true);

    // fermer le dialog
    setLockDialogOpen(false);

  } catch (error) {
    console.error("❌ Erreur clôture midi :", error);
    alert("Erreur lors de la clôture du pointage matin");
  }
};

  return loading ? (
    <Loading onFinish={() => setLoading(false)} />
  ) : (
    <div>
      <Backdrop
        open={openSpeed}
        sx={{
          zIndex: 9998, // Juste en dessous du SpeedDial (9999)
          backgroundColor: "rgba(0, 0, 0, 0.7)", // Intensité du noir
          backdropFilter: "blur(2px)", // Optionnel : floute un peu l'arrière-plan
        }}
        onClick={handleCloseSpeedDial}
      />
      {showHeader && (
        <Header
          notifications={notifications}
          setNotifications={setNotifications}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          markAllAsRead={markAllAsRead}
          lockDialogOpen={lockDialogOpen}
          setLockDialogOpen={setLockDialogOpen}
          cloturerMatin={cloturerMatin}
          cloturerMidi={cloturerMidi}
          setSnackbarMessage={setSnackbarMessage}
          setSnackbarOpen={setSnackbarOpen}
        />
      )}
      <div
        style={{
          paddingTop: isMobile ? "0px" : showHeader ? "130px" : 0,
        }}
      >
        {" "}
        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "80vh",
              }}
            >
              <Spin size="large" tip="Chargement..." />
            </div>
          }
        >
          <Outlet context={{ openDateFilter, setOpenDateFilter }} />
        </Suspense>
      </div>
      {user?.role === "responsable" && !isMobile && (
        <Tooltip title="Clôturer le pointage" placement="left">
          <Fab
            onClick={() => setLockDialogOpen(true)}
            aria-label="notifications"
            style={{
              backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
              position: "fixed",
              bottom: 100,
              right: 20,
              zIndex: 9999,
            }}
          >
            <LockIcon style={{ color: "white" }} />
          </Fab>
        </Tooltip>
      )}
      {user?.role === "responsable" && !isMobile && (
        <Tooltip title="Notifications" placement="left">
          <Fab
            aria-label="notifications"
            style={{
              backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
              position: "fixed",
              bottom: 20,
              right: 20,
              zIndex: 9999,
            }}
            onClick={() => {
              setDrawerOpen(true);
              markAllAsRead(); // Marquer toutes les notifications comme lues
            }}
          >
            <Badge badgeContent={unreadCount} color="error" max={9}>
              <RiNotification2Fill color="white" size={21} />
            </Badge>
          </Fab>
        </Tooltip>
      )}

      {user?.role === "personnel" && (
        <div>
          {!isMobile ? (
            <Tooltip
              title={
                location.pathname === "/global/pointages"
                  ? "Quitter"
                  : "Scanner"
              }
              placement="left"
            >
              <Fab
                aria-label="action-mobile"
                sx={{
                  position: "fixed",
                  bottom: 17,
                  right: 10,
                  zIndex: 9999,
                  width: 50,
                  height: 50,
                  backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
                  color: "white",
                }}
                onClick={() => {
                  if (location.pathname === "/global/pointages") {
                    navigate(-1);
                  } else {
                    navigate("/global/pointages");
                  }
                }}
              >
                {location.pathname === "/global/pointages" ? (
                  <Power size={24} />
                ) : (
                  <FaceRetouchingNaturalIcon sx={{ fontSize: 24 }} />
                )}
              </Fab>
            </Tooltip>
          ) : (
            /* --- VERSION DESKTOP : SPEEDDIAL --- */
            <SpeedDial
              ariaLabel="Actions Menu"
              open={openSpeed}
              onOpen={handleOpenSpeedDial}
              onClose={handleCloseSpeedDial}
              sx={{
                position: "fixed",
                bottom: 7,
                right: 7,
                zIndex: 9999,
                "& .MuiFab-primary": {
                  width: 48,
                  height: 50,
                  backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
                },
                "& .MuiSpeedDialAction-staticTooltipLabel": {
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  padding: "4px 10px",
                },
              }}
              icon={
                location.pathname === "/global/pointages" && !openSpeed ? (
                  <Power size={24} color="white" />
                ) : (
                  <FaceRetouchingNaturalIcon size={22} color="white" />
                )
              }
            >
              {actions.map((action) => (
                <SpeedDialAction
                  key={action.name}
                  icon={action.icon}
                  tooltipTitle={action.name}
                  tooltipOpen
                  onClick={() => {
                    if (action.onClick) action.onClick();
                    handleCloseSpeedDial();
                  }}
                  sx={{
                    "& .MuiSpeedDialAction-fab": {
                      color: "#8b69b8",
                    },
                  }}
                />
              ))}
            </SpeedDial>
          )}
        </div>
      )}

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "90%", sm: 400 }, p: 2 } }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            fontFamily:
              " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontFamily:
                " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
            }}
          >
            Notifications
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </div>
        <Divider />

        <List sx={{ maxHeight: "75vh", overflowY: "auto", mt: 1 }}>
          {notifications.length === 0 && (
            <Typography
              variant="body2"
              align="center"
              sx={{
                mt: 2,
                fontFamily:
                  "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
              }}
            >
              Aucune notification
            </Typography>
          )}
          {notifications.map((item) => (
            <Paper
              key={item.id}
              sx={{
                mb: 1,
                p: 1,
                width: "100%", // 🔹 prend toute la largeur du conteneur
                boxSizing: "border-box", // 🔹 inclut padding dans la largeur
                backgroundColor: "rgba(174, 188, 189, 0.06)",
                transition: "0.2s",
                boxShadow: "none",
              }}
            >
              <ListItem alignItems="flex-start">
                {/* 🔔 Avatar */}
                <ListItemAvatar>
                  <Badge
                    color="error"
                    variant={!item.etat ? "dot" : "standard"}
                    overlap="circular"
                  >
                    <Avatar
                      sx={{
                        bgcolor: item.etat ? "grey.300" : "#00c4cc",
                        width: 45,
                        height: 45,
                      }}
                      src={`${API_URL}/uploads/${item.image}`}
                    >
                      <NotificationsIcon fontSize="small" />
                    </Avatar>
                  </Badge>
                </ListItemAvatar>

                {/* 📝 Texte */}
                <ListItemText
                  primary={item.description}
                  secondary={formatDatePlus3(item.created_at)}
                  primaryTypographyProps={{
                    fontSize: "0.8rem",
                    fontWeight: item.etat ? "normal" : "bold",
                    fontFamily:
                      "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                  }}
                />

                {/* 🗑️ Bouton de suppression */}
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={async () => {
                    try {
                      await fetch(
                        `${API_URL}/api/pointage/notifications/${item.id}`,
                        {
                          method: "DELETE",
                          credentials: "include",
                        },
                      );
                      // Supprimer localement la notification du state
                      setNotifications((prev) =>
                        prev.filter((n) => n.id !== item.id),
                      );
                    } catch (err) {
                      console.error(
                        "Erreur lors de la suppression de la notification :",
                        err,
                      );
                    }
                  }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </ListItem>
            </Paper>
          ))}
        </List>
      </Drawer>
      <BootstrapDialog
        open={lockDialogOpen}
        onClose={() => setLockDialogOpen(false)}
      >
        <div
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            fontFamily: " 'Poppins', sans-serif",
            position: "relative", // 👈 important
          }}
        >
          {/* ❌ Bouton close */}
          <IconButton
            onClick={() => setLockDialogOpen(false)}
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#676767",
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <p style={{ fontFamily: " 'Poppins', sans-serif" }}>
            Clôture du pointage
          </p>

          <p style={{ color: "#676767", fontSize: "0.9rem" }}>
            Choisissez <b>Matin</b> ou <b>Après-midi</b> pour la clôture du
            pointage
          </p>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 12,
              justifyContent: "center",
              width: "100%",
            }}
          >
            <Button
              fullWidth
              variant="contained"
              startIcon={<WbSunnyIcon />}
              sx={{
                background: "linear-gradient(90deg,#00c4cc,#8b69b8)",
                textTransform: "none",
                borderRadius: 2,
                fontSize: "0.9rem",
                fontFamily: " 'Poppins', sans-serif",
              }}
              onClick={cloturerMatin}
            >
              Matin
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<NightsStayIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontSize: "0.9rem",
                fontFamily: " 'Poppins', sans-serif",
              }}
              onClick={cloturerMidi}
            >
              Après-midi
            </Button>
          </div>
        </div>
      </BootstrapDialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <BootstrapDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 25,
            padding: 3,
            backgroundColor: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            fontFamily: "'Poppins', sans-serif",
          },
        }}
        BackdropProps={{
          sx: {
            backdropFilter: "blur(3px)",
            backgroundColor: "rgba(0,0,0,0.25)",
          },
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "15px",
            fontFamily: "'Poppins', sans-serif",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
          >
            <p
              style={{
                fontFamily: " 'Poppins', sans-serif",
                fontSize: "1.0rem",
              }}
            >
              Changement de mot de passe
            </p>
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              color: "#555",
              fontSize: "0.95rem",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <p style={{ fontFamily: " 'Poppins', sans-serif" }}>
              Pour des raisons de sécurité, vous pouvez changer votre mot de
              passe maintenant
            </p>
          </Typography>

          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <Button
              fullWidth
              variant="contained"
              sx={{
                background: "linear-gradient(90deg,#00c4cc,#8b69b8)",
                textTransform: "none",
                borderRadius: 2,
                fontSize: "0.8rem",
                fontFamily: " 'Poppins', sans-serif",
              }}
              onClick={() => {
                setPasswordDialogOpen(false);
                navigate("/change-password");
              }}
            >
              Changer
            </Button>

            <Button
              variant="outlined"
              fullWidth
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontSize: "0.8rem",
                fontFamily: " 'Poppins', sans-serif",
              }}
              onClick={() => setPasswordDialogOpen(false)}
            >
              Non, merci
            </Button>
          </div>
        </div>
      </BootstrapDialog>
    </div>
  );
};

export default Global;
