import React, { useState, useEffect } from "react";
import { Avatar } from "@mui/material";
import Logo from "../../../../assets/logo1.png";
import Logo2 from "../../../../assets/finances.png";
import { StyledBadge } from "../Header.styles";
import { stringAvatar } from "../Header.utils";
import AccountBadge from "./AccountBadge";
import DarkModeSwitch from "../../DarkModeSwitch";

const TopBar = ({ styles, admin, API_URL, isMobile, darkMode, toggleDarkMode, handleAvatarClick }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Masque si le scroll dépasse 20px, réaffiche uniquement tout en haut
      if (window.scrollY > 20) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
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
    <div className={`${styles.headerHaut} ${!isVisible ? styles.hidden : ""}`}>
      <div className={styles.cardHeader}>
        {admin?.role !== "personnel" && (
          <div className={styles.images}>
            <div className={styles.logo2}>
              <img
                src={Logo}
                alt="Logo service"
                onError={(e) => (e.currentTarget.src = Logo)}
              />
            </div>
          </div>
        )}

        <div className={styles.facegov}>
          <span style={{ color: darkMode ? "rgb(224, 224, 224)" : "black" }}>Face</span>
          <span style={{ color: "#1a3797ff" }}>Gov</span>
        </div>

        {isMobile && (
          <div className={styles.mobileAvatar} style={{ gap: 10, display: "flex", alignItems: "center" }}>
            <DarkModeSwitch darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <StyledBadge
              onClick={handleAvatarClick}
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
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
                }}
              />
            </StyledBadge>
          </div>
        )}

        <div className={styles.compte}>
          <div className={styles.darkModeToggle}>
            <DarkModeSwitch darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          </div>

          {admin?.role === "admin" && (
            <AccountBadge
              styles={styles}
              darkMode={darkMode}
              onClick={handleAvatarClick}
              name={admin ? admin.nom : "..."}
              subtitle={admin ? admin.role : "..."}
              initialsName={admin ? admin.nom : ""}
              width={47}
              height={45}
            />
          )}

          {admin?.role === "responsable" && (
            <AccountBadge
              styles={styles}
              darkMode={darkMode}
              onClick={handleAvatarClick}
              name={admin ? admin.responsable.nom : "..."}
              subtitle={admin ? admin.role : "..."}
              imageSrc={`${API_URL}/uploads/${admin?.responsable?.image}`}
              width={50}
              height={47}
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
              width={50}
              height={47}
            />
          )}

          <div className={styles.logo}>
            <img
              src={serviceLogo}
              alt="Logo service"
              onError={(e) => (e.currentTarget.src = Logo)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;