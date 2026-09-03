/** Builds a CSV string from a generic {columns, rows} report result — columns use
 * {fieldKey, label}; each row is a plain object keyed by fieldKey. */
const toCsv = ({ columns, rows }) => {
  const header = columns.map((c) => `"${String(c.label).replace(/"/g, '""')}"`).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => `"${String(row[c.fieldKey] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  return [header, ...lines].join('\n');
};

module.exports = { toCsv };
