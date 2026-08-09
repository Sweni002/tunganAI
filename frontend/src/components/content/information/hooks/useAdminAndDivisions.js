// hooks/useAdminAndDivisions.js
import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../../../../AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Récupère l'admin courant (fetchMe) puis les divisions/services rattachés
 * à son idpers. Redirige vers /login si l'utilisateur n'est pas résolu.
 */
export function useAdminAndDivisions({ navigate }) {
  const { fetchMe } = useContext(AuthContext);
  const [admin, setAdmin] = useState(null);
  const [services, setServices] = useState([]);
  const isFetching = useRef(false);

  useEffect(() => {
    const fetchAdminAndDivisions = async () => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        const data = await fetchMe();
        setAdmin(data);

        if (!data || !data.personnel || !data.personnel.idpers) {
          navigate('/login');
          return;
        }

        const res = await fetch(`${API_URL}/api/divisions/by_personnel?idpers=${data.personnel.idpers}`, {
          credentials: 'include',
        });
        const divData = await res.json();

        if (Array.isArray(divData)) {
          setServices(divData);
        } else {
          console.error('Réponse API invalide :', divData);
        }
      } catch (err) {
        console.error('Erreur fetch admin ou divisions :', err);
        navigate('/login');
      } finally {
        isFetching.current = false;
      }
    };

    fetchAdminAndDivisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { admin, services };
}
