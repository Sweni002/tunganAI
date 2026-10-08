import React, { useState, useMemo, useRef, useEffect } from "react";
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
    InputAdornment,
    Tooltip,
    keyframes,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import RouterRoundedIcon from "@mui/icons-material/RouterRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import { useMacAddresses } from "./useMac";
import DeleteMacConfirmDialog from "./DeleteMacConfirmDialog";

// ============================================================
// Design system — Material 3 Expressive
// ============================================================

const FONT_PRIMARY = "'Poppins', sans-serif";
const FONT_MONO = "'Poppins', sans-serif";

const THEME = {
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    primaryContainer: "#dbeafe",
    danger: "#ef4444",
    dangerBg: "#fef2f2",
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    bgSubtle: "#f8fafc",
    border: "#e2e8f0",
    surface: "#ffffff",
};

// Animation M3 Expressive : ressort léger (spring) au survol
const springIn = keyframes`
    0%   { transform: scale(0.96); opacity: 0; }
    60%  { transform: scale(1.02); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
`;

const slideUp = keyframes`
    from { transform: translateY(8px); opacity: 0; }
    to   { transform: translateY(0);   opacity: 1; }
`;

// ============================================================
// Composant principal
// ============================================================

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
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    // MAC en attente de confirmation de suppression
    const [macToDelete, setMacToDelete] = useState(null);

    const searchInputRef = useRef(null);

    // Réinitialise la recherche à chaque changement de service
    useEffect(() => {
        setSearchQuery("");
    }, [idserv]);

    // ============================================================
    // Filtrage (MAC + description, insensible à la casse)
    // ============================================================
    const filteredMacAddresses = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return macAddresses;

        return macAddresses.filter((m) => {
            const mac = (m.mac_address || "").toLowerCase();
            const desc = (m.description || "").toLowerCase();
            return mac.includes(q) || desc.includes(q);
        });
    }, [macAddresses, searchQuery]);

    // ============================================================
    // Handlers de saisie MAC (masque AA:BB:CC:DD:EE:FF)
    // ============================================================
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
            searchInputRef.current?.focus();
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        searchInputRef.current?.focus();
    };

    // Ouvre le dialogue de confirmation
    const openDeleteConfirm = (macEntry) => {
        setMacToDelete(macEntry);
    };

    // Ferme le dialogue
    const closeDeleteConfirm = () => {
        // Empêche la fermeture si une suppression est en cours
        if (deletingId) return;
        setMacToDelete(null);
    };

    // Confirme et exécute la suppression
    const confirmDelete = async () => {
        if (!macToDelete) return;
        const id = macToDelete.id;
        const ok = await handleDelete(id);
        // handleDelete gère déjà le snackbar (succès ou erreur)
        // On ferme le dialogue dans tous les cas
        setMacToDelete(null);
    };

    // ============================================================
    // Rendu
    // ============================================================
    const hasMac = macAddresses.length > 0;
    const hasFilteredResult = filteredMacAddresses.length > 0;
    const isSearching = searchQuery.trim().length > 0;

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: "100%", sm: 440 },
                    backgroundColor: THEME.surface,
                    boxShadow: "-12px 0 32px rgba(15, 23, 42, 0.08)",
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
                {/* ==================== HEADER ==================== */}
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
                                    borderRadius: "12px",
                                    bgcolor: THEME.primaryContainer,
                                    color: THEME.primary,
                                    display: "flex",
                                    transition: "all 0.3s ease",
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
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    backgroundColor: "#e2e8f0",
                                    transform: "rotate(90deg)",
                                },
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
                            label={`${macAddresses.length} poste${macAddresses.length > 1 ? "s" : ""}`}
                            size="small"
                            sx={{
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                bgcolor: "#e0f2fe",
                                color: "#0369a1",
                                height: 22,
                                transition: "all 0.25s ease",
                                "&:hover": { transform: "scale(1.05)" },
                            }}
                        />
                    </Box>
                </Box>

                {/* ==================== FORMULAIRE ==================== */}
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        borderBottom: `1px solid ${THEME.border}`,
                        bgcolor: THEME.surface,
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
                        InputLabelProps={{
                            style: { fontFamily: FONT_PRIMARY, fontSize: "0.9rem" },
                        }}
                    />

                    <TextField
                        label="Description du poste (Optionnel)"
                        value={descInput}
                        onChange={(e) => setDescInput(e.target.value)}
                        size="medium"
                        fullWidth
                        InputProps={{
                            style: { fontFamily: FONT_PRIMARY, fontSize: "0.95rem" },
                        }}
                        inputProps={{ style: { padding: "14px 12px" } }}
                        InputLabelProps={{
                            style: { fontFamily: FONT_PRIMARY, fontSize: "0.9rem" },
                        }}
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
                            py: 1.2,
                            borderRadius: "12px",
                            backgroundColor: THEME.primary,
                            transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                            "&:hover": {
                                backgroundColor: THEME.primaryHover,
                                transform: "translateY(-1px)",
                                boxShadow: "0 6px 16px rgba(59, 130, 246, 0.25)",
                            },
                            "&:active": {
                                transform: "translateY(0) scale(0.98)",
                            },
                            "&:disabled": { backgroundColor: "#cbd5e1" },
                        }}
                    >
                        {saving ? "Enregistrement..." : "Ajouter le poste"}
                    </Button>
                </Box>

                {/* ==================== ZONE LISTE + RECHERCHE ==================== */}
                <Box
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        overflowY: "hidden",
                        backgroundColor: THEME.bgSubtle,
                    }}
                >
                    {/* ---------- Barre de recherche M3 Expressive ---------- */}
                    {hasMac && (
                        <Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
                            <TextField
                                inputRef={searchInputRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                placeholder="Rechercher une MAC ou un poste..."
                                size="small"
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchRoundedIcon
                                                sx={{
                                                    fontSize: "1.1rem",
                                                    color: searchFocused
                                                        ? THEME.primary
                                                        : THEME.textSecondary,
                                                    transition: "color 0.2s ease",
                                                }}
                                            />
                                        </InputAdornment>
                                    ),
                                    endAdornment: isSearching && (
                                        <InputAdornment position="end">
                                            <Tooltip title="Effacer" arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={clearSearch}
                                                    sx={{
                                                        color: THEME.textSecondary,
                                                        animation: `${springIn} 0.25s ease-out`,
                                                        "&:hover": {
                                                            color: THEME.primary,
                                                            bgcolor: THEME.primaryContainer,
                                                        },
                                                    }}
                                                >
                                                    <ClearRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        fontFamily: FONT_PRIMARY,
                                        fontSize: "0.9rem",
                                        // Shape morphing M3 Expressive : plus arrondi au focus
                                        borderRadius: searchFocused ? "20px" : "12px",
                                        backgroundColor: searchFocused
                                            ? "#ffffff"
                                            : "rgba(255, 255, 255, 0.7)",
                                        transition:
                                            "border-radius 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), " +
                                            "background-color 0.25s ease, " +
                                            "box-shadow 0.25s ease",
                                        "& fieldset": {
                                            borderColor: THEME.border,
                                            transition: "border-color 0.2s ease",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#cbd5e1",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: THEME.primary,
                                            borderWidth: "2px",
                                        },
                                        "&.Mui-focused": {
                                            boxShadow: `0 4px 12px ${THEME.primary}22`,
                                        },
                                    },
                                }}
                                inputProps={{
                                    style: {
                                        padding: "10px 8px",
                                    },
                                }}
                            />

                            {/* Compteur de résultats filtrés */}
                            {isSearching && (
                                <Typography
                                    sx={{
                                        fontSize: "0.72rem",
                                        color: THEME.textSecondary,
                                        mt: 1,
                                        ml: 0.5,
                                        fontFamily: FONT_PRIMARY,
                                        animation: `${slideUp} 0.2s ease-out`,
                                    }}
                                >
                                    {filteredMacAddresses.length} résultat
                                    {filteredMacAddresses.length > 1 ? "s" : ""} sur{" "}
                                    {macAddresses.length}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* ---------- Liste ---------- */}
                    <Box
                        sx={{
                            flex: 1,
                            px: 3,
                            pb: 3,
                            pt: hasMac ? 1 : 3,
                            overflowY: "auto",
                        }}
                    >
                        {loading ? (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                {[1, 2, 3].map((i) => (
                                    <Skeleton
                                        key={i}
                                        variant="rounded"
                                        height={56}
                                        sx={{ borderRadius: "12px" }}
                                    />
                                ))}
                            </Box>
                        ) : !hasMac ? (
                            /* ===== État vide initial ===== */
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
                                        borderRadius: "16px",
                                        bgcolor: THEME.surface,
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
                        ) : !hasFilteredResult ? (
                            /* ===== État "aucun résultat" ===== */
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
                                        animation: `${slideUp} 0.25s ease-out`,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            borderRadius: "50%",
                                            bgcolor: "#f1f5f9",
                                            mb: 1.5,
                                            display: "flex",
                                        }}
                                    >
                                        <SearchOffRoundedIcon
                                            sx={{ fontSize: "2rem", color: "#94a3b8" }}
                                        />
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontSize: "0.9rem",
                                            fontWeight: 600,
                                            color: THEME.textPrimary,
                                            mb: 0.5,
                                        }}
                                    >
                                        Aucun résultat
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontSize: "0.78rem",
                                            color: THEME.textSecondary,
                                            mb: 2,
                                        }}
                                    >
                                        Aucune MAC ne correspond à «{" "}
                                        <strong>{searchQuery}</strong> »
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={clearSearch}
                                        sx={{
                                            fontFamily: FONT_PRIMARY,
                                            textTransform: "none",
                                            fontSize: "0.78rem",
                                            fontWeight: 600,
                                            borderRadius: "10px",
                                            color: THEME.primary,
                                            "&:hover": {
                                                bgcolor: THEME.primaryContainer,
                                            },
                                        }}
                                    >
                                        Effacer la recherche
                                    </Button>
                                </Box>
                            </Fade>
                        ) : (
                            /* ===== Liste filtrée ===== */
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {filteredMacAddresses.map((m, index) => {
                                    const isDeleting = deletingId === m.id;

                                    return (
                                        <Box
                                            key={m.id}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                p: "10px 14px",
                                                backgroundColor: THEME.surface,
                                                borderRadius: "12px",
                                                border: `1px solid ${THEME.border}`,
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                                transition:
                                                    "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), " +
                                                    "border-color 0.2s ease, " +
                                                    "box-shadow 0.2s ease, " +
                                                    "opacity 0.2s ease",
                                                opacity: isDeleting ? 0.5 : 1,
                                                animation: `${slideUp} 0.25s ease-out both`,
                                                animationDelay: `${Math.min(index * 25, 200)}ms`,
                                                "&:hover": {
                                                    borderColor: "#cbd5e1",
                                                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
                                                    transform: "translateY(-1px)",
                                                },
                                            }}
                                        >
                                            <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
                                                {/* Surlignage du terme recherché dans la MAC */}
                                                <Typography
                                                    sx={{
                                                        fontFamily: FONT_MONO,
                                                        fontSize: "0.82rem",
                                                        fontWeight: 700,
                                                        color: THEME.textPrimary,
                                                        letterSpacing: "0.3px",
                                                    }}
                                                >
                                                    {highlightMatch(
                                                        m.mac_address,
                                                        searchQuery
                                                    )}
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
                                                        {highlightMatch(
                                                            m.description,
                                                            searchQuery
                                                        )}
                                                    </Typography>
                                                )}
                                            </Box>

                                            <IconButton
                                                size="small"
                                                onClick={() => openDeleteConfirm(m)}  // ← APRÈS

                                                disabled={isDeleting}
                                                sx={{
                                                    color: THEME.textSecondary,
                                                    transition: "all 0.2s ease",
                                                    "&:hover": {
                                                        color: THEME.danger,
                                                        backgroundColor: THEME.dangerBg,
                                                        transform: "scale(1.1)",
                                                    },
                                                    "&:active": {
                                                        transform: "scale(0.95)",
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
            </Box>
            {/* Dialogue de confirmation de suppression */}
            <DeleteMacConfirmDialog
                open={Boolean(macToDelete)}
                onClose={closeDeleteConfirm}
                onConfirm={confirmDelete}
                loading={Boolean(deletingId)}
                macAddress={macToDelete?.mac_address}
                description={macToDelete?.description}
                serviceName={service?.nom}
            />

        </Drawer>


    );
};

// ============================================================
// Helper : surlignage du terme recherché
// ============================================================
function highlightMatch(text, query) {
    if (!text) return text;
    const q = query.trim();
    if (!q) return text;

    const lower = text.toLowerCase();
    const lowerQ = q.toLowerCase();
    const idx = lower.indexOf(lowerQ);

    if (idx === -1) return text;

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);

    return (
        <>
            {before}
            <Box
                component="span"
                sx={{
                    backgroundColor: "#fef08a",
                    color: "#854d0e",
                    fontWeight: 800,
                    borderRadius: "3px",
                    px: 0.3,
                }}
            >
                {match}
            </Box>
            {after}
        </>
    );
}

export default MacAddressesDrawer;