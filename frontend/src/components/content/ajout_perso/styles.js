// ⚠️ Styles impossibles en inline pur : keyframes (fadeIn, rotation, mulShdSpin)
// et pseudo-sélecteurs (:hover). Tout le reste est en style inline dans le JSX.
// Contenu strictement identique à l'original (aucune valeur modifiée).
export const localStyles = `
  @keyframes ajoutPersoFadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .ajout-perso-loader {
    width: 27px;
    height: 27px;
    border: 5px dotted #FFF;
    border-radius: 50%;
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    animation: ajoutPersoRotation 1.2s linear infinite;
  }

  @keyframes ajoutPersoRotation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .ajout-perso-loader2 {
    color: #fff;
    font-size: 10px;
    width: 1em;
    height: 1em;
    border-radius: 50%;
    position: relative;
    text-indent: -9999em;
    animation: ajoutPersoMulShdSpin 1s infinite linear;
    transform: translateZ(0);
  }

  @keyframes ajoutPersoMulShdSpin {
    0%, 100% {
      box-shadow: 0 -3em 0 0.2em, 2em -2em 0 0em, 3em 0 0 -1em,
        2em 2em 0 -1em, 0 3em 0 -1em, -2em 2em 0 -1em,
        -3em 0 0 -1em, -2em -2em 0 0;
    }
    12.5% {
      box-shadow: 0 -3em 0 0, 2em -2em 0 0.2em, 3em 0 0 0,
        2em 2em 0 -1em, 0 3em 0 -1em, -2em 2em 0 -1em,
        -3em 0 0 -1em, -2em -2em 0 -1em;
    }
    25% {
      box-shadow: 0 -3em 0 -0.5em, 2em -2em 0 0, 3em 0 0 0.2em,
        2em 2em 0 0, 0 3em 0 -1em, -2em 2em 0 -1em,
        -3em 0 0 -1em, -2em -2em 0 -1em;
    }
    37.5% {
      box-shadow: 0 -3em 0 -1em, 2em -2em 0 -1em, 3em 0em 0 0,
        2em 2em 0 0.2em, 0 3em 0 0em, -2em 2em 0 -1em,
        -3em 0em 0 -1em, -2em -2em 0 -1em;
    }
    50% {
      box-shadow: 0 -3em 0 -1em, 2em -2em 0 -1em, 3em 0 0 -1em,
        2em 2em 0 0em, 0 3em 0 0.2em, -2em 2em 0 0,
        -3em 0em 0 -1em, -2em -2em 0 -1em;
    }
    62.5% {
      box-shadow: 0 -3em 0 -1em, 2em -2em 0 -1em, 3em 0 0 -1em,
        2em 2em 0 -1em, 0 3em 0 0, -2em 2em 0 0.2em,
        -3em 0 0 0, -2em -2em 0 -1em;
    }
    75% {
      box-shadow: 0em -3em 0 -1em, 2em -2em 0 -1em, 3em 0em 0 -1em,
        2em 2em 0 -1em, 0 3em 0 -1em, -2em 2em 0 0,
        -3em 0em 0 0.2em, -2em -2em 0 0;
    }
    87.5% {
      box-shadow: 0em -3em 0 0, 2em -2em 0 -1em, 3em 0 0 -1em,
        2em 2em 0 -1em, 0 3em 0 -1em, -2em 2em 0 0,
        -3em 0em 0 0, -2em -2em 0 0.2em;
    }
  }
`;

// Styles dépendant de isMobile / isTablet -> exposés via une fonction
// pour reproduire exactement le comportement du composant d'origine
// (recalculés à chaque render en fonction de la taille d'écran).
export function getResponsiveStyles(isMobile, isTablet) {
  return {
    stylePersonnels: {
      marginTop: isMobile ? 25 : 10,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      padding: isMobile ? "10px" : undefined,
    },
    styleBreak: {
      display: "flex",
      alignItems: "center",
      width: "100%",
      maxWidth: isTablet ? "95%" : "90%",
      justifyContent: "flex-start",
    },
    styleCard: {
      marginTop: isTablet ? 15 : 10,
      width: "100%",
      borderRadius: "15px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };
}

// Styles statiques (identiques quel que soit le breakpoint)
export const styleContainer = {
  animation: "ajoutPersoFadeIn 1s ease-in-out",
  width: "100%",
  maxWidth: "1000px",
  backgroundColor: "white",
  borderRadius: "13px",
 
  padding: "15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
};

export const styleSary = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  padding: "25px",
};

export const styleSary1 = {
  width: "230px",
  height: "230px",
};

export const styleSary1Img = {
  objectFit: "cover",
  width: "100%",
  height: "100%",
};

export const styleForm = {
  padding: "8px",
  marginTop: "17px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  width: "100%",
  maxWidth: "97%",
};

export const styleRetour = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  width: "100%",
  gap: "10px",
  padding: "10px",
  fontSize: "22px",
  cursor: "pointer",
  color: "black",
};

export const styleRetourIcon = {
  fontSize: "1.1rem",
};

export const styleInputM = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  marginBottom: "20px",
};

export const styleInputMLabel = {
  fontWeight: "bold",
  marginBottom: "8px",
  fontSize: "0.75rem",
  color: "#333",
};

export const styleInputMSpan = {
  fontSize: "0.75rem",
  color: "gray",
  marginBottom: "10px",
  display: "block",
};

export const stylePhotos = {
  display: "flex",
  width: "100%",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
};

export const styleImg1 = {
  width: "120px",
  height: "120px",
  marginTop: "5px",
  marginBottom: "12px",
};

export const styleImg1Img = {
  objectFit: "contain",
  width: "100%",
  height: "100%",
};

export const styleBtn = {
  width: "100%",
  marginTop: "25px",
};

export const styleScannerFrame = {
  position: "absolute",
  top: "15%",
  bottom: "15%",
  left: "26%",
  right: "25%",
  zIndex: 10,
};

const cornerBase = { position: "absolute", borderRadius: "8px" };

export const cornerTlHorizontal = {
  ...cornerBase,
  top: 0,
  left: 0,
  width: "30px",
  height: "3px",
  backgroundColor: "red",
  borderTopLeftRadius: "12px",
};
export const cornerTlVertical = {
  ...cornerBase,
  top: 0,
  left: 0,
  width: "3px",
  height: "30px",
  backgroundColor: "red",
  borderTopLeftRadius: "12px",
};
export const cornerTrHorizontal = {
  ...cornerBase,
  top: 0,
  right: 0,
  width: "30px",
  height: "3px",
  backgroundColor: "blue",
  borderTopRightRadius: "12px",
};
export const cornerTrVertical = {
  ...cornerBase,
  top: 0,
  right: 0,
  width: "3px",
  height: "30px",
  backgroundColor: "blue",
  borderTopRightRadius: "12px",
};
export const cornerBlHorizontal = {
  ...cornerBase,
  bottom: 0,
  left: 0,
  width: "30px",
  height: "3px",
  backgroundColor: "green",
  borderBottomLeftRadius: "12px",
};
export const cornerBlVertical = {
  ...cornerBase,
  bottom: 0,
  left: 0,
  width: "3px",
  height: "30px",
  backgroundColor: "green",
  borderBottomLeftRadius: "12px",
};
export const cornerBrHorizontal = {
  ...cornerBase,
  bottom: 0,
  right: 0,
  width: "30px",
  height: "3px",
  backgroundColor: "yellow",
  borderBottomRightRadius: "12px",
};
export const cornerBrVertical = {
  ...cornerBase,
  bottom: 0,
  right: 0,
  width: "3px",
  height: "30px",
  backgroundColor: "yellow",
  borderBottomRightRadius: "12px",
};