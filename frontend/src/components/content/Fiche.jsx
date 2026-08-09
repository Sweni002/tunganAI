import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Fiche = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 🔹 Recharge la page une seule fois
    if (!sessionStorage.getItem('ficheReloaded')) {
      sessionStorage.setItem('ficheReloaded', 'true');
      window.location.reload();
    } else {
      sessionStorage.removeItem('ficheReloaded');
      // 🔹 Après reload complet, redirige vers /login
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return <div>loading...</div>;
};

export default Fiche;