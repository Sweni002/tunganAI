// src/pages/Login/components/MacAgentInstallationCard.jsx

import React from "react";
import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    CircularProgress,
} from "@mui/material";

const MacAgentInstallationCard = ({
    macAgentInstalling,
    handleInstallMacAgent,
}) => {
    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
                background: "linear-gradient(145deg, #f8fafc 0%, #edf2f7 100%)",
                fontFamily: "'Poppins', sans-serif",
            }}
        >
            <Card
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "grey.200",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                    bgcolor: "background.paper",
                    fontFamily: "inherit",
                }}
            >
                <CardContent
                    sx={{
                        p: 4,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography
                            variant="h5"
                            fontWeight={700}
                            color="text.primary"
                            sx={{ fontFamily: "inherit", letterSpacing: "-0.3px", mb: 3 }}
                        >
                            Installation requise
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontFamily: "inherit", lineHeight: 1.6 }}
                        >
                            Le composant nécessaire au fonctionnement du pointage n'est pas
                            détecté sur ce poste.
                        </Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            disableElevation
                            onClick={handleInstallMacAgent}
                            disabled={macAgentInstalling}
                            sx={{
                                borderRadius: 2,
                                py: 1.4,
                                fontWeight: 600,
                                textTransform: "none",
                                fontFamily: "inherit",
                            }}
                        >
                            {macAgentInstalling ? (
                                <Box
                                    sx={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 1.5,
                                    }}
                                >
                                    <CircularProgress
                                        size={18}
                                        thickness={5}
                                        sx={{
                                            color: "#ffffff", // Forcer le blanc
                                            animationDuration: "800ms",
                                        }}
                                    />
                                </Box>
                            ) : (
                                "Installer"
                            )}
                        </Button>

                        <Button
                            variant="text"
                            size="medium"
                            fullWidth
                            onClick={handleRefresh}
                            sx={{
                                borderRadius: 2,
                                py: 1,
                                fontWeight: 600,
                                color: "text.secondary",
                                textTransform: "none",
                                fontFamily: "inherit",
                                "&:hover": {
                                    bgcolor: "action.hover",
                                },
                            }}
                        >
                            Actualiser la page
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default MacAgentInstallationCard;