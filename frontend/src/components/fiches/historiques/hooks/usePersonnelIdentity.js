// hooks/usePersonnelIdentity.js
import { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../../AuthContext";

/**
 * Détermine l'identité du personnel connecté.
 *
 * Source unique de vérité :
 *   AuthContext.user
 *
 * Priorité pour idpers :
 *   1. location.state.idpers
 *   2. user.personnel.idpers
 *
 * Aucun fetchMe() ici :
 * AuthContext s'occupe déjà de restaurer la session.
 */
export function usePersonnelIdentity() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user: admin,
    loading: authLoading,
  } = useContext(AuthContext);

  /**
   * ID personnel :
   * priorité au state de navigation
   */
  const idpers =
    location.state?.idpers ??
    admin?.personnel?.idpers ??
    null;

  /**
   * Redirection uniquement après
   * la restauration de la session.
   */
  useEffect(() => {
    // AuthContext est encore en train de récupérer la session
    if (authLoading) {
      return;
    }

    // Session inexistante
    if (!admin) {
      navigate("/login", { replace: true });
      return;
    }

    // Utilisateur connecté mais profil personnel incomplet
    if (
      admin.role === "personnel" &&
      !admin.personnel?.idpers
    ) {
      console.warn(
        "⚠️ Profil personnel incomplet :",
        admin
      );
    }
  }, [admin, authLoading, navigate]);

  return {
    admin,
    idpers,
    authLoading,
    navigate,
    location,
  };
}