import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import SplashScreen from "./SplashScreen";

const ROLE_HOME = {
  admin: "/global/service",
  responsable: "/global/fiche_presence",
  personnel: "/global/historique",
};

function getUserRoles(user) {
  if (!user) return [];

  if (
    user.role_conflict === true &&
    Array.isArray(user.available_roles) &&
    user.available_roles.length > 0
  ) {
    return user.available_roles;
  }

  return user.role ? [user.role] : [];
}

const RoleRoute = ({ children, roles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  // Ne jamais rediriger pendant le chargement
  if (loading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles || roles.length === 0) {
    return children;
  }

  const userRoles = getUserRoles(user);

  const hasAccess = userRoles.some((role) =>
    roles.includes(role)
  );

  if (hasAccess) {
    return children;
  }

  const fallbackRole =
    userRoles.find((role) => ROLE_HOME[role]) ||
    userRoles[0];

  const redirectPath =
    ROLE_HOME[fallbackRole] || "/login";

  return (
    <Navigate
      to={redirectPath}
      replace
    />
  );
};

export default RoleRoute;