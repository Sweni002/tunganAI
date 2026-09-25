import React, { useState, useEffect } from "react";
import { Avatar } from "@mui/material";
import Logo from "../../../../assets/logo1.png";
import Logo2 from "../../../../assets/finances.png";
import HeaderBanner from "../../../../assets/header-banner.png";
import { StyledBadge } from "../Header.styles";
import { stringAvatar } from "../Header.utils";
import AccountBadge from "./AccountBadge";
import DarkModeSwitch from "../../DarkModeSwitch";

const HIDE_AT = 40; // px : masquer au-delà
const SHOW_AT = 10; // px : réafficher en dessous (anti-clignotement)

const SPRING_FAST = "cubic-bezier(0.42, 1.67, 0.21, 0.9)";

const TopBar = ({
  styles,
  admin,
  API_URL,
  isMobile,
  darkMode,
  toggleDarkMode,
  handleAvatarClick,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setIsVisible((prev) => (prev ? y < HIDE_AT : y < SHOW_AT));
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const serviceLogo =
    admin?.role === "responsable"
      ? admin?.responsable?.service?.logo
        ? `data:image/png;base64,${admin.responsable.service.logo}`
        : Logo2
      : admin?.role === "personnel"
        ? admin?.personnel?.service?.logo
          ? `data:image/png;base64,${admin.personnel.service.logo}`
          : Logo2
        : Logo2;

  return (
    <header
      className={`${styles.headerHaut} ${!isVisible ? styles.hidden : ""}`}
      style={{ backgroundImage: `url(${HeaderBanner})` }}
    >
      <div className={styles.cardHeader}>
        {/* Le logo Point'eo est dans l'image de fond : titre gardé pour l'accessibilité */}
        <h1 className={styles.srOnly}>{import.meta.env.VITE_APP_NAME}</h1>

        {/* MOBILE : thème + avatar */}
        {isMobile && (
          <div
            className={`${styles.mobileAvatar} ${styles.enter}`}
            style={{ "--d": "160ms" }}
          >
            <DarkModeSwitch darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <StyledBadge
              onClick={handleAvatarClick}
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
              sx={{ cursor: "pointer" }}
            >
              <Avatar
                src={
                  admin?.personnel?.image
                    ? `${API_URL}/uploads/${admin.personnel.image}`
                    : undefined
                }
                {...(!admin?.personnel?.image &&
                  stringAvatar(admin?.personnel?.prenom || ""))}
                sx={{
                  width: 40,
                  height: 41,
                  backgroundColor: "#1B6979",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  borderRadius: "50%",
                  transition: `border-radius 450ms ${SPRING_FAST}, transform 350ms ${SPRING_FAST}`,
                  "&:hover": { borderRadius: "14px" },
                  "&:active": { transform: "scale(0.9)", borderRadius: "10px" },
                }}
              />
            </StyledBadge>
          </div>
        )}

        {/* DROITE : compte | logo du service */}
        <div className={`${styles.compte} ${styles.enter}`} style={{ "--d": "180ms" }}>
          {admin?.role === "admin" && (
            <AccountBadge
              styles={styles}
              darkMode={darkMode}
              onClick={handleAvatarClick}
              name={admin ? admin.nom : "..."}
              subtitle={admin ? admin.role : "..."}
              initialsName={admin ? admin.nom : ""}
              width={44}
              height={44}
            />
          )}

          {admin?.role === "responsable" && (
            <AccountBadge
              styles={styles}
              darkMode={darkMode}
              onClick={handleAvatarClick}
              name={admin?.responsable?.nom ? admin.responsable.nom.split(" ")[0] : "..."}
              subtitle={admin ? admin.role : "..."}
              imageSrc={`${API_URL}/uploads/${admin?.responsable?.image}`}
              width={44}
              height={44}
            />
          )}

          {admin?.role === "personnel" && (
            <AccountBadge
              styles={styles}
              darkMode={darkMode}
              onClick={handleAvatarClick}
              name={
                admin?.personnel?.prenom
                  ? admin.personnel.prenom.split(" ")[0]
                  : "..."
              }
              subtitle={admin?.role ?? "..."}
              imageSrc={
                admin?.personnel?.image
                  ? `${API_URL}/uploads/${admin.personnel.image}`
                  : undefined
              }
              initialsName={admin?.personnel?.prenom || ""}
              width={44}
              height={44}
            />
          )}

          <div className={styles.logo} title="Service">
            <img
              src={serviceLogo}
              alt="Logo du service"
              onError={(e) => (e.currentTarget.src = Logo)}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;