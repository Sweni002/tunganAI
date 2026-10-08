import React from "react";
import dayjs from "dayjs";
import Button from "@mui/material/Button";
import styles from "../sortie.module.css";

/** Au-dessus du tableau : filtre « un jour » + recherche + compteur. */
export default function SortieToolbar({
  selectedDate,
  setSelectedDate,
  onFiltrerParDate,
  searchText,
  setSearchText,
  dateInputRef,
  count,
}) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <Button
          variant="outlined"
          onClick={() => dateInputRef.current?.showPicker?.()}
          startIcon={<i className="fa-regular fa-calendar" style={{ fontSize: "0.9rem" }}></i>}
          sx={{
            textTransform: "none",
            fontSize: "0.8rem",
            height: 52,
            px: 3,
            color: selectedDate ? "#1b6979" : "#6b7a7e",
            borderColor: selectedDate ? "#1b6979" : "#dbe5e8",
            backgroundColor: selectedDate ? "rgba(27,105,121,0.08)" : "transparent",
          }}
        >
          {selectedDate ? dayjs(selectedDate).format("DD/MM/YYYY") : "Un jour précis"}
        </Button>
        <input
          type="date"
          ref={dateInputRef}
          style={{ display: "none" }}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            onFiltrerParDate(e.target.value);
          }}
        />
        <span className={styles.count} aria-live="polite">
          {count} résultat{count > 1 ? "s" : ""}
        </span>
      </div>

      <label className={styles.search}>
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input
          type="search"
          placeholder="Rechercher un agent, un motif…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          aria-label="Rechercher"
        />
      </label>
    </div>
  );
}
