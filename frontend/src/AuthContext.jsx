import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL;

let fetchPromise = null;
let lastFetchTime = 0;

const normalizeUser = (data) => {
  if (!data) return null;

  // Cas : { message, user: {...} }
  if (data.user) {
    return {
      ...data.user,
      role_conflict: data.role_conflict ?? data.conflict ?? false,
      available_roles: data.available_roles ?? [],
    };
  }

  // Cas : utilisateur directement retourné par /me
  return {
    ...data,
    role_conflict: data.role_conflict ?? data.conflict ?? false,
    available_roles: data.available_roles ?? [],
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authVersion, setAuthVersion] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const login = async (matricule, mot_de_passe) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        matricule,
        mot_de_passe,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erreur login");
    }

    const normalizedUser = normalizeUser(data);

    console.log("LOGIN USER :", normalizedUser);

    // IMPORTANT
    setUser(normalizedUser);
    setLoading(false);

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("role", normalizedUser?.role || "");

    lastFetchTime = Date.now();

    return {
      ...data,
      user: normalizedUser,
    };
  };

  const loginRespo = async (matricule, mot_de_passe) => {
    const res = await fetch(
      `${API_URL}/api/auth/login-responsable`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricule,
          mot_de_passe,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erreur login");
    }

    const normalizedUser = normalizeUser(data);

    setUser(normalizedUser);
    setLoading(false);
    lastFetchTime = Date.now();

    return {
      ...data,
      user: normalizedUser,
    };
  };

  const loginPerso = async (matricule, mot_de_passe) => {
    const res = await fetch(
      `${API_URL}/api/auth/login-personnel`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricule,
          mot_de_passe,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erreur login");
    }

    const normalizedUser = normalizeUser(data);

    setUser(normalizedUser);
    setLoading(false);
    lastFetchTime = Date.now();

    return {
      ...data,
      user: normalizedUser,
    };
  };

  const fetchMe = async (force = false) => {
    const now = Date.now();

    // Si le login vient juste de réussir,
    // ne pas refaire immédiatement /me.
    if (!force && user && now - lastFetchTime < 30000) {
      return user;
    }

    if (fetchPromise) {
      return fetchPromise;
    }

    fetchPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          setUser(null);
          return null;
        }

        const normalizedUser = normalizeUser(data);

        console.log("ME USER :", normalizedUser);

        lastFetchTime = Date.now();

        setUser(normalizedUser);

        return normalizedUser;
      } catch (error) {
        console.error("Erreur fetchMe :", error);

        // IMPORTANT :
        // ne pas supprimer un utilisateur déjà authentifié
        // à cause d'une erreur réseau temporaire.
        if (!user) {
          setUser(null);
        }

        return null;
      } finally {
        setLoading(false);
        fetchPromise = null;
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
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      setUser(null);

      localStorage.setItem("facegov", Date.now());

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Erreur logout :", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "facegov") {
        setUser(null);

        navigate("/login", {
          replace: true,
        });
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggingOut,
        setUser,
        login,
        logout,
        fetchMe,
        loginRespo,
        loginPerso,
        authVersion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};