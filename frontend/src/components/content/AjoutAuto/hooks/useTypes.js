import { useEffect, useState } from "react";

// Logique inchangée par rapport à AjoutAuto.jsx d'origine (fetchTypes)
// ⚠️ Le comportement d'origine (setErrors(err.message) en cas d'échec,
// qui remplace l'objet errors par une chaîne) est conservé tel quel.
export function useTypes(fetchWithAuth, setLoading, setErrors) {
  const [types, setTypes] = useState([]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const data = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/types/`);
        setTypes(data); // supposé retourner [{idtype, nomtype}, ...]
        setLoading(false);
      } catch (err) {
        setErrors(err.message);
        setLoading(false);
      }
    };

    fetchTypes();
  }, []);

  return types;
}
