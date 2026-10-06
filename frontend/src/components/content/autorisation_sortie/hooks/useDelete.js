import { useState } from "react";
import autorisationService from "../services/autorisationService";

/**
 * Suppression d'une autorisation SPÉCIALE (la version partagée supprimait via
 * la route des autorisations d'absence, donc sur la mauvaise table).
 */
export const useDelete = (setConges, setSnackMessage, setSnackError, setOpenSnack) => {
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
      const res = await autorisationService.deleteAutorisationSpeciale(recordToDelete.id);
      setSnackMessage(res.message || "Autorisation supprimée");
      setSnackError(false);
      setOpenSnack(true);
      setConges((prev) => prev.filter((c) => c.id !== recordToDelete.id));
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
