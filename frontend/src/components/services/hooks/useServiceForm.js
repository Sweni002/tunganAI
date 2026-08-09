import { useState, useRef } from "react";
import { SERVICES_LIST } from "./serviceConstants";

const API_URL = import.meta.env.VITE_API_URL;

// État initial complet : infos service + les 8 plages horaires
const INITIAL_FORM_STATE = {
  nom: "",
  code: "",
  sigle: "",
  addresse: "",
  // --- Horaires (strings "HH:mm") ---
  entreeMatinDebut: "",
  entreeMatinFin: "",
  sortieMatinDebut: "",
  sortieMatinFin: "",
  entreeSoirDebut: "",
  entreeSoirFin: "",
  sortieSoirDebut: "",
  sortieSoirFin: "",
};

const INITIAL_ERRORS = {
  nom: false,
  sigle: false,
  addresse: false,
  logo: false,
  code: false,
  entreeMatinDebut: false,
  entreeMatinFin: false,
  sortieMatinDebut: false,
  sortieMatinFin: false,
  entreeSoirDebut: false,
  entreeSoirFin: false,
  sortieSoirDebut: false,
  sortieSoirFin: false,
};

// Mapping champ front (camelCase) → champ backend (snake_case)
const HORAIRE_FIELD_MAP = {
  entreeMatinDebut: "entree_matin_debut",
  entreeMatinFin: "entree_matin_fin",
  sortieMatinDebut: "sortie_matin_debut",
  sortieMatinFin: "sortie_matin_fin",
  entreeSoirDebut: "entree_soir_debut",
  entreeSoirFin: "entree_soir_fin",
  sortieSoirDebut: "sortie_soir_debut",
  sortieSoirFin: "sortie_soir_fin",
};

export const useServiceForm = (showSnackbar) => {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);

  const [preview, setPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null); // le File, indépendant de l'input DOM
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState(INITIAL_ERRORS);

  const handleInputChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      showSnackbar("Format non supporté. Utilisez JPEG, JPG ou PNG.", "error");
      return;
    }

    if (errors.logo) {
      setErrors(prev => ({ ...prev, logo: false }));
    }

    setLogoFile(file); // fiable même quand l'input DOM est démonté (étape 1 → 2)
    setPreview(URL.createObjectURL(file));
  };

  const handleSelectAddress = (address) => {
    handleInputChange('addresse', address);
  };

  // -------------------------------------------------------------------------
  // Validation ÉTAPE 1 : informations du service
  // -------------------------------------------------------------------------
  const validateForm = () => {
    const newErrors = {
      nom: !formState.nom.trim(),
      code: !formState.code.trim(),
      sigle: !formState.sigle.trim(),
      logo: !preview,
      addresse: !formState.addresse
    };
    setErrors(prev => ({ ...prev, ...newErrors }));
    return !Object.values(newErrors).some(Boolean);
  };

  // -------------------------------------------------------------------------
  // Validation ÉTAPE 2 : horaires
  // -------------------------------------------------------------------------
  const HORAIRE_FIELDS = Object.keys(HORAIRE_FIELD_MAP);

  const validateHoraires = () => {
    const f = formState;
    const newErrors = {};
    let message = null;

    // 1) Champs requis + bornes 05:00–19:00
    HORAIRE_FIELDS.forEach((field) => {
      const v = f[field];
      const invalid = !v || v < "05:00" || v > "19:00";
      newErrors[field] = invalid;
      if (invalid && !message) {
        message = !v
          ? "Toutes les plages horaires sont requises."
          : "Les heures doivent être comprises entre 05h00 et 19h00.";
      }
    });

    // 2) Cohérence début < fin de chaque plage
    const plages = [
      ["entreeMatinDebut", "entreeMatinFin"],
      ["sortieMatinDebut", "sortieMatinFin"],
      ["entreeSoirDebut", "entreeSoirFin"],
      ["sortieSoirDebut", "sortieSoirFin"],
    ];
    plages.forEach(([debut, fin]) => {
      if (f[debut] && f[fin] && f[debut] >= f[fin]) {
        newErrors[debut] = true;
        newErrors[fin] = true;
        if (!message) message = "Chaque heure de fin doit être après l'heure de début.";
      }
    });

    // 3) Pas de chevauchement matin / soir (même règle que le backend)
    if (f.sortieMatinFin && f.entreeSoirDebut && f.sortieMatinFin > f.entreeSoirDebut) {
      newErrors.sortieMatinFin = true;
      newErrors.entreeSoirDebut = true;
      if (!message) message = "Chevauchement entre les horaires du matin et du soir.";
    }

    setErrors(prev => ({ ...prev, ...newErrors }));

    const isValid = !Object.values(newErrors).some(Boolean);
    if (!isValid && message) {
      showSnackbar(message, "error");
    }
    return isValid;
  };

  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setPreview(null);
    setLogoFile(null);
    setErrors(INITIAL_ERRORS);
  };

  // -------------------------------------------------------------------------
  // UN SEUL APPEL API : POST /api/services/ (multipart)
  // Envoie les infos du service + le logo + les 8 horaires dans le même
  // FormData. Le backend crée tout dans une transaction atomique :
  // plus de cas partiel "service créé mais horaires échoués".
  // -------------------------------------------------------------------------
  const handleCreateService = async () => {
    // Re-validation complète avant l'envoi
    if (!validateForm() || !validateHoraires()) return false;

    setLoading(true);

    const formData = new FormData();
    // --- Champs service ---
    formData.append("nom", formState.nom);
    formData.append("code_service", formState.code);
    formData.append("sigle", formState.sigle);
    formData.append("addresse", formState.addresse);
    if (logoFile) {
      formData.append("logo", logoFile);
    }
    // --- Champs horaires (camelCase → snake_case) ---
    Object.entries(HORAIRE_FIELD_MAP).forEach(([front, back]) => {
      formData.append(back, formState[front]);
    });

    try {
      const response = await fetch(`${API_URL}/api/services-horaires/`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const data = await response.json();

      if (!response.ok) {
        // 400 (champ/plage invalide) ou 409 (doublon) : rien n'a été créé
        showSnackbar(data.error || "Erreur lors de l'ajout", "error");
        return false;
      }

      showSnackbar(data.message || "Le service et ses horaires ont été créés avec succès.", "success");
      resetForm();
      return true;

    } catch (error) {
      showSnackbar(error.message || "Erreur interne", "error");
      console.error("Erreur d'ajout :", error);
      return false;

    } finally {
      setLoading(false);
    }
  };

  return {
    formState,
    errors,
    preview,
    logoFile,
    loading,
    fileInputRef,
    handleInputChange,
    handleFileChange,
    handleSelectAddress,
    validateForm,
    validateHoraires,
    handleCreateService,
    resetForm,
    setLoading,
    setFormState,
    setErrors,
    setPreview
  };
};