import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

import { AuthContext } from "../../../AuthContext";
import sortie from "../autorisation_sortie/sortie.module.css";
import styles from "./jours_feries.module.css";
import "../../fiches/presences/m3-expressive.css";

import PageHeader from "../autorisations_absences/components/PageHeader";
import SnackbarNotification from "../autorisations_absences/components/SnackbarNotification";
import SortieTable from "../autorisation_sortie/components/SortieTable";
import FerieSummary from "./components/FerieSummary";
import FerieDialog from "./components/FerieDialog";
import { getColumns } from "./constants/columns";
import { useJoursFeries } from "./hooks/useJoursFeries";
import { joursFeriesService } from "./services/joursFeriesService";

const FILTRES = [
  { value: "", label: "Tous" },
  { value: "complete", label: "Journée complète" },
  { value: "matin", label: "Matin" },
  { value: "soir", label: "Après-midi" },
];

const JoursFeries = () => {
  const navigate = useNavigate();
  const { fetchMe } = useContext(AuthContext);
  const [admin, setAdmin] = useState(null);
  const idserv = admin?.responsable?.idserv;

  const [searchText, setSearchText] = useState("");
  const [periode, setPeriode] = useState("");

  // Dialogues : ajout / modification, suppression
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jourEdite, setJourEdite] = useState(null);
  const [aSupprimer, setASupprimer] = useState(null);
  const [suppression, setSuppression] = useState(false);

  // Notifications
  const [snack, setSnack] = useState({ open: false, message: "" });
  const notify = (message) => setSnack({ open: true, message });

  const { data, total, resume, loading, page, setPage, pageSize, setPageSize, reload } = useJoursFeries({
    idserv,
    searchText,
    periode,
    navigate,
  });

  // Thème M3 Expressive (aussi pour les menus et dialogues portalés)
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

  const ouvrirAjout = () => {
    setJourEdite(null);
    setDialogOpen(true);
  };
  const ouvrirEdition = (jour) => {
    setJourEdite(jour);
    setDialogOpen(true);
  };

  const confirmerSuppression = async () => {
    if (!aSupprimer) return;
    setSuppression(true);
    try {
      const res = await joursFeriesService.supprimer(aSupprimer.id, navigate);
      notify(res.message || "Jour férié supprimé");
      setASupprimer(null);
      reload();
    } catch (err) {
      notify(err.message);
    } finally {
      setSuppression(false);
    }
  };

  const columns = useMemo(() => getColumns(ouvrirEdition, setASupprimer), []);

  return (
    <div className={`${sortie.page} ${styles.root}`}>
      <PageHeader
        title="Jours fériés"
        subtitle="Les jours fériés de votre service : ni pointage, ni absence sur ces périodes"
        showButton
        buttonLabel="Ajouter des jours fériés"
        onButtonClick={ouvrirAjout}
      />

      <FerieSummary resume={resume} loading={loading} />

      <section className={sortie.card} aria-label="Liste des jours fériés">
        <div className={sortie.toolbar}>
          <div className={styles.filterChips} role="group" aria-label="Filtrer par période">
            {FILTRES.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`${styles.filterChip} ${periode === f.value ? styles.filterChipOn : ""}`}
                aria-pressed={periode === f.value}
                onClick={() => setPeriode(f.value)}
              >
                {f.label}
              </button>
            ))}
            <span className={sortie.count} aria-live="polite">
              {total} résultat{total > 1 ? "s" : ""}
            </span>
          </div>

          <label className={sortie.search}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <input
              type="search"
              placeholder="Rechercher un motif…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              aria-label="Rechercher"
            />
          </label>
        </div>

        <SortieTable
          loading={loading}
          columns={columns}
          dataSource={data.map((j) => ({ ...j, key: j.id }))}
          emptyLabel="Aucun jour férié à afficher"
          pagination={{
            position: ["bottomCenter"],
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (t, [from, to]) => `${from}-${to} sur ${t}`,
            onChange: (p, size) => {
              if (size !== pageSize) setPageSize(size);
              else setPage(p);
            },
          }}
        />
      </section>

      <FerieDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        idserv={idserv}
        jour={jourEdite}
        navigate={navigate}
        onSaved={(message) => {
          notify(message);
          reload();
        }}
      />

      {/* ---------- Confirmation de suppression ---------- */}
      <Dialog
        open={Boolean(aSupprimer)}
        onClose={suppression ? undefined : () => setASupprimer(null)}
        slotProps={{ paper: { className: styles.dialogPaper } }}
      >
        <div className={styles.confirm}>
          <h2 className={styles.formTitle}>Supprimer ce jour férié ?</h2>
          <p>
            « {aSupprimer?.motif} » du {aSupprimer ? new Date(aSupprimer.date).toLocaleDateString("fr-FR") : ""} sera
            supprimé. Le pointage et le contrôle des absences reprendront normalement sur cette période.
          </p>
          <div className={styles.formActions}>
            <Button
              onClick={() => setASupprimer(null)}
              disabled={suppression}
              sx={{ textTransform: "none", fontSize: "0.85rem", px: 3, py: 1.4, color: "#1b6979" }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              disableElevation
              color="error"
              onClick={confirmerSuppression}
              disabled={suppression}
              startIcon={suppression ? <CircularProgress size={18} color="inherit" /> : <i className="fa-regular fa-trash-can"></i>}
              sx={{ textTransform: "none", fontSize: "0.85rem", px: 4, py: 1.4 }}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Dialog>

      <SnackbarNotification open={snack.open} message={snack.message} onClose={() => setSnack({ open: false, message: "" })} />
    </div>
  );
};

export default JoursFeries;
