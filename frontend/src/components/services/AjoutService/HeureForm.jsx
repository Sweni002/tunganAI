import React, { useCallback, useState } from "react";
import styles from "../ajout_service.module.css";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Badge from "@mui/material/Badge";
import { Spin } from "antd";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import "dayjs/locale/fr";


// Bornes horaires autorisées : entre 05h00 et 19h00
const MIN_TIME = dayjs("2000-01-01T05:00");
const MAX_TIME = dayjs("2000-01-01T19:00");
// ---------------------------------------------------------------------------
// Helpers de conversion : le formState garde des strings "HH:mm" (compatibles
// avec le backend), le TimePicker MUI travaille avec des objets dayjs.
// ---------------------------------------------------------------------------
const stringToDayjs = (value) =>
    value ? dayjs(`2000-01-01T${value}`) : null;

const dayjsToString = (value) =>
    value && value.isValid() ? value.format("HH:mm") : "";

// Style commun aux champs — hissé au niveau module (perf : créé une seule fois)
const timeFieldSx = {
    mt: 1,
    mb: 2,
    width: "100%",
    "& .MuiInputBase-input": {
        padding: "8px 1px",
        fontSize: "0.9rem",
        fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
        cursor: "pointer",
        "@media (max-width:600px)": {
            padding: "5px 0px !important",
        },
    },
    "& .MuiIconButton-root": {
        cursor: "pointer",
        color: "#3390a2",
        "& svg": { fontSize: "1.1rem" },
    },
};

// Personnalisation du popup du TimePicker (couleur du thème #14535f)
const popperSx = {
    "& .MuiMultiSectionDigitalClockSection-item.Mui-selected": {
        backgroundColor: "#3390a2",
        "&:hover": { backgroundColor: "#3390a2" },
    },
    "& .MuiClock-pin, & .MuiClockPointer-root, & .MuiClockPointer-thumb": {
        backgroundColor: "#3390a2",
        borderColor: "#3390a2",
    },
    "& .MuiButton-root": {
        color: "#3390a2",
        fontFamily: "'Poppins', sans-serif",
        textTransform: "none",
    },
};


// Style des Tabs Matin / Soir
const tabsSx = {
    mb: 5.5,
    minHeight: "52px",
    width: "40%",              // ← le conteneur prend toute la largeur du formulaire
    borderBottom: "1px solid #e6e9ea",
    "& .MuiTabs-indicator": {
        backgroundColor: "#3390a2",
        height: "2px",
        borderRadius: "3px 3px 0 0",
    },
};

const tabSx = {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "0.85rem",
    fontWeight: 500,
    textTransform: "none",
    minHeight: "52px",          // ← aligné sur la hauteur du conteneur (52px)
    minWidth: "200px",          // ← largeur minimale de chaque onglet
    px: 4,                      // ← padding horizontal plus généreux
    cursor: "pointer",
    color: "#8a8a8a",
    gap: 1,
    "&.Mui-selected": {
        color: "#3390a2",
        fontWeight: 600,
    },
};

// ---------------------------------------------------------------------------
// PERF : React.memo + props primitives (strings/booleans).
// Quand on modifie une heure, seule la plage concernée re-render.
// ---------------------------------------------------------------------------
const TimeRangeField = React.memo(
    ({
        label,
        fieldDebut,
        fieldFin,
        valueDebut,
        valueFin,
        errorDebut,
        errorFin,
        onInputChange,
        errorMessage,
    }) => (
        <div className={styles.inputM}>
            <label>
                {label} <span style={{ color: "red" }}>*</span>
            </label>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                }}
            >
                {/* Heure de début de la plage */}
                <TimePicker
                    value={stringToDayjs(valueDebut)}
                    onChange={(newValue) =>
                        onInputChange(fieldDebut, dayjsToString(newValue))
                    }
                    ampm={false}
                    minutesStep={5}
                    minTime={MIN_TIME}          // ← pas avant 05h00
                    maxTime={MAX_TIME}
                    slotProps={{
                        textField: {
                            id: fieldDebut,
                            variant: "standard",
                            fullWidth: true,
                            error: errorDebut,
                            placeholder: "hh:mm",
                            sx: timeFieldSx,
                        },
                        popper: { sx: popperSx },
                        field: { clearable: false },
                        openPickerButton: { size: "small" },
                    }}
                />

                <span
                    style={{
                        fontSize: "0.9rem",
                        fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
                        color: "#666",
                    }}
                >
                    --
                </span>

                {/* Heure de fin de la plage */}
                <TimePicker
                    value={stringToDayjs(valueFin)}
                    onChange={(newValue) =>
                        onInputChange(fieldFin, dayjsToString(newValue))
                    }
                    ampm={false}
                    minTime={stringToDayjs(valueDebut) || MIN_TIME}
                    maxTime={MAX_TIME}
                    slotProps={{
                        textField: {
                            id: fieldFin,
                            variant: "standard",
                            fullWidth: true,
                            error: errorFin,
                            placeholder: "hh:mm",
                            sx: timeFieldSx,
                        },
                        popper: { sx: popperSx },
                        field: { clearable: false },
                        openPickerButton: { size: "small" },
                    }}
                />
            </div>
            {(errorDebut || errorFin) && (
                <Typography color="error" variant="caption" sx={{ color: "brown" }}>
                    {errorMessage}
                </Typography>
            )}
        </div>
    )
);
TimeRangeField.displayName = "TimeRangeField";

// Styles hissés au niveau module (perf)
const btnPrecedentSx = {
    fontFamily: "'Poppins', sans-serif",
    color: "#3390a2",
    borderColor: "#3390a2",
    fontSize: "0.75rem",
    mb: 1,
    display: "flex",
    gap: 1.5,
    py: 1.0,
    px: 3,
    minWidth: "140px",
    borderRadius: "4px",
    justifyContent: "center",
    textTransform: "none",
    transition: "all 0.3s ease",
    cursor: "pointer",
};

const btnSuivantSx = {
    fontFamily: "'Poppins', sans-serif",
    backgroundColor: "#3390a2",
    fontSize: "0.75rem",
    mb: 1,
    display: "flex",
    gap: 1.5,
    py: 1.0,
    px: 3,
    minWidth: "140px",
    borderRadius: "4px",
    justifyContent: "center",
    border: "none",
    textTransform: "none",
    transition: "all 0.3s ease",
    cursor: "pointer",
};

const HeureForm = ({
    formState,
    errors,
    loading,
    onInputChange,
    onBack,
    onSubmit,
    onValidate,
}) => {
    // Onglet actif : 0 = Matin, 1 = Soir
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = useCallback((event, newValue) => {
        setActiveTab(newValue);
    }, []);

    // Un point rouge sur l'onglet si des erreurs concernent des champs cachés
    const hasMatinErrors =
        !!errors.entreeMatinDebut ||
        !!errors.entreeMatinFin ||
        !!errors.sortieMatinDebut ||
        !!errors.sortieMatinFin;

    const hasSoirErrors =
        !!errors.entreeSoirDebut ||
        !!errors.entreeSoirFin ||
        !!errors.sortieSoirDebut ||
        !!errors.sortieSoirFin;

    // PERF : référence stable
    const handleSubmit = useCallback(() => {
        if (!onValidate || onValidate()) {
            onSubmit();
        }
    }, [onValidate, onSubmit]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            <div className={styles.form}>
                {/* ================= TABS MATIN / SOIR ================= */}
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={tabsSx}
                >
                    <Tab
                        icon={
                            <Badge color="error" variant="dot" invisible={!hasMatinErrors}>
                                <i className="fa-solid fa-sun" style={{ fontSize: "0.75rem" }}></i>
                            </Badge>
                        }
                        iconPosition="start"
                        label="Matin"
                        sx={tabSx}
                    />
                    <Tab
                        icon={
                            <Badge color="error" variant="dot" invisible={!hasSoirErrors}>
                                <i className="fa-solid fa-moon" style={{ fontSize: "0.75rem" }}></i>
                            </Badge>
                        }
                        iconPosition="start"
                        label="Soir"
                        sx={tabSx}
                    />
                </Tabs>

                {/* ================= ONGLET MATIN ================= */}
                {activeTab === 0 && (
                    <>
                        <TimeRangeField
                            label="Heure d'entrée (matin)"
                            fieldDebut="entreeMatinDebut"
                            fieldFin="entreeMatinFin"
                            valueDebut={formState.entreeMatinDebut || ""}
                            valueFin={formState.entreeMatinFin || ""}
                            errorDebut={!!errors.entreeMatinDebut}
                            errorFin={!!errors.entreeMatinFin}
                            onInputChange={onInputChange}
                            errorMessage="La plage d'heure d'entrée du matin est requise."
                        />

                        <TimeRangeField
                            label="Heure de sortie (matin)"
                            fieldDebut="sortieMatinDebut"
                            fieldFin="sortieMatinFin"
                            valueDebut={formState.sortieMatinDebut || ""}
                            valueFin={formState.sortieMatinFin || ""}
                            errorDebut={!!errors.sortieMatinDebut}
                            errorFin={!!errors.sortieMatinFin}
                            onInputChange={onInputChange}
                            errorMessage="La plage d'heure de sortie du matin est requise."
                        />
                    </>
                )}

                {/* ================= ONGLET SOIR ================= */}
                {activeTab === 1 && (
                    <>
                        <TimeRangeField
                            label="Heure d'entrée (soir)"
                            fieldDebut="entreeSoirDebut"
                            fieldFin="entreeSoirFin"
                            valueDebut={formState.entreeSoirDebut || ""}
                            valueFin={formState.entreeSoirFin || ""}
                            errorDebut={!!errors.entreeSoirDebut}
                            errorFin={!!errors.entreeSoirFin}
                            onInputChange={onInputChange}
                            errorMessage="La plage d'heure d'entrée du soir est requise."
                        />

                        <TimeRangeField
                            label="Heure de sortie (soir)"
                            fieldDebut="sortieSoirDebut"
                            fieldFin="sortieSoirFin"
                            valueDebut={formState.sortieSoirDebut || ""}
                            valueFin={formState.sortieSoirFin || ""}
                            errorDebut={!!errors.sortieSoirDebut}
                            errorFin={!!errors.sortieSoirFin}
                            onInputChange={onInputChange}
                            errorMessage="La plage d'heure de sortie du soir est requise."
                        />
                    </>
                )}

                {/* ================= BOUTONS ================= */}
                <div
                    className={styles.btn}
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    {/* Précédent */}
                    <Button
                        variant="outlined"
                        disabled={loading}
                        onClick={onBack}
                        sx={btnPrecedentSx}
                    >
                        <i className="fa-solid fa-arrow-left" style={{ fontSize: "1rem" }}></i>
                        <span>Précédent</span>
                    </Button>

                    {/* Suivant / Sauvegarder */}
                    <Button
                        variant="contained"
                        disabled={loading}
                        onClick={handleSubmit}
                        sx={btnSuivantSx}
                    >
                        {loading ? (
                            <Spin size="large" />
                        ) : (
                            <>
                                <span>Suivant</span>
                                <i
                                    className="fa-solid fa-arrow-right"
                                    style={{ fontSize: "1rem" }}
                                ></i>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </LocalizationProvider>
    );
};

export default HeureForm;