// components/HistoriqueTable.jsx
import React from 'react';
import { Table } from 'antd';
import styles from '../../presences.module.css';

export default function HistoriqueTable({ loading, isSurface, columns, columnsSurface, dataSource, rowSelection }) {
  return (
    <div className={`${styles.tableau} ${styles.shadowedTable}`}>
      <Table
        loading={loading}
        pagination={{ position: ['bottomCenter'], pageSize: 10 }}
        scroll={{ x: 1300, y: 540 }}
        rowSelection={{ type: 'checkbox', ...rowSelection }}
        columns={isSurface ? columnsSurface : columns}
        dataSource={dataSource}
        rowClassName={() => styles.largeRow}
        onHeaderRow={() => ({ className: styles.largeHeader })}
      />
    </div>
  );
}
