import React, { useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import styles from "../saisie.module.css";

const versMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const hhmm = (total) => `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

/** Toutes les minutes de min à max (incluses). */
function genererOptions(min, max, valeurCourante) {
  if (!min || !max) return valeurCourante ? [valeurCourante] : [];
  const options = [];
  for (let t = versMinutes(min); t <= versMinutes(max); t += 1) options.push(hhmm(t));
  // Une heure déjà enregistrée hors plage reste affichable (sinon la liste la refuserait)
  if (valeurCourante && !options.includes(valeurCourante)) options.unshift(valeurCourante);
  return options;
}

/** « 8 », « 08 », « 8:0 », « 0807 » : retrouve les heures qui commencent ainsi. */
function filtrer(options, { inputValue }) {
  const q = inputValue.replace(/\s/g, "");
  if (!q) return options;
  const chiffres = q.replace(/\D/g, "");
  return options.filter((o) => {
    if (o.startsWith(q)) return true;
    if (o.startsWith("0") && o.slice(1).startsWith(q)) return true; // « 8:05 » pour « 08:05 »
    return chiffres && o.replace(":", "").startsWith(chiffres);
  });
}

/**
 * Sélecteur d'heure LIMITÉ à une plage : seules les heures de [min, max] sont proposées
 * (on peut aussi taper « 0807 » ou « 8:07 »). Le champ natif <input type="time"> ne bloque pas
 * les heures hors plage, d'où ce composant.
 */
export default function HeureSelect({
  value,
  min,
  max,
  disabled,
  className,
  onChange,
  onEnter,
  dataCell,
  ariaLabel,
  invalide,
  autoFocus,
  onFermer,
}) {
  const [ouvert, setOuvert] = useState(false);
  const options = useMemo(() => genererOptions(min, max, value), [min, max, value]);

  return (
    <Autocomplete
      options={options}
      value={value || null}
      onChange={(_, valeur) => onChange(valeur || "")}
      disabled={disabled}
      open={ouvert}
      onOpen={() => setOuvert(true)}
      onClose={() => setOuvert(false)}
      openOnFocus
      autoHighlight
      selectOnFocus
      disableClearable
      forcePopupIcon={false}
      filterOptions={filtrer}
      isOptionEqualToValue={(option, valeur) => option === valeur}
      noOptionsText={min && max ? `Hors plage (${min} – ${max})` : "Aucune heure"}
      slotProps={{
        paper: { className: styles.listPaper },
        listbox: { className: styles.listbox },
        popper: { style: { zIndex: 1400 } },
      }}
      renderInput={(params) => (
        <div ref={params.InputProps.ref} className={styles.cellAuto}>
          <input
            {...params.inputProps}
            className={className}
            placeholder="--:--"
            autoComplete="off"
            data-cell={dataCell}
            aria-label={ariaLabel}
            aria-invalid={invalide || undefined}
            autoFocus={autoFocus}
            onBlur={(e) => {
              params.inputProps.onBlur?.(e);
              onFermer?.();
            }}
            onKeyDown={(e) => {
              params.inputProps.onKeyDown?.(e);
              // Entrée quand la liste est fermée : case suivante
              if (e.key === "Enter" && !ouvert) onEnter?.(e);
            }}
          />
        </div>
      )}
    />
  );
}
