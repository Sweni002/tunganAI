// RoleRoute.jsx
// Garde-fou de ROLE (à utiliser à l'intérieur d'un PrivateRoute déjà authentifié).
// Corrige le bug de PrivateRoute.jsx : on vérifie TOUS les rôles disponibles
// de l'utilisateur (cas "conflict" multi-rôles), pas uniquement le premier.

import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

// Page d'accueil par défaut pour chaque rôle
const ROLE_HOME = {
  admin: "/global/service",
  responsable: "/global/fiche_presence",
  personnel: "/global/historique",
};

// Normalise la liste des rôles réels de l'utilisateur, qu'il soit
// mono-rôle (user.role) ou multi-rôle (user.conflict + available_roles)
function getUserRoles(user) {
  if (user?.conflict && Array.isArray(user.available_roles) && user.available_roles.length > 0) {
    return user.available_roles;
  }
  return user?.role ? [user.role] : [];
}

/**
 * @param {string[]} roles - rôles autorisés pour cette route (vide = ouvert à tout utilisateur connecté)
 */
const RoleRoute = ({ children, roles = [] }) => {
  const { user } = useContext(AuthContext);

  // Route ouverte à tout utilisateur connecté (déjà vérifié par PrivateRoute)
  if (!roles || roles.length === 0) {
    return children;
  }

  const userRoles = getUserRoles(user);

  // ✅ Accès autorisé dès qu'AU MOINS UN des rôles de l'utilisateur correspond
  const hasAccess = userRoles.some((r) => roles.includes(r));
  if (hasAccess) {
    return children;
  }

  // ❌ Aucun rôle ne correspond -> on renvoie vers l'accueil du premier rôle connu
  // (au lieu de recalculer bêtement le même rôle qui vient d'échouer)
  const fallbackRole = userRoles.find((r) => ROLE_HOME[r]) || userRoles[0];
  const redirectPath = ROLE_HOME[fallbackRole] || "/login";

  console.log(
    `❌ Rôle(s) [${userRoles.join(", ")}] non autorisé(s) pour cette route (requis: [${roles.join(", ")}]) → redirection ${redirectPath}`
  );

  return <Navigate to={redirectPath} replace />;
};

export default RoleRoute;