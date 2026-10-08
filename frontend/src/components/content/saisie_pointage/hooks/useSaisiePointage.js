import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { saisiePointageService } from "../services/saisiePointageService";

export const CHAMPS_BUREAU = ["entree_matin", "sortie_matin", "entree_soir", "sortie_soir"];
export const CHAMPS_SURFACE = ["entree_unique", "sortie_unique"];

const champsDe = (role) => (role === "surface" ? CHAMPS_SURFACE : CHAMPS_BUREAU);
const vide = (v) => (v === "" || v === undefined ? null : v);

/**
 * Saisie manuelle des pointages d'un service.
 *
 * - `rows`  : agents + heures enregistrées en base pour la date choisie ;
 * - `draft` : modifications du RH, seulement les cases qui DIFFÈRENT de la base
 *             { [idpers]: { [champ]: "HH:MM" | null } } ;
 * - changer la date recharge la base : pour chaque case, la valeur enregistrée remplace la saisie
 *   du RH ; s'il n'y en a pas, la saisie du RH est conservée.
 */
export function useSaisiePointage({ idserv, navigate, dateInitiale }) {
  const [date, setDateState] = useState(dateInitiale || dayjs().format("YYYY-MM-DD"));
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ horaires: null, ferie: null, avertissement: null, service: "", divisions: [] });
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erreursSaisie, setErreursSaisie] = useState(null); // { message, erreurs }
  const [info, setInfo] = useState(null); // message d'information (remplacements à la date)

  // Dernier brouillon, lu par le chargement sans le mettre en dépendance
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const charger = useCallback(
    async (jour, { reconciler = true } = {}) => {
      if (!idserv) return;
      setLoading(true);
      try {
        const res = await saisiePointageService.charger(idserv, jour, navigate);
        setRows(res.personnels);
        setMeta({
          horaires: res.horaires,
          ferie: res.ferie,
          avertissement: res.avertissement,
          service: res.service,
          divisions: res.divisions ?? [],
        });

        // Les données enregistrées remplacent les saisies du RH ; sans donnée, la saisie reste
        setDraft((courant) => {
          const parId = new Map(res.personnels.map((p) => [p.idpers, p]));
          const suivant = {};
          let remplacees = 0;

          Object.entries(courant).forEach(([id, champs]) => {
            const ligne = parId.get(Number(id));
            if (!ligne) return;
            Object.entries(champs).forEach(([champ, valeur]) => {
              const enBase = vide(ligne[champ]);
              if (reconciler && enBase !== null) {
                if (enBase !== valeur) remplacees += 1;
                return; // la base remplace la saisie
              }
              if (valeur !== enBase) {
                suivant[id] = { ...(suivant[id] || {}), [champ]: valeur };
              }
            });
          });

          setInfo(
            remplacees
              ? `${remplacees} saisie${remplacees > 1 ? "s" : ""} remplacée${remplacees > 1 ? "s" : ""} par les pointages déjà enregistrés à cette date.`
              : null
          );
          return suivant;
        });
      } catch (err) {
        setRows([]);
        setInfo(null);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [idserv, navigate]
  );

  // Chargement à l'arrivée et à chaque changement de date
  const [erreurChargement, setErreurChargement] = useState(null);
  useEffect(() => {
    if (!idserv) return;
    setErreurChargement(null);
    charger(date).catch((err) => setErreurChargement(err.message));
  }, [idserv, date, charger]);

  const setDate = useCallback((jour) => {
    if (jour) setDateState(jour);
  }, []);

  /** Valeur affichée d'une case : saisie du RH, sinon base. */
  const valeur = useCallback(
    (ligne, champ) => {
      const saisie = draft[ligne.idpers];
      if (saisie && Object.prototype.hasOwnProperty.call(saisie, champ)) return saisie[champ] ?? "";
      return ligne[champ] ?? "";
    },
    [draft]
  );

  const estModifiee = useCallback(
    (ligne, champ) => Boolean(draft[ligne.idpers] && Object.prototype.hasOwnProperty.call(draft[ligne.idpers], champ)),
    [draft]
  );

  const modifier = useCallback(
    (ligne, champ, texte) => {
      const nouvelle = vide(texte);
      setDraft((courant) => {
        const saisie = { ...(courant[ligne.idpers] || {}) };
        if (nouvelle === vide(ligne[champ])) delete saisie[champ]; // retour à la valeur de la base
        else saisie[champ] = nouvelle;

        const suivant = { ...courant };
        if (Object.keys(saisie).length) suivant[ligne.idpers] = saisie;
        else delete suivant[ligne.idpers];
        return suivant;
      });
    },
    []
  );

  /** Annule les modifications d'UNE ligne. */
  const retablirLigne = useCallback((ligne) => {
    setDraft((courant) => {
      if (!courant[ligne.idpers]) return courant;
      const suivant = { ...courant };
      delete suivant[ligne.idpers];
      return suivant;
    });
  }, []);

  const nbLignesModifiees = Object.keys(draft).length;
  const nbCasesModifiees = useMemo(
    () => Object.values(draft).reduce((n, champs) => n + Object.keys(champs).length, 0),
    [draft]
  );

  const annulerSaisies = useCallback(() => {
    setDraft({});
    setErreursSaisie(null);
    setInfo(null);
  }, []);

  /** Enregistre les lignes modifiées. Résout avec la réponse, ou rejette (erreursSaisie renseigné si refus). */
  const enregistrer = useCallback(async () => {
    const parId = new Map(rows.map((p) => [p.idpers, p]));
    const lignes = Object.entries(draft).map(([id, champs]) => {
      const ligne = parId.get(Number(id));
      const base = {};
      Object.keys(champs).forEach((c) => {
        base[c] = vide(ligne?.[c]);
      });
      return { idpers: Number(id), ...champs, base };
    });
    if (!lignes.length) return { message: "Aucune modification à enregistrer", enregistres: 0 };

    setSaving(true);
    setErreursSaisie(null);
    try {
      const res = await saisiePointageService.enregistrer({ idserv, date, lignes }, navigate);
      setDraft({});
      setInfo(null);
      await charger(date, { reconciler: false });
      return res;
    } catch (err) {
      setErreursSaisie({ message: err.message, erreurs: err.erreurs ?? [] });
      throw err;
    } finally {
      setSaving(false);
    }
  }, [rows, draft, idserv, date, navigate, charger]);

  return {
    date,
    setDate,
    rows,
    meta,
    loading,
    saving,
    info,
    setInfo,
    erreurChargement,
    valeur,
    estModifiee,
    modifier,
    retablirLigne,
    draft,
    nbLignesModifiees,
    nbCasesModifiees,
    annulerSaisies,
    enregistrer,
    erreursSaisie,
    fermerErreurs: () => setErreursSaisie(null),
    champsDe,
  };
}
