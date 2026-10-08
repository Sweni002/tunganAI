import React from "react";
import { Table } from "antd";
import styles from "../sortie.module.css";
import { useTableSkeleton } from "../../../fiches/common/tableSkeleton";

const PAGINATION_LOCALE = { position: ["bottomCenter"], pageSize: 8, showSizeChanger: false, hideOnSinglePage: true };

/** `pagination` : objet antd (pagination serveur) ; par défaut, pagination locale de 8 lignes. */
export default function SortieTable({ loading, columns, dataSource, pagination, emptyLabel = "Aucune autorisation à afficher" }) {
  const view = useTableSkeleton({ loading, columns, dataSource, rowCount: pagination?.pageSize || 8 });

  return (
    <div className={styles.tableWrap}>
      <Table
        loading={false}
        pagination={pagination || PAGINATION_LOCALE}
        scroll={{ x: 1100 }}
        columns={view.columns}
        dataSource={view.dataSource}
        locale={{
          emptyText: (
            <div className={styles.empty}>
              <i className="fa-regular fa-folder-open" aria-hidden="true"></i>
              {emptyLabel}
            </div>
          ),
        }}
      />
    </div>
  );
}
