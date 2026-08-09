// components/PresenceTable.jsx
import React from 'react';
import { Table, Button, Space, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import styles from '../presences.module.css';

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
}) {
  return (
    <>
      <Table
        loading={loading}
        pagination={false} // pagination gérée par le curseur serveur
        scroll={{ x: 1300, y: 540 }}
        rowSelection={rowSelection}
        columns={columns}
        dataSource={dataSource}
        rowKey={(record) => record.id ?? record.key}
        rowClassName={() => styles.largeRow}
        onHeaderRow={() => ({ className: styles.largeHeader })}
      />

      <Space
        align="center"
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '16px 0',
          fontFamily: "'Poppins', system-ui, sans-serif",
        }}
      >
        <Button icon={<LeftOutlined />} disabled={!canGoPrev || loading} onClick={onPrevPage}>
          Précédent
        </Button>

        <Typography.Text type="secondary" style={{ minWidth: 90, textAlign: 'center' }}>
          Page {pageIndex + 1}
        </Typography.Text>

        <Button disabled={!hasMore || loading} onClick={onNextPage}>
          Suivant <RightOutlined />
        </Button>
      </Space>
    </>
  );
}