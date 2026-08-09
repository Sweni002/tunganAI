import React from "react";
import { Table } from "antd";
import styles from "../responsables.module.css";

export default function PersonnelsTable({ loading, selectionType, columns, filteredPersonnels, rowSelection }) {
  return (
    <div className={`${styles.tableau} ${styles.shadowedTable}`}>
      <Table
        loading={loading}
        rowSelection={{ type: selectionType, ...rowSelection }}
        columns={columns}
        dataSource={filteredPersonnels.map((p) => ({ ...p, key: p.idpers }))}
        rowClassName={() => styles.largeRow}
        onHeaderRow={() => ({ className: styles.largeHeader })}
        pagination={{ position: ["bottomCenter"], pageSize: 10 }}
        scroll={{ x: 1300, y: 540 }}
      />
    </div>
  );
}