import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import styles from "../jours_feries.module.css";
import { joursFeriesService } from "../services/joursFeriesService";

const PERIODES = [
  { value: "matin", label: "Matin", icon: "fa-solid fa-sun" },
  { value: "soir", label: "Après-midi", icon: "fa-solid fa-cloud-sun" },
  { value: "complete", label: "Journée complète", icon: "fa-solid fa-calendar-day" },
];

const fieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "20px", backgroundColor: "#f4f8f9" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c5d6da" },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#1b6979", borderWidth: 2 },
  "& .MuiInputBase-input": { padding: "16px 20px", fontSize: "0.85rem" },
};

/** Nombre de jours ajoutés par une plage (week-ends exclus sauf demande). */
const compterJours = (debut, fin, inclureWeekends) => {
  if (!debut || !fin) return 0;
  const a = dayjs(debut);
  const b = dayjs(fin);
  if (!a.isValid() || !b.isValid() || b.isBefore(a)) return 0;
  let n = 0;
  for (let d = a; !d.isAfter(b); d = d.add(1, "day")) {
    if (inclureWeekends || (d.day() !== 0 && d.day() !== 6)) n += 1;
  }
  return n;
};

/**
 * Ajout (un ou plusieurs jours) ou modification (un jour) d'un jour férié.
 * `jour` = ligne à modifier, ou null pour un ajout.
 */
export default function FerieDialog({ open, onClose, idserv, jour, navigate, onSaved }) {
  const edition = Boolean(jour);

  const [dateDebut, setDateDebut] = useState("");
  const [plusieurs, setPlusieurs] = useState(false);
  const [dateFin, setDateFin] = useState("");
  const [inclureWeekends, setInclureWeekends] = useState(false);
  const [periode, setPeriode] = useState("complete");
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState(null); // { message, ignores }

  // Réinitialise le formulaire à chaque ouverture
  useEffect(() => {
    if (!open) return;
    setErreur(null);
    setSaving(false);
    if (jour) {
      setDateDebut(jour.date);
      setPeriode(jour.periode);
      setMotif(jour.motif);
    } else {
      setDateDebut(dayjs().format("YYYY-MM-DD"));
      setPeriode("complete");
      setMotif("");
    }
    setPlusieurs(false);
    setDateFin("");
    setInclureWeekends(false);
  }, [open, jour]);

  const nbJours = useMemo(
    () => (plusieurs ? compterJours(dateDebut, dateFin, inclureWeekends) : dateDebut ? 1 : 0),
    [plusieurs, dateDebut, dateFin, inclureWeekends]
  );

  const invalide =
    !dateDebut || !motif.trim() || (plusieurs && (!dateFin || dayjs(dateFin).isBefore(dayjs(dateDebut))));

  const handleSubmit = async () => {
    if (invalide || saving) return;
    setSaving(true);
    setErreur(null);

    try {
      const res = edition
        ? await joursFeriesService.modifier(jour.id, { date: dateDebut, periode, motif: motif.trim() }, navigate)
        : await joursFeriesService.ajouter(
            {
              idserv,
              date_debut: dateDebut,
              date_fin: plusieurs ? dateFin : undefined,
              periode,
              motif: motif.trim(),
              inclure_weekends: plusieurs && inclureWeekends,
            },
            navigate
          );
      onSaved(res.message || "Enregistré", res.ignores);
      onClose();
    } catch (err) {
      setErreur({ message: err.message, ignores: err.details?.ignores ?? [] });
    } finally {
      setSaving(false);
    }
  };

  const jourLong = (valeur) =>
    valeur && dayjs(valeur).isValid() ? dayjs(valeur).locale("fr").format("dddd D MMMM YYYY") : "";

  // Résumé lisible sous le formulaire
  const resumeTexte = (() => {
    if (!dateDebut) return "";
    if (!plusieurs || !dateFin) return jourLong(dateDebut);
    return `Du ${jourLong(dateDebut)} au ${jourLong(dateFin)}`;
  })();

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="ferie-dialog-title"
      slotProps={{ paper: { className: styles.dialogPaper } }}
    >
      {/* ---------- En-tête ---------- */}
      <header className={styles.dHead}>
        <span className={styles.dHeadIcon} aria-hidden="true">
          <i className={edition ? "fa-regular fa-pen-to-square" : "fa-solid fa-calendar-plus"}></i>
        </span>
        <div className={styles.dHeadText}>
          <h2 id="ferie-dialog-title" className={styles.formTitle}>
            {edition ? "Modifier le jour férié" : "Ajouter des jours fériés"}
          </h2>
          <p className={styles.formSub}>
            {edition
              ? "Changez la date, la période ou le motif."
              : "Aucun pointage ni absence ne sera pris en compte sur la période choisie."}
          </p>
        </div>
        <button type="button" className={styles.dClose} onClick={onClose} disabled={saving} aria-label="Fermer">
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </header>

      {/* ---------- Corps ---------- */}
      <div className={styles.dBody}>
        {/* Un jour / plusieurs jours */}
        {!edition && (
          <div className={styles.fieldGroup} role="radiogroup" aria-label="Nombre de jours">
            <span className={styles.fieldLabel}>Durée</span>
            <div className={styles.toggleGroup}>
              {[
                { v: false, label: "Un seul jour", icon: "fa-regular fa-calendar" },
                { v: true, label: "Plusieurs jours", icon: "fa-solid fa-calendar-week" },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  role="radio"
                  aria-checked={plusieurs === o.v}
                  className={`${styles.toggleBtn} ${plusieurs === o.v ? styles.toggleOn : ""}`}
                  onClick={() => setPlusieurs(o.v)}
                >
                  <i className={o.icon} aria-hidden="true"></i>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className={styles.dates}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="ferie-debut">
              {plusieurs ? "Date de début" : "Date"}
            </label>
            <TextField
              id="ferie-debut"
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              sx={fieldSx}
              fullWidth
            />
          </div>
          {plusieurs && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="ferie-fin">Date de fin</label>
              <TextField
                id="ferie-fin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                slotProps={{ htmlInput: { min: dateDebut || undefined } }}
                sx={fieldSx}
                fullWidth
              />
            </div>
          )}
        </div>

        {plusieurs && (
          <label className={styles.checkRow}>
            <Switch checked={inclureWeekends} onChange={(e) => setInclureWeekends(e.target.checked)} />
            <span>
              Inclure les week-ends
              <small>Par défaut, les samedis et dimanches sont ignorés.</small>
            </span>
          </label>
        )}

        {/* Période */}
        <div className={styles.fieldGroup} role="radiogroup" aria-label="Période">
          <span className={styles.fieldLabel}>Période concernée</span>
          <div className={styles.segmented}>
            {PERIODES.map((p) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={periode === p.value}
                className={`${styles.segment} ${periode === p.value ? styles.segmentOn : ""}`}
                onClick={() => setPeriode(p.value)}
              >
                <span className={styles.segmentIcon}>
                  <i className={p.icon} aria-hidden="true"></i>
                </span>
                <span className={styles.segmentLabel}>{p.label}</span>
                <i className={`fa-solid fa-circle-check ${styles.segmentCheck}`} aria-hidden="true"></i>
              </button>
            ))}
          </div>
        </div>

        {/* Motif */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="ferie-motif">Motif</label>
          <TextField
            id="ferie-motif"
            placeholder="Ex. Fête de l'Indépendance"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 255 } }}
            sx={fieldSx}
            fullWidth
          />
        </div>

        {/* Aperçu */}
        {!edition && nbJours > 0 && (
          <div className={styles.preview} role="status">
            <span className={styles.previewIcon}>
              <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
            </span>
            <div>
              <strong>
                {nbJours} jour{nbJours > 1 ? "s" : ""} sera{nbJours > 1 ? "ont" : ""} ajouté{nbJours > 1 ? "s" : ""}
                {plusieurs && !inclureWeekends ? " (week-ends exclus)" : ""}
              </strong>
              <p style={{ textTransform: "capitalize" }}>{resumeTexte}</p>
            </div>
          </div>
        )}

        {erreur && (
          <div className={styles.errorBox} role="alert">
            {erreur.message}
            {erreur.ignores.length > 0 && (
              <ul>
                {erreur.ignores.slice(0, 5).map((i) => (
                  <li key={i.date}>{i.raison}</li>
                ))}
                {erreur.ignores.length > 5 && <li>… et {erreur.ignores.length - 5} autre(s)</li>}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ---------- Pied : actions ---------- */}
      <footer className={styles.dFoot}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ textTransform: "none", fontSize: "0.85rem", px: 3, py: 1.4, color: "#1b6979" }}
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={handleSubmit}
          disabled={invalide || saving}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <i className="fa-solid fa-check"></i>}
          sx={{ textTransform: "none", fontSize: "0.85rem", px: 4.5, py: 1.4, backgroundColor: "#14535f" }}
        >
          {edition ? "Enregistrer" : "Ajouter"}
        </Button>
      </footer>
    </Dialog>
  );
}
