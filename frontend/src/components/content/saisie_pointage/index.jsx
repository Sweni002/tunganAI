import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";

import { AuthContext } from "../../../AuthContext";
import sortie from "../autorisation_sortie/sortie.module.css";
import styles from "./saisie.module.css";
import "../../fiches/presences/m3-expressive.css";

import PageHeader from "../autorisations_absences/components/PageHeader";
import SaisieGrid from "./components/SaisieGrid";
import { getColumns } from "./constants/columns";
import { messageHorsPlage } from "./utils/plages";
import { useSaisiePointage } from "./hooks/useSaisiePointage";

const SaisiePointage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchMe } = useContext(AuthContext);
  const [admin, setAdmin] = useState(null);
  const idserv = admin?.responsable?.idserv;

  const [onglet, setOnglet] = useState("bureau");
  const [recherche, setRecherche] = useState("");
  const [division, setDivision] = useState(null); // null = toutes les divisions
  const [confirmationAnnuler, setConfirmationAnnuler] = useState(false);
  // Messages de résultat : fenêtre modale (succès ou erreur sans détail par agent)
  const [message, setMessage] = useState(null); // { type: "success" | "error", titre, texte }
  const notifier = (type, titre, texte) => setMessage({ type, titre, texte });

  const saisie = useSaisiePointage({
    idserv,
    navigate,
    dateInitiale: location.state?.date,
  });
  const { date, setDate, rows, meta, loading, saving, info, erreurChargement, erreursSaisie } = saisie;

  // Thème M3 Expressive (aussi pour les dialogues portalés)
  useEffect(() => {
    document.body.classList.add("m3x-active");
    return () => document.body.classList.remove("m3x-active");
  }, []);

  useEffect(() => {
    let annule = false;
    fetchMe()
      .then((me) => !annule && setAdmin(me))
      .catch(() => {
        if (!annule) navigate("/login");
      });
    return () => {
      annule = true;
    };
  }, [fetchMe, navigate]);

  // ---------- Filtrage : onglet (bureau / surface) + recherche ----------
  const rowsDivision = useMemo(
    () => (division ? rows.filter((r) => r.iddiv === division) : rows),
    [rows, division]
  );

  const compteurs = useMemo(
    () => ({
      bureau: rowsDivision.filter((r) => r.role !== "surface").length,
      surface: rowsDivision.filter((r) => r.role === "surface").length,
    }),
    [rowsDivision]
  );

  // Divisions comportant des saisies non enregistrées (pastille d'alerte sur la puce)
  const divisionsModifiees = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => {
      if (saisie.draft[r.idpers]) s.add(r.iddiv);
    });
    return s;
  }, [rows, saisie.draft]);

  const lignesAffichees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return rowsDivision
      .filter((r) => (onglet === "surface" ? r.role === "surface" : r.role !== "surface"))
      .filter(
        (r) =>
          !q ||
          `${r.matricule} ${r.nom} ${r.prenom}`.toLowerCase().includes(q)
      )
      .map((r) => ({ ...r, key: r.idpers }));
  }, [rowsDivision, onglet, recherche]);

  // Agents refusés au dernier enregistrement : lignes surlignées
  const erreursParAgent = useMemo(() => {
    const m = {};
    (erreursSaisie?.erreurs ?? []).forEach((e) => {
      if (e.idpers != null) m[e.idpers] = e.messages;
    });
    return m;
  }, [erreursSaisie]);

  const weekend = dayjs(date).day() === 0 || dayjs(date).day() === 6;
  const columns = getColumns(onglet, {
    valeur: saisie.valeur,
    estModifiee: saisie.estModifiee,
    modifier: saisie.modifier,
    retablir: saisie.retablirLigne,
    ferie: meta.ferie,
    weekend,
    erreursParAgent,
    horaires: meta.horaires,
  });

  // Pagination locale de la grille (25 / 50 / 100 agents) ; retour à la page 1 quand le filtre change
  const [pageGrille, setPageGrille] = useState(1);
  const [taillePage, setTaillePage] = useState(25);
  useEffect(() => {
    setPageGrille(1);
  }, [onglet, division, recherche, date, taillePage]);

  // ---------- Actions ----------
  const handleEnregistrer = async () => {
    try {
      const res = await saisie.enregistrer();
      notifier("success", res.enregistres ? "Enregistrement réussi" : "Rien à enregistrer", res.message);
    } catch (err) {
      // Les erreurs détaillées par agent ont leur propre fenêtre ; sinon, message d'erreur général
      if (!err.erreurs?.length) notifier("error", "Enregistrement impossible", err.message);
    }
  };

  const handleAnnuler = () => {
    if (saisie.nbLignesModifiees > 0) setConfirmationAnnuler(true);
    else navigate(-1);
  };

  const dateLongue = dayjs(date).locale("fr").format("dddd D MMMM YYYY");
  const aDesModifs = saisie.nbLignesModifiees > 0;

  // Heures saisies hors de la plage du service (sans autorisation) : à corriger avant d'enregistrer
  const nbHorsPlage = useMemo(() => {
    let n = 0;
    rows.forEach((ligne) => {
      const brouillon = saisie.draft[ligne.idpers] || {};
      Object.entries(brouillon).forEach(([champ, valeur]) => {
        if (valeur && messageHorsPlage(champ, valeur, ligne, meta.horaires)) n += 1;
      });
    });
    return n;
  }, [rows, saisie.draft, meta.horaires]);

  // Ctrl/Cmd + S enregistre ; fermer l'onglet avec des saisies en attente demande confirmation
  const enregistrerRef = useRef(handleEnregistrer);
  enregistrerRef.current = handleEnregistrer;
  const nbHorsPlageRef = useRef(0);
  nbHorsPlageRef.current = nbHorsPlage;
  useEffect(() => {
    const surToucheS = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (aDesModifs && !saving && !weekend && nbHorsPlageRef.current === 0) enregistrerRef.current();
      }
    };
    const avantFermeture = (e) => {
      if (aDesModifs) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("keydown", surToucheS);
    window.addEventListener("beforeunload", avantFermeture);
    return () => {
      window.removeEventListener("keydown", surToucheS);
      window.removeEventListener("beforeunload", avantFermeture);
    };
  }, [aDesModifs, saving, weekend]);

  return (
    <div className={`${sortie.page} ${styles.root}`}>
      <PageHeader
        title="Saisie manuelle des pointages"
        subtitle="À utiliser en cas de coupure de la reconnaissance faciale"
        show
        onBackClick={handleAnnuler}
      />

      {/* ---------- Date ---------- */}
      <div className={styles.dateRow}>
        <div className={styles.dateField}>
          <label htmlFor="saisie-date">Date du pointage</label>
          <input
            id="saisie-date"
            type="date"
            value={date}
            max={dayjs().format("YYYY-MM-DD")}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <span className={styles.dateLong}>{dateLongue}</span>
      </div>

      {erreurChargement && (
        <div className={`${styles.banner} ${styles.bannerBad}`} role="alert">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          <span>{erreurChargement}</span>
        </div>
      )}
      {meta.avertissement && (
        <div className={`${styles.banner} ${styles.bannerWarn}`} role="status">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
          <span>{meta.avertissement}</span>
        </div>
      )}
      {meta.ferie && (
        <div className={`${styles.banner} ${styles.bannerWarn}`} role="status">
          <i className="fa-solid fa-calendar-xmark" aria-hidden="true"></i>
          <span>
            Jour férié{meta.ferie.motif ? ` (${meta.ferie.motif})` : ""} :{" "}
            {meta.ferie.matin && meta.ferie.soir ? "toute la journée" : meta.ferie.matin ? "le matin" : "l'après-midi"} ne
            peut pas être saisi.
          </span>
        </div>
      )}
      {info && (
        <div className={`${styles.banner} ${styles.bannerInfo}`} role="status">
          <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
          <span>{info}</span>
        </div>
      )}

      {/* ---------- Liste éditable ---------- */}
      <section className={sortie.card} aria-label="Agents du service">
        {meta.divisions.length > 1 && (
          <div className={styles.divisions} role="group" aria-label="Filtrer par division">
            <button
              type="button"
              className={`${styles.divChip} ${division === null ? styles.divOn : ""}`}
              aria-pressed={division === null}
              onClick={() => setDivision(null)}
            >
              Toutes les divisions
              <span className={styles.badge}>{rows.length}</span>
            </button>
            {meta.divisions.map((d) => (
              <button
                key={d.iddiv}
                type="button"
                className={`${styles.divChip} ${division === d.iddiv ? styles.divOn : ""}`}
                aria-pressed={division === d.iddiv}
                onClick={() => setDivision(d.iddiv)}
              >
                {d.nom}
                <span className={styles.badge}>{d.effectif}</span>
                {divisionsModifiees.has(d.iddiv) && (
                  <span className={styles.divEdited} title="Saisies non enregistrées" aria-label="Saisies non enregistrées" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className={sortie.toolbar}>
          <div className={sortie.toolbarLeft}>
            <div className={styles.tabs} role="tablist" aria-label="Type d'agent">
              {[
                { v: "bureau", label: "Agents de bureau" },
                { v: "surface", label: "Agents de surface" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  role="tab"
                  aria-selected={onglet === o.v}
                  className={`${styles.tab} ${onglet === o.v ? styles.tabOn : ""}`}
                  onClick={() => setOnglet(o.v)}
                >
                  {o.label}
                  <span className={styles.badge}>{compteurs[o.v]}</span>
                </button>
              ))}
            </div>
          </div>

          <label className={sortie.search}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <input
              type="search"
              placeholder="Rechercher un agent, un matricule…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              aria-label="Rechercher"
            />
          </label>
        </div>

        <div className={styles.legend}>
          <span><i style={{ background: "#eaf6f1" }} />Déjà enregistré</span>
          <span><i style={{ background: "#fff6e0", border: "2px solid #e8c76a" }} />Modifié (à enregistrer)</span>
          <span><i style={{ background: "#fdecee", border: "2px solid #c0353c" }} />Ligne refusée</span>
          <span className={styles.tip}>
            <i className="fa-regular fa-keyboard" aria-hidden="true" style={{ background: "none", width: "auto", height: "auto" }}></i>
            <kbd>Entrée</kbd> case suivante · <kbd>Ctrl</kbd> + <kbd>S</kbd> enregistrer
          </span>
        </div>

        <SaisieGrid
          colonnes={columns}
          lignes={lignesAffichees}
          chargement={loading}
          classeLigne={(l) =>
            erreursParAgent[l.idpers] ? styles.rowError : draftLigne(saisie, l) ? styles.rowEdited : ""
          }
          page={pageGrille}
          taillePage={taillePage}
          onPage={setPageGrille}
          onTaillePage={setTaillePage}
        />
      </section>

      {/* ---------- Barre d'actions fixée en bas ---------- */}
      <div className={styles.bar}>
        <div className={styles.barInner} role="region" aria-label="Actions de saisie">
          <div className={styles.barInfo}>
            <span className={styles.barIcon}>
              <i className="fa-solid fa-pen-to-square" aria-hidden="true"></i>
            </span>
            {aDesModifs ? (
              <span>
                <strong>{saisie.nbCasesModifiees}</strong> heure{saisie.nbCasesModifiees > 1 ? "s" : ""} modifiée
                {saisie.nbCasesModifiees > 1 ? "s" : ""} pour <strong>{saisie.nbLignesModifiees}</strong> agent
                {saisie.nbLignesModifiees > 1 ? "s" : ""}
              </span>
            ) : (
              <span>Aucune modification</span>
            )}
            {nbHorsPlage > 0 && (
              <span className={styles.barWarn} role="alert">
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
                {nbHorsPlage} heure{nbHorsPlage > 1 ? "s" : ""} hors plage à corriger
              </span>
            )}
          </div>
          <div className={styles.barActions}>
            <Button
              onClick={handleAnnuler}
              disabled={saving}
              sx={{ textTransform: "none", fontSize: "0.85rem", px: 3.5, py: 1.4, color: "#1b6979" }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleEnregistrer}
              disabled={!aDesModifs || saving || weekend || nbHorsPlage > 0}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <i className="fa-solid fa-floppy-disk"></i>}
              sx={{ textTransform: "none", fontSize: "0.85rem", px: 4.5, py: 1.4, backgroundColor: "#14535f" }}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </div>

      {/* ---------- Erreurs d'enregistrement ---------- */}
      <Dialog
        open={Boolean(erreursSaisie?.erreurs?.length)}
        onClose={saisie.fermerErreurs}
        maxWidth="md"
        fullWidth
        scroll="paper"
        aria-labelledby="saisie-erreurs-titre"
        slotProps={{ paper: { className: styles.dialogPaper } }}
      >
        <header className={styles.dHead}>
          <span className={styles.dHeadIcon} aria-hidden="true">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </span>
          <div>
            <h2 id="saisie-erreurs-titre" className={styles.dTitle}>Enregistrement refusé</h2>
            <p className={styles.dSub}>{erreursSaisie?.message} Corrigez les lignes ci-dessous (surlignées en rouge dans la liste).</p>
          </div>
        </header>
        <div className={styles.dBody}>
          <ul className={styles.errList}>
            {(erreursSaisie?.erreurs ?? []).map((e, i) => (
              <li key={`${e.idpers}-${i}`} className={styles.errItem}>
                <div className={styles.errAgent}>
                  <i className="fa-solid fa-user" aria-hidden="true"></i>
                  {e.nom}
                  {e.matricule && <span className={styles.errMat}>{e.matricule}</span>}
                </div>
                <ul className={styles.errMsgs}>
                  {e.messages.map((m, j) => (
                    <li key={j}>{m}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <footer className={styles.dFoot}>
          <Button
            variant="contained"
            disableElevation
            onClick={saisie.fermerErreurs}
            sx={{ textTransform: "none", fontSize: "0.85rem", px: 4.5, py: 1.4, backgroundColor: "#14535f" }}
          >
            Compris
          </Button>
        </footer>
      </Dialog>

      {/* ---------- Abandon des modifications ---------- */}
      <Dialog
        open={confirmationAnnuler}
        onClose={() => setConfirmationAnnuler(false)}
        slotProps={{ paper: { className: styles.dialogPaper } }}
      >
        <header className={styles.dHead}>
          <span className={`${styles.dHeadIcon} ${styles.dHeadOk}`} aria-hidden="true">
            <i className="fa-solid fa-rotate-left"></i>
          </span>
          <div>
            <h2 className={styles.dTitle}>Abandonner la saisie ?</h2>
            <p className={styles.dSub}>
              {saisie.nbCasesModifiees} heure{saisie.nbCasesModifiees > 1 ? "s" : ""} non enregistrée
              {saisie.nbCasesModifiees > 1 ? "s" : ""} seront perdue{saisie.nbCasesModifiees > 1 ? "s" : ""}.
            </p>
          </div>
        </header>
        <footer className={styles.dFoot}>
          <Button
            onClick={() => setConfirmationAnnuler(false)}
            sx={{ textTransform: "none", fontSize: "0.85rem", px: 3.5, py: 1.4, color: "#1b6979" }}
          >
            Continuer la saisie
          </Button>
          <Button
            variant="contained"
            disableElevation
            color="error"
            onClick={() => {
              saisie.annulerSaisies();
              setConfirmationAnnuler(false);
              navigate(-1);
            }}
            sx={{ textTransform: "none", fontSize: "0.85rem", px: 4, py: 1.4 }}
          >
            Abandonner
          </Button>
        </footer>
      </Dialog>

      {/* ---------- Résultat (succès / erreur générale) ---------- */}
      <Dialog
        open={Boolean(message)}
        onClose={() => setMessage(null)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="saisie-message-titre"
        slotProps={{ paper: { className: styles.dialogPaper } }}
      >
        {message && (
          <>
            <header className={styles.dHead}>
              <span
                className={`${styles.dHeadIcon} ${message.type === "success" ? styles.dHeadSuccess : ""}`}
                aria-hidden="true"
              >
                <i className={message.type === "success" ? "fa-solid fa-check" : "fa-solid fa-triangle-exclamation"}></i>
              </span>
              <div>
                <h2 id="saisie-message-titre" className={styles.dTitle}>{message.titre}</h2>
                <p className={styles.dSub} role={message.type === "error" ? "alert" : "status"}>{message.texte}</p>
              </div>
            </header>
            <footer className={styles.dFoot}>
              <Button
                variant="contained"
                disableElevation
                autoFocus
                onClick={() => setMessage(null)}
                sx={{ textTransform: "none", fontSize: "0.85rem", px: 4.5, py: 1.4, backgroundColor: "#14535f" }}
              >
                OK
              </Button>
            </footer>
          </>
        )}
      </Dialog>
    </div>
  );
};

/** Vrai si la ligne a au moins une case modifiée (pour le repère visuel de la ligne). */
function draftLigne(saisie, ligne) {
  return [
    "entree_matin", "sortie_matin", "entree_soir", "sortie_soir", "entree_unique", "sortie_unique",
  ].some((champ) => saisie.estModifiee(ligne, champ));
}

export default SaisiePointage;
