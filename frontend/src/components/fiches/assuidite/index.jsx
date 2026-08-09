import React from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import styles from "./assiduite.module.css"; // ⚠️ même fichier CSS que l'original, inchangé

import LoadingOverlay from "./components/LoadingOverlay";
import DivisionSelector from "./components/DivisionSelector";
import MobileSearchBar from "./components/MobileSearchBar";
import TableSearchBar from "./components/TableSearchBar";
import MonthFilter from "./components/MonthFilter";
import MatriculeFilter from "./components/MatriculeFilter";
import ExportMenu from "./components/ExportMenu";
import AssiduiteTable from "./components/AssiduiteTable";
import RowActionsMenu from "./components/RowActionsMenu";
import ExportSnackbar from "./components/ExportSnackbar";
import { useAssiduiteController } from "./Useassiduitecontroller";
import { buildAssiduiteColumns } from "./Useassiduitecolumns";
import PageHeader from "../../content/autorisations_absences/components/PageHeader";

const Assiduites = () => {
  const c = useAssiduiteController();
  const { columns } = buildAssiduiteColumns(c.types);

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
              personnels={c.personnels}
              loading={c.loading}
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
        />
      </div>

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