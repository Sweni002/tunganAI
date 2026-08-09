import React from "react";
import IconButton from "@mui/material/IconButton";
import styles from "../responsables.module.css";

export default function DivisionSelector({
  divisions,
  selectedDivision,
  setSelectedDivision,
  scrollRef,
  scrollBtnsRef,
  showLeft,
  showRight,
  scroll,
}) {
  if (divisions.length > 10) {
    return (
      <div className={styles.scrollContainer}>
        {showLeft && (
          <div style={{ display: "flex", alignContent: "center", paddingRight: 13 }}>
            <IconButton
              onClick={() => scroll("left")}
              sx={{
                bgcolor: "transparent",
                position: "relative",
                "&:hover": { bgcolor: "transparent", transform: "scale(1.1)" },
                transition: "all 0.2s ease",
              }}
            >
              <i className="fa-solid fa-chevron-left" style={{ color: "black" }}></i>
            </IconButton>
          </div>
        )}

        <div ref={scrollRef} className={styles.scrollBtns}>
          {divisions.map((s) => (
            <button
              key={s.iddiv}
              ref={(el) => (scrollBtnsRef.current[s.iddiv] = el)}
              onClick={() => setSelectedDivision(selectedDivision === s.iddiv ? null : s.iddiv)}
              className={`${styles.scrollBtn} ${selectedDivision === s.iddiv ? styles.activeBtn : ""}`}
            >
              <span className={styles.divisionName}>{s.nomdivision}</span>
              <span className={styles.badge}>{s.total_personnels}</span>
            </button>
          ))}
        </div>

        {showRight && (
          <div style={{ display: "flex", alignContent: "center", paddingLeft: 13 }}>
            <IconButton
              onClick={() => scroll("right")}
              sx={{
                bgcolor: "transparent",
                "&:hover": { bgcolor: "transparent", transform: "scale(1.1)" },
                transition: "all 0.2s ease",
              }}
            >
              <i className="fa-solid fa-chevron-right" style={{ color: "black" }}></i>
            </IconButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.cardDivision}>
      {divisions.length === 0 ? (
        <p>Chargement des divisions...</p>
      ) : (
        divisions.map((division) => (
          <div
            className={styles.btn1}
            key={division.iddiv}
            style={{
              cursor: "pointer",
              backgroundColor:
                selectedDivision === division.iddiv ? "rgba(145, 141, 141, 0.1)" : undefined,
            }}
            onClick={() => {
              if (selectedDivision === division.iddiv) {
                setSelectedDivision(null);
              } else {
                setSelectedDivision(division.iddiv);
              }
            }}
          >
            <h2>{division.nomdivision}</h2>

            <div className={styles.chiffre}>
              <h2>{division.total_personnels}</h2>
            </div>
          </div>
        ))
      )}
    </div>
  );
}