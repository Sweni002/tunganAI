// src/pages/Responsable/hooks/useResponsableForm.js

import { useState } from "react";

export const useResponsableForm = () => {
  const [formData, setFormData] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    email: "",
    tel: "",
    password: "",
    selectedService: "",
    selectedDivision: null,
    selectedImage: null,
    preview: null,
    faceDescriptor: null,
  });

  const [errors, setErrors] = useState({
    matricule: false,
    nom: false,
    prenom: false,
    tel: false,
    division: false,
    services: false,
    photo: false,
    email: false,
    password: false,
  });

  const validateForm = () => {
    const newErrors = {
      matricule: !formData.matricule.trim(),
      nom: !formData.nom.trim(),
      prenom: !formData.prenom.trim(),
      email: !formData.email.trim(),
      services: !formData.selectedService,
      photo: !formData.preview,
      division: !formData.selectedDivision,
      password: !formData.password,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const resetForm = () => {
    setFormData({
      matricule: "",
      nom: "",
      prenom: "",
      email: "",
      tel: "",
      password: "",
      selectedService: "",
      selectedDivision: null,
      selectedImage: null,
      preview: null,
      faceDescriptor: null,
    });
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    validateForm,
    updateField,
    resetForm,
  };
};