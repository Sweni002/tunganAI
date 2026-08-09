import React from 'react'

const DarkModeSwitch = ({ darkMode, toggleDarkMode }) => {
  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-pressed={darkMode}
      aria-label={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
      style={{
        cursor: "pointer",
        fontSize: 16,
        background: darkMode ? "#333" : "transparent",
        border: "1px solid #ccc",
        borderRadius: 20,
        width: 40,
        height: 21,
        display: "flex",
        alignItems: "center",
        justifyContent: darkMode ? "flex-end" : "flex-start",
        padding: "0 5px",
        transition: "background-color 0.3s ease, justify-content 0.3s ease",
        borderColor: darkMode ? "#555" : "#ccc",
      }}
    >
      <i
        className={`fa-solid ${darkMode ? "fa-sun" : "fa-moon"}`}
        style={{ color: darkMode ? "white" : "#555" , fontSize:"1.1rem" }}
      />
    </button>
  );
};


export default DarkModeSwitch