import React from "react";
import Box from "@mui/material/Box";
import styles from "../assiduite.module.css";
import PageHeader from "../../../content/autorisations_absences/components/PageHeader";

import MonthFilter from "../components/MonthFilter";
import ExportButton from "../components/ExportButton";
import SearchBox from "../components/SearchBox";
import AssuiditePersoTable from "../components/AssuiditePersoTable";

const DesktopView = ({ c, columns }) => {
  return (
    <div style={{
      width: "100%",
      margin: "0 auto"
    }}>
      <PageHeader
        title="Fiche d'assiduité personnel"
        subtitle="Suivi des retards et de l'assiduité du personnel"
      />

      <div className={styles.cardTab} style={{ border: "none" }}>
        <div className={styles.searchBar}>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingLeft: "10px",
              gap: 12,
              "@media (max-width:768px)": {
                width: "100%",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "10px",
                paddingLeft: 0,
              },
              "@media (max-width:480px)": {
                marginTop: "10px",
                width: "100% !important",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
                paddingLeft: 0,
              },
            }}
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
          </Box>

          <SearchBox searchText={c.searchText} setSearchText={c.setSearchText} />
        </div>

        <div className={`${styles.tableau} ${styles.shadowedTable}`}>
          <AssuiditePersoTable
            loading={c.loading}
            ready={c.ready}
            rowSelection={c.rowSelection}
            selectionType={c.selectionType}
            columns={columns}
            filteredPersonnels={c.filteredPersonnels}
          />
        </div>
      </div>
    </div>
  );
};

export default DesktopView;