import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

// Logique inchangée par rapport à AjoutAuto.jsx d'origine
// (useEffect dépendant de [admin] qui fetch divisions + personnels en parallèle)
export function useDivisionsAndPersonnels(admin, fetchWithAuth, setLoading) {
  const [divisions, setDivisions] = useState([]);
  const [personnels, setPersonnels] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!admin || !admin.responsable || !admin.responsable.idrh) {
      console.log("Admin pas encore chargé, on attend...");
      return;
    }

    const idserv = admin.responsable.idserv;
    setLoading(true);

    // Fetch divisions et personnels en parallèle
    const fetchDivisions = fetchWithAuth(
      `${API_URL}/api/divisions/with_count?idserv=${idserv}`
    );

    const fetchPersonnels = fetchWithAuth(
      `${API_URL}/api/personnels/service/${admin.responsable.idserv}`
    );

    Promise.all([fetchDivisions, fetchPersonnels])
      .then(([divisionsData, personnelsData]) => {
        // ---- Divisions ----
        if (Array.isArray(divisionsData)) {
          setDivisions(divisionsData);
        } else {
          console.error("Erreur divisions:", divisionsData);
          setDivisions([]);
        }

        // ---- Personnels ----
        if (Array.isArray(personnelsData)) {
          console.log("perso ! ", personnelsData);
          setPersonnels(personnelsData);
          setErrorMsg(null);
        } else if (personnelsData.error) {
          setErrorMsg(personnelsData.error);
          setPersonnels([]);
        } else {
          setErrorMsg("Format inattendu pour personnels");
          setPersonnels([]);
        }
      })
      .catch((err) => {
        console.error("Erreur fetch divisions/personnels:", err);
        setDivisions([]);
        setPersonnels([]);
        setErrorMsg(err.message);
      })
      .finally(() => setLoading(false));
  }, [admin]); // s'exécute seulement quand 'admin' change

  return { divisions, personnels, errorMsg };
}
