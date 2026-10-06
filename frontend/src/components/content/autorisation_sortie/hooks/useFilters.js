import { useState } from "react";
import dayjs from "dayjs";
import autorisationService from "../services/autorisationService";

// Les routes « spéciales » renvoient soit une liste, soit { success, data }
const toList = (res) => (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);

/**
 * Filtres de la page Autorisations de sortie.
 * Toutes les requêtes sont limitées au service (idserv) et portent sur les
 * autorisations SPÉCIALES : la version partagée avec la page Autorisations
 * d'absence interrogeait les autorisations d'absence, tous services confondus pour la date.
 */
export const useFilters = (setConges, setSnackMessage, setSnackError, setOpenSnack) => {
  const [dateDebutFiltre, setDateDebutFiltre] = useState("");
  const [dateFinFiltre, setDateFinFiltre] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [pickerType, setPickerType] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorEl2, setAnchorEl2] = useState(null);

  const notify = (message, isError = false) => {
    setSnackMessage(message);
    setSnackError(isError);
    setOpenSnack(true);
  };

  const notifyCount = (list) => {
    const n = list.length;
    notify(`${n} autorisation${n > 1 ? "s" : ""} trouvée${n > 1 ? "s" : ""}`);
  };

  const handleFiltrerParDates = async (idserv) => {
    if (!idserv) return;

    if (!dateDebutFiltre || !dateFinFiltre) {
      notify("Veuillez sélectionner les deux dates pour filtrer.", true);
      return;
    }
    if (dayjs(dateDebutFiltre).isAfter(dayjs(dateFinFiltre))) {
      notify("La date de début ne peut pas être supérieure à la date de fin.", true);
      return;
    }

    try {
      const res = await autorisationService.getAutorisationsSpecialesBetweenDates(
        idserv,
        dayjs(dateDebutFiltre).format("YYYY-MM-DD"),
        dayjs(dateFinFiltre).format("YYYY-MM-DD")
      );
      const list = toList(res);
      setSelectedDate("");
      setConges(list);
      notifyCount(list);
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleResetFiltre = async (idserv) => {
    setDateDebutFiltre("");
    setDateFinFiltre("");
    setSelectedDate("");
    if (!idserv) return;

    try {
      setConges(toList(await autorisationService.getAutorisationsSpeciales(idserv)));
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleFiltrerParDateUnique = async (date, idserv) => {
    if (!date || !idserv) return;

    try {
      const res = await autorisationService.getAutorisationsSpecialesByDate(
        idserv,
        dayjs(date).format("YYYY-MM-DD")
      );
      const list = toList(res);
      setDateDebutFiltre("");
      setDateFinFiltre("");
      setConges(list);
      notifyCount(list);
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleOpenDatePicker = (type) => (event) => {
    setPickerType(type);
    if (type === "debut") setAnchorEl(event.currentTarget);
    else setAnchorEl2(event.currentTarget);
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
