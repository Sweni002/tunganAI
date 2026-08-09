import React from "react";
import Drawer from "@mui/material/Drawer";
import styles from "./header.module.css"; // ⚠️ même fichier CSS que l'original, inchangé

import { useHeaderController } from "./useHeaderController";
import TopBar from "./components/TopBar";
import DesktopNav from "./components/DesktopNav";
import MobileNav from "./components/MobileNav";
import DrawerContent from "./components/DrawerContent";
import SearchDialog from "./components/SearchDialog";
import RoleSwitchMenu from "./components/RoleSwitchMenu";

const Header = ({
  notifications,
  setNotifications,
  drawerOpen,
  setDrawerOpen,
  markAllAsRead,
  lockDialogOpen,
  setLockDialogOpen,
  cloturerMatin,
  cloturerMidi,
  setSnackbarMessage,
  setSnackbarOpen,
}) => {
  const c = useHeaderController({
    notifications,
    markAllAsRead,
    setLockDialogOpen,
    setDrawerOpen,
  });

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 999 }}>
      {!c.isMobileCompact ? (
        <div>
          <TopBar
            styles={styles}
            admin={c.admin}
            API_URL={c.API_URL}
            isMobile={c.isMobile}
            darkMode={c.darkMode}
            toggleDarkMode={c.toggleDarkMode}
            handleAvatarClick={c.handleAvatarClick}
          />

          {/* ⚠️ Le bandeau du DesktopNav garde toujours son dégradé, même en mode sombre : pas de classe darkNavbar ici */}
          <div className={styles.navbar}>
            <DesktopNav
              styles={styles}
              admin={c.admin}
              activeMenu={c.activeMenu}
              handleClick={c.handleClick}
              absMenuAnchor={c.absMenuAnchor}
              handleMouseEnter={c.handleMouseEnter}
              handleMouseLeave={c.handleMouseLeave}
              setAbsMenuAnchor={c.setAbsMenuAnchor}
              cancelHoverClose={c.cancelHoverClose}
              openService={c.openService}
              openResponsable={c.openResponsable}
              openDiv={c.openDiv}
              openType={c.openType}
              openInfo={c.openInfo}
              openHisto={c.openHisto}
              openAssdPerso={c.openAssdPerso}
              openPerso={c.openPerso}
              openConge={c.openConge}
              openAutorisaion={c.openAutorisaion}
              openPresences={c.openPresences}
              openAssd={c.openAssd}
            />

            <SearchDialog open={c.open} handleClose={c.handleClose} />
          </div>
        </div>
      ) : (
        <MobileNav
          styles={styles}
          admin={c.admin}
          drawerOpen2={c.drawerOpen2}
          setDrawerOpen2={c.setDrawerOpen2}
          setLockDialogOpen={setLockDialogOpen}
          setDrawerOpen={setDrawerOpen}
          markAllAsRead={markAllAsRead}
          notifications={notifications}
          setMenuAnchorEl={c.setMenuAnchorEl}
        />
      )}

      <Drawer
        anchor="right"
        open={c.drawerOpen2}
        onClose={c.toggleDrawer}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            backgroundColor: "#fff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          },
        }}
        sx={{ zIndex: 20000 }}
      >
        <DrawerContent
          admin={c.admin}
          API_URL={c.API_URL}
          openPerso={c.openPerso}
          toggleCertif={c.toggleCertif}
          openCertif={c.openCertif}
          openConge={c.openConge}
          openAutorisaion={c.openAutorisaion}
          openPresences={c.openPresences}
          openAssd={c.openAssd}
          openInfo={c.openInfo}
          openHisto={c.openHisto}
          openAssdPerso={c.openAssdPerso}
          handleLogout={c.handleLogout}
          toggleDrawer={c.toggleDrawer}
        />
      </Drawer>

      <RoleSwitchMenu
        isMobile={c.isMobile}
        menuAnchorEl={c.menuAnchorEl}
        handleMenuClose={c.handleMenuClose}
        getOtherRoles={c.getOtherRoles}
        handleSwitchRole={c.handleSwitchRole}
        navigate={c.navigate}
        handleLogout={c.handleLogout}
      />
    </div>
  );
};

export default Header;