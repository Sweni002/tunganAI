import React from "react";
import {
    Dialog,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Box,
    IconButton,
    Fade,
    CircularProgress,
    keyframes,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

// ============================================================
// Design tokens
// ============================================================
const FONT_PRIMARY = "'Inter', 'Poppins', system-ui, sans-serif";
const FONT_MONO = "'Roboto Mono', 'Fira Code', monospace";

const THEME = {
    danger: "#dc2626",
    dangerHover: "#b91c1c",
    dangerContainer: "#fee2e2",
    dangerContainerDark: "#fecaca",
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    surface: "#ffffff",
    surfaceMuted: "#f8fafc",
};

// ============================================================
// Animations M3 Expressive
// ============================================================
const springPop = keyframes`
    0%   { transform: scale(0.85); opacity: 0; }
    60%  { transform: scale(1.04); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
`;

const pulseRing = keyframes`
    0%   { box-shadow: 0 0 0 0 ${THEME.danger}40; }
    70%  { box-shadow: 0 0 0 12px ${THEME.danger}00; }
    100% { box-shadow: 0 0 0 0 ${THEME.danger}00; }
`;

// ============================================================
// Composant
// ============================================================
const DeleteMacConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    loading = false,
    macAddress,
    description,
    serviceName,
}) => {
    const handleBackdropClose = (event, reason) => {
        // Empêche la fermeture pendant la suppression
        if (loading) return;
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleBackdropClose}
            maxWidth="xs"
            fullWidth
            TransitionComponent={Fade}
            transitionDuration={220}
            PaperProps={{
                sx: {
                    borderRadius: "28px",
                    padding: 0,
                    overflow: "hidden",
                    backgroundColor: THEME.surface,
                    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
                    fontFamily: FONT_PRIMARY,
                    // Animation d'entrée type M3 Expressive
                    animation: open ? `${springPop} 0.3s ease-out` : "none",
                },
            }}
            BackdropProps={{
                sx: {
                    backdropFilter: "blur(4px)",
                    backgroundColor: "rgba(15, 23, 42, 0.35)",
                },
            }}
        >
            {/* ==================== EN-TÊTE avec icône ==================== */}
            <Box
                sx={{
                    position: "relative",
                    pt: 4,
                    pb: 2,
                    px: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                }}
            >
                {/* Bouton fermer */}
                <IconButton
                    onClick={onClose}
                    disabled={loading}
                    size="small"
                    sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        color: THEME.textSecondary,
                        transition: "all 0.2s ease",
                        "&:hover": {
                            backgroundColor: "#e2e8f0",
                            transform: "rotate(90deg)",
                        },
                        "&.Mui-disabled": { color: "#cbd5e1" },
                    }}
                >
                    <CloseRoundedIcon fontSize="small" />
                </IconButton>

                {/* Icône danger dans un cercle pulsant */}
                <Box
                    sx={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        backgroundColor: THEME.dangerContainer,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2,
                        animation: `${pulseRing} 2s ease-out infinite`,
                    }}
                >
                    <DeleteForeverRoundedIcon
                        sx={{
                            fontSize: "2.2rem",
                            color: THEME.danger,
                        }}
                    />
                </Box>

                {/* Titre */}
                <Typography
                    sx={{
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        color: THEME.textPrimary,
                        fontFamily: FONT_PRIMARY,
                        mb: 1,
                        letterSpacing: "-0.02em",
                    }}
                >
                    Supprimer cette adresse MAC ?
                </Typography>

                {/* Sous-titre */}
                <Typography
                    sx={{
                        fontSize: "0.85rem",
                        color: THEME.textSecondary,
                        fontFamily: FONT_PRIMARY,
                        lineHeight: 1.5,
                        maxWidth: 320,
                    }}
                >
                    Cette action est irréversible. Le poste ne pourra plus
                    effectuer de pointage après suppression.
                </Typography>
            </Box>

            {/* ==================== CARTE RÉCAP ==================== */}
            <DialogContent
                sx={{
                    px: 3,
                    pt: 0,
                    pb: 3,
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        borderRadius: "16px",
                        backgroundColor: THEME.surfaceMuted,
                        border: `1px solid ${THEME.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                    }}
                >
                    {/* Adresse MAC en évidence */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <WarningAmberRoundedIcon
                            sx={{
                                fontSize: "1.1rem",
                                color: "#f59e0b",
                                flexShrink: 0,
                            }}
                        />
                        <Typography
                            sx={{
                                fontFamily: FONT_MONO,
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                color: THEME.textPrimary,
                                letterSpacing: "0.4px",
                                wordBreak: "break-all",
                            }}
                        >
                            {macAddress || "—"}
                        </Typography>
                    </Box>

                    {/* Description (si présente) */}
                    {description && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                pl: 0.2,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: "50%",
                                    backgroundColor: THEME.textSecondary,
                                    flexShrink: 0,
                                    ml: 0.6,
                                }}
                            />
                            <Typography
                                sx={{
                                    fontSize: "0.78rem",
                                    color: THEME.textSecondary,
                                    fontFamily: FONT_PRIMARY,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {description}
                            </Typography>
                        </Box>
                    )}

                    {/* Service concerné */}
                    {serviceName && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                pt: 1,
                                mt: 0.5,
                                borderTop: `1px dashed ${THEME.border}`,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: "0.72rem",
                                    color: THEME.textSecondary,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    fontWeight: 600,
                                }}
                            >
                                Service
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: "0.8rem",
                                    color: THEME.textPrimary,
                                    fontWeight: 600,
                                    fontFamily: FONT_PRIMARY,
                                }}
                            >
                                {serviceName}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            {/* ==================== ACTIONS ==================== */}
            <DialogActions
                sx={{
                    px: 3,
                    pb: 3,
                    pt: 0,
                    display: "flex",
                    gap: 1.5,
                    flexDirection: { xs: "column-reverse", sm: "row" },
                    "& > :not(:first-of-type)": { ml: 0 },
                }}
            >
                <Button
                    fullWidth
                    onClick={onClose}
                    disabled={loading}
                    variant="text"
                    sx={{
                        fontFamily: FONT_PRIMARY,
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        py: 1.2,
                        borderRadius: "14px",
                        color: THEME.textSecondary,
                        transition: "all 0.2s ease",
                        "&:hover": {
                            backgroundColor: "#f1f5f9",
                            color: THEME.textPrimary,
                        },
                    }}
                >
                    Annuler
                </Button>

                <Button
                    fullWidth
                    onClick={onConfirm}
                    disabled={loading}
                    variant="contained"
                    disableElevation
                    startIcon={
                        loading ? (
                            <CircularProgress size={16} color="inherit" />
                        ) : (
                            <DeleteForeverRoundedIcon sx={{ fontSize: "1.1rem" }} />
                        )
                    }
                    sx={{
                        fontFamily: FONT_PRIMARY,
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        py: 1.2,
                        borderRadius: "14px",
                        backgroundColor: THEME.danger,
                        color: "#fff",
                        transition:
                            "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        "&:hover": {
                            backgroundColor: THEME.dangerHover,
                            transform: "translateY(-1px)",
                            boxShadow: "0 8px 20px rgba(220, 38, 38, 0.35)",
                        },
                        "&:active": {
                            transform: "translateY(0) scale(0.98)",
                        },
                        "&.Mui-disabled": {
                            backgroundColor: "#fca5a5",
                            color: "#fff",
                        },
                    }}
                >
                    {loading ? "Suppression..." : "Supprimer"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteMacConfirmDialog;