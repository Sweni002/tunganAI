// hooks/useSavePersonnel.js
import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export function useSavePersonnel({ idpers, personnel, setMsg, setOpenSnack }) {
  const [loading, setLoading] = useState(false);

  const handleCreateResponsable = async ({ matricule, nom, prenom, email, selectedService, selectedImage, selectedFaceDescriptor }) => {
    setLoading(true);
    setMsg('');

    const formData = new FormData();
    formData.append('matricule', matricule);
    formData.append('nom', nom);
    formData.append('prenom', prenom);
    formData.append('email', email);
    formData.append('role', personnel.role);
    formData.append('iddiv', selectedService);
    formData.append('idrh', personnel.idrh);
    formData.append('mot_de_passe', '');

    if (selectedImage) {
      formData.append('image', selectedImage);
    }
    if (selectedFaceDescriptor) {
      formData.append('faceapi_descriptor', JSON.stringify(selectedFaceDescriptor));
    }

    try {
      const response = await fetch(`${API_URL}/api/personnels/${idpers}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMsg(data.error);
        setOpenSnack(true);
        setLoading(false);
        return;
      }

      setLoading(false);
      setMsg(data.message);
      setOpenSnack(true);
    } catch (error) {
      console.error("Erreur d'ajout :", error);
      setMsg(error.message);
      setOpenSnack(true);
      setLoading(false);
    }
  };

  return { loading, handleCreateResponsable };
}
