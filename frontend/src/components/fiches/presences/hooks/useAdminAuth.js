import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../../AuthContext";

export function useAdminAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    loading: authLoading,
  } = useContext(AuthContext);

  const [admin, setAdmin] = useState(null);
  const [idrh, setIdrh] = useState(null);
  const [idserv, setIdserv] = useState(null);

  useEffect(() => {
    // 🔴 AuthContext est encore en train de vérifier la session
    if (authLoading) {
      return;
    }

    // 🔴 AuthContext a terminé et aucun utilisateur
    if (!user) {
      setAdmin(null);
      setIdrh(null);
      setIdserv(null);

      navigate("/login", { replace: true });
      return;
    }

    // 🟢 Utilisateur disponible
    setAdmin(user);

    // Priorité au state de navigation
    const targetIdRh =
      location.state?.idrh ??
      user?.responsable?.idrh ??
      user?.responsable?.id ??
      null;

    const targetIdServ =
      location.state?.idserv ??
      user?.responsable?.idserv ??
      null;

    setIdrh(targetIdRh);
    setIdserv(targetIdServ);
  }, [
    user,
    authLoading,
    location.state,
    navigate,
  ]);

  return {
    admin,
    idrh,
    idserv,
    navigate,
    location,

    // 🔥 très important pour les composants
    loading: authLoading || (!admin && !!user),
  };
}