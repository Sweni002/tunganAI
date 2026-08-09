// hooks/useExportExcel.js
import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

const formatDateForAPI = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const triggerDownload = (blob, filename) => {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};

export function useExportExcel({ idpers, selectedDivision, navigate, showSnack }) {
  const [loadingPdf, setLoadingPdf] = useState(false); // export période
  const [loadingPdf1, setLoadingPdf1] = useState(false); // export jour

  const downloadViaFetch = useCallback(
    async (url, filename, setFlag) => {
      setFlag(true);
      try {
        const response = await fetch(url, { method: 'GET', credentials: 'include' });

        if (response.status === 401) {
          navigate('/login');
          throw new Error('Session expirée, veuillez vous reconnecter.');
        }
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }

        const blob = await response.blob();
        triggerDownload(blob, filename);
        showSnack('Exportation réussie', false);
      } catch (error) {
        console.error('Erreur export excel:', error);
        showSnack(error.message || "Erreur lors de l'export", true);
      } finally {
        setFlag(false);
      }
    },
    [navigate, showSnack]
  );

  // Export "période" (dateDebutFiltre -> dateFinFiltre)
  const downloadPDF = useCallback(
    (dateDebutFiltre, dateFinFiltre) => {
      if (!dateDebutFiltre || !dateFinFiltre) {
        showSnack('Veuillez sélectionner une date de début et une date de fin pour exporter en excel.', true);
        return;
      }
      const url = `${API_URL}/api/pointage/facial/excel/periode/personnel/${idpers}?date_debut=${formatDateForAPI(dateDebutFiltre)}&date_fin=${formatDateForAPI(dateFinFiltre)}`;
      const filename = `pointages_${dateDebutFiltre}_au_${dateFinFiltre}.xlsx`;
      downloadViaFetch(url, filename, setLoadingPdf);
    },
    [idpers, showSnack, downloadViaFetch]
  );

  // Export "jour" (selectedDate) — division si sélectionnée, sinon personnel courant
  const exportExcel = useCallback(
    (selectedDate) => {
      if (!selectedDate) {
        showSnack('Sélectionner une date pour exporter en excel.', true);
        return;
      }
      const url = selectedDivision
        ? `${API_URL}/api/pointage/facial/pdf/division/?date=${selectedDate}&iddiv=${selectedDivision}`
        : `${API_URL}/api/pointage/facial/excel/personnel/${idpers}?date=${selectedDate}`;
      const filename = `pointages_${selectedDate}.xlsx`;
      downloadViaFetch(url, filename, setLoadingPdf1);
    },
    [idpers, selectedDivision, showSnack, downloadViaFetch]
  );

  return { downloadPDF, exportExcel, loadingPdf, loadingPdf1 };
}
