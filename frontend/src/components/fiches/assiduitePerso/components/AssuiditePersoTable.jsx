import React from "react";
import { Table } from "antd";
import styles from "../assiduite.module.css";
import { useTableSkeleton } from "../../common/tableSkeleton";

const AssuiditePersoTable = ({
  loading,
  ready,
  rowSelection,
  selectionType,
  columns,
  filteredPersonnels,
}) => {
  const rows = filteredPersonnels.map((p) => ({
    ...p,
    key: p.idpointage || p.matricule || `${p.nom}-${p.prenom}`,
  }));
  // Une seule ligne : fiche d'un seul personnel
  const view = useTableSkeleton({ loading: loading || !ready, columns, dataSource: rows, rowCount: 1 });

  return (
  <Table
    loading={false}
    pagination={{ position: ["bottomCenter"], pageSize: 10 }}
    scroll={{ x: 1800, y: 540 }}
    rowSelection={{ type: selectionType, ...rowSelection }}
    columns={view.columns}
    dataSource={view.dataSource}
    rowClassName={() => styles.largeRow}
    onHeaderRow={() => ({ className: styles.largeHeader })}
  />
  );
};

export default AssuiditePersoTable;
