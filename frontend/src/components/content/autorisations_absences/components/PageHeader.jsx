// components/PageHeader.jsx
import { useState, useEffect } from "react";
import { Button, IconButton } from "@mui/material";

function useIsMobile(breakpoint = 800) {
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
    );

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, [breakpoint]);

    return isMobile;
}

export default function PageHeader({
    title,
    subtitle,
    showButton = false,
    buttonLabel = "Ajouter",
    buttonIcon = <i className="fa-solid fa-plus" style={{ fontSize: "0.9rem" }}></i>,
    onButtonClick,
    show = false,
    onBackClick,
}) {
    const isMobile = useIsMobile();

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                marginTop: isMobile ? 70 : 0 ,
                flexDirection: isMobile ? "column" : "row",
                marginBottom: "24px",
                padding: isMobile ? "8px 4px 16px" : "18px 4px 16px",
                flexWrap: "wrap",
                gap: "16px",
                width: "100%",
                borderBottom: "1px solid #e5e7eb",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                {show && (
                    <IconButton
                    
                        aria-label="retour"
                        onClick={onBackClick}
                        size="large"
                        sx={{
                            color: "#4f4f4f",
                        }}
                    >
                        <i className="fa-solid fa-arrow-left" style={{ fontSize: "1rem" }}></i>
                    </IconButton>
                )}

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                    }}
                >
                    <h1
                        style={{
                            fontSize: isMobile ? "0.8rem" : "1.0rem",
                            fontWeight: 600,
                            color: "#1a1a2e",
                            margin: 0,
                            fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                            letterSpacing: "-0.5px",
                        }}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p
                            style={{
                                fontSize: isMobile ? "0.65rem" : "0.7rem",
                                color: "#6b7280",
                                margin: 0,
                                fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                            }}
                        >
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {showButton && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        width: isMobile ? "100%" : "auto",
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onButtonClick}
                        startIcon={buttonIcon}
                        fullWidth={isMobile}
                        sx={{
                            padding: "12px 22px",
                            fontSize: isMobile ? "0.65rem" : "0.75rem",
                            fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                            textTransform: "none",
                            borderRadius: "8px",
                            boxShadow:
                                "0 14px 28px rgba(25, 118, 210, 0.45), 0 10px 10px rgba(25, 118, 210, 0.35)",
                            "&:hover": {
                                boxShadow:
                                    "0 20px 38px rgba(25, 118, 210, 0.55), 0 15px 12px rgba(25, 118, 210, 0.45)",
                                transform: "translateY(-3px)",
                            },
                            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                    >
                        {buttonLabel}
                    </Button>
                </div>
            )}
        </div>
    );
}