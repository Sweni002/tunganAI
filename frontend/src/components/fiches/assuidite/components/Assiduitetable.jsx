import React from "react";
import { Table } from "antd";
import { useTableSkeleton } from "../../common/tableSkeleton";
import styles from "../assiduite.module.css";

const AssiduiteTable = ({
  loading,
  ready,
  rowSelection,
  selectionType,
  columns,
  filteredPersonnels,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  onRowClick,
}) => {
  const rows = filteredPersonnels.map((p) => ({
    ...p,
    key: p.idpointage || p.matricule || `${p.nom}-${p.prenom}`,
  }));
  const showSkeleton = loading || !ready;
  const view = useTableSkeleton({ loading: showSkeleton, columns, dataSource: rows, rowCount: pageSize });

  return (
    <div className={`${styles.tableau} ${styles.shadowedTable}`} aria-busy={showSkeleton}>
      <Table
        loading={false}
        pagination={{
          position: ["bottomCenter"],
          current: page,
          pageSize,
          total,
          onChange: onPageChange,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (t, [from, to]) => `${from}-${to} sur ${t}`,
        }}
        scroll={{ x: 1800, y: { xs: 300, sm: 540 } }}
        rowSelection={{ type: selectionType, ...rowSelection }}
        columns={view.columns}
        dataSource={view.dataSource}
        rowClassName={() => styles.largeRow}
        onRow={(record) => ({
          onClick: (event) => {
            if (!onRowClick || String(record.key).startsWith("sk-")) return;
            // Ignore les clics sur les boutons, liens et cases à cocher
            if (event.target.closest("button, a, .ant-checkbox-wrapper, .ant-table-selection-column")) return;
            onRowClick(record);
          },
          style: onRowClick ? { cursor: "pointer" } : undefined,
        })}
        onHeaderRow={() => ({ className: styles.largeHeader })}
      />
    </div>
  );
};

export default AssiduiteTable;