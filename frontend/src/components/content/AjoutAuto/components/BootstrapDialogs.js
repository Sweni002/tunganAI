import Dialog from "@mui/material/Dialog";
import { styled } from "@mui/material/styles";

export const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: theme.spacing(3),
    width: "100%",
    maxWidth: "500px",
  },
}));

export const BootstrapDialog2 = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: theme.spacing(0),
    width: "100%",
    maxWidth: "400px",
  },
}));
