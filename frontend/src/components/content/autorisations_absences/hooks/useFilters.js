import { useState } from "react";
import dayjs from "dayjs";
import { autorisationService } from "../services/autorisationService";

export const useFilters = (setConges, setSnackMessage, setSnackError, setOpenSnack) => {
  const [dateDebutFiltre, setDateDebutFiltre] = useState("");
  const [dateFinFiltre, setDateFinFiltre] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [pickerType, setPickerType] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorEl2, setAnchorEl2] = useState(null);

  const handleFiltrerParDates = async (idserv) => {
    if (!dateDebutFiltre || !dateFinFiltre) {
      setSnackMessage("Veuillez sélectionner les deux dates pour filtrer.");
      setSnackError(true);
      setOpenSnack(true);
      return;
    }

    if (dayjs(dateDebutFiltre).isAfter(dayjs(dateFinFiltre))) {
      setSnackMessage("La date de début ne peut pas être supérieure à la date de fin.");
      setSnackError(true);
      setOpenSnack(true);
      return;
    }

    try {
      const startIso = dayjs(dateDebutFiltre).format("YYYY-MM-DD");
      const endIso = dayjs(dateFinFiltre).format("YYYY-MM-DD");
      
      const res = await autorisationService.getAutorisationsBetweenDates(
        idserv,
        startIso,
        endIso
      );
      
      const count = Array.isArray(res) ? res.length : 0;
      setSnackMessage(`${count} autorisation${count > 1 ? "s" : ""} trouvée${count > 1 ? "s" : ""}`);
      setSnackError(false);
      setOpenSnack(true);
      setConges(res);
    } catch (err) {
      setSnackMessage(err.message);
      setSnackError(true);
      setOpenSnack(true);
    }
  };

  const handleResetFiltre = async (idserv) => {
    setDateDebutFiltre("");
    setDateFinFiltre("");
    try {
      const data = await autorisationService.getAutorisations(idserv);
      setConges(data);
    } catch (err) {
      setSnackMessage(err.message);
      setSnackError(true);
      setOpenSnack(true);
    }
  };

  const handleFiltrerParDateUnique = async (date) => {
    if (!date) return;
    
    try {
      const data = await autorisationService.getAutorisationsByDate(date);
      const count = Array.isArray(data) ? data.length : 0;
      setSnackMessage(`${count} autorisation${count > 1 ? "s" : ""} trouvée${count > 1 ? "s" : ""}`);
      setSnackError(false);
      setOpenSnack(true);
      setConges(data);
    } catch (err) {
      setSnackMessage(err.message);
      setSnackError(true);
      setOpenSnack(true);
    }
  };

  const handleOpenDatePicker = (type) => (event) => {
    setPickerType(type);
    if (type === "debut") {
      setAnchorEl(event.currentTarget);
    } else {
      setAnchorEl2(event.currentTarget);
    }
  };

  const handleClosePicker = () => {
    setAnchorEl(null);
    setAnchorEl2(null);
  };

  return {
    dateDebutFiltre,
    setDateDebutFiltre,
    dateFinFiltre,
    setDateFinFiltre,
    selectedDate,
    setSelectedDate,
    pickerType,
    anchorEl,
    anchorEl2,
    handleFiltrerParDates,
    handleResetFiltre,
    handleFiltrerParDateUnique,
    handleOpenDatePicker,
    handleClosePicker,
  };
};