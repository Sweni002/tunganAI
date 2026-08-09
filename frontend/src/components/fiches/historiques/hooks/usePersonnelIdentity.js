// hooks/usePersonnelIdentity.js
import { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../../AuthContext';

/**
 * Détermine l'utilisateur courant (via fetchMe) et en déduit idpers, en
 * donnant priorité au state de navigation (location.state.idpers) sur le
 * profil utilisateur (admin.personnel.idpers).
 *
 * Équivalent de useAdminAuth (module presences/) mais pour un contexte
 * "personnel" (idpers) plutôt que "responsable" (idrh/idserv).
 */
export function usePersonnelIdentity() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchMe } = useContext(AuthContext);

  const [admin, setAdmin] = useState(null);
  const [idpers, setIdpers] = useState(null);
  const isFetching = useRef(false);

  useEffect(() => {
    const initAdmin = async () => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        const data = await fetchMe();
        setAdmin(data);

        // Priorité 1 : idpers transmis via la navigation
        if (location.state?.idpers) {
          setIdpers(location.state.idpers);
        }
        // Priorité 2 : idpers du profil connecté
        else if (data?.personnel?.idpers) {
          setIdpers(data.personnel.idpers);
        }
      } catch (err) {
        console.error('Erreur fetchMe:', err);
        navigate('/login');
        setAdmin(null);
        setIdpers(null);
      } finally {
        isFetching.current = false;
      }
    };

    initAdmin();
  }, [fetchMe, location.state, navigate]);

  return { admin, idpers, navigate };
}
