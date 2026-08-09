import React from "react";
import { CiSearch } from "react-icons/ci";
import styles from "../responsables.module.css";

export default function SearchBar({ searchText, setSearchText }) {
    return (
        <div className={styles.searchBar}>
            <div
                style={{
                    width: "22%",
                    backgroundColor: "#e7edee",
                    borderRadius: "44px",
                    border: "1px solid transparent",
                    padding: "7px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    marginRight: "35px",
                    transition: "border 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.border = "1px solid #14535f")}
                onMouseLeave={(e) => (e.currentTarget.style.border = "1px solid transparent")}
            >
                <CiSearch size={22} color="#14535f" />

                <input
                    type="text"
                    placeholder="Rechercher ..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{
                        fontSize: "0.75rem",
                        border: "none",
                        backgroundColor: "transparent",
                        outline: "none",
                        boxShadow: "none",
                        padding: "12px 0",
                        flex: 1, // 👈 prend l'espace restant, colle à l'icône
                        color: "#676767",
                        minWidth: 0, // 👈 évite que l'input déborde du conteneur
                    }}
                />
            </div>
        </div>
    );
}