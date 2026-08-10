// hooks/useAdminAuth.js
import { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../../AuthContext';

/**
 * Détermine l'utilisateur courant (via contexte ou fetchMe) et en déduit
 * idrh / idserv, en donnant priorité au state de navigation (location.state)
 * sur le profil utilisateur.
 */
export function useAdminAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchMe, user, loading: authLoading } = useContext(AuthContext);

  const [admin, setAdmin] = useState(null);
  const [idrh, setIdrh] = useState(null);
  const [idserv, setIdserv] = useState(null);
  const isFetching = useRef(false);

  useEffect(() => {
    const initAdmin = async () => {
      let currentUser = user;

      if (!currentUser && !authLoading) {
        if (isFetching.current) return;
        isFetching.current = true;
        try {
          currentUser = await fetchMe();
        } catch (err) {
          console.error('Erreur fetchMe:', err);
          navigate('/login');
          return;
        } finally {
          isFetching.current = false;
        }
      }

      if (currentUser) {
        setAdmin(currentUser);
        const targetIdRh = location.state?.idrh || currentUser?.responsable?.idrh;
        const targetIdServ = location.state?.idserv || currentUser?.responsable?.idserv;
        setIdrh(targetIdRh);
        setIdserv(targetIdServ);
      } else if (!authLoading) {
        navigate('/login');
      }
    };

    initAdmin();
  }, [user, fetchMe, location.state, authLoading, navigate]);

  return { admin, idrh, idserv, navigate, location };
}