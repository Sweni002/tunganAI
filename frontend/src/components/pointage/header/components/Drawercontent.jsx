import React from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Avatar from "@mui/material/Avatar";
import LogoutIcon from "@mui/icons-material/Logout";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
  UsersIcon,
  UserMinusIcon,
  UserCheckIcon,
  CalendarBlankIcon,
  ScrollIcon,
  UserGearIcon,
} from "@phosphor-icons/react";
import { menuItemStyle, textStyle, subItemStyle, subTextStyle } from "../Header.styles";
import { stringAvatar } from "../Header.utils";

const DrawerContent = ({
  admin,
  API_URL,
  // responsable
  openPerso,
  toggleCertif,
  openCertif,
  openConge,
  openAutorisaion,
  openPresences,
  openAssd,
  // personnel
  openInfo,
  openHisto,
  openAssdPerso,
  handleLogout,
  toggleDrawer,
}) => {
  const isPersonnel = admin?.role === "personnel";

  // ---- En-tête (avatar + nom + libellé du panel) selon le rôle ----
  const headerAvatarSrc = isPersonnel
    ? admin?.personnel?.image
      ? `${API_URL}/uploads/${admin.personnel.image}`
      : undefined
    : admin?.responsable?.image
      ? `${API_URL}/uploads/${admin.responsable.image}`
      : undefined;

  const headerName = isPersonnel
    ? admin?.personnel?.prenom || "Personnel"
    : admin?.responsable?.nom || "Responsable";

  const headerLabel = isPersonnel ? "Personnel Panel" : "Responsable Panel";

  return (
    <Box
      sx={{
        width: 270,
        backgroundColor: "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ================= HEADER LOGO ================= */}
      <Box
        sx={{
          px: 2,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          mb: 1,
        }}
      >
        <Avatar
          src={headerAvatarSrc}
          {...(!headerAvatarSrc && stringAvatar(headerName))}
          sx={{
            width: 44,
            height: 44,
            backgroundColor: "#1B6979",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "0.75rem",
          }}
        />

        <Box>
          <Box sx={{ fontSize: "0.8rem", fontWeight: 500 }}>{headerName}</Box>
          <Box sx={{ fontSize: "0.7rem", color: "#666", fontFamily: "'Poppins', sans-serif" }}>
            {headerLabel}
          </Box>
        </Box>
      </Box>

      {/* ================= MENU ================= */}
      <List sx={{ px: 1.5, flex: 1 }}>
        {isPersonnel ? (
          <>
            {/* -------- MENU PERSONNEL -------- */}
            <ListItemButton
              onClick={() => {
                openInfo();
                toggleDrawer();
              }}
              sx={menuItemStyle}
            >
              <UserGearIcon size={18} weight="regular" style={{ marginRight: 10 }} />
              <ListItemText primary="INFORMATION" primaryTypographyProps={textStyle} />
            </ListItemButton>

            <Divider sx={{ my: 1 }} />

            <ListItemButton
              onClick={() => {
                openHisto();
                toggleDrawer();
              }}
              sx={menuItemStyle}
            >
              <ScrollIcon size={18} weight="regular" style={{ marginRight: 10 }} />
              <ListItemText primary="HISTORIQUE DE POINTAGE" primaryTypographyProps={textStyle} />
            </ListItemButton>

            <Divider sx={{ my: 1 }} />

            <ListItemButton
              onClick={() => {
                openAssdPerso();
                toggleDrawer();
              }}
              sx={menuItemStyle}
            >
              <i className="fa-solid fa-chart-line" style={{ marginRight: 10, fontSize: "0.9rem" }} />
              <ListItemText primary="FICHE D'ASSIDUITÉ" primaryTypographyProps={textStyle} />
            </ListItemButton>
          </>
        ) : (
          <>
            {/* -------- MENU RESPONSABLE -------- */}
            <ListItemButton
              onClick={() => {
                openPerso();
                toggleDrawer();
              }}
              sx={menuItemStyle}
            >
              <UsersIcon size={18} weight="regular" style={{ marginRight: 10 }} />
              <ListItemText primary="PERSONNELS" primaryTypographyProps={textStyle} />
            </ListItemButton>

            <Divider sx={{ my: 1 }} />

            <ListItemButton onClick={toggleCertif} sx={menuItemStyle}>
              <CalendarBlankIcon size={18} weight="regular" style={{ marginRight: 10 }} />
              <ListItemText primary="AUTORISATIONS" primaryTypographyProps={textStyle} />
              {openCertif ? (
                <ExpandLess sx={{ fontSize: 18 }} />
              ) : (
                <ExpandMore sx={{ fontSize: 18 }} />
              )}
            </ListItemButton>

            <Collapse in={openCertif} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  sx={subItemStyle}
                  onClick={() => {
                    openConge();
                    toggleDrawer();
                  }}
                >
                  <UserMinusIcon size={16} weight="regular" style={{ marginRight: 10 }} />
                  <ListItemText primary="ABSENCES" primaryTypographyProps={subTextStyle} />
                </ListItemButton>

                <ListItemButton
                  sx={subItemStyle}
                  onClick={() => {
                    openAutorisaion();
                    toggleDrawer();
                  }}
                >
                  <UserCheckIcon size={16} weight="regular" style={{ marginRight: 10 }} />
                  <ListItemText primary="AUTORISATIONS" primaryTypographyProps={subTextStyle} />
                </ListItemButton>
              </List>
            </Collapse>

            <Divider sx={{ my: 1 }} />

            <ListItemButton
              onClick={() => {
                openPresences();
                toggleDrawer();
              }}
              sx={menuItemStyle}
            >
              <ScrollIcon size={18} weight="regular" style={{ marginRight: 10 }} />
              <ListItemText primary="FICHE DE PRÉSENCES" primaryTypographyProps={textStyle} />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                openAssd();
                toggleDrawer();
              }}
              sx={menuItemStyle}
            >
              <i className="fa-solid fa-chart-line" style={{ marginRight: 10, fontSize: "0.9rem" }} />
              <ListItemText primary="FICHE D'ASSIDUITÉ" primaryTypographyProps={textStyle} />
            </ListItemButton>
          </>
        )}
      </List>

      {/* ================= FOOTER LOGOUT ================= */}
      <Box sx={{ px: 1.5, pb: 2 }}>
        <Divider sx={{ my: 1 }} />

        <ListItemButton
          onClick={() => {
            handleLogout();
            toggleDrawer();
          }}
          sx={{
            borderRadius: 2,
            py: 1,
            "&:hover": { backgroundColor: "rgba(255,0,0,0.06)" },
          }}
        >
          <LogoutIcon sx={{ mr: 1, fontSize: 18, color: "#d32f2f" }} />
          <ListItemText
            primary="DÉCONNEXION"
            primaryTypographyProps={{
              sx: {
                textTransform: "uppercase",
                fontWeight: 400,
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                color: "#d32f2f",
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
};

export default DrawerContent;