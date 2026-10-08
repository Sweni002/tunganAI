import { useCallback, useEffect, useState } from "react";
import { joursFeriesService } from "../services/joursFeriesService";

const DEBOUNCE_MS = 350;

/**
 * Jours fériés du service : pagination, recherche et filtre de période côté serveur.
 */
export function useJoursFeries({ idserv, searchText = "", periode = "", navigate }) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchText]);

  // Tout changement de filtre ramène à la première page
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, periode, pageSize, idserv]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!idserv) return undefined;

    let cancelled = false; // ignore les réponses devenues obsolètes
    setLoading(true);

    joursFeriesService
      .liste(idserv, { page, perPage: pageSize, q: debouncedSearch, periode }, navigate)
      .then((res) => {
        if (cancelled) return;
        setData(Array.isArray(res.data) ? res.data : []);
        setTotal(typeof res.total === "number" ? res.total : 0);
        setResume(res.resume ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Erreur jours fériés :", err);
        setData([]);
        setTotal(0);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setInitialLoadDone(true);
      });

    return () => {
      cancelled = true;
    };
  }, [idserv, page, pageSize, debouncedSearch, periode, reloadKey, navigate]);

  return { data, total, resume, loading, initialLoadDone, page, setPage, pageSize, setPageSize, reload };
}
