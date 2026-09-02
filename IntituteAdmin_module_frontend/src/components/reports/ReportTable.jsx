import React from 'react';
import DataTable from '../common/DataTable';

/** Renders any report's result generically from its {columns, rows} — never a hardcoded
 * table per report. `columns` come straight from the report definition (fieldKey/label). */
export const ReportTable = ({ columns = [], rows = [] }) => {
  const tableColumns = columns.map((c) => ({ header: c.label, key: c.fieldKey }));
  return <DataTable columns={tableColumns} data={rows} pageSize={20} />;
};

export default ReportTable;
