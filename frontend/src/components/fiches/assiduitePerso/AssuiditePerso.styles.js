import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import TextField from "@mui/material/TextField";

export const ITEM_HEIGHT = 48;

export const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "white",
    borderRadius: "25px",
    padding: theme.spacing(3),
    width: "100%",
    maxWidth: "400px",
  },
}));

export const CustomTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    padding: 0,
  },
  "& .MuiOutlinedInput-input": {
    padding: "10px 14px",
  },
}));
