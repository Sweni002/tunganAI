import React from "react";
import { CiSearch } from "react-icons/ci";
import styles from "../assiduite.module.css";

const MobileSearchBar = ({ searchText, setSearchText }) => (
  <div
    className={styles.mobileSearch}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "15px 15px",
      marginBottom: 8,
      borderRadius: 7,
      background: "linear-gradient(90deg,#f8f9fb,#ffffff)",
      border: "1px solid #eee",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}
  >
    <CiSearch style={{ fontSize: "1.5rem", color: "#888" }} />

    <input
      type="text"
      placeholder="Rechercher ..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      style={{
        width: "100%",
        border: "none",
        overflow: "hidden",
        outline: "none",
      }}
    />
  </div>
);

export default MobileSearchBar;