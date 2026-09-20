/**
 * Dynamic Report Builder — safe execution engine (Phase 8)
 *
 * Turns a validated {dataSource, fields, filters, sortBy, sortDirection} definition
 * into a real Prisma query and a generic {columns, rows} result — the same shape the
 * existing report engine's toCsv/toExcelBuffer/toPdfBuffer already consume, so export
 * is fully reused, never duplicated.
 *
 * Every filter operator maps to an explicit Prisma clause (no string interpolation, no
 * arbitrary `where` from user input) and institutionId is always injected server-side,
 * never taken from the request.
 */
const prisma = require('../database/client');
const { getDataSource, OPERATORS_BY_TYPE } = require('./dynamicSources');

const buildWhereClause = (source, filters, institutionId) => {
  // Not every model has its own institutionId column (StudentFeeAssignment doesn't —
  // it's scoped through its required student relation instead) — tenantScope says
  // which shape to build so tenant isolation is never accidentally skipped.
  const where = source.tenantScope.type === 'direct'
    ? { institutionId }
    : { [source.tenantScope.relation]: { institutionId } };
  for (const filter of filters || []) {
    const fieldDef = source.fields[filter.field];
    if (!fieldDef || fieldDef.nested) throw new Error(`Field "${filter.field}" is not filterable on this data source`);
    const allowedOps = OPERATORS_BY_TYPE[fieldDef.type];
    if (!allowedOps.includes(filter.operator)) throw new Error(`Operator "${filter.operator}" is not valid for field "${filter.field}"`);

    const value = fieldDef.type === 'NUMBER' ? Number(filter.value) : fieldDef.type === 'DATE' ? new Date(filter.value) : filter.value;

    switch (filter.operator) {
      case 'equals': where[fieldDef.path] = value; break;
      case 'contains': where[fieldDef.path] = { contains: value, mode: 'insensitive' }; break;
      case 'gt': where[fieldDef.path] = { ...(where[fieldDef.path] || {}), gt: value }; break;
      case 'gte': where[fieldDef.path] = { ...(where[fieldDef.path] || {}), gte: value }; break;
      case 'lt': where[fieldDef.path] = { ...(where[fieldDef.path] || {}), lt: value }; break;
      case 'lte': where[fieldDef.path] = { ...(where[fieldDef.path] || {}), lte: value }; break;
      default: throw new Error(`Unsupported operator "${filter.operator}"`);
    }
  }
  return where;
};

const buildSelect = (source, fieldKeys) => {
  const select = {};
  const nestedGroups = {};
  for (const key of fieldKeys) {
    const fieldDef = source.fields[key];
    if (!fieldDef) throw new Error(`Field "${key}" does not exist on this data source`);
    if (fieldDef.nested) {
      const [relation, subField] = fieldDef.path.split('.');
      nestedGroups[relation] = nestedGroups[relation] || {};
      nestedGroups[relation][subField] = true;
    } else {
      select[fieldDef.path] = true;
    }
  }
  for (const [relation, subSelect] of Object.entries(nestedGroups)) {
    select[relation] = { select: subSelect };
  }
  return select;
};

/** Flattens a Prisma row (with nested relation objects) into a single-level object
 * keyed by the same dotted field keys the caller requested — matches how columns are
 * labelled, so the generic exporters can render it directly. */
const flattenRow = (row, fieldKeys, source) => {
  const flat = {};
  for (const key of fieldKeys) {
    const fieldDef = source.fields[key];
    if (fieldDef.nested) {
      const [relation, subField] = fieldDef.path.split('.');
      flat[key] = row[relation]?.[subField] ?? '';
    } else {
      const value = row[fieldDef.path];
      flat[key] = value instanceof Date ? value.toISOString().slice(0, 10) : value ?? '';
    }
  }
  return flat;
};

const runDynamicReport = async ({ dataSourceKey, fields, filters, sortBy, sortDirection, institutionId }) => {
  const source = getDataSource(dataSourceKey);
  if (!Array.isArray(fields) || fields.length === 0) throw new Error('At least one field must be selected');

  const where = buildWhereClause(source, filters, institutionId);
  const select = buildSelect(source, fields);

  let orderBy;
  if (sortBy) {
    const sortFieldDef = source.fields[sortBy];
    if (!sortFieldDef || sortFieldDef.nested) throw new Error(`Field "${sortBy}" is not sortable on this data source`);
    orderBy = { [sortFieldDef.path]: sortDirection === 'desc' ? 'desc' : 'asc' };
  }

  const rows = await prisma[source.model].findMany({ where, select, ...(orderBy && { orderBy }), take: 5000 });

  const columns = fields.map((key) => ({ fieldKey: key, label: source.fields[key].label }));
  const flatRows = rows.map((r) => flattenRow(r, fields, source));

  return { columns, rows: flatRows, totalRows: flatRows.length };
};

module.exports = { runDynamicReport };
