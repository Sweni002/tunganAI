// services/serviceApi.js
// ---------------------------------------------------------------------------
// Appels API pour la création d'un service + ses horaires.
// Le flux "Sauvegarder" du récap enchaîne les DEUX endpoints :
//   1. POST /services  (multipart : nom, addresse, sigle, code_service, logo)
//      → renvoie service.idserv
//   2. POST /horaires  (JSON : idserv + les 8 plages en snake_case)
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SERVICES_URL = `${API_BASE}/services/`;   // adapte au préfixe réel de ton blueprint
const HORAIRES_URL = `${API_BASE}/horaires`;    // idem (route "" du blueprint horaires_api)

// ---------------------------------------------------------------------------
// 1) Création du service (multipart/form-data car logo = fichier)
//    ⚠️ le backend attend "code_service", pas "code"
// ---------------------------------------------------------------------------
export async function createService(formState, logoFile) {
    const formData = new FormData();
    formData.append("nom", formState.nom);
    formData.append("addresse", formState.addresse);
    formData.append("sigle", formState.sigle);
    formData.append("code_service", formState.code);
    if (logoFile) {
        formData.append("logo", logoFile);
    }

    const response = await fetch(SERVICES_URL, {
        method: "POST",
        body: formData, // pas de Content-Type manuel : le navigateur gère le boundary
    });

    const data = await response.json();
    if (!response.ok) {
        // 400 (champ manquant) ou 409 (doublon nom/adresse ou code)
        throw new Error(data.error || "Erreur lors de la création du service");
    }

    return data.service; // { idserv, nom, addresse, sigle, logo, code_service }
}

// ---------------------------------------------------------------------------
// 2) Création des horaires (JSON, mapping camelCase → snake_case)
// ---------------------------------------------------------------------------
export async function createHoraires(idserv, formState) {
    const payload = {
        idserv,
        entree_matin_debut: formState.entreeMatinDebut,
        entree_matin_fin: formState.entreeMatinFin,
        sortie_matin_debut: formState.sortieMatinDebut,
        sortie_matin_fin: formState.sortieMatinFin,
        entree_soir_debut: formState.entreeSoirDebut,
        entree_soir_fin: formState.entreeSoirFin,
        sortie_soir_debut: formState.sortieSoirDebut,
        sortie_soir_fin: formState.sortieSoirFin,
    };

    const response = await fetch(HORAIRES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
        // 400 (format/plages invalides, doublon horaires), 404 (service introuvable)
        throw new Error(data.error || "Erreur lors de la création des horaires");
    }

    return data; // { message, id }
}

// ---------------------------------------------------------------------------
// Adresses MAC autorisées par service
// ---------------------------------------------------------------------------
export async function fetchMacAddresses(idserv) {
    const response = await fetch(`${API_BASE}/api/services-horaires/${idserv}/mac-addresses`, {
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la récupération des adresses MAC");
    }
    return data; // tableau [{ id, idserv, mac_address, description }]
}

export async function addMacAddresses(idserv, entries) {
    // entries: [{ mac_address, description }]
    const response = await fetch(`${API_BASE}/api/services-horaires/${idserv}/mac-addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ mac_addresses: entries }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'ajout des adresses MAC");
    }
    return data.mac_addresses;
}

export async function deleteMacAddress(idserv, macId) {
    const response = await fetch(`${API_BASE}/api/services-horaires/${idserv}/mac-addresses/${macId}`, {
        method: "DELETE",
        credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
    }
    return data;
}