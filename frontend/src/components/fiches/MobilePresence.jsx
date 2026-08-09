import React, { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import { Spin } from "antd";
import { Popover } from "antd";
// Nécessaire pour mettre la première lettre en majuscule (ex: Janvier)
import updateLocale from "dayjs/plugin/updateLocale";
dayjs.extend(updateLocale);
dayjs.locale("fr");
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useOutletContext } from "react-router-dom";
import TextField from "@mui/material/TextField";
import {
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  LogIn,
  DoorOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  FileCheck,
  XCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import styles from "./mobilePresence.module.css";
import CircularProgress from "@mui/material/CircularProgress";
import { RotateCcw } from "lucide-react";
import PageHeader from "../content/autorisations_absences/components/PageHeader";

const theme = createTheme({
  palette: { primary: { main: "#2196F3" } },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "14px",
          border: "1px solid #eeeded",
          boxShadow: "none",
          marginBottom: "10px",
        },
      },
    },
  },
});

const SessionTile = ({
  subtitle,
  nomabbr, // 👈 AJOUT

  title,
  color,
  icon: Icon,
  statut,
  entree,
  sortie,
  entreeIcon: EntreeIcon,
  sortieIcon: SortieIcon,
  entreeColor,
  sortieColor,
  retard = "0mn",
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const [filtrerDeuxDate, setFiltrerDeuxDate] = useState(true);
  const getDynamicFontSize = (text) => {
    if (text.length > 15) return "10px";
    if (text.length > 10) return "11px";
    return "13px";
  };

  const getHeaderStatus = () => {
    if (statut === "Sortie non enregistrée" || statut === "Absent") {
      return { text: "Absent", color: "#F44336" };
    }
    const hasDelay = retard !== "0mn" && retard !== "---" && retard !== null;
    if (hasDelay && statut === "Présent") {
      return { text: "Retard", color: "#FF9800" };
    }
    if (statut === "Présent") {
      return { text: "Présent", color: "#4CAF50" };
    }
    return { text: statut, color: "#9E9E9E" };
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case "Présent":
        return { icon: CheckCircle, color: "#4CAF50", bg: "#E8F5E9" };
      case "Autorisation d'absence":
        return { icon: FileCheck, color: "#2196F3", bg: "#E3F2FD" };
      case "Sortie non enregistrée":
        return { icon: XCircle, color: "#F44336", bg: "#FFEBEE" };
      default:
        return { icon: AlertCircle, color: "#757575", bg: "#F5F5F5" };
    }
  };

  const headerInfo = getHeaderStatus();
  const detailConfig = getStatusDetails(statut);
  const StatusIcon = detailConfig.icon;
  const hasRetard = retard !== "0mn" && retard !== "---";
const isAbsenceNonJustifie = statut === "Absence non justifiée";
  return (
    <div className={styles.container}>
      <div
        className={styles.tileHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.leading}>
          {Icon && <Icon size={22} style={{ color: color }} />}
        </div>
        <div className={styles.titleSection}>
          <h3 style={{ color: color }} className={styles.title}>
            {title}
          </h3>
          <span className={styles.subtitle} style={{ color: "black" }}>
            {subtitle ?? headerInfo.text}
          </span>
        </div>
        <div className={styles.trailing}>
          {isExpanded ? (
            <ChevronUp size={18} color="grey" />
          ) : (
            <ChevronDown size={18} color="grey" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.gridContainer}>
            <div
              className={styles.timeCard}
              style={{ backgroundColor: `${entreeColor}1A` }}
            >
              <EntreeIcon size={18} style={{ color: entreeColor }} />
              <span
                className={styles.timeText}
                style={{ color: entreeColor, fontSize: "13px" }}
              >
                {entree}
              </span>
              <span className={styles.label}>Entrée</span>
            </div>

            <div
              className={styles.timeCard}
              style={{ backgroundColor: `${sortieColor}1A` }}
            >
              <SortieIcon size={18} style={{ color: sortieColor }} />
              <span
                className={styles.timeText}
                style={{ color: sortieColor, fontSize: "13px" }}
              >
                {sortie}
              </span>
              <span className={styles.label}>Sortie</span>
            </div>

            { !isAbsenceNonJustifie ? (
              <Popover
                content={<div style={{ fontSize: 11 }}>{nomabbr}</div>}
                trigger="click"
                placement="topRight"
              >
                <div
                  className={styles.timeCard}
                  style={{
                    backgroundColor: detailConfig.bg,
                    cursor: "pointer",
                  }}
                >
                  <StatusIcon size={18} style={{ color: detailConfig.color }} />

                  <span
                    className={styles.timeText}
                    style={{
                      color: detailConfig.color,
                      fontSize: getDynamicFontSize(statut),
                      lineHeight: "1.1",
                    }}
                  >
                    {statut}
                  </span>

                  <span className={styles.label}>Statut</span>
                </div>
              </Popover>
            ) : (
              <div
                className={styles.timeCard}
                style={{
                  backgroundColor: detailConfig.bg,
                  cursor: "default",
                }}
              >
                <StatusIcon size={18} style={{ color: detailConfig.color }} />

                <span
                  className={styles.timeText}
                  style={{
                    color: detailConfig.color,
                    fontSize: getDynamicFontSize(statut),
                    lineHeight: "1.1",
                  }}
                >
                  {statut}
                </span>

                <span className={styles.label}>Statut</span>
              </div>
            )}

            <div
              className={styles.timeCard}
              style={{ backgroundColor: hasRetard ? "#FFF3E0" : "#F5F5F5" }}
            >
              <Clock size={18} color={hasRetard ? "#EF6C00" : "#757575"} />
              <span
                className={styles.timeText}
                style={{
                  color: hasRetard ? "#EF6C00" : "#424242",
                  fontSize: getDynamicFontSize(retard),
                }}
              >
                {retard}
              </span>
              <span className={styles.label}>Retard</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MobilePresence = ({ personnels, selectedDate, setSelectedDate,loading,setLoading }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
const [openStartPicker, setOpenStartPicker] = useState(false);
const [openEndPicker, setOpenEndPicker] = useState(false);
const [loadingFilter, setLoadingFilter] = useState(false);
const [activeDate, setActiveDate] = useState(null);
 
const start = startDate ? dayjs(startDate) : null;
const end = endDate ? dayjs(endDate) : null;

const days =
  start && end
    ? Array.from({ length: end.diff(start, "day") + 1 }, (_, i) =>
        start.add(i, "day"),
      )
    : [...Array(10)].map((_, i) => dayjs().subtract(i, "day"));

const handleStartChange = (value) => {
  setStartDate(value);
  setActiveDate(value);
};

const handleEndChange = (value) => {
  setEndDate(value);
  setActiveDate(value);
};

const isInvalidRange =
  startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate));

const ctx = useOutletContext() || {};

const { openDateFilter, setOpenDateFilter } = ctx;
 const [filtrerDeuxDate, setFiltrerDeuxDate] = useState(false);

 const filteredPersonnels = React.useMemo(() => {
  if (!filtrerDeuxDate) return personnels;

  if (!startDate || !endDate) return personnels;

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  return personnels.filter((p) => {
    const d = dayjs(p.date);
    return d.isAfter(start.subtract(1, "day")) && d.isBefore(end.add(1, "day"));
  });
}, [personnels, startDate, endDate, filtrerDeuxDate]);

const selected = filteredPersonnels.find(
  (p) => dayjs(p.date).format("YYYY-MM-DD") === selectedDate,
);


const getStatut = (record, periode) => {
  const data = record?.[periode];

  const abbr =
    periode === "matin"
      ? record?.absence_matin_abbr
      : record?.absence_soir_abbr;

  const entree = data?.entree;
  const sortie = data?.sortie;

  // 1️⃣ Absence justifiée
  if (abbr) return abbr;

  // 2️⃣ Absence non justifiée (priorité métier)
  if (!entree && !sortie) return "Absence non justifiée";

  // 3️⃣ Entrée sans sortie
  if (entree && !sortie) return "Sortie non enregistrée";

  // 4️⃣ Aucune donnée exploitable
  return "----";
};
    const absenceSoir = selected?.apresmidi?.absence;
 const absenceMatin = selected?.matin?.absence;
 const isSurface = selected?.role === "surface" || selected?.role === "";
 console.log("selec", selected);
        const isPresent =
          !selected?.absence_unique && selected?.heure_entree_unique;
  
  const sessions = isSurface
    ? [
        {
          id: "unique",
          title: "Journée",
          subtitle:
            selected?.absence_unique == null && !selected?.heure_entree_unique
              ? "----"
              : selected?.absence_unique
                ? "Absent"
                : isPresent
                  ? "Présent"
                  : "----",
          nomabbr: selected?.nomabbr,
          color: "#9C27B0",
          icon: CalendarDays,

          statut: (() => {
            const abbr = selected?.nomabbr;
            const isAbsent = selected?.absence_unique;

            const entree = selected?.heure_entree_unique;
            const sortie = selected?.heure_sortie_unique;

            // 1️⃣ Absence avec abbr
            if (isAbsent && abbr) return abbr;

            // 2️⃣ Absence + pas de sortie
            if (isAbsent && !sortie) return "Sortie non enregistrée";

            // 3️⃣ Absence simple
            if (isAbsent) return "Absence non justifiée";

            // 4️⃣ Entrée sans sortie
            if (entree && !sortie) return "Sortie non enregistrée";

            // 5️⃣ fallback
            return "---";
          })(),
          entree: selected?.heure_entree_unique ?? "---",
          sortie: selected?.heure_sortie_unique ?? "---",

          entreeIcon: LogIn,
          sortieIcon: DoorOpen,
          entreeColor: "#4CAF50",
          sortieColor: "#F44336",

          // ❌ pas de retard
          retard: "---",
        },
      ]
    : [
        {
          id: "matin",
          subtitle:
            absenceMatin == null
              ? "----"
              : absenceMatin === true
                ? "Absent"
                : "Présent",
          nomabbr: selected?.nomabbr,

          title: "Matin",
          color: "#FF9800",
          icon: Sun,
          statut: getStatut(selected, "matin"),
          entree: selected?.matin?.entree ?? "---",
          sortie: selected?.matin?.sortie ?? "---",
          entreeIcon: LogIn,
          sortieIcon: DoorOpen,
          entreeColor: "#4CAF50",
          sortieColor: "#F44336",
          retard:
            selected?.retard_matin_minutes != null
              ? `${selected?.retard_matin_minutes}mn`
              : "---",
        },
        {
          id: "apres-midi",
          subtitle:
            absenceSoir == null
              ? "----"
              : absenceSoir === true
                ? "Absent"
                : "Présent",
          nomabbr: selected?.nomabbr,

          title: "Après-midi",
          color: "#2196F3",
          icon: Moon,
          statut: getStatut(selected, "apresmidi"),
          entree: selected?.apresmidi?.entree || "---",
          sortie: selected?.apresmidi?.sortie || "---",
          entreeIcon: LogIn,
          sortieIcon: DoorOpen,
          entreeColor: "#4CAF50",
          sortieColor: "#F44336",

          retard:
            selected?.retard_soir_minutes != null
              ? `${selected?.retard_soir_minutes}mn`
              : "---",
        },
      ];

const resetDateFilter = () => {
  setStartDate(null);
  setEndDate(null);
  setFiltrerDeuxDate(false);

  const today = dayjs().format("YYYY-MM-DD");
  setSelectedDate(today);
  setActiveDate(today);
};

const sessionsToRender = isSurface ? [sessions[0]] : sessions; 


  return (
    <div className={styles.paddingWrapper} style={{ maxWidth: "88%", margin: "0 auto" }}>
          <PageHeader
            title="Présences"
            subtitle="Suivi des pointages et présences du personnel"
          />
    
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
          <StaticDatePicker
            displayStaticWrapperAs="desktop"
            value={dayjs(selectedDate)}
            onChange={(newValue) => {
              if (!newValue) return;
              setSelectedDate(newValue.format("YYYY-MM-DD"));
            }}
            slotProps={{
              actionBar: { actions: [] },
              toolbar: { hidden: true },
              // AJOUT ICI : Cibler l'en-tête du calendrier
              calendarHeader: {
                sx: {
                  "& .MuiPickersCalendarHeader-label": {
                    fontSize: "0.75rem", // Diminue la taille du mois
                    textTransform: "capitalize",
                  },
                },
              },
            }}
          />
        </LocalizationProvider>
      </ThemeProvider>

      <div
        className={
          filtrerDeuxDate ? styles.dateListContainer : styles.dateDisplay
        }
      >
        {!filtrerDeuxDate ? (
          <span className={styles.dateValue}>
            {dayjs(selectedDate).format("DD/MM/YY")}
          </span>
        ) : (
          <div className={styles.scrollContainerRelative}>
            {/* Icône indiquant qu'on peut scroller */}
            <div
              className={`${styles.scrollIndicator} ${styles.leftIndicator}`}
            >
              <ChevronLeft size={16} />
            </div>

            <div className={styles.scrollWrapper}>
              {days.map((date, i) => {
                const isActive = date.format("YYYY-MM-DD") === selectedDate;

                return (
                  <div
                    key={i}
                    className={`${styles.dateItem} ${
                      isActive ? styles.activeDate : ""
                    }`}
                    onClick={() => setSelectedDate(date.format("YYYY-MM-DD"))}
                  >
                    <span className={styles.itemDay}>{date.format("ddd")}</span>

                    <span className={styles.itemDate}>
                      {date.format("DD/MM")}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              className={`${styles.scrollIndicator} ${styles.rightIndicator}`}
            >
              <ChevronRight size={16} />
            </div>
          </div>
        )}
      </div>

      {filtrerDeuxDate && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 10,
          }}
        >
          <Button
            color="primary"
            onClick={resetDateFilter}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              border: "none",
              background: "#f5f5f5",
              mb: 1,
              borderRadius: 8,

              fontSize: "0.6rem",
            }}
          >
            <RotateCcw size={14} />
            Réinitialiser
          </Button>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" size="default" />
        </div>
      ) : (
        sessionsToRender.map((session) => (
          <SessionTile key={session.id} {...session} />
        ))      )}

      <Dialog
        open={openDateFilter}
        onClose={() => setOpenDateFilter(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "15px",
            px: 0.7,
            py: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "1rem",
          }}
        >
          Filtrer entre deux dates
        </DialogTitle>

        <DialogContent>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              marginTop: 10,
            }}
          >
            {/* START DATE */}
            <div style={{ position: "relative" }}>
              <TextField
                label="Date de début"
                value={startDate ? dayjs(startDate).format("DD/MM/YYYY") : ""}
                fullWidth
                onClick={() =>
                  document.getElementById("startDateInput").showPicker?.()
                }
                InputProps={{ readOnly: true }}
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  "& .MuiInputBase-input": {
                    fontFamily: "Poppins, sans-serif",
                  },
                  "& .MuiInputLabel-root": {
                    fontFamily: "Poppins, sans-serif",
                  },
                }}
              />

              <input
                id="startDateInput"
                type="date"
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: 0,
                  height: 0,
                  pointerEvents: "none",
                }}
                value={startDate || ""}
                onChange={(e) => handleStartChange(e.target.value)}
              />
            </div>
            {/* END DATE */}
            <div style={{ position: "relative" }}>
              <TextField
                label="Date de fin"
                value={endDate ? dayjs(endDate).format("DD/MM/YYYY") : ""}
                fullWidth
                onClick={() =>
                  document.getElementById("endDateInput").showPicker?.()
                }
                InputProps={{ readOnly: true }}
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  "& .MuiInputBase-input": {
                    fontFamily: "Poppins, sans-serif",
                  },
                  "& .MuiInputLabel-root": {
                    fontFamily: "Poppins, sans-serif",
                  },
                }}
              />

              <input
                id="endDateInput"
                type="date"
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: 0,
                  height: 0,
                  pointerEvents: "none",
                }}
                value={endDate || ""}
                onChange={(e) => handleEndChange(e.target.value)}
              />
            </div>
          </div>
        </DialogContent>

        <DialogActions
          sx={{
            fontFamily: "Poppins, sans-serif",
            px: 2,
            pb: 2,
          }}
        >
          <Button
            onClick={() => setOpenDateFilter(false)}
            sx={{
              fontFamily: "Poppins, sans-serif",

              fontSize: "0.8rem",
            }}
          >
            Annuler
          </Button>

          <Button
            variant="contained"
            disabled={!startDate || !endDate || loadingFilter || isInvalidRange}
            onClick={async () => {
              setLoadingFilter(true);

              try {
                await new Promise((r) => setTimeout(r, 500));

                setFiltrerDeuxDate(true);
                setActiveDate(null);

                if (startDate) {
                  setSelectedDate(startDate);
                }

                setOpenDateFilter?.(false); // 👈 important (safe call)
              } finally {
                setLoadingFilter(false);
              }
            }}
            sx={{
              fontFamily: "Poppins, sans-serif",

              borderRadius: "20px",
              minWidth: 120,
              fontSize: "0.8rem",
            }}
          >
            {loadingFilter ? (
              <CircularProgress size={17} color="inherit" />
            ) : (
              "Filtrer"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MobilePresence;
