import React from "react";
import { Avatar } from "@mui/material";
import { StyledBadge } from "../Header.styles";
import { stringAvatar } from "../Header.utils";

/**
 * Reproduit exactement les 3 blocs ".avatar" (admin / responsable / personnel)
 * de l'ancien Header, en factorisant le balisage commun.
 *
 * - imageSrc non fourni  -> comportement identique au bloc "admin" d'origine (toujours initiales)
 * - imageSrc toujours fourni (même invalide) -> comportement "responsable" d'origine
 * - imageSrc conditionnel + initialsName -> comportement "personnel" d'origine
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
  return (
    <div
      className={`${styles.avatar} ${darkMode ? styles.avatarDark : ""}`}
      onClick={onClick}
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