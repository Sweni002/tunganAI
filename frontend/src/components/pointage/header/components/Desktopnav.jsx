import React from "react";
import { MenuItem, Popover } from "@mui/material";
import {
  UserCheckIcon,
  UsersIcon,
  UserMinusIcon,
  ScrollIcon,
  CalendarBlankIcon,
  UserGearIcon,
} from "@phosphor-icons/react";
import { CalendarX, ClipboardText } from "@phosphor-icons/react";

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
  return (
    <div
      className={styles.gauche}
      style={admin?.role === "responsable" ? { maxWidth: "1600px" } : {}}
    >
      <div className={styles.menu}>
        <ul>
          {admin?.role === "admin" && (
            <>
              <li
                onClick={() => handleClick("services", openService)}
                className={activeMenu === "services" ? styles.active : ""}
              >
                <i className="fa-solid fa-landmark" style={{ fontSize: "1.0rem" }}></i>
                <span>Services</span>
              </li>

              <li
                onClick={() => handleClick("responsables", openResponsable)}
                className={activeMenu === "responsables" ? styles.active : ""}
              >
                <i className="fa-solid fa-user-tie"></i>
                <span>Responsables</span>
              </li>

              <li
                onClick={() => handleClick("division", openDiv)}
                className={activeMenu === "division" ? styles.active : ""}
              >
                <i className="fa-solid fa-layer-group"></i>
                <span>Division</span>
              </li>

              <li
                onClick={() => handleClick("type", openType)}
                className={activeMenu === "type" ? styles.active : ""}
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
                className={activeMenu === "info" ? styles.active : ""}
              >
                <UserGearIcon size={20} weight="bold" /> <span>Information</span>
              </li>
              <li
                onClick={() => handleClick("histo", openHisto)}
                className={activeMenu === "histo" ? styles.active : ""}
              >
                <ScrollIcon size={19} weight="bold" /> <span>Historique de pointage</span>
              </li>
              <li
                onClick={() => handleClick("ass", openAssdPerso)}
                className={activeMenu === "ass" ? styles.active : ""}
              >
                <i className="fa-solid fa-chart-line"></i>
                <span>Fiche d'assiduité personnelle</span>
              </li>
            </>
          )}

          {admin?.role === "responsable" && (
            <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
              <li
                onClick={() => handleClick("personnels", openPerso)}
                className={activeMenu === "personnels" ? styles.active : ""}
              >
                <UsersIcon size={20} weight="bold" style={{ marginRight: "6px" }} />
                <span style={{ fontFamily: "'Roboto Mono', monospace", }}>Personnels</span>
              </li>

              {/* MENU DÉROULANT : ABSENCES & AUTORISATIONS */}
              <li
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={["conge", "autoris"].includes(activeMenu) ? styles.active : ""}
                style={{ cursor: "pointer" }}
              >
                <CalendarBlankIcon size={22} weight="bold" style={{ marginRight: "4px" }} />
                <span style={{ fontFamily: "'Roboto Mono', monospace", }}>Autorisations</span>
                <i
                  className="fa-solid fa-chevron-down"
                  style={{ fontSize: "0.7rem", marginLeft: "4px" }}
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
                PaperProps={{
                  onMouseEnter: cancelHoverClose,
                  onMouseLeave: handleMouseLeave,
                  sx: {
                    pointerEvents: "auto",
                    mt: "12px",
                    borderRadius: "12px",
                    minWidth: 280,
                    boxShadow: "0 15px 55px rgba(0,0,0,0.1)",
                    border: "2px solid rgba(0,0,0,0.05)",
                    overflow: "hidden",
                  },
                }}
              >
                <div style={{ padding: "18px 18px" }}>
                  <MenuItem
                    onClick={() => {
                      handleClick("conge", openConge);
                      setAbsMenuAnchor(null);
                    }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: "8px",
                      alignItems: "center",
                      gap: "12px",
                      "&:hover": {
                        backgroundColor: "rgba(0, 196, 204, 0.1)",
                        "& .menu-title": { color: "#1B6979" },
                      },
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: "rgba(0, 196, 204, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CalendarX size={18} weight="bold" style={{ color: "#1B6979" }} />
                    </div>
                    <div>
                      <div
                        className="menu-title"
                        style={{
                          fontFamily: "'Roboto Mono', monospace",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                        }}
                      >
                        Absences
                      </div>
                      <div
                        style={{
                          fontFamily: "'Roboto Mono', monospace",
                          fontSize: "0.75rem",
                          color: "rgba(0,0,0,0.5)",
                          marginTop: 2,
                        }}
                      >
                        Gérer et suivre les congés et absences des employés
                      </div>
                    </div>
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      handleClick("autoris", openAutorisaion);
                      setAbsMenuAnchor(null);
                    }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: "8px",
                      alignItems: "center",
                      gap: "12px",
                      mt: 0.5,
                      "&:hover": {
                        backgroundColor: "rgba(0, 196, 204, 0.1)",
                        "& .menu-title": { color: "#1B6979" },
                      },
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: "rgba(0, 196, 204, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ClipboardText size={18} weight="bold" style={{ color: "#1B6979" }} />
                    </div>
                    <div>
                      <div
                        className="menu-title"
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                        }}
                      >
                        Autorisations
                      </div>
                      <div
                        style={{
                          fontFamily: "'Roboto Mono', monospace",
                          fontSize: "0.75rem",
                          color: "rgba(0,0,0,0.5)",
                          marginTop: 2,
                        }}
                      >
                        Demander et valider les autorisations de sortie
                      </div>
                    </div>
                  </MenuItem>
                </div>
              </Popover>
              <li
                onClick={() => handleClick("presenc", openPresences)}
                className={activeMenu === "presenc" ? styles.active : ""}
              >
                <ScrollIcon size={19} weight="bold" style={{ marginRight: "6px" }} />{" "}
                <span style={{ fontFamily: "'Roboto Mono', monospace", }}> Fiche de présences</span>
              </li>

              <li
                onClick={() => handleClick("ass2", openAssd)}
                className={activeMenu === "ass2" ? styles.active : ""}
              >
                <i className="fa-solid fa-chart-line" style={{ marginRight: "6px" }}></i>
                <span style={{ fontFamily: "'Roboto Mono', monospace", }}> Fiche d'assiduités</span>
              </li>
            </div>
          )}
        </ul>
      </div>
    </div>
  );
};

export default DesktopNav;