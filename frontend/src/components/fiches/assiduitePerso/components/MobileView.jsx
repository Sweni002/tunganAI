import React from "react";
import Typography from "@mui/material/Typography";
import styles from "../assiduite.module.css";

import MonthFilter from "./MonthFilter";
import ExportButton from "./ExportButton";
import FicheCardList from "./FicheCardList";
import PageHeader from "../../../content/autorisations_absences/components/PageHeader";

/**
 * Vue mobile (≤700px) de la fiche d'assiduité personnelle.
 * - titre "Fiche d'assiduité" tout en haut
 * - la barre de filtres (mois + export) prend toute la largeur, en space-between
 * - pas de champ de recherche visible (masqué sur mobile dans l'original)
 * - les données sont présentées en cartes MUI (tuiles tapables), plus lisibles
 *   qu'un tableau large sur petit écran, à la place du <Table> desktop
 */
const MobileView = ({ c }) => {
  return (
    <div style={{
      width: "100%",
      margin: "0 auto"
    }}  >

      <PageHeader
        title="Fiche d'assiduité personnel"
        subtitle="Suivi des retards et de l'assiduité du personnel"
      />

      <div className={styles.searchBar}>
        <div
          className={styles.flexible1}
          style={{ display: "flex", justifyContent: "space-between", width: "100%" }}
        >
          <MonthFilter
            anchorRef={c.anchorRef}
            open1={c.open1}
            setOpen={c.setOpen}
            selectedDate={c.selectedDate}
            setSelectedDate={c.setSelectedDate}
            setMoisAll={c.setMoisAll}
            setAnneeAll={c.setAnneeAll}
          />
          <ExportButton loadingPdf1={c.loadingPdf1} exportExcel={c.exportExcel} />
        </div>
      </div>

      <FicheCardList
        filteredPersonnels={c.filteredPersonnels}
        types={c.types}
        fetchRetardDetails={c.fetchRetardDetails}
        setSelectedRetardDates={c.setSelectedRetardDates}
        loading={c.loading}
        ready={c.ready}
      />
    </div>
  );
};

export default MobileView;