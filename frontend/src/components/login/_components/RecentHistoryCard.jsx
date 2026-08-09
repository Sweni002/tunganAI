// src/pages/Login/RecentHistoryCard.jsx

import React from "react";
import Typography from "@mui/material/Typography";

/**
 * Petite carte "Récentes" affichée à droite de la webcam sur desktop.
 * `items` n'est pas encore branché à une vraie source de données —
 * passe un tableau d'objets { id, label, time, type } depuis le parent
 * une fois l'API de pointage récent disponible. En attendant, affiche
 * un état vide si `items` est vide/absent.
 */
const RecentHistoryCard = ({ items = [] }) => {
    return (
        <div
            style={{
                width: 300,
                flexShrink: 0,
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(10, 15, 20, 0.55)",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "'Roboto Mono', monospace",
            }}
        >
            <div
                style={{
                    padding: "20px 20px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Typography
                    sx={{
                        color: "#e8f6f8",
                        fontFamily: "'Roboto Mono', monospace",
                        fontSize: "1rem",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                    }}
                >
                    Récentes
                </Typography>
            </div>

            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "10px 16px",
                }}
            >
                {items.length === 0 ? (
                    <Typography
                        sx={{
                            color: "rgba(255,255,255,0.45)",
                            fontFamily: "'Roboto Mono', monospace",
                            fontSize: "0.8rem",
                            textAlign: "center",
                            mt: 4,
                        }}
                    >
                        Aucun pointage récent
                    </Typography>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px 6px",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ color: "#e8f6f8", fontSize: "0.8rem" }}>{item.label}</span>
                                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.7rem" }}>{item.type}</span>
                            </div>
                            <span style={{ color: "#7fd8ff", fontSize: "0.75rem" }}>{item.time}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentHistoryCard;