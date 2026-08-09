// src/pages/Login/services/macAgentService.js
//
// Interroge l'agent Electron local (mac-agent) qui tourne en arrière-plan
// sur le poste de l'utilisateur, pour récupérer l'adresse MAC de la carte
// Wi-Fi du système. Cet agent n'est jamais ouvert manuellement par
// l'utilisateur : il démarre seul avec la session Windows et sert
// simplement cette info en HTTP sur 127.0.0.1.

const MAC_AGENT_URL = "http://127.0.0.1:17532/mac-address";

/**
 * Détecte un vrai appareil mobile (téléphone/tablette) via le user-agent,
 * PAS via la largeur d'écran (un PC avec une fenêtre réduite ne doit pas
 * être traité comme un mobile ici). Utile car l'agent mac-agent (Electron)
 * ne peut physiquement pas tourner sur Android/iOS : il n'y a aucun
 * équivalent permettant à une page web mobile de lancer un process local
 * qui écoute sur 127.0.0.1.
 */
export const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/**
 * Un seul essai de fetch vers l'agent, avec timeout.
 */
const tryFetchMac = async (timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(MAC_AGENT_URL, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[mac-agent] Réponse HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data?.mac || null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("[mac-agent] Tentative échouée :", err.message);
    return null;
  }
};

/**
 * Tente de récupérer l'adresse MAC Wi-Fi du système via l'agent local.
 * Ne lève jamais d'exception : si l'agent n'est pas lancé (ou hors ligne),
 * renvoie simplement `null` pour ne pas bloquer le flux de pointage.
 *
 * NOTE : le tout premier appel depuis une session navigateur fraîche est
 * souvent plus lent que les suivants (établissement de la connexion vers
 * 127.0.0.1, inspection par un éventuel antivirus/pare-feu...). On retente
 * donc automatiquement une fois avec un délai plus long avant d'abandonner,
 * plutôt que de faire échouer le pointage pour un simple "premier appel à froid".
 */
export const getSystemWifiMac = async () => {
  const firstAttempt = await tryFetchMac(3000);
  if (firstAttempt) return firstAttempt;

  console.warn("[mac-agent] Premier essai infructueux, nouvelle tentative...");
  return tryFetchMac(6000);
};