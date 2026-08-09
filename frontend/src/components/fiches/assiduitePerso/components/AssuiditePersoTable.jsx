import React from "react";
import { Table } from "antd";
import styles from "../assiduite.module.css";

const AssuiditePersoTable = ({
  loading,
  ready,
  rowSelection,
  selectionType,
  columns,
  filteredPersonnels,
}) => (
  <Table
    loading={loading || !ready}
    pagination={{ position: ["bottomCenter"], pageSize: 10 }}
    scroll={{ x: 1300, y: 540 }}
    rowSelection={{ type: selectionType, ...rowSelection }}
    columns={columns}
    dataSource={filteredPersonnels.map((p) => ({
      ...p,
      key: p.idpointage || p.matricule || `${p.nom}-${p.prenom}`,
    }))}
    rowClassName={() => styles.largeRow}
    onHeaderRow={() => ({ className: styles.largeHeader })}
  />
);

export default AssuiditePersoTable;
