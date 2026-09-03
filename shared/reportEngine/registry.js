/**
 * Report Handler Registry — maps a Report.handlerKey to its backend implementation.
 *
 * This is the only place new report types get wired in code; everything else (catalog,
 * filters, columns, frontend) is driven purely by database configuration. Adding report
 * #11 means: write one handler file here, register its key, and create its Report +
 * ReportFilter + ReportColumn rows — no other code changes anywhere in the system.
 */
const REPORT_REGISTRY = {
  STUDENT_LIST: require('./handlers/studentList.report'),
  STAFF_LIST: require('./handlers/staffList.report'),
  ATTENDANCE_SUMMARY: require('./handlers/attendanceSummary.report'),
  ATTENDANCE_DETAILED: require('./handlers/attendanceDetailed.report'),
  FEE_COLLECTION: require('./handlers/feeCollection.report'),
  FEE_OUTSTANDING: require('./handlers/feeOutstanding.report'),
  EXAM_RESULT: require('./handlers/examResult.report'),
  STUDENT_PERFORMANCE: require('./handlers/studentPerformance.report'),
  ADMISSION_REPORT: require('./handlers/admission.report'),
  INSTITUTION_SUMMARY: require('./handlers/institutionSummary.report'),
};

module.exports = { REPORT_REGISTRY };
