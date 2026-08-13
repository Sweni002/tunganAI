import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL;
let fetchPromise = null;
let lastFetchTime = 0;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authVersion, setAuthVersion] = useState(0);
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true); // 👈 ÉTAPE 1 : Ajouter l'état loading
  const login = async (matricule, mot_de_passe) => {

    console.log(`${API_URL}/api/auth/login`)
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricule, mot_de_passe }),
    });
  
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur login");
 localStorage.setItem("isLoggedIn", "true");

    // 🔹 Utiliser `data.admin` au lieu de `data.user`
    setUser(data);
    return data;
  };

  const loginRespo = async (matricule, mot_de_passe) => {
    const res = await fetch(
      `${API_URL}/api/auth/login-responsable`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule, mot_de_passe }),
      },
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur login");

    // 🔹 Utiliser `data.admin` au lieu de `data.user`
    setUser(data);
    return data;
  };

  const loginPerso = async (matricule, mot_de_passe) => {
    const res = await fetch(
      "http://192.168.0.107:5000/api/auth/login-personnel",
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule, mot_de_passe }),
      },
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur login");

    // 🔹 Utiliser `data.admin` au lieu de `data.user`
    setUser(data);
    return data;
  };

let fetchPromise = null;

const fetchMe = async (force = false) => {
  const now = Date.now();

    // 1. Si on a déjà un utilisateur et que l'appel est récent (< 30s), on skip l'appel API
    if (!force && user && (now - lastFetchTime < 30000)) {
      return user;
    }
  if (fetchPromise) return fetchPromise; // 🔒 évite doublons

  fetchPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        lastFetchTime = Date.now(); // On marque le succès
        setUser(data);
        return data;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error("Erreur fetchMe:", err);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
      fetchPromise = null; // 🔓 libère
    }
  })();

  return fetchPromise;
};
useEffect(() => {
  fetchMe();
}, []);

const logout = async () => {
  try {
    setIsLoggingOut(true);

    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    localStorage.removeItem("isLoggedIn");

    setUser(null);

    // 🔥 SIGNAL GLOBAL
    localStorage.setItem("facegov", Date.now());

    // Rechargement complet de la page (pas juste une navigation SPA)
    window.location.replace("/login");
  } catch (error) {
    console.error("Erreur logout:", error);
    // Même en cas d'erreur réseau sur /logout, on force quand même
    // le retour au login pour éviter de laisser l'utilisateur bloqué
    window.location.replace("/login");
  } finally {
    setIsLoggingOut(false);
  }
};

useEffect(() => {
  const handleStorage = (event) => {
    if (event.key === "facegov") {
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}, [navigate]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isLoggingOut,   setUser,   // 🔹 ajouter cette ligne
login, logout, fetchMe, loginRespo, loginPerso , authVersion // 👈 AJOUT
 }}
    >
      {children}
    </AuthContext.Provider>
  );
};
