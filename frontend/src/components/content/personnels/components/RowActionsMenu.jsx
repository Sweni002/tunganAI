import React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

const ITEM_HEIGHT = 48;

export default function RowActionsMenu({ menuAnchor, open, handleMenuClose, selectedRecord, voirFicheAssiduite }) {
  return (
    <Menu
      id="long-menu"
      anchorEl={menuAnchor}
      open={open}
      onClose={handleMenuClose}
      PaperProps={{
        style: {
          maxHeight: ITEM_HEIGHT * 4.5,
          width: "30ch",
        },
      }}
      MenuListProps={{
        "aria-labelledby": "long-button",
      }}
    >
      <MenuItem
        onClick={() => {
          voirFicheAssiduite(selectedRecord);
          handleMenuClose();
        }}
      >
        <i className="fa-solid fa-eye" style={{ marginRight: 12, color: "#1890ff" }}></i>
        <span style={{ fontSize: 18 }}>Voir fiche d’assiduité</span>
      </MenuItem>
    </Menu>
  );
}