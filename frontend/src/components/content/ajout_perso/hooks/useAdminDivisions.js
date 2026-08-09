import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

// Logique inchangée par rapport à AjoutPerso.jsx d'origine (fetchAdminAndDivisions)
export function useAdminDivisions(fetchMe) {
  const navigate = useNavigate();
  const [services, setServices] = useState([]); // liste des services
  const [admin, setAdmin] = useState(null);
  const isFetching = useRef(false);

  useEffect(() => {
    const fetchAdminAndDivisions = async () => {
      if (isFetching.current) return; // Stop si déjà en cours
      isFetching.current = true;

      try {
        // 1️⃣ Récupérer les infos de l'admin
        const data = await fetchMe();
        setAdmin(data);

        if (!data || !data.responsable || !data.responsable.idrh) {
          navigate("/login");
          return;
        }

        // 2️⃣ Fetch divisions/services selon idrh du responsable
        const res = await fetch(
          `${API_URL}/api/divisions//by_service?idserv=${data.responsable.idserv}`,
          { credentials: "include" }
        );
        const divData = await res.json();

        if (Array.isArray(divData)) {
          console.log("Divisions :", divData);
          setServices(divData); // ou setDivisions si tu veux stocker dans divisions
        } else {
          console.error("Réponse API invalide :", divData);
        }
      } catch (err) {
        console.error("Erreur fetch admin ou divisions :", err);
        navigate("/login");
      } finally {
        isFetching.current = false;
      }
    };

    fetchAdminAndDivisions();
  }, []);

  return { admin, services };
}