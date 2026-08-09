import React from "react";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import { LockIcon } from "@phosphor-icons/react";
import { RiNotification2Line } from "react-icons/ri";
import { FaTimes } from "react-icons/fa";

const MobileNav = ({
  styles,
  admin,
  drawerOpen2,
  setDrawerOpen2,
  setLockDialogOpen,
  setDrawerOpen,
  markAllAsRead,
  notifications,
  setMenuAnchorEl,
}) => {
  const isPersonnel = admin?.role === "personnel";

  return (
    <div className={styles.mobileHeader}>
      <div className={styles.left}>
        <IconButton
          onClick={() => setDrawerOpen2(!drawerOpen2)}
          sx={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1.5px solid rgba(255,255,255,0.6)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: "0 8px 22px rgba(0,0,0,0.2)",
              backgroundImage: "linear-gradient(90deg,#00b3ba,#7a5aa8)",
            },
          }}
        >
          {drawerOpen2 ? (
            <FaTimes style={{ fontSize: "1.1rem" }} />
          ) : (
            <i className="fa-solid fa-bars-staggered" style={{ fontSize: "1.1rem" }} />
          )}
        </IconButton>
      </div>

      <Box
        sx={{
          width: isPersonnel ? 50 : 130,
          height: 50,
          borderRadius: "999px",
          backgroundImage: "linear-gradient(90deg,#00c4cc,#8b69b8)",
          display: "flex",
          alignItems: "center",
          justifyContent: isPersonnel ? "center" : "space-around",
          border: "1.5px solid rgba(255,255,255,0.6)",
          pr: isPersonnel ? 0 : 0.7,
          boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
        }}
      >
        {!isPersonnel && (
          <>
            <IconButton sx={{ color: "#fff" }} onClick={() => setLockDialogOpen(true)}>
              <LockIcon size={22} />
            </IconButton>

            <IconButton
              onClick={() => {
                setDrawerOpen(true);
                markAllAsRead();
              }}
              sx={{ color: "#fff" }}
            >
              <Badge
                badgeContent={notifications.filter((n) => !n.etat).length}
                color="error"
                max={9}
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: "0.65rem",
                    height: 16,
                    minWidth: 16,
                  },
                }}
              >
                <RiNotification2Line color="white" size={21} />
              </Badge>
            </IconButton>
          </>
        )}

        <IconButton onClick={(e) => setMenuAnchorEl(e.currentTarget)} sx={{ color: "#fff" }}>
          <i className="fa-solid fa-ellipsis-vertical" style={{ fontSize: "1.1rem" }}></i>
        </IconButton>
      </Box>
    </div>
  );
};

export default MobileNav;