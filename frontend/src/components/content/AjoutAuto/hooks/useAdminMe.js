import { useEffect, useRef, useState } from "react";

// Logique inchangée par rapport à AjoutAuto.jsx d'origine (fetchAdmin)
export function useAdminMe(fetchMe) {
  const [admin, setAdmin] = useState(null);
  const isFetching = useRef(false);

  useEffect(() => {
    const fetchAdmin = async () => {
      if (isFetching.current) return; // Stop si déjà en cours
      isFetching.current = true;

      try {
        const data = await fetchMe(); // ⚠️ Assure-toi que fetchMe renvoie {id, nom, role, ...}
        setAdmin(data);
        console.log("me1 : ", data);
      } catch (err) {
        console.error("Erreur fetchMe:", err);
        setAdmin(null); // si non authentifié
      } finally {
        isFetching.current = false;
      }
    };
    fetchAdmin();
  }, []);

  return admin;
}
