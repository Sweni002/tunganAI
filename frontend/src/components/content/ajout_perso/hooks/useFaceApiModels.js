// src/components/content/ajout_perso/hooks/useFaceApiModels.js
//
// Nom conservé pour ne pas casser les imports existants.
// À renommer en useFaceModels.js quand tu feras le ménage.

import { useEffect, useState } from "react";
import { getFaceLandmarker } from "../../../login/services/mediapipeService";

export function useFaceApiModels() {
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getFaceLandmarker()
      .then(() => {
        if (!cancelled) setModelsLoaded(true);
      })
      .catch((err) => {
        console.error("❌ Erreur chargement du modèle facial :", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return modelsLoaded;
}