import React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { keyframes } from "@mui/material/styles";
import { rotate } from "../Header.styles";

/* ================= TOKENS M3 EXPRESSIVE ================= */

const SPRING_FAST = "cubic-bezier(0.42, 1.67, 0.21, 0.9)";
const SPRING_DEFAULT = "cubic-bezier(0.38, 1.21, 0.22, 1)";
const EFFECTS = "cubic-bezier(0.34, 0.8, 0.34, 1)";

const itemIn = keyframes`
  from { opacity: 0; transform: translateY(-8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

/* Option du menu : entrée échelonnée, couche de survol, icône et chevron animés */
const m3ItemSx = (index, { danger = false, ...extra } = {}) => ({
  borderRadius: "16px",
  animation: `${itemIn} 450ms ${SPRING_DEFAULT} both`,
  animationDelay: `${index * 50}ms`,
  transition: `background-color 200ms ${EFFECTS}, border-radius 400ms ${SPRING_FAST}, transform 400ms ${SPRING_FAST}`,
  "& .m3-icon": {
    transition: `border-radius 450ms ${SPRING_FAST}, transform 450ms ${SPRING_FAST}`,
  },
  "& .m3-chevron": {
    transition: `transform 400ms ${SPRING_FAST}`,
  },
  "&:hover": {
    backgroundColor: danger ? "rgba(186, 26, 26, 0.08)" : "rgba(0, 196, 204, 0.1)",
    "& .m3-icon": {
      borderRadius: "12px",
      transform: "rotate(-8deg) scale(1.08)",
    },
    "& .m3-chevron": { transform: "translateX(4px)" },
    ...(danger && { "& .m3-label": { color: "#ba1a1a" } }),
  },
  "&:active": {
    borderRadius: "12px",
    transform: "scale(0.98)",
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
    transition: "none",
  },
  ...extra,
});

const RoleSwitchMenu = ({
  isMobile,
  menuAnchorEl,
  handleMenuClose,
  getOtherRoles,
  handleSwitchRole,
  navigate,
  handleLogout,
}) => {
  const otherRoles = getOtherRoles();

  const actionIconSx = {
    width: isMobile ? 29 : 34,
    height: isMobile ? 30 : 35,
    borderRadius: "60%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
  };

  const actionTextStyle = {
    display: "flex",
    alignItems: "center",
    color: "black",
    fontSize: isMobile ? "0.78rem" : "0.9rem",
    fontFamily: "'Poppins', sans-serif",
  };

  return (
    <Menu
      anchorEl={menuAnchorEl}
      open={Boolean(menuAnchorEl)}
      onClose={handleMenuClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      transitionDuration={{ enter: 420, exit: 160 }}
      TransitionProps={{
        easing: { enter: SPRING_DEFAULT, exit: EFFECTS },
      }}
      PaperProps={{
        sx: {
          borderRadius: "28px",
          mt: 1,
          boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
          width: isMobile ? 260 : 335,
          px: isMobile ? 1.5 : 2,
          py: isMobile ? 1 : 2,
        },
      }}
    >
      {/* Tous les rôles sauf le rôle actuel */}
      {otherRoles.map((role, index) => (
        <React.Fragment key={role}>
          <MenuItem
            onClick={() => handleSwitchRole(role)}
            sx={m3ItemSx(index, { px: 2, py: 0.5, mb: 1 })}
          >
            <div
              style={{
                paddingRight: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                color: "black",
                fontSize: "0.9rem",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                <Box
                  sx={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 45,
                    height: 45,
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.9,
                      transform: "scale(0.7)",
                      pointerEvents: "none",
                      animation: `${rotate} 3s linear infinite`,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="100%"
                      height="100%"
                      fill="none"
                      strokeWidth="0.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <defs>
                        <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#00c4cc" />
                          <stop offset="100%" stopColor="#8b69b8" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                        stroke="url(#arrowGradient)"
                      />
                      <polyline points="3 3 3 8 8 8" stroke="url(#arrowGradient)" />
                      <path
                        d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
                        stroke="url(#arrowGradient)"
                      />
                      <polyline points="16 16 21 16 21 21" stroke="url(#arrowGradient)" />
                    </svg>
                  </Box>

                  <Avatar
                    className="m3-icon"
                    sx={{
                      width: 29,
                      height: 29,
                      backgroundImage:
                        role === "admin"
                          ? "linear-gradient(90deg,#00c4cc,#8b69b8)"
                          : role === "responsable"
                            ? "linear-gradient(90deg,#1B6979,#4CAF50)"
                            : "linear-gradient(90deg,#36d1dc,#5b86e5)",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      zIndex: 1,
                    }}
                  >
                    {role[0].toUpperCase()}
                  </Avatar>
                </Box>

                <span style={{ fontWeight: 600 }}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </div>

              <i
                className="fa-solid fa-chevron-right m3-chevron"
                style={{ fontSize: "0.9rem" }}
              />
            </div>
          </MenuItem>
          {index < otherRoles.length - 1 && (
            <Divider sx={{ borderColor: "rgba(0,0,0,0.12)", my: 0.5, mx: 1 }} />
          )}
        </React.Fragment>
      ))}

      <Divider sx={{ my: 0.5, borderColor: "rgba(0,0,0,0.12)", mx: 1 }} />

      {/* Changer mot de passe */}
      <MenuItem
        onClick={() => navigate("/change-password")}
        sx={m3ItemSx(otherRoles.length, { px: 1, py: isMobile ? 0.5 : 1.5 })}
      >
        <div style={{ ...actionTextStyle, gap: isMobile ? 10 : 15 }}>
          <Box className="m3-icon" sx={actionIconSx}>
            <i
              className="fa-solid fa-lock"
              style={{ color: "white", fontSize: isMobile ? "0.78rem" : "0.9rem" }}
            />
          </Box>
          <span className="m3-label">Changer le mot de passe</span>
        </div>
      </MenuItem>

      {/* Déconnexion */}
      <MenuItem
        onClick={handleLogout}
        sx={m3ItemSx(otherRoles.length + 1, { danger: true, px: 1, py: 1.5 })}
      >
        <div style={{ ...actionTextStyle, gap: isMobile ? 12 : 13 }}>
          <Box className="m3-icon" sx={actionIconSx}>
            <i
              className="fa-solid fa-right-from-bracket"
              style={{ color: "white", fontSize: isMobile ? "0.78rem" : "0.9rem" }}
            ></i>
          </Box>
          <span className="m3-label" style={{ transition: "color 200ms" }}>
            Se déconnecter
          </span>
        </div>
      </MenuItem>
    </Menu>
  );
};

export default RoleSwitchMenu;