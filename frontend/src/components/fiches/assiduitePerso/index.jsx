import React from "react";
import styles from "./assiduite.module.css"; // ⚠️ même fichier CSS que l'original, inchangé

import { useAssuiditePersoController } from "./useAssuiditePersoController";

import { buildRetardDetailColumns } from "./useRetardDetailColumns";

import LoadingOverlay from "./components/LoadingOverlay";
import RetardModal from "./components/RetardModal";
import ExportSnackbar from "./components/ExportSnackbar";

import { buildAssuiditePersoColumns } from "./components/useAssuiditePersoColumns";
import MobileView from "./components/MobileView";
import DesktopView from "./components/DesktopView";

const AssuiditePerso = () => {
  const c = useAssuiditePersoController();

  const { columns } = buildAssuiditePersoColumns({
    types: c.types,
    fetchRetardDetails: c.fetchRetardDetails,
    setSelectedRetardDates: c.setSelectedRetardDates,
  });
  const { columns2, columnsSurface } = buildRetardDetailColumns();

  if (c.loadingPage) {
    return <LoadingOverlay open={c.loadingPage} />;
  }

  return (
    <div
      className={styles.personnels}
      style={{
        maxWidth: "88%",
        margin: "0 auto",
        ...(c.isMobile ? { paddingTop: 0 } : {}),
      }}
    >
      {c.isMobile ? (
        <MobileView c={c} columns={columns} />
      ) : (
        <DesktopView c={c} columns={columns} />
      )}

      <RetardModal
        open={c.openRetardModal}
        onClose={() => c.setOpenRetardModal(false)}
        loading={c.loading}
        loadingPdf={c.loadingPdf}
        downloadPDF={c.downloadPDF}
        selectionType={c.selectionType}
        rowSelection={c.rowSelection}
        columns={c.admin?.personnel?.role === "surface" ? columnsSurface : columns2}
        dataSource={c.filteredFiltrage}
        isMobile={c.isMobile}
        variant={c.admin?.personnel?.role === "surface" ? "surface" : "bureau"}
      />

      <ExportSnackbar
        openSnack={c.openSnack}
        setOpenSnack={c.setOpenSnack}
        snackMessage={c.snackMessage}
      />
    </div>
  );
};

export default AssuiditePerso;