// Conversion 1:1 des classes de ajout_conge.module.css réellement utilisées
// dans AjoutAuto.jsx. Aucune valeur n'a été modifiée.
//
// Note : deux classNames de l'original ne correspondaient déjà à aucune
// classe définie dans le CSS module (`styles.dialo` et `styles.liste` —
// le fichier ne définit que `.dialog`, `.liste1`, `.liste2`). Ces deux
// endroits n'appliquaient donc déjà aucun style dans l'original ; on
// reproduit fidèlement ce comportement en ne leur donnant aucun style ici.

// ⚠️ Keyframes et pseudo-sélecteur :hover, impossibles en style inline pur.
export const localStyles = `
  @keyframes ajoutAutoFadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes ajoutAutoRotation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .ajout-auto-loader {
    width: 25px;
    height: 25px;
    border: 5px dotted #FFF;
    border-radius: 50%;
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    animation: ajoutAutoRotation 1.2s linear infinite;
  }

  .ajout-auto-liste1:hover {
    background-color: rgb(234, 238, 238);
    border-radius: 4px;
  }
`;

// Styles responsives (dépendent de isMobile) -> exposés via une fonction,
// recalculés à chaque render comme dans l'original (media query 768px).
export function getResponsiveStyles(isMobile) {
  return {
    stylePersonnels: {
      marginTop: isMobile ? 95 : 10,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      padding: isMobile ? "10px" : undefined,
    },
  };
}

// Styles statiques (identiques quelle que soit la taille d'écran)
export const styleBreak = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  maxWidth: "90%",
  justifyContent: "flex-start",
};

export const styleCard = {
  marginTop: "10px",
  width: "100%",
  borderRadius: "15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const styleContainer = {
  animation: "ajoutAutoFadeIn 1s ease-in-out",
  width: "100%",
  maxWidth: "1000px",
  borderRadius: "13px",
  padding: "25px",
  backgroundColor: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
};

export const styleSary1 = {
  width: "200px",
  height: "210px",
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
  fontSize: "0.9rem",
  color: "gray",
  marginBottom: "10px",
};

export const styleInputDiv = {
  display: "flex",
  flexDirection: "column",
  width: "80%",
  marginBottom: "20px",
};

export const styleDateContainer = {
  display: "flex",
  gap: "25px",
  justifyContent: "space-between",
  width: "100%",
  marginBottom: "20px",
  cursor: "pointer",
};

export const styleDateField = {
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  width: "50%",
};

export const styleDateFieldLabel = {
  fontWeight: "bold",
  marginBottom: "8px",
  fontSize: "0.8rem",
  color: "#333",
};

export const styleDateFields = {
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  width: "100%",
};

export const styleDateFieldsLabel = {
  fontWeight: "bold",
  marginBottom: "8px",
  fontSize: "0.8rem",
  color: "#333",
};

export const styleBtn = {
  width: "100%",
  marginTop: "25px",
};

// .liste1 (hors :hover, géré via la classe CSS "ajout-auto-liste1" ci-dessus)
export const styleListe1 = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  marginBottom: "30px",
  transition: "border 0.3s ease",
  padding: "7px",
};

export const styleListe2 = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  alignItems: "flex-start",
  justifyContent: "center",
};

export const styleListe2H4 = {
  textAlign: "center",
  fontSize: "0.85rem",
};