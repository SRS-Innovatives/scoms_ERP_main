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

// Institutions register as one of 4 real types. Day-to-day module usage is the same for
// COLLEGE and AUTONOMOUS_COLLEGE (same Course→Semester→Section structure, same fee/library/
// hostel needs) — what actually differs between them is examination/degree AUTHORITY, not
// which of these modules are useful, so they share a recommendation set here. An autonomous
// college also self-governs its own exams and can confer its own degrees like a University
// does, so it picks up Research/Convocation recommendations too where a plain College doesn't.
const resolveStructureType = (institutionType) => institutionType;

const MODULE_CATALOG = [
  { key: 'student', label: 'Student Management', description: 'Admissions, student directory, certificates, promotions', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'staff', label: 'Staff Management', description: 'Staff registration, profiles, leave, payroll structure', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'attendance', label: 'Attendance Module', description: 'Daily & subject-wise attendance, biometric sync', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'timetable', label: 'Timetable Module', description: 'Class, teacher and exam timetable generation', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'examination', label: 'Examination Module', description: 'Exam setup, marks entry, result publishing', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'fee', label: 'Fee Management', description: 'Fee structures, collection, receipts, refunds', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'communication', label: 'Communication', description: 'Announcements, circulars, SMS/email/WhatsApp broadcast', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'library', label: 'Library Module', description: 'Book catalog, issue/return, fines', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'transport', label: 'Transport Module', description: 'Routes, vehicles, drivers, student transport mapping', recommendedFor: ['SCHOOL'] },
  { key: 'hostel', label: 'Hostel Module', description: 'Room/bed allocation, mess fees, visitor register', recommendedFor: ['COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'inventory', label: 'Inventory & Assets', description: 'Asset register, lab/computer inventory, purchases', recommendedFor: ['COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'certificates', label: 'Certificates Module', description: 'TC, bonafide, conduct and completion certificates', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'reports', label: 'Reports Module', description: 'Cross-module analytical and compliance reports', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'homework', label: 'Homework Module', description: 'Class-wise homework posting with description and image/PDF/DOCX attachments', recommendedFor: ['SCHOOL'] },
  { key: 'placement', label: 'Placement / Career Services', description: 'Job & internship postings, student applications, placement tracking', recommendedFor: ['COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'research', label: 'Research & Publications', description: 'Faculty papers, patents, conference talks and book chapters', recommendedFor: ['AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'alumni', label: 'Alumni Network', description: 'Graduated-student directory, employer/designation tracking, mentorship contact', recommendedFor: ['COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'convocation', label: 'Convocation & Degree Issuance', description: 'Formal degree records, convocation date, registry numbers — distinct from TC/bonafide certificates', recommendedFor: ['AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'ai_tutor', label: 'AI Study Tutor', description: 'Real AI Q&A grounded in your own Std 5-12 textbook content (Tamil & English) — powered by a platform-wide OpenAI key Super Admin configures', recommendedFor: ['SCHOOL'] },

  // -- World-class ERP additions --
  { key: 'front_office', label: 'Front Office / Admission Enquiry', description: 'Walk-in, phone and website admission enquiries with follow-up and lead-conversion tracking', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'payroll', label: 'Payroll Module', description: 'Monthly payslip generation from real staff salary structures, payment tracking', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'discipline', label: 'Student Discipline', description: 'Incident logging, severity categorisation and resolution tracking for student conduct', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'health', label: 'Health & Medical Records', description: 'School/college nurse visit log — symptoms, diagnosis, hospital referral and parent notification', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'visitor_management', label: 'Visitor / Gate Management', description: 'Front-gate visitor check-in/check-out log with ID proof and purpose of visit', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'events_clubs', label: 'Events & Clubs', description: 'Campus event calendar with registrations, plus clubs & societies membership', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'grievance_feedback', label: 'Grievance & Feedback', description: 'Student grievance redressal and anonymous course/faculty feedback collection', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'career_portfolio', label: 'Career Portfolio', description: 'Student resume builder and achievements/certificates portfolio', recommendedFor: ['COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'counselling', label: 'Counselling Appointments', description: 'Student booking of counselling/mentoring appointments with staff', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'ptm', label: 'Parent-Teacher Meetings', description: 'Staff logging of parent-teacher meeting notes and follow-ups', recommendedFor: ['SCHOOL'] },
  { key: 'messaging', label: 'Internal Messaging', description: 'Direct chat between students, parents and staff', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'gallery', label: 'Photo Gallery', description: 'Event/campus photo albums — Institute Admin & Staff upload, everyone in the institution can view', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
  { key: 'pre_admission', label: 'Pre-Admission / Application Form', description: 'A public API your own website\'s admission form can submit into — applications land here for review, then one click converts a real student admission', recommendedFor: ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY'] },
];

const OPTIONAL_MODULE_KEYS = MODULE_CATALOG.map((m) => m.key);

/** Which of the catalog's module keys are recommended for a given institution type —
 * used to pre-check sensible defaults at onboarding. Every module stays freely toggleable
 * either way; this only decides what starts checked. */
const getRecommendedModules = (institutionType) => {
  const structureType = resolveStructureType(institutionType);
  return MODULE_CATALOG.filter((m) => m.recommendedFor.includes(structureType)).map((m) => m.key);
};

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
  resolveStructureType,
  getRecommendedModules,
};
