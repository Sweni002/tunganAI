import { useState } from "react";
import { API_URL } from "../services/autorisationService";

export const useAutorisationForm = (admin, setConges, setSnackMessage, setSnackError, setOpenSnack) => {
  const [openMatriculeDialog, setOpenMatriculeDialog] = useState(false);
  const [step, setStep] = useState("list");
  const [loadingSelect, setLoadingSelect] = useState(false);
  const [personnels, setPersonnels] = useState([]);
  const [searchPers, setSearchPers] = useState("");
  const [selectedMatricule, setSelectedMatricule] = useState(null);
  const [selected, setSelected] = useState("sortie");
  const [periode, setPeriode] = useState("matin");
  const [isRange, setIsRange] = useState(false);
  const [dateDebut2, setDateDebut2] = useState(new Date());
  const [dateFin2, setDateFin2] = useState(new Date());
  const [motif, setMotif] = useState("");
  const [formError, setFormError] = useState("");
  const [resultType, setResultType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");

  const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Erreur inconnue");
    }

    return response.json();
  };

  const loadPersonnels = async (idserv) => {
    try {
      const data = await fetchWithAuth(
        `${API_URL}/api/personnels/service/${idserv}`
      );
      setPersonnels(data);
    } catch (err) {
      console.error(err);
    }
  };

  const resetDialogState = () => {
    setStep("list");
    setSearchPers("");
    setSelectedMatricule(null);
    setFormError("");
    setMotif("");
    setIsRange(false);
    setPeriode("matin");
    setDateDebut2(new Date());
    setDateFin2(new Date());
    setSelected("sortie");
  };

  const handleValider = async () => {
    if (loadingSelect) return;

    setLoadingSelect(true);
    setFormError("");

    try {
      if (!selectedMatricule) {
        throw new Error("Veuillez sélectionner un personnel");
      }

      if (!motif.trim()) {
        throw new Error("Le motif est obligatoire");
      }

      if (isRange && dateFin2 < dateDebut2) {
        throw new Error("La date de fin doit être supérieure à la date de début");
      }

      const payload = {
        motif: motif,
        type_autorisation: selected.toLowerCase(),
        periode: periode.toLowerCase(),
        date_debut: dateDebut2.toISOString().split("T")[0],
        date_fin: isRange ? dateFin2.toISOString().split("T")[0] : null,
        idpers: selectedMatricule.idpers,
      };

      const res = await fetchWithAuth(`${API_URL}/api/autorisations_speciales/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.success) {
        throw new Error(res.error || "Erreur lors de la création");
      }

      setModalMessage("Création réussie !");
      setResultType("success");
      setStep("success");
      
      // Rafraîchir la liste
      const refreshData = await fetchWithAuth(
        `${API_URL}/api/autorisations_speciales/${admin.responsable.idserv}`
      );
      if (refreshData?.success && Array.isArray(refreshData.data)) {
        setConges(refreshData.data);
      }

    } catch (err) {
      setResultType("error");
      setFormError(err.message || "Erreur serveur !");
      setModalMessage(err.message || "Erreur serveur !");
    } finally {
      setLoadingSelect(false);
    }
  };

  return {
    openMatriculeDialog,
    setOpenMatriculeDialog,
    step,
    setStep,
    loadingSelect,
    personnels,
    searchPers,
    setSearchPers,
    selectedMatricule,
    setSelectedMatricule,
    selected,
    setSelected,
    periode,
    setPeriode,
    isRange,
    setIsRange,
    dateDebut2,
    setDateDebut2,
    dateFin2,
    setDateFin2,
    motif,
    setMotif,
    formError,
    resultType,
    modalMessage,
    resetDialogState,
    handleValider,
    loadPersonnels,
  };
};