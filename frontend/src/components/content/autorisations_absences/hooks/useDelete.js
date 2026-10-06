import { useState } from "react";
import { autorisationService } from "../services/autorisationService";

export const useDelete = (onDeleted, setSnackMessage, setSnackError, setOpenSnack) => {
  const [loadingSupp, setLoadingSupp] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    
    setLoadingSupp(true);
    try {
      const res = await autorisationService.deleteAutorisation(recordToDelete.id);
      setSnackMessage(res.message);
      setSnackError(false);
      setOpenSnack(true);
      onDeleted(); // recharge la page courante (le total a changé)
    } catch (err) {
      setSnackMessage(err.message || "Erreur inconnue");
      setSnackError(true);
      setOpenSnack(true);
    } finally {
      setConfirmOpen(false);
      setRecordToDelete(null);
      setLoadingSupp(false);
    }
  };

  return {
    loadingSupp,
    confirmOpen,
    recordToDelete,
    handleDeleteClick,
    handleConfirmDelete,
    setConfirmOpen,
  };
};