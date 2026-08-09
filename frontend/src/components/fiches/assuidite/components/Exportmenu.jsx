import React from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Tooltip, Spin } from "antd";
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
      <Tooltip title="Exporter en Excel" arrow>
        <div className={styles.pdf} aria-label="Exporter en Excel">
          <IconButton
            size="medium"
            onClick={handleClick3}
            disabled={loadingPdf1}
            sx={{ gap: 0.7 }}
          >
            {loadingPdf1 ? (
              <Spin size="default" />
            ) : (
              <>
                <i className="fa-solid fa-download"></i>
                <ArrowDropDownIcon fontSize="small" />
              </>
            )}
          </IconButton>
        </div>
      </Tooltip>

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