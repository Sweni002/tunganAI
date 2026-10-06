import React from "react";
import { Table } from "antd";
import styles from "../conge.module.css"; // 👈 IMPORT AJOUTÉ
import { useTableSkeleton } from "../../../fiches/common/tableSkeleton";

const DataTable = ({ 
  loading = false, 
  columns = [], 
  dataSource = [], 
  rowSelection = {},
  pagination = { position: ["bottomCenter"], pageSize: 10 },
  scroll = { x: 1300, y: 540 }
}) => {
  // Squelettes pendant le chargement
  const view = useTableSkeleton({ loading, columns, dataSource, rowCount: pagination?.pageSize || 10 });

  return (
    <div className={`${styles.tableau} ${styles.shadowedTable}`} > {/* 👈 MODIFIÉ */}
      <Table
        loading={false}
        pagination={pagination}
        scroll={scroll}
        rowSelection={{ type: "checkbox", ...rowSelection }}
        columns={view.columns}
        dataSource={view.dataSource}
        rowClassName={() => styles.largeRow} // 👈 MODIFIÉ
        onHeaderRow={() => ({ className: styles.largeHeader })} // 👈 MODIFIÉ
      />
    </div>
  );
};

export default DataTable;