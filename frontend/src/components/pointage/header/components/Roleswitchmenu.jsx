import React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { rotate } from "../Header.styles";

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

  return (
    <Menu
      anchorEl={menuAnchorEl}
      open={Boolean(menuAnchorEl)}
      onClose={handleMenuClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          mt: 1,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          width: isMobile ? 260 : 335,
          px: isMobile ? 2 : 3,
          py: isMobile ? 1 : 3,
        },
      }}
    >
      {/* Dynamique : affiche tous les rôles sauf le rôle actuel */}
      {otherRoles.map((role, index) => (
        <React.Fragment key={role}>
          <MenuItem
            onClick={() => handleSwitchRole(role)}
            sx={{ px: 2, py: 0, mb: 1.5, borderRadius: 2 }}
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
                    className="arrows-container"
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

                <span style={{ fontWeight: 500 }}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </div>

              <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.9rem" }} />
            </div>
          </MenuItem>
          {index < otherRoles.length - 1 && (
            <Divider sx={{ borderColor: "rgba(0,0,0,0.15)", my: 0.5, mx: 1 }} />
          )}
        </React.Fragment>
      ))}

      <Divider sx={{ my: 0.5, borderColor: "rgba(0,0,0,0.15)", mx: 1 }} />

      {/* Changer mot de passe */}
      <MenuItem
        onClick={() => navigate("/change-password")}
        sx={{ px: isMobile ? 1 : 1, py: isMobile ? 0 : 1.5, borderRadius: 2 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 10 : 15,
            color: "black",
            fontSize: isMobile ? "0.78rem" : "0.9rem",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <Box
            sx={{
              width: isMobile ? 29 : 34,
              height: isMobile ? 30 : 35,
              borderRadius: "60%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
            }}
          >
            <i
              className="fa-solid fa-lock"
              style={{ color: "white", fontSize: isMobile ? "0.78rem" : "0.9rem" }}
            />
          </Box>
          <span>Changer le mot de passe</span>
        </div>
      </MenuItem>

      {/* Déconnexion */}
      <MenuItem onClick={handleLogout} sx={{ px: 1, py: 1.5, borderRadius: 2 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 12 : 13,
            color: "black",
            fontSize: isMobile ? "0.78rem" : "0.9rem",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <Box
            sx={{
              width: isMobile ? 29 : 34,
              height: isMobile ? 30 : 35,
              borderRadius: "60%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
            }}
          >
            <i
              className="fa-solid fa-right-from-bracket"
              style={{ color: "white", fontSize: isMobile ? "0.78rem" : "0.9rem" }}
            ></i>
          </Box>
          <span>Se déconnecter</span>
        </div>
      </MenuItem>
    </Menu>
  );
};

export default RoleSwitchMenu;