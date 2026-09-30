import React from "react";
import { Avatar } from "@mui/material";
import { StyledBadge } from "../Header.styles";
import { stringAvatar } from "../Header.utils";

/**
 * Bloc compte (admin / responsable / personnel).
 * - imageSrc non fourni -> initiales (admin)
 * - imageSrc toujours fourni -> image (responsable)
 * - imageSrc conditionnel + initialsName -> image ou initiales (personnel)
 *
 * Avatar seul au repos, nom + rôle au survol (header.module.css : .avatar / .nom).
 * Nom trop long : coupé avec "…" + nom complet en info-bulle.
 */
const AccountBadge = ({
  styles,
  darkMode,
  onClick,
  name,
  subtitle,
  imageSrc,
  initialsName,
  width = 47,
  height = 45,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <div
      className={`${styles.avatar} ${darkMode ? styles.avatarDark : ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Compte de ${name}${subtitle ? `, ${subtitle}` : ""}`}
      title={name}
    >
      <div className={`${styles.nom} ${darkMode ? styles.nomDark : ""}`}>
        <h3>{name}</h3>
        <p>{subtitle}</p>
      </div>

      <StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        variant="dot"
      >
        <Avatar
          src={imageSrc}
          alt={name}
          {...(!imageSrc && stringAvatar(initialsName || ""))}
          sx={{
            width,
            height,
            backgroundColor: "#1B6979",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "0.8rem",
          }}
        />
      </StyledBadge>
    </div>
  );
};

export default AccountBadge;