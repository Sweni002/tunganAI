import React from "react";
import Button from "@mui/material/Button";
import dayjs from "dayjs";
import styles from "../conge.module.css";
import { Search } from "lucide-react"; // 👈 Remplacé phosphor-icons par lucide-react

const SearchBar = ({
    selectedDate,
    setSelectedDate,
    handleFiltrerParDateUnique,
    searchText,
    setSearchText,
    dateInputRef,
}) => {
    return (
        <div className={styles.searchBar}>
            <div className={styles.flexible}>
                <div className={styles.debuts}>
                    <Button
                        onClick={() => {
                            if (dateInputRef.current) {
                                dateInputRef.current.showPicker();
                            }
                        }}
                        variant="outlined"
                        sx={{
                            p: 1.2,
                            pl: 3,
                            pr: 3,
                            gap: 1,
                            color: "gray",
                            backgroundColor: "transparent",
                            border: "1px solid #ebecee",
                            textTransform: "none",
                            fontSize: "0.75rem",
                            fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                            "@media (max-width:1369px)": {
                                py: 0.8,
                            },
                            "&:hover": {
                                backgroundColor: " rgba(27, 105, 121, 0.08)",
                            },
                        }}
                        startIcon={
                            <i className="fa-solid fa-calendar" style={{ fontSize: "0.9rem" }}></i>
                        }
                    >
                        {selectedDate
                            ? dayjs(selectedDate).format("DD/MM/YYYY")
                            : "Filtrer par date"}
                    </Button>

                    <input
                        type="date"
                        ref={dateInputRef}
                        style={{ display: "none" }}
                        onChange={(e) => {
                            const dateChoisie = e.target.value;
                            setSelectedDate(dateChoisie);
                            handleFiltrerParDateUnique(dateChoisie);
                        }}
                    />
                </div>
            </div>
            <div className={styles.searchB} style={{
                borderRadius: "25px",
                padding: "9px 25px 9px 15px" // 👈 AJOUTÉ (Haut/Bas | Gauche/Droite)
            }} // 👈 AJOUTÉ
            >
                <input
                    type="text"
                    placeholder="Rechercher ..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
                <Search size={18} color="#14535f" /> {/* 👈 Icône Lucide React */}
            </div>
        </div>
    );
};

export default SearchBar;