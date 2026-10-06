import React, { useEffect } from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import "../presences/m3-expressive.css"; // thème M3 Expressive partagé
import styles from "./assiduite.module.css"; // ⚠️ même fichier CSS que l'original, inchangé

import LoadingOverlay from "./components/LoadingOverlay";
import DivisionSelector from "./components/DivisionSelector";
import MobileSearchBar from "./components/MobileSearchBar";
import TableSearchBar from "./components/TableSearchBar";
import MonthFilter from "./components/MonthFilter";
import MatriculeFilter from "./components/MatriculeFilter";
import ExportMenu from "./components/ExportMenu";
import AssiduiteTable from "./components/AssiduiteTable";
import AssiduiteSummary from "./components/AssiduiteSummary";
import dayjs from "dayjs";
import RowActionsMenu from "./components/RowActionsMenu";
import ExportSnackbar from "./components/ExportSnackbar";
import { useAssiduiteController } from "./Useassiduitecontroller";
import { buildAssiduiteColumns } from "./Useassiduitecolumns";
import PageHeader from "../../content/autorisations_absences/components/PageHeader";

const Assiduites = () => {
  const c = useAssiduiteController();

  // Active le thème M3 Expressive (aussi pour menus/dialogues portalés)
  useEffect(() => {
    document.body.classList.add("m3x-active");
    return () => document.body.classList.remove("m3x-active");
  }, []);
  const { columns } = buildAssiduiteColumns(c.types);

  // Passe au mois précédent / suivant (même format que MonthFilter)
  const shiftMonth = (delta) => {
    const d = dayjs(c.selectedDate).add(delta, "month");
    const month = d.format("MM");
    c.setMoisAll(month);
    c.setAnneeAll(d.year());
    c.setSelectedDate(`${d.year()}-${month}-01`);
  };

  if (c.loadingPage) {
    return <LoadingOverlay open={c.loadingPage} />;
  }

  return (
    <div className={styles.personnels}  style={{ maxWidth: "88%", margin: "0 auto" }}>
      
       <PageHeader
        title="Assiduités"
        subtitle="Consultez la liste des assiduités de votre équipe"
      />
      {c.isMobile && (
        <MobileSearchBar searchText={c.searchText} setSearchText={c.setSearchText} />
      )}

      {c.isMobile ? (
        <DivisionSelector
          isMobile={c.isMobile}
          divisions={c.divisions}
          selectedDivision={c.selectedDivision}
          setSelectedDivision={c.setSelectedDivision}
          scrollRef={c.scrollRef}
          scrollBtnsRef={c.scrollBtnsRef}
          showLeft={c.showLeft}
          showRight={c.showRight}
          scroll={c.scroll}
        />
      ) : (
        <section className={styles.filtresCard} aria-label="Divisions">
          <div className={styles.filtresTitle}>
            <i className="fa-solid fa-layer-group" aria-hidden="true"></i>
            <span>Divisions</span>
          </div>
          <DivisionSelector
            isMobile={c.isMobile}
            divisions={c.divisions}
            selectedDivision={c.selectedDivision}
            setSelectedDivision={c.setSelectedDivision}
            scrollRef={c.scrollRef}
            scrollBtnsRef={c.scrollBtnsRef}
            showLeft={c.showLeft}
            showRight={c.showRight}
            scroll={c.scroll}
          />
        </section>
      )}

      {c.isMobile ? (
        <div className={styles.cardTab} style={{ border: 'none' }}>
          <div className={styles.searchBar}>
            <div className={styles.flexible}>
              <MonthFilter
                anchorRef={c.anchorRef}
                open1={c.open1}
                setOpen={c.setOpen}
                selectedDate={c.selectedDate}
                setSelectedDate={c.setSelectedDate}
                setMoisAll={c.setMoisAll}
                setAnneeAll={c.setAnneeAll}
              />

              <MatriculeFilter
                selectedMatricule={c.selectedMatricule}
                setSelectedMatricule={c.setSelectedMatricule}
                anchorEl={c.anchorEl}
                setAnchorEl={c.setAnchorEl}
                searchPers={c.searchPers}
                setSearchPers={c.setSearchPers}
                personnels={c.matriculeOptions}
                loading={c.loadingOptions}
                errorMsg={c.errorMsg}
                handleSelectMatricule={c.handleSelectMatricule}
              />

              <ExportMenu
                loadingPdf1={c.loadingPdf1}
                handleClick3={c.handleClick3}
                anchorEl3={c.anchorEl3}
                open3={c.open3}
                handleClose3={c.handleClose3}
                handleExport={c.handleExport}
              />
            </div>

            <TableSearchBar searchText={c.searchText} setSearchText={c.setSearchText} />
          </div>

          <AssiduiteTable
            loading={c.loading}
            ready={c.ready}
            rowSelection={c.rowSelection}
            selectionType={c.selectionType}
            columns={columns}
            filteredPersonnels={c.filteredPersonnels}
              page={c.page}
              pageSize={c.pageSize}
              total={c.total}
              onPageChange={(p, size) => {
                if (size !== c.pageSize) c.setPageSize(size);
                else c.setPage(p);
              }}
          />
        </div>
      ) : (
        <>
          {/* Barre de filtrage : mois + matricule à gauche, recherche + export à droite */}
          <div className={styles.topBar}>
            <div className={styles.topLeft}>
              <div className={styles.monthNav} role="group" aria-label="Choisir le mois">
                <button type="button" className={styles.navBtn} onClick={() => shiftMonth(-1)} aria-label="Mois précédent">
                  <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
                </button>
                <MonthFilter
                  anchorRef={c.anchorRef}
                  open1={c.open1}
                  setOpen={c.setOpen}
                  selectedDate={c.selectedDate}
                  setSelectedDate={c.setSelectedDate}
                  setMoisAll={c.setMoisAll}
                  setAnneeAll={c.setAnneeAll}
                />
                <button type="button" className={styles.navBtn} onClick={() => shiftMonth(1)} aria-label="Mois suivant">
                  <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
              </div>

              <MatriculeFilter
                selectedMatricule={c.selectedMatricule}
                setSelectedMatricule={c.setSelectedMatricule}
                anchorEl={c.anchorEl}
                setAnchorEl={c.setAnchorEl}
                searchPers={c.searchPers}
                setSearchPers={c.setSearchPers}
                personnels={c.matriculeOptions}
                loading={c.loadingOptions}
                errorMsg={c.errorMsg}
                handleSelectMatricule={c.handleSelectMatricule}
              />
            </div>

            <div className={styles.topRight}>
              <ExportMenu
                loadingPdf1={c.loadingPdf1}
                handleClick3={c.handleClick3}
                anchorEl3={c.anchorEl3}
                open3={c.open3}
                handleClose3={c.handleClose3}
                handleExport={c.handleExport}
              />
            </div>
          </div>

          <AssiduiteSummary resume={c.resume} loading={c.loadingResume} />

          <div className={styles.cardTab} style={{ border: 'none' }}>
            <div className={styles.sectionHead}>
              <div>
                <h3>Détail du mois</h3>
                <p>Retards et absences, par type</p>
              </div>
              <TableSearchBar searchText={c.searchText} setSearchText={c.setSearchText} />
            </div>
            <AssiduiteTable
              loading={c.loading}
              ready={c.ready}
              rowSelection={c.rowSelection}
              selectionType={c.selectionType}
              columns={columns}
              filteredPersonnels={c.filteredPersonnels}
              page={c.page}
              pageSize={c.pageSize}
              total={c.total}
              onPageChange={(p, size) => {
                if (size !== c.pageSize) c.setPageSize(size);
                else c.setPage(p);
              }}
            />
          </div>
        </>
      )}

      <RowActionsMenu
        menuAnchor={c.menuAnchor}
        open={c.open}
        handleMenuClose={c.handleMenuClose}
        setConfirmOpen={c.setConfirmOpen}
      />

      <ExportSnackbar
        openSnack={c.openSnack}
        setOpenSnack={c.setOpenSnack}
        snackMessage={c.snackMessage}
      />
    </div>
  );
};

export default Assiduites;