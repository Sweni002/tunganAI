import React from "react";
import styles from "./responsables.module.css";
import LoadingOverlay from "./components/LoadingOverlay";
import DivisionSelector from "./components/DivisionSelector";
import SearchBar from "./components/SearchBar";
import PersonnelsTable from "./components/PersonnelsTable";
import RowActionsMenu from "./components/RowActionsMenu";
import PersonnelsSnackbar from "./components/PersonnelsSnackbar";
import { usePersonnelsController } from "./usePersonnelsController";
import { usePersonnelsColumns } from "./usePersonnelsColumns";
import PageHeader from "../autorisations_absences/components/PageHeader";
import DeleteConfirmDialog from "../../fiches/presences/components/DeleteConfirmDialog";

const Personnels = () => {
  const c = usePersonnelsController();
  const { columns } = usePersonnelsColumns({
    navigate: c.navigate,
    handleDeleteClick: c.handleDeleteClick,
    API_URL: c.API_URL,
  });

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, "selectedRows: ", selectedRows);
    },
    getCheckboxProps: (record) => ({
      disabled: false,
      name: record.nom,
    }),
  };

  if (c.loadingPage) {
    return <LoadingOverlay open={c.loadingPage} />;
  }

  return (
    <div className={styles.personnels} style={{ maxWidth: "88%", margin: "0 auto" }}>
      <PageHeader
        title="Personnels"
        subtitle="Gérez la liste des personnels de votre équipe"
        showButton
        buttonLabel="Nouveau personnel"
        onButtonClick={c.goAjout}
      />

      <DivisionSelector
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
        <SearchBar searchText={c.searchText} setSearchText={c.setSearchText} />

        <PersonnelsTable
          loading={c.loading}
          selectionType={c.selectionType}
          columns={columns}
          filteredPersonnels={c.filteredPersonnels}
          rowSelection={rowSelection}
        />
      </div>

      <RowActionsMenu
        menuAnchor={c.menuAnchor}
        open={c.open}
        handleMenuClose={c.handleMenuClose}
        selectedRecord={c.selectedRecord}
        voirFicheAssiduite={c.voirFicheAssiduite}
      />

      <PersonnelsSnackbar openSnack={c.openSnack} setOpenSnack={c.setOpenSnack} snackMessage={c.snackMessage} />

      <DeleteConfirmDialog
        open={c.confirmOpen}
        onClose={() => c.setConfirmOpen(false)}
        onConfirm={c.handleConfirmDelete}
        loading={c.loadingSupp}
      />
    </div>
  );
};

export default Personnels;