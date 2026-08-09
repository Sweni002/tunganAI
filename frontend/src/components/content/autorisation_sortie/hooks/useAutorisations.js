import { useState } from "react";
import autorisationService from "../services/autorisationService";

export const useAutorisations = (admin, type = "standard") => {
  const [conges, setConges] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(null);

  const loadData = async (idserv) => {
    if (!idserv) return;
    
    setLoading(true);
    setLoadingPage(true);
    
    try {
      // Récupérer les divisions
      const divisionsData = await autorisationService.getDivisions(idserv);
      setDivisions(Array.isArray(divisionsData) ? divisionsData : []);
      
      // Récupérer les autorisations selon le type
      let personnelsData;
      if (type === "speciales") {
        personnelsData = await autorisationService.getAutorisationsSpeciales(idserv);
        if (personnelsData?.success && Array.isArray(personnelsData.data)) {
          setConges(personnelsData.data);
        } else {
          setConges([]);
        }
      } else {
        personnelsData = await autorisationService.getAutorisations(idserv);
        setConges(Array.isArray(personnelsData) ? personnelsData : []);
      }
      
      setErrorMsg(null);
    } catch (err) {
      console.error("Erreur fetch:", err);
      setConges([]);
      setDivisions([]);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      setLoadingPage(false);
    }
  };

  const filterByDivision = (divisionId) => {
    setSelectedDivision(divisionId);
  };

  return {
    conges,
    setConges,
    divisions,
    loading,
    loadingPage,
    errorMsg,
    selectedDivision,
    loadData,
    filterByDivision,
  };
};