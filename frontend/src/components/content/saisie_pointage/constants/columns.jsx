import React, { useState } from "react";
import sortie from "../../autorisation_sortie/sortie.module.css";
import styles from "../saisie.module.css";
import { messageHorsPlage, plagePour, retardMinutes } from "../utils/plages";
import HeureSelect from "../components/HeureSelect";

const initiales = (l) => `${l.prenom?.[0] ?? ""}${l.nom?.[0] ?? ""}`.toUpperCase() || "?";

/** En-tête de colonne : titre + plage horaire attendue du service (aide à la saisie). */
const entete = (titre, plage) => (
  <span className={styles.th}>
    <span className={styles.thTitle}>{titre}</span>
    {plage && <span className={styles.thRange}>{plage}</span>}
  </span>
);

/** Passe à la même colonne de la ligne suivante (Entrée) ou précédente (Maj + Entrée). */
function naviguer(event, index, champ) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const cible = index + (event.shiftKey ? -1 : 1);
  const suivant = document.querySelector(`[data-cell="${cible}-${champ}"]:not(:disabled)`);
  if (suivant) {
    suivant.focus();
    suivant.select?.();
  }
}

/** Case d'heure éditable : grande zone de saisie, croix pour effacer. */
function CaseHeure({ ligne, index, champ, libelle, valeur, modifiee, desactivee, enErreur, horaires, onChange }) {
  // Avec beaucoup d'agents, on ne monte le sélecteur (liste de minutes) que pour la case en cours d'édition
  const [actif, setActif] = useState(false);
  const plage = plagePour(champ, ligne, horaires);
  // Les heures déjà enregistrées ne sont pas contrôlées : seulement ce que le RH saisit
  const horsPlage = modifiee ? messageHorsPlage(champ, valeur, ligne, horaires) : null;
  const retard = modifiee ? retardMinutes(champ, valeur, ligne, horaires) : { minutes: 0, excuse: false };

  const classes = [
    styles.timeInput,
    modifiee ? styles.edited : ligne[champ] ? styles.saved : "",
    enErreur ? styles.hasError : "",
    horsPlage ? styles.outOfRange : "",
  ].join(" ");

  // Ligne d'information sous la case
  let aide = null;
  if (horsPlage) aide = { cls: styles.helpBad, icone: "fa-solid fa-circle-exclamation", texte: horsPlage };
  else if (retard.minutes > 0)
    aide = retard.excuse
      ? { cls: styles.helpOk, icone: "fa-solid fa-circle-check", texte: `Retard excusé (+${retard.minutes} min)` }
      : { cls: styles.helpWarn, icone: "fa-regular fa-clock", texte: `Retard de ${retard.minutes} min` };
  else if (plage?.libre && !desactivee)
    aide = { cls: styles.helpOk, icone: "fa-solid fa-unlock", texte: "Sortie autorisée : heure libre" };

  return (
    <div className={styles.cellCol}>
      <div className={styles.cell}>
        {plage || !horaires ? (
          actif && !desactivee ? (
            <HeureSelect
              className={classes}
              value={valeur}
              min={plage?.min}
              max={plage?.max}
              disabled={desactivee}
              dataCell={`${index}-${champ}`}
              ariaLabel={`${libelle} de ${ligne.prenom} ${ligne.nom}`}
              invalide={Boolean(horsPlage)}
              autoFocus
              onFermer={() => setActif(false)}
              onChange={(v) => onChange(ligne, champ, v)}
              onEnter={(e) => naviguer(e, index, champ)}
            />
          ) : (
            <button
              type="button"
              className={`${classes} ${styles.timeButton}`}
              disabled={desactivee}
              data-cell={`${index}-${champ}`}
              onFocus={() => setActif(true)}
              onClick={() => setActif(true)}
              aria-label={`${libelle} de ${ligne.prenom} ${ligne.nom} : ${valeur || "non renseignée"}`}
            >
              {valeur || <span className={styles.placeholder}>--:--</span>}
            </button>
          )
        ) : (
          /* Agent de surface : pas de plage, saisie libre */
          <input
            type="time"
            className={classes}
            value={valeur}
            disabled={desactivee}
            data-cell={`${index}-${champ}`}
            onChange={(e) => onChange(ligne, champ, e.target.value)}
            onKeyDown={(e) => naviguer(e, index, champ)}
            aria-label={`${libelle} de ${ligne.prenom} ${ligne.nom}`}
          />
        )}
        {valeur && !desactivee && (
          <button
            type="button"
            className={styles.clear}
            onClick={() => onChange(ligne, champ, "")}
            aria-label={`Effacer ${libelle} de ${ligne.prenom} ${ligne.nom}`}
            tabIndex={-1}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        )}
      </div>
      {aide && (
        <span className={`${styles.help} ${aide.cls}`} role={horsPlage ? "alert" : undefined}>
          <i className={aide.icone} aria-hidden="true"></i>
          {aide.texte}
        </span>
      )}
    </div>
  );
}

/**
 * Colonnes du tableau de saisie.
 * ctx : { valeur, estModifiee, modifier, retablir, ferie, weekend, erreursParAgent, horaires }
 */
export function getColumns(role, ctx) {
  const { valeur, estModifiee, modifier, retablir, ferie, weekend, erreursParAgent, horaires } = ctx;

  const plage = (debut, fin) => (horaires?.[debut] && horaires?.[fin] ? `${horaires[debut]} – ${horaires[fin]}` : null);

  const agent = {
    title: entete("Agent"),
    key: "agent",
    fixed: "left",
    width: 300,
    render: (l) => (
      <div className={styles.agentCell}>
        <span className={styles.avatar} aria-hidden="true">{initiales(l)}</span>
        <div className={styles.agentText}>
          <span className={styles.agentName}>{l.prenom} {l.nom}</span>
          <span className={styles.agentMat}>{l.matricule}{l.division ? ` · ${l.division}` : ""}</span>
        </div>
      </div>
    ),
  };

  const colonne = (champ, titre, libelle, intervalle, periodeFeriee) => ({
    title: entete(titre, intervalle),
    key: champ,
    width: 210,
    render: (l, index) => (
      <CaseHeure
        ligne={l}
        index={index}
        champ={champ}
        libelle={libelle}
        valeur={valeur(l, champ)}
        modifiee={estModifiee(l, champ)}
        desactivee={weekend || periodeFeriee}
        enErreur={Boolean(erreursParAgent[l.idpers])}
        horaires={horaires}
        onChange={modifier}
      />
    ),
  });

  const colonneRetablir = {
    title: "",
    key: "retablir",
    width: 70,
    fixed: "right",
    render: (l) =>
      ["entree_matin", "sortie_matin", "entree_soir", "sortie_soir", "entree_unique", "sortie_unique"].some((c) =>
        estModifiee(l, c)
      ) ? (
        <button
          type="button"
          className={sortie.iconBtn}
          style={{ color: "#1b6979" }}
          onClick={() => retablir(l)}
          aria-label={`Annuler les modifications de ${l.prenom} ${l.nom}`}
          title="Annuler les modifications de cette ligne"
        >
          <i className="fa-solid fa-rotate-left" aria-hidden="true"></i>
        </button>
      ) : null,
  };

  if (role === "surface") {
    const journee = ferie?.matin && ferie?.soir;
    return [
      agent,
      colonne("entree_unique", "Entrée", "Entrée", plage("entree_matin_debut", "entree_matin_fin"), journee),
      colonne("sortie_unique", "Sortie", "Sortie", plage("sortie_soir_debut", "sortie_soir_fin"), journee),
      colonneRetablir,
    ];
  }

  return [
    agent,
    colonne("entree_matin", "Entrée matin", "Entrée du matin", plage("entree_matin_debut", "entree_matin_fin"), ferie?.matin),
    colonne("sortie_matin", "Sortie matin", "Sortie du matin", plage("sortie_matin_debut", "sortie_matin_fin"), ferie?.matin),
    colonne("entree_soir", "Entrée après-midi", "Entrée de l'après-midi", plage("entree_soir_debut", "entree_soir_fin"), ferie?.soir),
    colonne("sortie_soir", "Sortie après-midi", "Sortie de l'après-midi", plage("sortie_soir_debut", "sortie_soir_fin"), ferie?.soir),
    colonneRetablir,
  ];
}
