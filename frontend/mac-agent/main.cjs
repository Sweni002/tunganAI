// mac-agent/main.js
//
// Agent Electron "invisible" : aucune fenêtre n'est jamais créée.
// Il tourne en arrière-plan (idéalement lancé automatiquement à
// l'ouverture de session Windows) et expose une petite API HTTP en
// local (127.0.0.1 uniquement) que le site SRSP interroge en fetch()
// pour récupérer l'adresse MAC de la carte Wi-Fi de la machine.
//
// On ne fait JAMAIS app.setLoginItemSettings + un raccourci "à ouvrir" :
// l'utilisateur n'a pas vocation à lancer cette app lui-même, c'est
// uniquement un moyen technique d'obtenir l'adresse MAC système
// depuis une page web (ce qu'un navigateur ne peut pas faire seul).

const { app } = require("electron");
const express = require("express");
const cors = require("cors");
const si = require("systeminformation");

// Port local fixe. Choisis un port peu commun pour éviter les conflits.
const PORT = 17532;

// Origines autorisées à interroger l'agent (adapter selon vos environnements).
const ALLOWED_ORIGINS = [
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5173",
  // Ajouter ici l'origine de prod, ex: "https://pointage.srsp.mg"
];

let serverInstance = null;

function startHttpServer() {
  const expressApp = express();

  expressApp.use(
    cors({
      origin: (origin, callback) => {
        // Autorise les requêtes sans origine (ex: outils locaux) et les
        // origines explicitement listées ci-dessus.
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Origine non autorisée par l'agent MAC"));
        }
      },
    })
  );

  // Simple ping pour savoir si l'agent tourne déjà (utile côté front).
  expressApp.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  expressApp.get("/mac-address", async (_req, res) => {
    try {
      const interfaces = await si.networkInterfaces();

      const isRealMac = (mac) =>
        !!mac && mac !== "00:00:00:00:00:00" && mac.toLowerCase() !== "ff:ff:ff:ff:ff:ff";

      // 1) On cherche en priorité une interface explicitement Wi-Fi.
      const wifi = interfaces.find((i) => i.type === "wireless" && isRealMac(i.mac));

      if (wifi) {
        return res.json({ success: true, mac: wifi.mac, iface: wifi.iface, source: "wireless" });
      }

      // 2) Repli : nom d'interface contenant wi-fi / wlan / wireless / sans-fil
      const wifiByName = interfaces.find(
        (i) =>
          isRealMac(i.mac) &&
          /wi-?fi|wlan|wireless|sans.?fil/i.test(i.iface || i.ifaceName || "")
      );

      if (wifiByName) {
        return res.json({
          success: true,
          mac: wifiByName.mac,
          iface: wifiByName.iface,
          source: "name-match",
        });
      }

      // 3) Dernier repli : première interface non-interne avec une vraie MAC.
      const fallback = interfaces.find((i) => isRealMac(i.mac) && !i.internal);

      if (fallback) {
        return res.json({
          success: true,
          mac: fallback.mac,
          iface: fallback.iface,
          source: "fallback",
        });
      }

      return res.status(404).json({ success: false, error: "Aucune adresse MAC exploitable trouvée." });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  serverInstance = expressApp.listen(PORT, "127.0.0.1", () => {
    console.log(`[mac-agent] En écoute sur http://127.0.0.1:${PORT}`);
  });
}

// Un seul exemplaire de l'agent à la fois.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.whenReady().then(() => {
    // IMPORTANT : on ne crée volontairement AUCUNE BrowserWindow.
    // L'app reste un simple processus de fond, invisible pour l'utilisateur.

    if (process.platform === "darwin" && app.dock) {
      app.dock.hide();
    }

    // Auto-démarrage à l'ouverture de session (uniquement utile une fois
    // l'app packagée/installée — en dev avec `electron .` ce réglage est
    // ignoré par Windows car le chemin de l'exécutable n'est pas stable).
    if (app.isPackaged) {
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: true,
        path: process.execPath,
      });
    }

    startHttpServer();
  });

  app.on("before-quit", () => {
    if (serverInstance) serverInstance.close();
  });

  // Comme aucune fenêtre n'est jamais ouverte, "window-all-closed" ne se
  // déclenche jamais ici — l'agent reste actif tant que le process tourne.
}
