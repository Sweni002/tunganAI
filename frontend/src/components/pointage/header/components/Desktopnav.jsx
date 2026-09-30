import React from "react";
import { MenuItem, Popover } from "@mui/material";
import {
  UsersIcon,
  ScrollIcon,
  CalendarBlankIcon,
  UserGearIcon,
} from "@phosphor-icons/react";
import { CalendarX, ClipboardText } from "@phosphor-icons/react";

/* ================= TOKENS M3 EXPRESSIVE ================= */

const SPRING_FAST = "cubic-bezier(0.42, 1.67, 0.21, 0.9)";
const SPRING_DEFAULT = "cubic-bezier(0.38, 1.21, 0.22, 1)";
const EFFECTS = "cubic-bezier(0.34, 0.8, 0.34, 1)";

const NAV_FONT = "'Roboto Mono', monospace";

/* Option du popover : couche de survol, icône qui change de forme, léger écrasement au clic */
const m3ItemSx = (extra = {}) => ({
  py: 1.5,
  px: 2,
  borderRadius: "16px",
  alignItems: "center",
  gap: "12px",
  transition: `background-color 200ms ${EFFECTS}, border-radius 400ms ${SPRING_FAST}, transform 400ms ${SPRING_FAST}`,
  "& .m3-icon": {
    transition: `border-radius 450ms ${SPRING_FAST}, transform 450ms ${SPRING_FAST}, background-color 200ms ${EFFECTS}`,
  },
  "&:hover": {
    backgroundColor: "rgba(0, 196, 204, 0.1)",
    "& .menu-title": { color: "#1B6979" },
    "& .m3-icon": {
      borderRadius: "12px",
      transform: "rotate(-8deg) scale(1.08)",
      backgroundColor: "rgba(0, 196, 204, 0.2)",
    },
  },
  "&:active": {
    borderRadius: "12px",
    transform: "scale(0.98)",
  },
  ...extra,
});

const iconBoxStyle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  backgroundColor: "rgba(0, 196, 204, 0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const menuTitleStyle = {
  fontFamily: NAV_FONT,
  fontSize: "0.9rem",
  fontWeight: 600,
};

const menuDescStyle = {
  fontFamily: NAV_FONT,
  fontSize: "0.75rem",
  color: "rgba(0,0,0,0.5)",
  marginTop: 2,
  whiteSpace: "normal",
};

/* Groupe d'onglets centré */
/* Transparent pour la mise en page : les <li> suivent .menu ul */
const groupStyle = {
  display: "contents",
};

const DesktopNav = ({
  styles,
  admin,
  activeMenu,
  handleClick,
  absMenuAnchor,
  handleMouseEnter,
  handleMouseLeave,
  setAbsMenuAnchor,
  cancelHoverClose,
  openService,
  openResponsable,
  openDiv,
  openType,
  openInfo,
  openHisto,
  openAssdPerso,
  openPerso,
  openConge,
  openAutorisaion,
  openPresences,
  openAssd,
}) => {
  const isActive = (key) => (activeMenu === key ? styles.active : "");

  return (
    <nav className={styles.gauche} aria-label="Navigation principale">
      <div className={styles.menu}>
        <ul>
          {admin?.role === "admin" && (
            <>
              <li
                onClick={() => handleClick("services", openService)}
                className={isActive("services")}
              >
                <i className="fa-solid fa-landmark" style={{ fontSize: "1rem" }}></i>
                <span>Services</span>
              </li>

              <li
                onClick={() => handleClick("responsables", openResponsable)}
                className={isActive("responsables")}
              >
                <i className="fa-solid fa-user-tie"></i>
                <span>Responsables</span>
              </li>

              <li
                onClick={() => handleClick("division", openDiv)}
                className={isActive("division")}
              >
                <i className="fa-solid fa-layer-group"></i>
                <span>Division</span>
              </li>

              <li
                onClick={() => handleClick("type", openType)}
                className={isActive("type")}
              >
                <i className="fa-solid fa-ban"></i>
                <span>Type d'absence</span>
              </li>
            </>
          )}

          {admin?.role === "personnel" && (
            <>
              <li
                onClick={() => handleClick("info", openInfo)}
                className={isActive("info")}
              >
                <UserGearIcon size={20} weight="bold" />
                <span>Information</span>
              </li>

              <li
                onClick={() => handleClick("histo", openHisto)}
                className={isActive("histo")}
              >
                <ScrollIcon size={19} weight="bold" />
                <span>Historique de pointage</span>
              </li>

              <li
                onClick={() => handleClick("ass", openAssdPerso)}
                className={isActive("ass")}
              >
                <i className="fa-solid fa-chart-line"></i>
                <span>Fiche d'assiduité personnelle</span>
              </li>
            </>
          )}

          {admin?.role === "responsable" && (
            <div style={groupStyle}>
              <li
                onClick={() => handleClick("personnels", openPerso)}
                className={isActive("personnels")}
              >
                <UsersIcon size={20} weight="bold" />
                <span style={{ fontFamily: NAV_FONT }}>Personnels</span>
              </li>

              {/* MENU DÉROULANT : ABSENCES & AUTORISATIONS */}
              <li
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`${
                  ["conge", "autoris"].includes(activeMenu) ? styles.active : ""
                } ${absMenuAnchor ? styles.dropOpen : ""}`}
                aria-haspopup="true"
                aria-expanded={Boolean(absMenuAnchor)}
              >
                <CalendarBlankIcon size={20} weight="bold" />
                <span style={{ fontFamily: NAV_FONT }}>Autorisations</span>
                <i
                  className="fa-solid fa-chevron-down"
                  style={{ fontSize: "0.7rem" }}
                ></i>
              </li>

              <Popover
                id="mouse-over-popover"
                sx={{ pointerEvents: "none" }}
                open={Boolean(absMenuAnchor)}
                anchorEl={absMenuAnchor}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
                disableRestoreFocus
                disableScrollLock
                onClose={handleMouseLeave}
                transitionDuration={{ enter: 420, exit: 160 }}
                TransitionProps={{
                  easing: { enter: SPRING_DEFAULT, exit: EFFECTS },
                }}
                PaperProps={{
                  onMouseEnter: cancelHoverClose,
                  onMouseLeave: handleMouseLeave,
                  sx: {
                    pointerEvents: "auto",
                    mt: "10px",
                    borderRadius: "24px",
                    minWidth: 300,
                    maxWidth: 340,
                    boxShadow: "0 15px 55px rgba(0,0,0,0.12)",
                    border: "2px solid rgba(0,0,0,0.05)",
                    overflow: "hidden",
                  },
                }}
              >
                <div style={{ padding: 12 }}>
                  <MenuItem
                    onClick={() => {
                      handleClick("conge", openConge);
                      setAbsMenuAnchor(null);
                    }}
                    sx={m3ItemSx()}
                  >
                    <div className="m3-icon" style={iconBoxStyle}>
                      <CalendarX size={18} weight="bold" style={{ color: "#1B6979" }} />
                    </div>
                    <div>
                      <div className="menu-title" style={menuTitleStyle}>
                        Absences
                      </div>
                      <div style={menuDescStyle}>
                        Gérer et suivre les congés et absences des employés
                      </div>
                    </div>
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      handleClick("autoris", openAutorisaion);
                      setAbsMenuAnchor(null);
                    }}
                    sx={m3ItemSx({ mt: 0.5 })}
                  >
                    <div className="m3-icon" style={iconBoxStyle}>
                      <ClipboardText size={18} weight="bold" style={{ color: "#1B6979" }} />
                    </div>
                    <div>
                      <div className="menu-title" style={menuTitleStyle}>
                        Autorisations
                      </div>
                      <div style={menuDescStyle}>
                        Demander et valider les autorisations de sortie
                      </div>
                    </div>
                  </MenuItem>
                </div>
              </Popover>

              <li
                onClick={() => handleClick("presenc", openPresences)}
                className={isActive("presenc")}
              >
                <ScrollIcon size={19} weight="bold" />
                <span style={{ fontFamily: NAV_FONT }}>Fiche de présences</span>
              </li>

              <li
                onClick={() => handleClick("ass2", openAssd)}
                className={isActive("ass2")}
              >
                <i className="fa-solid fa-chart-line"></i>
                <span style={{ fontFamily: NAV_FONT }}>Fiche d'assiduités</span>
              </li>
            </div>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default DesktopNav;