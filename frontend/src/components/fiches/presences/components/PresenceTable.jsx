// components/PresenceTable.jsx
import React from 'react';
import { Table, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import styles from '../presences.module.css';
import { useTableSkeleton } from '../../common/tableSkeleton';

export default function PresenceTable({
  loading,
  columns,
  dataSource,
  rowSelection,
  onNextPage,
  onPrevPage,
  hasMore,
  canGoPrev,
  pageIndex = 0,
  onRowClick,
}) {
  // Squelettes pendant le chargement (au lieu du spinner par-dessus le tableau)
  const view = useTableSkeleton({ loading, columns, dataSource });

  return (
    <>
      <Table
        loading={false}
        pagination={false} // pagination gérée par le curseur serveur
        scroll={{ x: 1800, y: 560 }}
        rowSelection={rowSelection}
        columns={view.columns}
        dataSource={view.dataSource}
        rowKey={(record) => record.id ?? record.key}
        rowClassName={() => styles.largeRow}
        onRow={(record) => ({
          onClick: (event) => {
            if (!onRowClick || String(record.key).startsWith('sk-')) return;
            // Ignore les clics sur le menu d'actions, la case à cocher et les liens
            if (event.target.closest('button, a, .ant-checkbox-wrapper, .ant-table-selection-column')) return;
            onRowClick(record);
          },
        })}
        onHeaderRow={() => ({ className: styles.largeHeader })}
      />

      <nav className={styles.pager} aria-label="Pagination">
        <Button
          className={styles.pagerBtn}
          icon={<LeftOutlined />}
          disabled={!canGoPrev || loading}
          onClick={onPrevPage}
        >
          Précédent
        </Button>

        <span className={styles.pagerPage} aria-current="page">
          Page {pageIndex + 1}
        </span>

        <Button
          className={`${styles.pagerBtn} ${styles.pagerBtnPrimary}`}
          disabled={!hasMore || loading}
          onClick={onNextPage}
        >
          Suivant <RightOutlined />
        </Button>
      </nav>
    </>
  );
}