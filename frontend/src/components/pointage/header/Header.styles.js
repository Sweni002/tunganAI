import { styled, keyframes } from "@mui/material/styles";
import Badge from "@mui/material/Badge";
import Dialog from "@mui/material/Dialog";

export const menuItemStyle = {
  borderRadius: 2,
  py: 1.5,
  px: 1.5,
  mb: 0.5,
  "&:hover": {
    backgroundColor: "rgba(0,0,0,0.04)",
  },
};

export const textStyle = {
  sx: {
    textTransform: "uppercase",
    fontWeight: 400,
    fontSize: "0.78rem",
    letterSpacing: "0.5px",
    fontFamily: "'Poppins', sans-serif",
  },
};

export const subItemStyle = {
  pl: 4,
  py: 1.5,
  borderRadius: 2,
  "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
};

export const subTextStyle = {
  sx: {
    textTransform: "uppercase",
    fontWeight: 400,
    fontSize: "0.72rem",
    letterSpacing: "0.4px",
  },
};

export const menuTextStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 11,
  color: "black",
  fontSize: "0.9rem",
  fontFamily: "'Poppins', sans-serif",
};

export const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

export const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "30px",
    padding: theme.spacing(4),
    width: "100%",
    maxWidth: "500px",
  },
  "& .MuiDialog-container": {
    alignItems: "flex-start",
    marginTop: theme.spacing(12),
  },
}));

export const StyledConfirmDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: "20px",
    padding: theme.spacing(2),
    maxWidth: 400,
    width: "90%",
    backgroundColor: "#fff",
  },
}));