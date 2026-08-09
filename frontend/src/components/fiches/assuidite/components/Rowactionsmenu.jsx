import React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ITEM_HEIGHT } from "../Assiduite.styles";

const RowActionsMenu = ({ menuAnchor, open, handleMenuClose, setConfirmOpen }) => {
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
          setConfirmOpen(true);
          handleMenuClose();
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <i
            className="fa-regular fa-trash-can"
            style={{ color: "#ff4d4f", marginRight: 12, fontSize: 18 }}
          ></i>
          <span style={{ fontSize: 18 }}>Supprimer</span>
        </div>
      </MenuItem>

      <MenuItem>
        <div style={{ display: "flex", alignItems: "center" }}>
          <i
            className="fa-solid fa-eye"
            style={{ color: "#1890ff", marginRight: 12, fontSize: 18 }}
          ></i>
          <span style={{ fontSize: 17 }}>Voir fiche d'assiduité</span>
        </div>
      </MenuItem>
    </Menu>
  );
};

export default RowActionsMenu;