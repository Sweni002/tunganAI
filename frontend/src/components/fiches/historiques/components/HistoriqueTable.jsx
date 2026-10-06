// components/HistoriqueTable.jsx
import React from 'react';
import { Table } from 'antd';
import styles from '../../presences.module.css';
import { useTableSkeleton } from '../../common/tableSkeleton';

export default function HistoriqueTable({ loading, isSurface, columns, columnsSurface, dataSource, rowSelection }) {
  const view = useTableSkeleton({
    loading,
    columns: isSurface ? columnsSurface : columns,
    dataSource,
  });

  return (
    <div className={`${styles.tableau} ${styles.shadowedTable}`}>
      <Table
        loading={false}
        pagination={{ position: ['bottomCenter'], pageSize: 10 }}
        scroll={{ x: 1300, y: 540 }}
        rowSelection={{ type: 'checkbox', ...rowSelection }}
        columns={view.columns}
        dataSource={view.dataSource}
        rowClassName={() => styles.largeRow}
        onHeaderRow={() => ({ className: styles.largeHeader })}
      />
    </div>
  );
}
