import { useState } from "react";
import dayjs from "dayjs";

export const useFilters = (applyFilters, setSnackMessage, setSnackError, setOpenSnack) => {
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

    // Le serveur filtre et pagine : on se contente de transmettre la plage
    setSelectedDate("");
    applyFilters({
      start: dayjs(dateDebutFiltre).format("YYYY-MM-DD"),
      end: dayjs(dateFinFiltre).format("YYYY-MM-DD"),
    });
  };

  const handleResetFiltre = async () => {
    setDateDebutFiltre("");
    setDateFinFiltre("");
    setSelectedDate("");
    applyFilters({});
  };

  const handleFiltrerParDateUnique = async (date) => {
    if (!date) return;
    setDateDebutFiltre("");
    setDateFinFiltre("");
    applyFilters({ date: dayjs(date).format("YYYY-MM-DD") });
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