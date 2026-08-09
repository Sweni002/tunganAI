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
  const { login } = useContext(AuthContext);
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
      setLoginError("Veuillez entrer le matricule et le mot de passe !");
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

      if (data.conflict && data.users?.responsable) {
        const responsable = data.users.responsable;
        localStorage.setItem("user", JSON.stringify(responsable));
        localStorage.setItem("role", "responsable");
        navigate("/global/fiche_presence", {
          state: { idrh: responsable.id, idserv: responsable.idserv },
        });
        return;
      }

      if (data.user) {
        const role = data.user.role;
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("role", role);

        if (role === "admin") {
          navigate("/global/service", { replace: true });
        } else if (role === "responsable") {
          navigate("/global/fiche_presence", {
            state: { idrh: data.user.id, idserv: data.user.idserv },
          });
        } else {
          navigate("/global/historique", { replace: true });
        }
      } else if (data.conflict) {
        let defaultRole = data.available_roles.includes("admin")
          ? "admin"
          : data.available_roles.includes("responsable")
          ? "responsable"
          : "personnel";

        const user = data.users[defaultRole];
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", defaultRole);

        if (defaultRole === "admin") {
          navigate("/global/service", { replace: true });
        } else if (defaultRole === "responsable") {
          navigate("/global/fiche_presence", {
            state: { idrh: user.id, idserv: user.idserv },
          });
        } else {
          navigate("/global/historique", { replace: true });
        }
      }
    } catch (error) {
      console.error("Erreur de connexion :", error);
      setLoginError(error.message || "Erreur de connexion au serveur");
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