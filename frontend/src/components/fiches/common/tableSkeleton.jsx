import React from "react";
import { Skeleton } from "antd";

// Remplace le rendu de chaque cellule par un squelette animé ; les en-têtes sont conservés.
const toSkeletonColumns = (cols) =>
  cols.map((col) =>
    col.children
      ? { ...col, children: toSkeletonColumns(col.children) }
      : {
          ...col,
          dataIndex: undefined,
          render: () => <Skeleton.Input active size="small" style={{ width: 70, minWidth: 40 }} />,
        },
  );

const rows = (n) => Array.from({ length: n }, (_, i) => ({ key: `sk-${i}` }));

/**
 * Retourne { columns, dataSource } à passer au <Table> :
 * pendant le chargement, des lignes-squelettes ; sinon les vraies données.
 */
export function useTableSkeleton({ loading, columns, dataSource, rowCount = 10 }) {
  const skeletonColumns = React.useMemo(() => toSkeletonColumns(columns), [columns]);
  const skeletonRows = React.useMemo(() => rows(rowCount), [rowCount]);
  return loading
    ? { columns: skeletonColumns, dataSource: skeletonRows }
    : { columns, dataSource };
}
