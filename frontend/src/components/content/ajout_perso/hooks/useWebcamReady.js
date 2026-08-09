import { useEffect, useState } from "react";

// Logique inchangée par rapport à AjoutPerso.jsx d'origine (useEffect checkVideo)
export function useWebcamReady(webcamRef) {
  const [webcamReady, setWebcamReady] = useState(false);

  useEffect(() => {
    const checkVideo = setInterval(() => {
      const video = webcamRef.current?.video;
      if (video && video.readyState === 4) {
        setWebcamReady(true); // la webcam est prête
        clearInterval(checkVideo);
      }
    }, 100);

    return () => clearInterval(checkVideo);
  }, [webcamRef]);

  return webcamReady;
}