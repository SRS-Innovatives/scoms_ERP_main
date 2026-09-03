/**
 * Institution Module Catalog for SCOMS
 *
 * Institutions don't all need the same feature set (a small school may not need
 * Hostel/Transport, a college may not need all of them either). Super Admin assigns
 * which of these OPTIONAL modules are enabled per institution at onboarding time or
 * later via PATCH /institutions/:id/modules. The Institute Admin frontend gates its
 * sidebar navigation using this same catalog so an institution only sees what it was
 * actually granted.
 *
 * CORE modules (dashboard, institution setup, settings) are always available to every
 * institution and are never toggleable — an institute admin always needs these to run
 * the tenant at all.
 */

const CORE_MODULE_KEYS = ['dashboard', 'setup', 'settings'];

const MODULE_CATALOG = [
  { key: 'student', label: 'Student Management', description: 'Admissions, student directory, certificates, promotions' },
  { key: 'staff', label: 'Staff Management', description: 'Staff registration, profiles, leave, payroll structure' },
  { key: 'attendance', label: 'Attendance Module', description: 'Daily & subject-wise attendance, biometric sync' },
  { key: 'timetable', label: 'Timetable Module', description: 'Class, teacher and exam timetable generation' },
  { key: 'examination', label: 'Examination Module', description: 'Exam setup, marks entry, result publishing' },
  { key: 'fee', label: 'Fee Management', description: 'Fee structures, collection, receipts, refunds' },
  { key: 'communication', label: 'Communication', description: 'Announcements, circulars, SMS/email/WhatsApp broadcast' },
  { key: 'library', label: 'Library Module', description: 'Book catalog, issue/return, fines' },
  { key: 'transport', label: 'Transport Module', description: 'Routes, vehicles, drivers, student transport mapping' },
  { key: 'hostel', label: 'Hostel Module', description: 'Room/bed allocation, mess fees, visitor register' },
  { key: 'inventory', label: 'Inventory & Assets', description: 'Asset register, lab/computer inventory, purchases' },
  { key: 'certificates', label: 'Certificates Module', description: 'TC, bonafide, conduct and completion certificates' },
  { key: 'reports', label: 'Reports Module', description: 'Cross-module analytical and compliance reports' },
  { key: 'homework', label: 'Homework Module', description: 'Class-wise homework posting with description and image/PDF/DOCX attachments' },
];

const OPTIONAL_MODULE_KEYS = MODULE_CATALOG.map((m) => m.key);

/**
 * Institutions created before module assignment existed (or with modules left unset)
 * default to having every optional module enabled, so nothing that used to be visible
 * suddenly disappears.
 */
const resolveEnabledModules = (modules) => {
  if (Array.isArray(modules) && modules.length > 0) {
    return modules.filter((m) => OPTIONAL_MODULE_KEYS.includes(m));
  }
  return OPTIONAL_MODULE_KEYS;
};

module.exports = {
  CORE_MODULE_KEYS,
  MODULE_CATALOG,
  OPTIONAL_MODULE_KEYS,
  resolveEnabledModules,
};
