// src/pages/Responsable/hooks/useServicesAndDivisions.js

import { useState, useEffect } from "react";
import { responsableService } from "../service/responsableService";

export const useServicesAndDivisions = () => {
  const [services, setServices] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(null);

  // Charger les services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await responsableService.getServices();
        setServices(data);
      } catch (error) {
        console.error("Erreur chargement services:", error);
        setServices([]);
      }
    };
    fetchServices();
  }, []);

  // Charger les divisions quand le service change
  useEffect(() => {
    if (!selectedService) {
      setDivisions([]);
      return;
    }

    setLoadingDivisions(true);
    responsableService
      .getDivisionsByService(selectedService)
      .then((data) => setDivisions(data))
      .catch((err) => {
        console.error("Erreur divisions:", err);
        setDivisions([]);
      })
      .finally(() => setLoadingDivisions(false));
  }, [selectedService]);

  const resetDivision = () => {
    setSelectedDivision(null);
  };

  return {
    services,
    divisions,
    loadingDivisions,
    selectedService,
    setSelectedService,
    selectedDivision,
    setSelectedDivision,
    resetDivision,
  };
};