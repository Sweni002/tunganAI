// src/pages/Login/hooks/useLoginBackground.js

import { useEffect } from "react";
import bgImage from "../../../assets/logo4.webp"; // ⚠️ ajuste le chemin selon ta vraie arborescence

export const useLoginBackground = (isLargeScreen) => {
  useEffect(() => {
    if (isLargeScreen) {
      document.body.style.background = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${bgImage}) no-repeat center center fixed`;
      document.body.style.backgroundSize = "cover";
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.background = "#000";
      document.body.style.backgroundSize = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.body.style.background = "";
      document.body.style.backgroundSize = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.userSelect = "";
    };
  }, [isLargeScreen]);
};