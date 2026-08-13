// src/pages/Login/services/macAgentService.js
//
// Interroge l'agent Electron local (mac-agent) qui tourne en arrière-plan
// sur le poste de l'utilisateur.
//
// L'agent écoute sur 127.0.0.1 et expose :
//   GET /health
//   GET /mac-address
//
// En production :
//   - l'agent est installé une fois sur le poste Windows
//   - il démarre automatiquement avec Windows
//   - React vérifie sa disponibilité au chargement
//   - si l'agent n'est pas disponible, React peut proposer son installation.
//

const MAC_AGENT_URL = import.meta.env.VITE_MAC_AGENT_URL;

// ============================================================
// CONFIGURATION
// ============================================================

// URL de téléchargement de l'installeur Windows.
//
// Exemple :
// https://pointage.srsp.mg/downloads/SRSP-Mac-Agent-Setup-1.0.0.exe
//
const MAC_AGENT_DOWNLOAD_URL =
  import.meta.env.VITE_MAC_AGENT_DOWNLOAD_URL ||
  "http://127.0.0.1:5000/downloads/mac-agent"

// ============================================================
// MOBILE
// ============================================================

/**
 * Détecte un vrai appareil mobile (téléphone/tablette) via le user-agent.
 *
 * L'agent Electron ne peut pas tourner directement sur Android/iOS.
 */
export const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;

  return /Android|iPhone|iPad|iPod/i.test(
    navigator.userAgent
  );
};


// ============================================================
// FETCH UTILITAIRE
// ============================================================

/**
 * Fetch vers l'agent local avec timeout.
 */
const fetchWithTimeout = async (
  url,
  timeoutMs = 3000
) => {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return response;

  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};


// ============================================================
// VÉRIFICATION AGENT
// ============================================================

/**
 * Vérifie si le Mac Agent est disponible.
 *
 * Retour :
 *
 * {
 *   installed: true,
 *   running: true,
 *   data: {...}
 * }
 *
 * ou :
 *
 * {
 *   installed: false,
 *   running: false,
 *   data: null
 * }
 *
 * IMPORTANT :
 * Depuis un navigateur, on ne peut pas distinguer parfaitement :
 *
 *   - agent non installé
 *   - agent installé mais arrêté
 *
 * Si 127.0.0.1:17532 ne répond pas, on considère donc
 * l'agent comme indisponible.
 */
export const checkMacAgent = async () => {

  // Sur mobile, l'agent n'existe pas.
  if (isMobileDevice()) {
    return {
      installed: false,
      running: false,
      mobile: true,
      data: null,
    };
  }

  try {

    const response = await fetchWithTimeout(
      `${MAC_AGENT_URL}/health`,
      2000
    );

    if (!response.ok) {

      console.warn(
        `[mac-agent] Health HTTP ${response.status}`
      );

      return {
        installed: false,
        running: false,
        mobile: false,
        data: null,
      };
    }

    const data = await response.json();

    const running = data?.ok === true;

    console.log(
      "[mac-agent] Health :",
      data
    );

    return {
      installed: running,
      running,
      mobile: false,
      data,
    };

  } catch (err) {

    console.warn(
      "[mac-agent] Agent non disponible :",
      err.message
    );

    return {
      installed: false,
      running: false,
      mobile: false,
      data: null,
    };
  }
};


// ============================================================
// RÉCUPÉRATION MAC
// ============================================================

/**
 * Un seul essai de récupération de la MAC.
 */
const tryFetchMac = async (timeoutMs) => {

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {

    const response = await fetch(
      `${MAC_AGENT_URL}/mac-address`,
      {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {

      console.warn(
        `[mac-agent] Réponse HTTP ${response.status}`
      );

      return null;
    }

    const data = await response.json();

    if (!data?.success || !data?.mac) {
      console.warn(
        "[mac-agent] Réponse MAC invalide :",
        data
      );

      return null;
    }

    console.log(
      `[mac-agent] MAC détectée : ${data.mac}`,
      data
    );

    return data.mac;

  } catch (err) {

    clearTimeout(timeoutId);

    console.warn(
      "[mac-agent] Tentative échouée :",
      err.message
    );

    return null;
  }
};


// ============================================================
// MAC SYSTÈME
// ============================================================

/**
 * Tente de récupérer l'adresse MAC Wi-Fi du système via l'agent local.
 *
 * Ne lève jamais d'exception.
 *
 * Retourne :
 *
 *   "AA:BB:CC:DD:EE:FF"
 *
 * ou :
 *
 *   null
 */
export const getSystemWifiMac = async () => {

  // Mobile : aucun agent local.
  if (isMobileDevice()) {
    console.warn(
      "[mac-agent] Appareil mobile détecté."
    );

    return null;
  }

  // ----------------------------------------------------------
  // Première tentative
  // ----------------------------------------------------------

  const firstAttempt = await tryFetchMac(3000);

  if (firstAttempt) {
    return firstAttempt;
  }

  // ----------------------------------------------------------
  // Deuxième tentative
  // ----------------------------------------------------------

  console.warn(
    "[mac-agent] Premier essai infructueux, nouvelle tentative..."
  );

  return tryFetchMac(6000);
};


// ============================================================
// URL INSTALLATEUR
// ============================================================

/**
 * Retourne l'URL de téléchargement de l'agent.
 */
export const getMacAgentDownloadUrl = () => {
  return MAC_AGENT_DOWNLOAD_URL;
};


// ============================================================
// OUVRIR INSTALLATEUR
// ============================================================

/**
 * Ouvre la page / URL de téléchargement de l'agent.
 *
 * Le navigateur ne peut pas installer automatiquement
 * un fichier .exe. L'utilisateur devra lancer l'installeur.
 */
export const openMacAgentInstaller = async () => {
  const url = getMacAgentDownloadUrl();

  if (!url) {
    console.error("[mac-agent] URL de téléchargement absente.");
    throw new Error("URL de téléchargement absente.");
  }

  console.log("[mac-agent] Téléchargement :", url);

  // Vérifie que le serveur Flask est accessible
  const response = await fetch(url, {
    method: "HEAD",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Impossible de télécharger l'agent (HTTP ${response.status})`
    );
  }

  // Ouvre le téléchargement
  window.open(url, "_blank", "noopener,noreferrer");

  return true;
};