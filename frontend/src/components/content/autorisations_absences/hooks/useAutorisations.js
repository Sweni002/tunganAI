import { useState, useEffect, useRef } from "react";
import { autorisationService } from "../services/autorisationService";
import { useNavigate } from "react-router-dom";

export const useAutorisations = (admin) => {
  const navigate = useNavigate();
  const [conges, setConges] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const isFetching = useRef(false);
  const [selectedDivision, setSelectedDivision] = useState(null);

  const fetchAutorisations = async (idserv) => {
    try {
      const data = await autorisationService.getAutorisations(idserv);
      setConges(data);
      return data;
    } catch (err) {
      setErrorMsg(err.message);
      throw err;
    }
  };

  const fetchDivisions = async (idserv) => {
    try {
      const data = await autorisationService.getDivisions(idserv);
      setDivisions(data);
      return data;
    } catch (err) {
      setErrorMsg(err.message);
      throw err;
    }
  };

  const loadData = async (idserv) => {
    if (!idserv) return;
    
    setLoading(true);
    setLoadingPage(true);
    
    try {
      const [divisionsData, personnelsData] = await Promise.all([
        fetchDivisions(idserv),
        fetchAutorisations(idserv),
      ]);
      
      setDivisions(Array.isArray(divisionsData) ? divisionsData : []);
      setConges(Array.isArray(personnelsData) ? personnelsData : []);
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