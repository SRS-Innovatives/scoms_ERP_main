/**
 * Dynamic Report Builder — safe data-source registry (Phase 8)
 *
 * Deliberately a curated allow-list, not raw Prisma model introspection: only fields
 * listed here can ever be selected, filtered, or sorted on by a dynamic report. This is
 * the same discipline already used in broadcastController's RECIPIENT_GROUPS — never
 * let user input become an arbitrary Prisma `where` clause or expose a field (like a
 * password hash or token) that was never meant to be report output.
 *
 * Every query built from this registry is additionally always scoped to
 * req.institutionId server-side — the caller never controls that.
 */

const FIELD_TYPES = ['STRING', 'NUMBER', 'DATE', 'ENUM'];
const OPERATORS_BY_TYPE = {
  STRING: ['equals', 'contains'],
  NUMBER: ['equals', 'gt', 'gte', 'lt', 'lte'],
  DATE: ['gte', 'lte'],
  ENUM: ['equals'],
};

const DATA_SOURCES = {
  STUDENT: {
    label: 'Students',
    model: 'student',
    tenantScope: { type: 'direct' }, // this model has its own institutionId column
    fields: {
      firstName: { label: 'First Name', type: 'STRING', path: 'firstName' },
      lastName: { label: 'Last Name', type: 'STRING', path: 'lastName' },
      admissionNumber: { label: 'Admission Number', type: 'STRING', path: 'admissionNumber' },
      rollNumber: { label: 'Roll Number', type: 'STRING', path: 'rollNumber' },
      email: { label: 'Email', type: 'STRING', path: 'email' },
      phone: { label: 'Phone', type: 'STRING', path: 'phone' },
      status: { label: 'Status', type: 'ENUM', path: 'status', options: ['ACTIVE', 'WITHDRAWN', 'TRANSFERRED'] },
      gender: { label: 'Gender', type: 'ENUM', path: 'gender', options: ['MALE', 'FEMALE', 'OTHER'] },
      city: { label: 'City', type: 'STRING', path: 'city' },
      admissionDate: { label: 'Admission Date', type: 'DATE', path: 'admissionDate' },
    },
  },
  STAFF: {
    label: 'Staff',
    model: 'staff',
    tenantScope: { type: 'direct' },
    fields: {
      firstName: { label: 'First Name', type: 'STRING', path: 'firstName' },
      lastName: { label: 'Last Name', type: 'STRING', path: 'lastName' },
      employeeCode: { label: 'Employee Code', type: 'STRING', path: 'employeeCode' },
      designation: { label: 'Designation', type: 'STRING', path: 'designation' },
      staffType: { label: 'Staff Type', type: 'ENUM', path: 'staffType', options: ['TEACHING', 'NON_TEACHING'] },
      status: { label: 'Status', type: 'ENUM', path: 'status', options: ['ACTIVE', 'INACTIVE'] },
      joiningDate: { label: 'Joining Date', type: 'DATE', path: 'joiningDate' },
    },
  },
  FEE_ASSIGNMENT: {
    label: 'Fee Assignments',
    model: 'studentFeeAssignment',
    // StudentFeeAssignment has no institutionId column of its own — scoped indirectly
    // via its required student relation instead.
    tenantScope: { type: 'relation', relation: 'student' },
    fields: {
      totalAmount: { label: 'Total Amount', type: 'NUMBER', path: 'totalAmount' },
      discountAmount: { label: 'Discount', type: 'NUMBER', path: 'discountAmount' },
      paidAmount: { label: 'Paid Amount', type: 'NUMBER', path: 'paidAmount' },
      dueAmount: { label: 'Due Amount', type: 'NUMBER', path: 'dueAmount' },
      status: { label: 'Status', type: 'ENUM', path: 'status', options: ['PENDING', 'PARTIAL', 'PAID'] },
      createdAt: { label: 'Assigned On', type: 'DATE', path: 'createdAt' },
      // Nested read-only fields off the related student — output-only, not filterable/sortable
      'student.firstName': { label: 'Student First Name', type: 'STRING', path: 'student.firstName', nested: true },
      'student.lastName': { label: 'Student Last Name', type: 'STRING', path: 'student.lastName', nested: true },
      'student.admissionNumber': { label: 'Admission Number', type: 'STRING', path: 'student.admissionNumber', nested: true },
    },
  },
};

const getDataSource = (key) => {
  const source = DATA_SOURCES[key];
  if (!source) throw new Error(`Unknown data source "${key}"`);
  return source;
};

const listDataSources = () => Object.entries(DATA_SOURCES).map(([key, s]) => ({
  key,
  label: s.label,
  fields: Object.entries(s.fields).map(([fieldKey, f]) => ({
    key: fieldKey,
    label: f.label,
    type: f.type,
    options: f.options || null,
    filterable: !f.nested,
    sortable: !f.nested,
    operators: f.nested ? [] : OPERATORS_BY_TYPE[f.type],
  })),
}));

module.exports = { DATA_SOURCES, FIELD_TYPES, OPERATORS_BY_TYPE, getDataSource, listDataSources };
