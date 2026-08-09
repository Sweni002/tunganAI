// PrivateRoute.jsx
// Garde-fou d'AUTHENTIFICATION uniquement (est-ce que l'utilisateur est connecté ?).
// La gestion des ROLES a été déplacée dans RoleRoute.jsx pour être appliquée
// route par route, et corriger le bug qui ne testait que le premier rôle
// disponible en cas de compte multi-rôles ("conflict").

import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import SplashScreen from "./SplashScreen";

const PrivateRoute = ({ children }) => {
  const { user, loading, isLoggingOut } = useContext(AuthContext);

  if (loading || isLoggingOut) {
    return <SplashScreen />;
  }

  if (!user) {
    console.log("❌ Pas d'utilisateur, redirection vers login");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;