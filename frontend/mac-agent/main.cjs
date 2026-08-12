// mac-agent/main.js
//
// Agent Electron invisible : aucune fenêtre n'est créée.
// Il tourne en arrière-plan et expose une API HTTP locale
// permettant au frontend SRSP de récupérer l'adresse MAC.
//
// Priorité de détection :
//   1. Wi-Fi
//   2. Ethernet
//   3. Autre interface physique
//
// Le serveur écoute uniquement sur 127.0.0.1.

const { app } = require("electron");
const express = require("express");
const cors = require("cors");
const si = require("systeminformation");

// ============================================================
// CONFIGURATION
// ============================================================

const PORT = 17532;

const ALLOWED_ORIGINS = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",

  // Ajouter l'origine de production ici si nécessaire :
  // "https://pointage.srsp.mg",
];

let serverInstance = null;

// ============================================================
// UTILITAIRES
// ============================================================

/**
 * Vérifie qu'une adresse MAC est exploitable.
 */
function isRealMac(mac) {
  if (!mac) {
    return false;
  }

  const normalized = String(mac).trim().toLowerCase();

  return (
    normalized !== "00:00:00:00:00:00" &&
    normalized !== "ff:ff:ff:ff:ff:ff" &&
    normalized !== "00-00-00-00-00-00" &&
    normalized !== "ff-ff-ff-ff-ff-ff"
  );
}

/**
 * Retourne le nom de l'interface.
 */
function getInterfaceName(networkInterface) {
  return (
    networkInterface.iface ||
    networkInterface.ifaceName ||
    networkInterface.name ||
    ""
  );
}

/**
 * Détermine si une interface ressemble à du Wi-Fi.
 */
function isWifiInterface(networkInterface) {
  const name = getInterfaceName(networkInterface);

  return (
    networkInterface.type === "wireless" ||
    /wi-?fi|wlan|wireless|sans.?fil/i.test(name)
  );
}

/**
 * Détermine si une interface ressemble à de l'Ethernet.
 */
function isEthernetInterface(networkInterface) {
  const name = getInterfaceName(networkInterface);

  return (
    networkInterface.type === "wired" ||
    /ethernet|eth|lan/i.test(name)
  );
}

/**
 * Vérifie qu'une interface est exploitable.
 */
function isUsableInterface(networkInterface) {
  return (
    isRealMac(networkInterface.mac) &&
    !networkInterface.internal
  );
}

// ============================================================
// SERVEUR HTTP
// ============================================================

function startHttpServer() {
  const expressApp = express();

  // ----------------------------------------------------------
  // CORS
  // ----------------------------------------------------------

  expressApp.use(
    cors({
      origin: (origin, callback) => {
        // Autoriser les requêtes sans Origin
        // (outils locaux, curl, etc.)
        if (!origin) {
          return callback(null, true);
        }

        if (ALLOWED_ORIGINS.includes(origin)) {
          return callback(null, true);
        }

        console.warn(
          `[mac-agent] Origine refusée : ${origin}`
        );

        return callback(
          new Error("Origine non autorisée par l'agent MAC")
        );
      },
    })
  );

  // ----------------------------------------------------------
  // HEALTH CHECK
  // ----------------------------------------------------------

  expressApp.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "mac-agent",
      port: PORT,
    });
  });

  // ----------------------------------------------------------
  // RÉCUPÉRATION DE LA MAC
  // ----------------------------------------------------------

  expressApp.get("/mac-address", async (_req, res) => {
    try {
      const interfaces = await si.networkInterfaces();

      if (!Array.isArray(interfaces) || interfaces.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Aucune interface réseau trouvée.",
        });
      }

      console.log(
        "[mac-agent] Interfaces réseau détectées :"
      );

      interfaces.forEach((networkInterface) => {
        console.log({
          iface: getInterfaceName(networkInterface),
          type: networkInterface.type,
          mac: networkInterface.mac,
          internal: networkInterface.internal,
          operstate: networkInterface.operstate,
        });
      });

      // ======================================================
      // 1. PRIORITÉ : WI-FI
      // ======================================================

      const wifi = interfaces.find(
        (networkInterface) =>
          isUsableInterface(networkInterface) &&
          isWifiInterface(networkInterface)
      );

      if (wifi) {
        const iface = getInterfaceName(wifi);

        console.log(
          `[mac-agent] MAC Wi-Fi détectée : ${wifi.mac} (${iface})`
        );

        return res.json({
          success: true,
          mac: wifi.mac,
          iface,
          source: "wireless",
        });
      }

      // ======================================================
      // 2. PRIORITÉ : ETHERNET
      // ======================================================

      const ethernet = interfaces.find(
        (networkInterface) =>
          isUsableInterface(networkInterface) &&
          isEthernetInterface(networkInterface)
      );

      if (ethernet) {
        const iface = getInterfaceName(ethernet);

        console.log(
          `[mac-agent] MAC Ethernet détectée : ${ethernet.mac} (${iface})`
        );

        return res.json({
          success: true,
          mac: ethernet.mac,
          iface,
          source: "ethernet",
        });
      }

      // ======================================================
      // 3. DERNIER FALLBACK : AUTRE INTERFACE PHYSIQUE
      // ======================================================

      const fallback = interfaces.find(
        (networkInterface) =>
          isUsableInterface(networkInterface)
      );

      if (fallback) {
        const iface = getInterfaceName(fallback);

        console.log(
          `[mac-agent] MAC fallback détectée : ${fallback.mac} (${iface})`
        );

        return res.json({
          success: true,
          mac: fallback.mac,
          iface,
          source: "fallback",
        });
      }

      // ======================================================
      // AUCUNE MAC TROUVÉE
      // ======================================================

      console.warn(
        "[mac-agent] Aucune adresse MAC exploitable trouvée."
      );

      return res.status(404).json({
        success: false,
        error: "Aucune adresse MAC exploitable trouvée.",
      });

    } catch (err) {
      console.error(
        "[mac-agent] Erreur récupération MAC :",
        err
      );

      return res.status(500).json({
        success: false,
        error: err.message || "Erreur inconnue",
      });
    }
  });

  // ==========================================================
  // DÉMARRAGE DU SERVEUR
  // ==========================================================

  serverInstance = expressApp.listen(
    PORT,
    "127.0.0.1",
    () => {
      console.log(
        `[mac-agent] En écoute sur http://127.0.0.1:${PORT}`
      );
      console.log(
        `[mac-agent] Endpoint MAC : http://127.0.0.1:${PORT}/mac-address`
      );
    }
  );

  serverInstance.on("error", (err) => {
    console.error(
      "[mac-agent] Erreur serveur HTTP :",
      err
    );
  });
}

// ============================================================
// SINGLE INSTANCE
// ============================================================

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  console.log(
    "[mac-agent] Une instance est déjà en cours."
  );

  app.quit();
} else {
  // ==========================================================
  // ELECTRON READY
  // ==========================================================

  app.whenReady().then(() => {
    // --------------------------------------------------------
    // AUCUNE BrowserWindow
    // --------------------------------------------------------

    // L'agent reste complètement invisible.
    // Aucune fenêtre Electron n'est créée.

    // --------------------------------------------------------
    // macOS : masquer le Dock
    // --------------------------------------------------------

    if (process.platform === "darwin" && app.dock) {
      app.dock.hide();
    }

    // --------------------------------------------------------
    // DÉMARRAGE AUTOMATIQUE WINDOWS
    // --------------------------------------------------------

    if (app.isPackaged) {
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: true,
        path: process.execPath,
      });

      console.log(
        "[mac-agent] Démarrage automatique activé."
      );
    }

    // --------------------------------------------------------
    // SERVEUR HTTP
    // --------------------------------------------------------

    startHttpServer();
  });

  // ==========================================================
  // ARRÊT PROPRE
  // ==========================================================

  app.on("before-quit", () => {
    console.log(
      "[mac-agent] Arrêt de l'agent..."
    );

    if (serverInstance) {
      serverInstance.close(() => {
        console.log(
          "[mac-agent] Serveur HTTP arrêté."
        );
      });
    }
  });

  // ==========================================================
  // EMPÊCHER ELECTRON DE QUITTER
  // ==========================================================

  app.on("window-all-closed", (event) => {
    // Normalement aucune fenêtre n'est créée.
    // On empêche néanmoins Electron de quitter
    // automatiquement.
    event.preventDefault();
  });
}