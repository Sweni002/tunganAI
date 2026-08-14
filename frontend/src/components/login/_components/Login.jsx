// src/pages/Login/Login.jsx

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import Fab from "@mui/material/Fab";
import { LuScanFace } from "react-icons/lu";

import { AuthContext } from "../../../AuthContext";
import LoginForm from "./LoginForm";
import { useLoginBackground } from "../services/useLoginBackground";

import styles from "./login.module.css";

const Login = () => {
  const { login, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const isLargeScreen = useMediaQuery({ minWidth: 1200 });

  const [nom, setNom] = useState("");
  const [mdp, setMdp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentLottie, setCurrentLottie] = useState(1);

  useEffect(() => {
    let timer;
    if (currentLottie === 1) timer = setTimeout(() => setCurrentLottie(2), 10000);
    else if (currentLottie === 2) timer = setTimeout(() => setCurrentLottie(1), 12000);
    return () => clearTimeout(timer);
  }, [currentLottie]);

  useLoginBackground(isLargeScreen);

  const handleShowPassword = () => setShowPassword((prev) => !prev);

  const goPointage = async () => {
  if (!nom.trim() && !mdp.trim()) {
    setLoginError(
      "Veuillez entrer le matricule et le mot de passe !"
    );
    return;
  }

  if (!nom.trim()) {
    setLoginError("Veuillez entrer votre matricule !");
    return;
  }

  if (!mdp.trim()) {
    setLoginError("Veuillez entrer votre mot de passe !");
    return;
  }

  setLoading(true);

  try {
    const data = await login(nom, mdp);

    console.log("LOGIN DATA :", data);

    // =====================================================
    // CAS 1 : COMPTE MULTI-RÔLES
    // =====================================================
  if (
  data.role_conflict === true ||
  data.conflict === true
) {
  const availableRoles = data.available_roles || [];

  console.log("MULTI-ROLES :", availableRoles);

  let selectedRole;

  // Priorité
  if (availableRoles.includes("responsable")) {
    selectedRole = "responsable";
  } else if (availableRoles.includes("personnel")) {
    selectedRole = "personnel";
  } else if (availableRoles.includes("admin")) {
    selectedRole = "admin";
  }

  if (!selectedRole) {
    throw new Error("Aucun rôle valide n'a été trouvé.");
  }

  const selectedUser = data.users?.[selectedRole];

  if (!selectedUser) {
    throw new Error(
      `Les informations du rôle "${selectedRole}" sont introuvables.`
    );
  }

  console.log("RÔLE SÉLECTIONNÉ :", selectedRole);
  console.log("UTILISATEUR SÉLECTIONNÉ :", selectedUser);

  // =====================================================
  // IMPORTANT :
  // construire l'utilisateur courant pour AuthContext
  // =====================================================

  const currentUser = {
    ...selectedUser,

    // rôle actuellement actif
    role: selectedRole,

    // informations multi-rôles
    available_roles: availableRoles,
    conflict: data.conflict,
    role_conflict: data.role_conflict,

    // conserver les utilisateurs des différents rôles
    users: data.users,

    // structure attendue par Header
    responsable: data.users?.responsable || null,
    personnel: data.users?.personnel || null,
    admin: data.users?.admin || null,
  };

  console.log("CURRENT USER :", currentUser);

  // 🔥 TRÈS IMPORTANT
  // AuthContext est maintenant immédiatement synchronisé
  setUser(currentUser);

  // localStorage
  localStorage.setItem(
    "user",
    JSON.stringify(currentUser)
  );

  localStorage.setItem(
    "role",
    selectedRole
  );

  // =====================================================
  // NAVIGATION
  // =====================================================

  if (selectedRole === "responsable") {
    navigate("/global/fiche_presence", {
      replace: true,
      state: {
        idrh: selectedUser.id,
        idserv: selectedUser.idserv,
      },
    });
  } else if (selectedRole === "personnel") {
    navigate("/global/historique", {
      replace: true,
    });
  } else if (selectedRole === "admin") {
    navigate("/global/service", {
      replace: true,
    });
  }

  return;
}

    // =====================================================
    // CAS 2 : COMPTE MONO-RÔLE
    // =====================================================

    const user = data.user;

    if (!user) {
      throw new Error(
        "Utilisateur non retourné par le serveur."
      );
    }

    const role = user.role;

    console.log("MONO-RÔLE :", role);
// 🔥 CORRECTIF COMPLET : même structure imbriquée que CAS 1 / fetchMe()
const currentUser = {
  ...user,
  role,
  admin: role === "admin" ? user : null,
  responsable: role === "responsable" ? user : null,
  personnel: role === "personnel" ? user : null,
};

setUser(currentUser);
    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    localStorage.setItem(
      "role",
      role
    );

    if (role === "admin") {
      navigate("/global/service", {
        replace: true,
      });
    } else if (role === "responsable") {
      navigate("/global/fiche_presence", {
        replace: true,
        state: {
          idrh: user.id,
          idserv: user.idserv,
        },
      });
    } else {
      navigate("/global/historique", {
        replace: true,
      });
    }

  } catch (error) {
    console.error(
      "Erreur de connexion :",
      error
    );

    setLoginError(
      error.message ||
        "Erreur de connexion au serveur"
    );
  } finally {
    setLoading(false);
  }
};



  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      goPointage();
    }
  };

  return (
    <div className={styles.loginWrapper} style={{ fontFamily: "'Roboto Mono', monospace" }}>
      <LoginForm
        nom={nom}
        setNom={setNom}
        mdp={mdp}
        setMdp={setMdp}
        showPassword={showPassword}
        handleShowPassword={handleShowPassword}
        loginError={loginError}
        setLoginError={setLoginError}
        loading={loading}
        onLogin={goPointage}
        onKeyDown={handleKeyDown}
        isLargeScreen={isLargeScreen}
        onForgotPassword={() => navigate("/oublie_respo")}
        onShowPointage={() => navigate("/pointage")}
        currentLottie={currentLottie}
      />

      {!isLargeScreen && (
        <Fab
          onClick={() => navigate("/pointage")}
          aria-label="scan"
          sx={{
            position: "absolute",
            bottom: 20,
            right: 15,
            width: 45,
            height: 47,
            borderRadius: 3,
            backgroundColor: "rgb(51, 94, 143)",
            zIndex: 99999,
          }}
        >
          <LuScanFace color="white" size={20} />
        </Fab>
      )}
    </div>
  );
};

export default Login;