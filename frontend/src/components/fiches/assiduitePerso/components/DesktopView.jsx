import React from "react";
import styles from "../assiduite.module.css";
import PageHeader from "../../../content/autorisations_absences/components/PageHeader";

import DashboardHero from "./DashboardHero";
import MonthFilter from "../components/MonthFilter";
import { Spin } from "antd";
import dayjs from "dayjs";
import AssuiditePersoTable from "../components/AssuiditePersoTable";
import AutorisationsDuJour from "../../common/AutorisationsDuJour";

const DesktopView = ({ c, columns }) => {
  // Passe au mois précédent / suivant en gardant le même format que MonthFilter
  const shiftMonth = (delta) => {
    const d = dayjs(c.selectedDate).add(delta, "month");
    const month = d.format("MM");
    c.setMoisAll(month);
    c.setAnneeAll(d.year());
    c.setSelectedDate(`${d.year()}-${month}-01`);
  };

  return (
    <div style={{
      width: "100%",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: 24,
    }}>
      <PageHeader
        title="Fiche d'assiduité personnel"
        subtitle="Suivi des retards et de l'assiduité du personnel"
      />

      {/* Barre de filtrage : navigation par mois à gauche, export à droite */}
      <div className={styles.topBar}>
        <div className={styles.monthNav} role="group" aria-label="Choisir le mois">
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => shiftMonth(-1)}
            aria-label="Mois précédent"
          >
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
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => shiftMonth(1)}
            aria-label="Mois suivant"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </button>
        </div>

        <button
          type="button"
          className={styles.exportBtn}
          onClick={c.exportExcel}
          disabled={c.loadingPdf1}
        >
          {c.loadingPdf1 ? <Spin size="small" /> : <i className="fa-solid fa-download" aria-hidden="true"></i>}
          Exporter
        </button>
      </div>

      <DashboardHero c={c} />

      <AutorisationsDuJour data={c.autorisationsJour} loading={c.loadingAutorisationsJour} />

      <div className={styles.cardTab} style={{ border: "none" }}>
        <div className={styles.sectionHead}>
          <h3>Détail du mois</h3>
          <p>Retards et absences, par type</p>
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