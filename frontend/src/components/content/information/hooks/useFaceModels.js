// hooks/useFaceModels.js
import { useEffect, useState } from 'react';
import { getFaceLandmarker } from '../../../login/services/mediapipeService';

/**
 * Initialise le FaceLandmarker MediaPipe (singleton : un seul
 * téléchargement/compilation, même si plusieurs composants l'appellent).
 *
 * @returns {boolean} true quand le modèle est prêt
 */
export function useFaceModels() {
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getFaceLandmarker()
      .then(() => {
        if (!cancelled) setModelsLoaded(true);
      })
      .catch((err) => {
        console.error('❌ Erreur chargement du modèle facial :', err);
        if (!cancelled) setModelsLoaded(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return modelsLoaded;
}