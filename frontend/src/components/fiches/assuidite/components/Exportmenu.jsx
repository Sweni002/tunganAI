import React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Spin } from "antd";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import styles from "../assiduite.module.css";

const ExportMenu = ({
  loadingPdf1,
  handleClick3,
  anchorEl3,
  open3,
  handleClose3,
  handleExport,
}) => {
  return (
    <>
      <button
        type="button"
        className={styles.exportBtn}
        onClick={handleClick3}
        disabled={loadingPdf1}
        aria-label="Exporter en Excel"
      >
        {loadingPdf1 ? <Spin size="small" /> : <i className="fa-solid fa-download" aria-hidden="true"></i>}
        Exporter
        <ArrowDropDownIcon fontSize="small" />
      </button>

      <Menu
        anchorEl={anchorEl3}
        open={open3}
        onClose={handleClose3}
        PaperProps={{
          sx: { fontFamily: "Poppins" },
        }}
      >
        <MenuItem onClick={() => handleExport("all")} sx={{ fontFamily: "Poppins", fontSize: "0.9rem" }}>
          Tout
        </MenuItem>

        <MenuItem onClick={() => handleExport("bureau")} sx={{ fontFamily: "Poppins", fontSize: "0.9rem" }}>
          Agent de bureau
        </MenuItem>

        <MenuItem onClick={() => handleExport("surface")} sx={{ fontFamily: "Poppins", fontSize: "0.9rem" }}>
          Agent de surface
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportMenu;