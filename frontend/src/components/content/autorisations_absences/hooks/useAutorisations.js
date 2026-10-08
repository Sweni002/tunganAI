import { useState, useEffect, useCallback } from "react";
import { autorisationService } from "../services/autorisationService";

const SEARCH_DEBOUNCE_MS = 350;
const NO_FILTERS = { start: "", end: "", date: "" };

/**
 * Autorisations d'un service : pagination, recherche et filtres de dates côté serveur.
 * @param admin        utilisateur connecté (le service vient de admin.responsable.idserv)
 * @param searchText   texte de recherche brut (débouncé ici)
 */
export const useAutorisations = (admin, searchText = "") => {
  const idserv = admin?.responsable?.idserv;

  const [conges, setConges] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(null);

  // --- Pagination / filtres appliqués ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchText]);

  // Tout changement de filtre ramène à la première page
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters, pageSize, idserv]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // Remplace les filtres de dates ({} ou NO_FILTERS pour les retirer)
  const applyFilters = useCallback((next = {}) => setFilters({ ...NO_FILTERS, ...next }), []);

  // --- Une page à la fois ---
  useEffect(() => {
    if (!idserv) return undefined;

    let cancelled = false; // ignore les réponses devenues obsolètes
    setLoading(true);

    autorisationService
      .getAutorisationsPage(idserv, {
        page,
        per_page: pageSize,
        q: debouncedSearch,
        ...filters,
      })
      .then((res) => {
        if (cancelled) return;
        setConges(Array.isArray(res.data) ? res.data : []);
        setTotal(typeof res.total === "number" ? res.total : 0);
        setErrorMsg(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Erreur fetch:", err);
        setConges([]);
        setTotal(0);
        setErrorMsg(err.message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadingPage(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idserv, page, pageSize, debouncedSearch, filters, reloadKey]);

  // Les divisions ne dépendent pas de la pagination
  const loadData = async (id) => {
    if (!id) return;
    try {
      const data = await autorisationService.getDivisions(id);
      setDivisions(Array.isArray(data) ? data : []);
    } catch (err) {
      setDivisions([]);
      setErrorMsg(err.message);
    }
  };

  const filterByDivision = (divisionId) => {
    setSelectedDivision(divisionId);
  };

  return {
    conges,
    setConges,
    divisions,
    loading,
    loadingPage,
    errorMsg,
    selectedDivision,
    loadData,
    filterByDivision,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    filters,
    applyFilters,
    reload,
    reloadKey,
  };
};
