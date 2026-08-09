import React, { useState } from "react";
import {
    Drawer,
    IconButton,
    TextField,
    Button,
    CircularProgress,
    Typography,
    Box,
    Chip,
    Skeleton,
    Fade,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import RouterRoundedIcon from "@mui/icons-material/RouterRounded";
import { useMacAddresses } from "./useMac";

// Constantes de Style & Design System
const FONT_PRIMARY = "'Inter', 'Poppins', system-ui, sans-serif";
const FONT_MONO = "'Roboto Mono', 'Fira Code', monospace";

const THEME = {
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    danger: "#ef4444",
    dangerBg: "#fef2f2",
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    bgSubtle: "#f8fafc",
    border: "#e2e8f0",
};

const MacAddressesDrawer = ({ open, onClose, service, showSnackbar }) => {
    const idserv = service?.idserv;
    const {
        macAddresses = [],
        loading,
        saving,
        deletingId,
        handleAdd,
        handleDelete,
    } = useMacAddresses(idserv, showSnackbar);

    const [macInput, setMacInput] = useState("");
    const [descInput, setDescInput] = useState("");

    // Masque dynamique d'adresse MAC (AA:BB:CC:DD:EE:FF)
    const handleMacChange = (e) => {
        let raw = e.target.value.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
        if (raw.length > 12) raw = raw.substring(0, 12);

        const formatted = raw.match(/.{1,2}/g)?.join(":") || raw;
        setMacInput(formatted);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!macInput.trim()) return;

        const success = await handleAdd([
            { mac_address: macInput.trim(), description: descInput.trim() || null },
        ]);

        if (success) {
            setMacInput("");
            setDescInput("");
        }
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: "100%", sm: 420 },
                    backgroundColor: "#ffffff",
                    boxShadow: "-8px 0 24px rgba(0, 0, 0, 0.06)",
                },
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    fontFamily: FONT_PRIMARY,
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        padding: "24px 24px 16px",
                        borderBottom: `1px solid ${THEME.border}`,
                        backgroundColor: THEME.bgSubtle,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box
                                sx={{
                                    p: 1,
                                    borderRadius: "10px",
                                    bgcolor: "#eff6ff",
                                    color: THEME.primary,
                                    display: "flex",
                                }}
                            >
                                <RouterRoundedIcon fontSize="small" />
                            </Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                    color: THEME.textPrimary,
                                    fontFamily: FONT_PRIMARY,
                                }}
                            >
                                Adresses MAC Autorisées
                            </Typography>
                        </Box>

                        <IconButton
                            onClick={onClose}
                            size="small"
                            sx={{
                                color: THEME.textSecondary,
                                "&:hover": { backgroundColor: "#e2e8f0" },
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mt: 1.5,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: "0.8rem",
                                color: THEME.textSecondary,
                                fontWeight: 500,
                            }}
                        >
                            {service?.nom || "Service sélectionné"}
                        </Typography>

                        <Chip
                            label={`${macAddresses.length} poste${macAddresses.length > 1 ? "s" : ""
                                }`}
                            size="small"
                            sx={{
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                bgcolor: "#e0f2fe",
                                color: "#0369a1",
                                height: 22,
                            }}
                        />
                    </Box>
                </Box>

                {/* Formulaire de Saisie */}
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        borderBottom: `1px solid ${THEME.border}`,
                        bgcolor: "#ffffff",
                    }}
                >
                    <TextField
                        label="Adresse MAC"
                        value={macInput}
                        onChange={handleMacChange}
                        size="medium"
                        fullWidth
                        required
                        inputProps={{
                            maxLength: 17,
                            style: {
                                fontFamily: FONT_MONO,
                                fontSize: "0.95rem",
                                letterSpacing: "0.5px",
                                padding: "14px 12px",
                            },
                        }}
                        InputLabelProps={{ style: { fontFamily: FONT_PRIMARY, fontSize: "0.9rem" } }}
                    />

                    <TextField
                        label="Description du poste (Optionnel)"
                        value={descInput}
                        onChange={(e) => setDescInput(e.target.value)}
                        size="medium"
                        fullWidth
                        InputProps={{ style: { fontFamily: FONT_PRIMARY, fontSize: "0.95rem" } }}
                        inputProps={{ style: { padding: "14px 12px" } }}
                        InputLabelProps={{ style: { fontFamily: FONT_PRIMARY, fontSize: "0.9rem" } }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        disableElevation
                        startIcon={
                            saving ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : (
                                <AddRoundedIcon />
                            )
                        }
                        disabled={saving || macInput.length < 17}
                        sx={{
                            fontFamily: FONT_PRIMARY,
                            textTransform: "none",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            py: 1,
                            borderRadius: "8px",
                            backgroundColor: THEME.primary,
                            "&:hover": { backgroundColor: THEME.primaryHover },
                            "&:disabled": { backgroundColor: "#cbd5e1" },
                        }}
                    >
                        {saving ? "Enregistrement..." : "Ajouter le poste"}
                    </Button>
                </Box>

                {/* Liste des adresses MAC */}
                <Box
                    sx={{
                        flex: 1,
                        p: 3,
                        overflowY: "auto",
                        backgroundColor: THEME.bgSubtle,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: THEME.textSecondary,
                            mb: 1.5,
                        }}
                    >
                        Postes enregistrés
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                            {[1, 2, 3].map((i) => (
                                <Skeleton
                                    key={i}
                                    variant="rounded"
                                    height={56}
                                    sx={{ borderRadius: "10px" }}
                                />
                            ))}
                        </Box>
                    ) : macAddresses.length === 0 ? (
                        <Fade in>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    py: 6,
                                    px: 2,
                                    textAlign: "center",
                                    border: `2px dashed ${THEME.border}`,
                                    borderRadius: "12px",
                                    bgcolor: "#ffffff",
                                }}
                            >
                                <ComputerRoundedIcon
                                    sx={{ fontSize: "2.5rem", color: "#cbd5e1", mb: 1 }}
                                />
                                <Typography
                                    sx={{
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        color: THEME.textPrimary,
                                        mb: 0.5,
                                    }}
                                >
                                    Aucun poste autorisé
                                </Typography>
                                <Typography
                                    sx={{ fontSize: "0.75rem", color: THEME.textSecondary }}
                                >
                                    Renseignez une adresse MAC ci-dessus pour restreindre
                                    l'accès.
                                </Typography>
                            </Box>
                        </Fade>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {macAddresses.map((m) => {
                                const isDeleting = deletingId === m.id;

                                return (
                                    <Box
                                        key={m.id}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            p: "10px 14px",
                                            backgroundColor: "#ffffff",
                                            borderRadius: "10px",
                                            border: `1px solid ${THEME.border}`,
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                            transition: "all 0.2s ease-in-out",
                                            "&:hover": {
                                                borderColor: "#cbd5e1",
                                                boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
                                            },
                                        }}
                                    >
                                        <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
                                            <Typography
                                                sx={{
                                                    fontFamily: FONT_MONO,
                                                    fontSize: "0.82rem",
                                                    fontWeight: 700,
                                                    color: THEME.textPrimary,
                                                    letterSpacing: "0.3px",
                                                }}
                                            >
                                                {m.mac_address}
                                            </Typography>
                                            {m.description && (
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.73rem",
                                                        color: THEME.textSecondary,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        mt: 0.2,
                                                    }}
                                                >
                                                    {m.description}
                                                </Typography>
                                            )}
                                        </Box>

                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(m.id)}
                                            disabled={isDeleting}
                                            sx={{
                                                color: THEME.textSecondary,
                                                transition: "all 0.2s",
                                                "&:hover": {
                                                    color: THEME.danger,
                                                    backgroundColor: THEME.dangerBg,
                                                },
                                            }}
                                        >
                                            {isDeleting ? (
                                                <CircularProgress size={16} color="error" />
                                            ) : (
                                                <DeleteOutlineIcon fontSize="small" />
                                            )}
                                        </IconButton>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Box>
        </Drawer>
    );
};

export default MacAddressesDrawer;