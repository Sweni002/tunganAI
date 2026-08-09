import React from "react";
import { Table } from "antd";
import styles from "../conge.module.css"; // 👈 IMPORT AJOUTÉ

const DataTable = ({ 
  loading = false, 
  columns = [], 
  dataSource = [], 
  rowSelection = {},
  pagination = { position: ["bottomCenter"], pageSize: 10 },
  scroll = { x: 1300, y: 540 }
}) => {
  return (
    <div className={`${styles.tableau} ${styles.shadowedTable}`} > {/* 👈 MODIFIÉ */}
      <Table
        loading={loading}
        pagination={pagination}
        scroll={scroll}
        rowSelection={{ type: "checkbox", ...rowSelection }}
        columns={columns}
        dataSource={dataSource}
        rowClassName={() => styles.largeRow} // 👈 MODIFIÉ
        onHeaderRow={() => ({ className: styles.largeHeader })} // 👈 MODIFIÉ
      />
    </div>
  );
};

export default DataTable;