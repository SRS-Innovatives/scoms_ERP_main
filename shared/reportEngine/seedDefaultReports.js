/**
 * Seeds the 10 default SCOMS reports (Layer 1 catalog + their filters/columns), then makes
 * sure every existing institution has a Layer 2 InstitutionReport configuration row for
 * each — enabled by default, since these are SYSTEM reports every institution should see
 * out of the box. Fully idempotent: safe to re-run any time (e.g. after a deploy).
 *
 * Run directly:  node shared/reportEngine/seedDefaultReports.js
 * Or import:     const { seedDefaultReports } = require('.../reportEngine/seedDefaultReports');
 */
const prisma = require('../database/client');

const DEFAULT_REPORTS = [
  {
    code: 'STUDENT_LIST',
    name: 'Student List Report',
    description: 'Full student directory with department, course, section and contact details.',
    category: 'STUDENT',
    module: 'Students',
    icon: 'Users',
    filters: [
      { fieldKey: 'departmentId', label: 'Department', inputType: 'DEPARTMENT', source: 'DEPARTMENT', sortOrder: 1 },
      { fieldKey: 'courseId', label: 'Course', inputType: 'COURSE', source: 'COURSE', dependsOn: 'departmentId', sortOrder: 2 },
      { fieldKey: 'sectionId', label: 'Section', inputType: 'SECTION', source: 'SECTION', dependsOn: 'courseId', sortOrder: 3 },
      { fieldKey: 'status', label: 'Status', inputType: 'STATUS', source: 'STATUS', sortOrder: 4 },
    ],
    columns: [
      { fieldKey: 'admissionNumber', label: 'Admission Number', sortOrder: 1 },
      { fieldKey: 'name', label: 'Student Name', sortOrder: 2 },
      { fieldKey: 'department', label: 'Department', sortOrder: 3 },
      { fieldKey: 'course', label: 'Course', sortOrder: 4 },
      { fieldKey: 'semester', label: 'Semester', sortOrder: 5 },
      { fieldKey: 'section', label: 'Section', sortOrder: 6 },
      { fieldKey: 'phone', label: 'Phone', sortOrder: 7 },
      { fieldKey: 'email', label: 'Email', sortOrder: 8 },
      { fieldKey: 'status', label: 'Status', sortOrder: 9 },
    ],
  },
  {
    code: 'STAFF_LIST',
    name: 'Staff Directory Report',
    description: 'Full staff directory with department, designation and contact details.',
    category: 'STAFF',
    module: 'Staff',
    icon: 'UserCheck',
    filters: [
      { fieldKey: 'departmentId', label: 'Department', inputType: 'DEPARTMENT', source: 'DEPARTMENT', sortOrder: 1 },
      { fieldKey: 'status', label: 'Status', inputType: 'STATUS', source: 'STATUS', sortOrder: 2 },
    ],
    columns: [
      { fieldKey: 'employeeCode', label: 'Employee Code', sortOrder: 1 },
      { fieldKey: 'name', label: 'Staff Name', sortOrder: 2 },
      { fieldKey: 'department', label: 'Department', sortOrder: 3 },
      { fieldKey: 'designation', label: 'Designation', sortOrder: 4 },
      { fieldKey: 'email', label: 'Email', sortOrder: 5 },
      { fieldKey: 'phone', label: 'Phone', sortOrder: 6 },
      { fieldKey: 'status', label: 'Status', sortOrder: 7 },
    ],
  },
  {
    code: 'ATTENDANCE_SUMMARY',
    name: 'Attendance Summary Report',
    description: 'Per-section attendance rate aggregated over a date range.',
    category: 'ATTENDANCE',
    module: 'Attendance',
    icon: 'CalendarCheck',
    filters: [
      { fieldKey: 'dateFrom', label: 'Date From', inputType: 'DATE', required: true, sortOrder: 1 },
      { fieldKey: 'dateTo', label: 'Date To', inputType: 'DATE', required: true, sortOrder: 2 },
      { fieldKey: 'sectionId', label: 'Section', inputType: 'SECTION', source: 'SECTION', sortOrder: 3 },
    ],
    columns: [
      { fieldKey: 'section', label: 'Section', sortOrder: 1 },
      { fieldKey: 'sessions', label: 'Sessions', sortOrder: 2 },
      { fieldKey: 'present', label: 'Present', aggregation: 'SUM', sortOrder: 3 },
      { fieldKey: 'absent', label: 'Absent', aggregation: 'SUM', sortOrder: 4 },
      { fieldKey: 'total', label: 'Total Records', aggregation: 'SUM', sortOrder: 5 },
      { fieldKey: 'rate', label: 'Attendance Rate', sortOrder: 6 },
    ],
  },
  {
    code: 'ATTENDANCE_DETAILED',
    name: 'Detailed Attendance Report',
    description: 'Every attendance session recorded in a date range, one row per session.',
    category: 'ATTENDANCE',
    module: 'Attendance',
    icon: 'ListChecks',
    filters: [
      { fieldKey: 'dateFrom', label: 'Date From', inputType: 'DATE', required: true, sortOrder: 1 },
      { fieldKey: 'dateTo', label: 'Date To', inputType: 'DATE', required: true, sortOrder: 2 },
      { fieldKey: 'sectionId', label: 'Section', inputType: 'SECTION', source: 'SECTION', sortOrder: 3 },
      { fieldKey: 'subjectId', label: 'Subject', inputType: 'SUBJECT', source: 'SUBJECT', dependsOn: 'sectionId', sortOrder: 4 },
    ],
    columns: [
      { fieldKey: 'date', label: 'Date', sortOrder: 1 },
      { fieldKey: 'class', label: 'Class', sortOrder: 2 },
      { fieldKey: 'subject', label: 'Subject', sortOrder: 3 },
      { fieldKey: 'period', label: 'Period', sortOrder: 4 },
      { fieldKey: 'present', label: 'Present', aggregation: 'SUM', sortOrder: 5 },
      { fieldKey: 'absent', label: 'Absent', aggregation: 'SUM', sortOrder: 6 },
      { fieldKey: 'total', label: 'Total', aggregation: 'SUM', sortOrder: 7 },
      { fieldKey: 'rate', label: 'Rate', sortOrder: 8 },
    ],
  },
  {
    code: 'FEE_COLLECTION',
    name: 'Fee Collection Report',
    description: 'Every successful fee payment received in a date range.',
    category: 'FEES',
    module: 'Fees',
    icon: 'Wallet',
    allowedRoles: ['INSTITUTE_ADMIN', 'ACCOUNTANT'],
    filters: [
      { fieldKey: 'dateFrom', label: 'Date From', inputType: 'DATE', required: true, sortOrder: 1 },
      { fieldKey: 'dateTo', label: 'Date To', inputType: 'DATE', required: true, sortOrder: 2 },
      { fieldKey: 'paymentMode', label: 'Payment Mode', inputType: 'PAYMENT_MODE', source: 'PAYMENT_MODE', sortOrder: 3 },
    ],
    columns: [
      { fieldKey: 'date', label: 'Date', sortOrder: 1 },
      { fieldKey: 'name', label: 'Student Name', sortOrder: 2 },
      { fieldKey: 'rollNumber', label: 'Roll No', sortOrder: 3 },
      { fieldKey: 'category', label: 'Fee Category', sortOrder: 4 },
      { fieldKey: 'amount', label: 'Amount', format: 'currency', aggregation: 'SUM', sortOrder: 5 },
      { fieldKey: 'mode', label: 'Mode', sortOrder: 6 },
      { fieldKey: 'reference', label: 'Reference', sortOrder: 7 },
    ],
  },
  {
    code: 'FEE_OUTSTANDING',
    name: 'Outstanding Fee Report',
    description: 'Students with a due fee balance above an optional minimum threshold.',
    category: 'FINANCE',
    module: 'Fees',
    icon: 'AlertTriangle',
    allowedRoles: ['INSTITUTE_ADMIN', 'ACCOUNTANT'],
    filters: [
      { fieldKey: 'courseId', label: 'Course', inputType: 'COURSE', source: 'COURSE', sortOrder: 1 },
      { fieldKey: 'sectionId', label: 'Section', inputType: 'SECTION', source: 'SECTION', dependsOn: 'courseId', sortOrder: 2 },
      { fieldKey: 'minimumOutstanding', label: 'Minimum Outstanding (₹)', inputType: 'NUMBER', dataType: 'number', sortOrder: 3 },
    ],
    columns: [
      { fieldKey: 'name', label: 'Student Name', sortOrder: 1 },
      { fieldKey: 'rollNumber', label: 'Roll No', sortOrder: 2 },
      { fieldKey: 'course', label: 'Course', sortOrder: 3 },
      { fieldKey: 'section', label: 'Section', sortOrder: 4 },
      { fieldKey: 'category', label: 'Fee Category', sortOrder: 5 },
      { fieldKey: 'totalFee', label: 'Total Fee', format: 'currency', aggregation: 'SUM', sortOrder: 6 },
      { fieldKey: 'paid', label: 'Paid', format: 'currency', aggregation: 'SUM', sortOrder: 7 },
      { fieldKey: 'outstanding', label: 'Outstanding', format: 'currency', aggregation: 'SUM', sortOrder: 8 },
      { fieldKey: 'parentPhone', label: 'Parent Phone', sortOrder: 9 },
    ],
  },
  {
    code: 'EXAM_RESULT',
    name: 'Examination Result Report',
    description: 'Every recorded mark for a selected exam, one row per student per subject.',
    category: 'EXAMINATION',
    module: 'Examination',
    icon: 'GraduationCap',
    filters: [
      { fieldKey: 'examId', label: 'Exam', inputType: 'SELECT', source: 'EXAM', required: true, sortOrder: 1 },
      { fieldKey: 'sectionId', label: 'Section', inputType: 'SECTION', source: 'SECTION', sortOrder: 2 },
    ],
    columns: [
      { fieldKey: 'name', label: 'Student Name', sortOrder: 1 },
      { fieldKey: 'rollNumber', label: 'Roll No', sortOrder: 2 },
      { fieldKey: 'section', label: 'Section', sortOrder: 3 },
      { fieldKey: 'subject', label: 'Subject', sortOrder: 4 },
      { fieldKey: 'maxMarks', label: 'Max Marks', sortOrder: 5 },
      { fieldKey: 'obtained', label: 'Obtained', aggregation: 'AVG', sortOrder: 6 },
      { fieldKey: 'grade', label: 'Grade', sortOrder: 7 },
    ],
  },
  {
    code: 'STUDENT_PERFORMANCE',
    name: 'Student Performance Report',
    description: 'Average marks % per student across every exam recorded, optionally scoped to one section.',
    category: 'ANALYTICS',
    module: 'Examination',
    icon: 'TrendingUp',
    filters: [
      { fieldKey: 'courseId', label: 'Course', inputType: 'COURSE', source: 'COURSE', sortOrder: 1 },
      { fieldKey: 'sectionId', label: 'Section', inputType: 'SECTION', source: 'SECTION', dependsOn: 'courseId', sortOrder: 2 },
    ],
    columns: [
      { fieldKey: 'name', label: 'Student Name', sortOrder: 1 },
      { fieldKey: 'rollNumber', label: 'Roll No', sortOrder: 2 },
      { fieldKey: 'section', label: 'Section', sortOrder: 3 },
      { fieldKey: 'avgPercent', label: 'Average %', sortOrder: 4 },
      { fieldKey: 'grade', label: 'Grade', sortOrder: 5 },
      { fieldKey: 'examsCount', label: 'Exams Counted', sortOrder: 6 },
    ],
  },
  {
    code: 'ADMISSION_REPORT',
    name: 'Admission Report',
    description: 'Every student admitted in a date range, optionally scoped to one course.',
    category: 'ADMISSION',
    module: 'Admissions',
    icon: 'UserPlus',
    filters: [
      { fieldKey: 'dateFrom', label: 'Date From', inputType: 'DATE', required: true, sortOrder: 1 },
      { fieldKey: 'dateTo', label: 'Date To', inputType: 'DATE', required: true, sortOrder: 2 },
      { fieldKey: 'courseId', label: 'Course', inputType: 'COURSE', source: 'COURSE', sortOrder: 3 },
    ],
    columns: [
      { fieldKey: 'admissionDate', label: 'Admission Date', sortOrder: 1 },
      { fieldKey: 'admissionNumber', label: 'Admission No', sortOrder: 2 },
      { fieldKey: 'name', label: 'Student Name', sortOrder: 3 },
      { fieldKey: 'course', label: 'Course', sortOrder: 4 },
      { fieldKey: 'section', label: 'Section', sortOrder: 5 },
      { fieldKey: 'status', label: 'Status', sortOrder: 6 },
    ],
  },
  {
    code: 'INSTITUTION_SUMMARY',
    name: 'Institution Summary Report',
    description: 'Top-level real counts for the whole institution — students, staff, fees, structure.',
    category: 'ADMINISTRATION',
    module: 'Administration',
    icon: 'Building2',
    filters: [],
    columns: [
      { fieldKey: 'metric', label: 'Metric', sortOrder: 1 },
      { fieldKey: 'value', label: 'Value', sortOrder: 2 },
    ],
  },
];

const seedDefaultReports = async () => {
  const reportIds = [];

  for (const def of DEFAULT_REPORTS) {
    const report = await prisma.report.upsert({
      where: { code: def.code },
      update: {
        name: def.name,
        description: def.description,
        category: def.category,
        module: def.module,
        icon: def.icon,
        allowedRoles: def.allowedRoles || null,
        handlerKey: def.code,
        visibility: 'SYSTEM',
        status: 'ACTIVE',
      },
      create: {
        code: def.code,
        name: def.name,
        description: def.description,
        category: def.category,
        module: def.module,
        icon: def.icon,
        allowedRoles: def.allowedRoles || null,
        handlerKey: def.code,
        visibility: 'SYSTEM',
        status: 'ACTIVE',
      },
    });

    // Deterministic reseed: replace this report's filters/columns each run so the catalog
    // always matches the definitions above exactly (no orphaned/stale field definitions).
    await prisma.reportFilter.deleteMany({ where: { reportId: report.id } });
    await prisma.reportColumn.deleteMany({ where: { reportId: report.id } });

    if (def.filters.length > 0) {
      await prisma.reportFilter.createMany({
        data: def.filters.map((f) => ({
          reportId: report.id,
          fieldKey: f.fieldKey,
          label: f.label,
          inputType: f.inputType,
          dataType: f.dataType || 'string',
          required: !!f.required,
          source: f.source || null,
          dependsOn: f.dependsOn || null,
          sortOrder: f.sortOrder || 0,
        })),
      });
    }

    if (def.columns.length > 0) {
      await prisma.reportColumn.createMany({
        data: def.columns.map((c) => ({
          reportId: report.id,
          fieldKey: c.fieldKey,
          label: c.label,
          dataType: c.dataType || 'string',
          format: c.format || null,
          aggregation: c.aggregation || null,
          sortOrder: c.sortOrder || 0,
        })),
      });
    }

    reportIds.push(report.id);
  }

  // Enable every default (SYSTEM) report for every existing institution — a SYSTEM report
  // with no InstitutionReport row is already treated as enabled by the engine, but creating
  // the row explicitly makes it visible/editable in the Super Admin assignment screen too.
  const institutions = await prisma.institution.findMany({ select: { id: true } });
  for (const institution of institutions) {
    for (const reportId of reportIds) {
      await prisma.institutionReport.upsert({
        where: { institutionId_reportId: { institutionId: institution.id, reportId } },
        update: {},
        create: { institutionId: institution.id, reportId, enabled: true },
      });
    }
  }

  return { reportsSeeded: reportIds.length, institutionsConfigured: institutions.length };
};

module.exports = { seedDefaultReports, DEFAULT_REPORTS };

if (require.main === module) {
  seedDefaultReports()
    .then((result) => {
      console.log(`✅ Seeded ${result.reportsSeeded} default reports across ${result.institutionsConfigured} institution(s).`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Failed to seed default reports:', err);
      process.exit(1);
    });
}
