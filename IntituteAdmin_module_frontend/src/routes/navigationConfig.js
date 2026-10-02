import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  CheckSquare,
  Calendar,
  Award,
  CreditCard,
  MessageSquare,
  BookOpen,
  Bus,
  Home,
  Package,
  FileCheck,
  BarChart3,
  Settings,
  Briefcase,
  ClipboardList,
  FlaskConical,
  BrainCircuit,
  UserPlus,
  Wallet,
  ShieldAlert,
  HeartPulse,
  UserCheck,
  PartyPopper,
  Images,
  Zap,
  GitBranch
} from 'lucide-react';

export const navigationConfig = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard'
  },
  {
    key: 'setup',
    title: 'Institution Setup',
    icon: Building2,
    children: [
      { key: 'profile', title: 'Institute Profile', path: '/admin/setup/profile' },
      { key: 'module-settings', title: 'Module Settings', path: '/admin/setup/module-settings' },
      { key: 'academic-year', title: 'Academic Year Setup', path: '/admin/setup/academic-year' },
      { key: 'campus', title: 'Campus Setup', path: '/admin/setup/campus' },
      { key: 'department', title: 'Department Setup', path: '/admin/setup/department' },
      { key: 'program', title: 'Program Setup', path: '/admin/setup/program' },
      { key: 'course', title: 'Course / Class Setup', path: '/admin/setup/course' },
      { key: 'semester', title: 'Semester Setup', path: '/admin/setup/semester' },
      { key: 'section', title: 'Section Setup', path: '/admin/setup/section' },
      { key: 'subject', title: 'Subject Setup', path: '/admin/setup/subject' },
      { key: 'batch', title: 'Batch Setup', path: '/admin/setup/batch' },
      { key: 'house', title: 'House / Group Setup', path: '/admin/setup/house' },
      { key: 'affiliated-colleges', title: 'Affiliated Colleges', path: '/admin/setup/affiliated-colleges' }
    ]
  },
  {
    key: 'visitor_management',
    title: 'Visitor / Gate Management',
    icon: UserCheck,
    path: '/admin/setup/visitors'
  },
  {
    key: 'student',
    title: 'Student Management',
    icon: GraduationCap,
    badge: '3,450',
    children: [
      { key: 'admission', title: 'Admission Form', path: '/admin/student/admission' },
      { key: 'bulk-admission', title: 'Bulk Admission Upload', path: '/admin/student/bulk-admission' },
      { key: 'student-list', title: 'Student Directory', path: '/admin/student/list' },
      { key: 'student-profile', title: 'Student Profile', path: '/admin/student/profile' },
      { key: 'tc', title: 'Transfer Certificate (TC)', path: '/admin/student/tc' },
      { key: 'bonafide', title: 'Bonafide Certificate', path: '/admin/student/bonafide' },
      { key: 'id-card', title: 'ID Card Generator', path: '/admin/student/id-card' },
      { key: 'documents', title: 'Document Vault', path: '/admin/student/documents' },
      { key: 'exit', title: 'Withdrawal / Transfer', path: '/admin/student/exit' },
      { key: 'promote', title: 'Promote Students', path: '/admin/student/promote' }
    ]
  },
  {
    key: 'alumni',
    title: 'Alumni Network',
    icon: GraduationCap,
    path: '/admin/student/alumni'
  },
  {
    key: 'discipline',
    title: 'Student Discipline',
    icon: ShieldAlert,
    path: '/admin/student/discipline'
  },
  {
    key: 'health',
    title: 'Health & Medical',
    icon: HeartPulse,
    path: '/admin/student/health'
  },
  {
    key: 'staff',
    title: 'Staff Management',
    icon: Users,
    badge: '285',
    children: [
      { key: 'registration', title: 'Staff Registration', path: '/admin/staff/registration' },
      { key: 'staff-profile-fields', title: 'Staff Form Builder', path: '/admin/staff/form-builder' },
      { key: 'teaching', title: 'Teaching Staff', path: '/admin/staff/teaching' },
      { key: 'non-teaching', title: 'Non-Teaching Staff', path: '/admin/staff/non-teaching' },
      { key: 'staff-profile', title: 'Staff Profile', path: '/admin/staff/profile' },
      { key: 'assignments', title: 'Teacher Assignments', path: '/admin/staff/assignments' },
      { key: 'qualifications', title: 'Qualification Details', path: '/admin/staff/qualifications' },
      { key: 'experience', title: 'Experience Records', path: '/admin/staff/experience' },
      { key: 'salary', title: 'Salary Structure', path: '/admin/staff/salary' },
      { key: 'leave', title: 'Leave Management', path: '/admin/staff/leave' },
      { key: 'staff-attendance', title: 'Staff Attendance', path: '/admin/staff/attendance' },
      { key: 'staff-id', title: 'Staff ID Card', path: '/admin/staff/id-card' },
      { key: 'service-cert', title: 'Service Certificate', path: '/admin/staff/service-cert' }
    ]
  },
  {
    key: 'payroll',
    title: 'Payroll',
    icon: Wallet,
    path: '/admin/staff/payroll'
  },
  {
    key: 'homework',
    title: 'Homework',
    icon: ClipboardList,
    path: '/admin/homework'
  },
  {
    key: 'attendance',
    title: 'Attendance Module',
    icon: CheckSquare,
    children: [
      { key: 'daily', title: 'Daily Attendance', path: '/admin/attendance/daily' },
      { key: 'subject-att', title: 'Subject-wise Attendance', path: '/admin/attendance/subject' },
      { key: 'biometric', title: 'Biometric Sync', path: '/admin/attendance/biometric' },
      { key: 'absent-list', title: 'Absentee List & SMS', path: '/admin/attendance/absentee' },
      { key: 'att-corrections', title: 'Lock & Corrections', path: '/admin/attendance/corrections' },
      { key: 'att-reports', title: 'Attendance Reports', path: '/admin/attendance/reports' }
    ]
  },
  {
    key: 'timetable',
    title: 'Timetable Module',
    icon: Calendar,
    children: [
      { key: 'class-tt', title: 'Class Timetable', path: '/admin/timetable/class' },
      { key: 'teacher-tt', title: 'Teacher Timetable', path: '/admin/timetable/teacher' },
      { key: 'exam-tt', title: 'Exam Schedule TT', path: '/admin/timetable/exam' },
      { key: 'tt-generator', title: 'Timetable Generator UI', path: '/admin/timetable/generator' }
    ]
  },
  {
    key: 'examination',
    title: 'Examination Module',
    icon: Award,
    children: [
      { key: 'exam-setup', title: 'Exam Setup', path: '/admin/examination/setup' },
      { key: 'exam-schedule', title: 'Exam Schedule', path: '/admin/examination/schedule' },
      { key: 'hall-ticket', title: 'Hall Ticket Generator', path: '/admin/examination/hall-ticket' },
      { key: 'marks-entry', title: 'Marks Entry', path: '/admin/examination/marks-entry' },
      { key: 'grade-setup', title: 'Grade Setup', path: '/admin/examination/grade-setup' },
      { key: 'result-publish', title: 'Result Publish', path: '/admin/examination/result-publish' },
      { key: 'marksheet-template', title: 'Marksheet Template', path: '/admin/examination/marksheet' },
      { key: 'rank-list', title: 'Rank List & Analysis', path: '/admin/examination/rank-list' },
      { key: 'progress-report', title: 'Progress Report', path: '/admin/examination/progress-report' }
    ]
  },
  {
    key: 'fee',
    title: 'Fee Management',
    icon: CreditCard,
    badge: 'Important',
    children: [
      { key: 'fee-dashboard', title: 'Fee Dashboard', path: '/admin/fee/dashboard' },
      { key: 'fee-heads-setup', title: 'Fee Heads', path: '/admin/fee/heads' },
      { key: 'fee-structure-builder', title: 'Fee Structure Builder', path: '/admin/fee/structure-builder' },
      { key: 'fee-category', title: 'Fee Category Setup (Legacy)', path: '/admin/fee/category' },
      { key: 'fee-structure', title: 'Fee Structure (Legacy, view only)', path: '/admin/fee/structure' },
      { key: 'student-assignment', title: 'Student Fee Assignment (Legacy, view only)', path: '/admin/fee/assignment' },
      { key: 'bulk-assignment', title: 'Bulk Fee Assignment (Legacy, view only)', path: '/admin/fee/bulk-assignment' },
      { key: 'collect-fee', title: 'Collect Fee — Legacy Assignments', path: '/admin/fee/collect' },
      { key: 'collect-fee-v2', title: 'Collect Fee (POS/UPI)', path: '/admin/fee/collect-v2' },
      { key: 'pending-fees', title: 'Pending Fees List', path: '/admin/fee/pending' },
      { key: 'challan', title: 'Bank Challan Generator', path: '/admin/fee/challan' },
      { key: 'receipt-preview', title: 'Fee Receipt Printable', path: '/admin/fee/receipt' },
      { key: 'installments', title: 'Installment Setup', path: '/admin/fee/installments' },
      { key: 'scholarship', title: 'Scholarship / Concession', path: '/admin/fee/scholarship' },
      { key: 'refund', title: 'Refund Management', path: '/admin/fee/refund' },
      { key: 'fee-reports', title: 'Fee Collection Reports', path: '/admin/fee/reports' },
      { key: 'cash-book', title: 'Cash Book', path: '/admin/fee/cash-book' },
      { key: 'day-book', title: 'Day Book Ledger', path: '/admin/fee/day-book' },
      { key: 'fee-assignment-fields', title: 'Fee Form Builder', path: '/admin/fee/form-builder' }
    ]
  },
  {
    key: 'communication',
    title: 'Communication',
    icon: MessageSquare,
    children: [
      { key: 'announcements', title: 'Announcements', path: '/admin/communication/announcements' },
      { key: 'circulars', title: 'Circulars & Notices', path: '/admin/communication/circulars' },
      { key: 'sms-center', title: 'SMS Center (DLT)', path: '/admin/communication/sms-center' },
      { key: 'scheduled-notifications', title: 'Scheduled Notifications', path: '/admin/communication/scheduled' },
      { key: 'email-center', title: 'Email Broadcast', path: '/admin/communication/email-center' },
      { key: 'whatsapp', title: 'WhatsApp Broadcast', path: '/admin/communication/whatsapp' },
      { key: 'templates', title: 'Message Templates', path: '/admin/communication/templates', badge: 'NEW' },
    ]
  },
  {
    key: 'events_clubs',
    title: 'Events & Clubs',
    icon: PartyPopper,
    children: [
      { key: 'campus-events', title: 'Campus Events', path: '/admin/communication/events' },
      { key: 'clubs', title: 'Clubs & Societies', path: '/admin/communication/clubs' }
    ]
  },
  {
    key: 'grievance_feedback',
    title: 'Grievance & Feedback',
    icon: ShieldAlert,
    children: [
      { key: 'grievances', title: 'Student Grievances', path: '/admin/communication/grievances' },
      { key: 'feedback-summary', title: 'Faculty Feedback Summary', path: '/admin/reports/feedback' }
    ]
  },
  {
    key: 'gallery',
    title: 'Photo Gallery',
    icon: Images,
    path: '/admin/communication/gallery'
  },
  {
    key: 'front_office',
    title: 'Front Office',
    icon: UserPlus,
    path: '/admin/admissions/enquiries'
  },
  {
    key: 'pre_admission',
    title: 'Pre-Admissions',
    icon: FileCheck,
    children: [
      { key: 'pre-admission-list', title: 'Applications', path: '/admin/admissions/pre-admission' },
      { key: 'pre-admission-settings', title: 'Integration Settings', path: '/admin/admissions/pre-admission/settings' },
      { key: 'admission-form-builder', title: 'Admission Form Builder', path: '/admin/admissions/form-builder' }
    ]
  },
  {
    key: 'library',
    title: 'Library Module',
    icon: BookOpen,
    children: [
      { key: 'book-master', title: 'Book Master Directory', path: '/admin/library/books' },
      { key: 'issue-book', title: 'Issue Book', path: '/admin/library/issue' },
      { key: 'return-book', title: 'Return & Renew', path: '/admin/library/return' },
      { key: 'fine-collection', title: 'Fine Collection', path: '/admin/library/fines' },
      { key: 'library-card', title: 'Student Library Card', path: '/admin/library/card' },
      { key: 'library-reports', title: 'Library Reports', path: '/admin/library/reports' },
      { key: 'library-membership-fields', title: 'Library Form Builder', path: '/admin/library/form-builder' }
    ]
  },
  {
    key: 'transport',
    title: 'Transport Module',
    icon: Bus,
    children: [
      { key: 'routes', title: 'Route Management', path: '/admin/transport/routes' },
      { key: 'vehicles', title: 'Vehicle Management', path: '/admin/transport/vehicles' },
      { key: 'drivers', title: 'Driver Management', path: '/admin/transport/drivers' },
      { key: 'student-mapping', title: 'Student Route Mapping', path: '/admin/transport/mapping' },
      { key: 'transport-fee', title: 'Transport Fee Setup', path: '/admin/transport/fee' },
      { key: 'vehicle-att', title: 'Vehicle Attendance', path: '/admin/transport/attendance' },
      { key: 'transport-enrollment-fields', title: 'Transport Form Builder', path: '/admin/transport/form-builder' }
    ]
  },
  {
    key: 'hostel',
    title: 'Hostel Module',
    icon: Home,
    children: [
      { key: 'hostel-setup', title: 'Hostel Setup', path: '/admin/hostel/setup' },
      { key: 'room-allocation', title: 'Room Allocation', path: '/admin/hostel/rooms' },
      { key: 'bed-allocation', title: 'Bed Allocation', path: '/admin/hostel/beds' },
      { key: 'hostel-att', title: 'Hostel Attendance', path: '/admin/hostel/attendance' },
      { key: 'mess-fee', title: 'Mess Fee Management', path: '/admin/hostel/mess-fee' },
      { key: 'visitor-register', title: 'Visitor Register', path: '/admin/hostel/visitors' },
      { key: 'hostel-allocation-fields', title: 'Hostel Form Builder', path: '/admin/hostel/form-builder' }
    ]
  },
  {
    key: 'inventory',
    title: 'Inventory & Assets',
    icon: Package,
    children: [
      { key: 'asset-register', title: 'Asset Register', path: '/admin/inventory/assets' },
      { key: 'lab-equipment', title: 'Lab Equipment', path: '/admin/inventory/lab-equipment' },
      { key: 'computer-lab', title: 'Computer Lab Inventory', path: '/admin/inventory/computer-lab' },
      { key: 'purchase-entry', title: 'Purchase Orders', path: '/admin/inventory/purchase' },
      { key: 'stock-inout', title: 'Stock In / Out', path: '/admin/inventory/stock' },
      { key: 'vendor-mgmt', title: 'Vendor Directory', path: '/admin/inventory/vendors' },
      { key: 'asset-maintenance', title: 'Asset Maintenance', path: '/admin/inventory/maintenance' }
    ]
  },
  {
    key: 'academic_calendar',
    title: 'Academic Calendar',
    icon: Calendar,
    path: '/admin/academic-calendar'
  },
  {
    key: 'expense_management',
    title: 'Expense & Budget',
    icon: Wallet,
    path: '/admin/finance/expenses'
  },
  {
    key: 'hr_recruitment',
    title: 'HR Recruitment',
    icon: UserPlus,
    path: '/admin/staff/recruitment'
  },
  {
    key: 'automation_engine',
    title: 'Event Automation',
    icon: Zap,
    path: '/admin/automation'
  },
  {
    key: 'workflow_engine',
    title: 'Workflow Engine',
    icon: GitBranch,
    path: '/admin/workflows'
  },
  {
    key: 'certificates',
    title: 'Certificates Module',
    icon: FileCheck,
    children: [
      { key: 'cert-format', title: 'Customize Certificate Format', path: '/admin/certificates/format', badge: 'NEW' },
      { key: 'cert-tc', title: 'Transfer Certificate (TC)', path: '/admin/certificates/tc' },
      { key: 'cert-bonafide', title: 'Bonafide Certificate', path: '/admin/certificates/bonafide' },
      { key: 'cert-completion', title: 'Course Completion', path: '/admin/certificates/completion' },
      { key: 'cert-conduct', title: 'Conduct Certificate', path: '/admin/certificates/conduct' },
      { key: 'cert-feepaid', title: 'Fee Paid Certificate', path: '/admin/certificates/feepaid' },
      { key: 'cert-experience', title: 'Experience Certificate', path: '/admin/certificates/experience' },
      { key: 'cert-requests', title: 'Student Requests', path: '/admin/certificates/requests' }
    ]
  },
  {
    key: 'placement',
    title: 'Placement Cell',
    icon: Briefcase,
    children: [
      { key: 'placement-postings', title: 'Job Postings', path: '/admin/placement/postings' }
    ]
  },
  {
    key: 'research',
    title: 'Research & Publications',
    icon: FlaskConical,
    path: '/admin/staff/research'
  },
  {
    key: 'convocation',
    title: 'Convocation & Degrees',
    icon: Award,
    path: '/admin/student/degrees'
  },
  {
    key: 'ai_tutor',
    title: 'AI Study Tutor Content',
    icon: BrainCircuit,
    path: '/admin/staff/ai-tutor-content'
  },
  {
    key: 'reports',
    title: 'Reports Module',
    icon: BarChart3,
    children: [
      { key: 'rep-center', title: 'Report Center (Build Your Own)', path: '/admin/reports/center', badge: 'NEW' },
      { key: 'rep-builder', title: 'Ad-hoc Report Builder', path: '/admin/reports/builder', badge: 'NEW' },
      { key: 'rep-admission', title: 'Admission Report', path: '/admin/reports/admission' },
      { key: 'rep-attendance', title: 'Attendance Report', path: '/admin/reports/attendance' },
      { key: 'rep-attendance-datewise', title: 'Date-wise Attendance Report', path: '/admin/reports/attendance-datewise', badge: 'NEW' },
      { key: 'rep-attendance-consolidated', title: 'Consolidated Attendance Report', path: '/admin/reports/attendance-consolidated', badge: 'NEW' },
      { key: 'rep-fee', title: 'Fee Collection Report', path: '/admin/reports/fee-collection' },
      { key: 'rep-outstanding', title: 'Outstanding Fee Report', path: '/admin/reports/outstanding' },
      { key: 'rep-exam', title: 'Exam Result Report', path: '/admin/reports/exam-results' },
      { key: 'rep-marks-consolidated', title: 'Complete Marks Report', path: '/admin/reports/marks-consolidated', badge: 'NEW' },
      { key: 'rep-staff', title: 'Staff Report', path: '/admin/reports/staff' },
      { key: 'rep-transport', title: 'Transport Report', path: '/admin/reports/transport' },
      { key: 'rep-library', title: 'Library Report', path: '/admin/reports/library' },
      { key: 'rep-feedback', title: 'Faculty Feedback Summary', path: '/admin/reports/feedback' }
    ]
  },
  {
    key: 'settings',
    title: 'Settings Module',
    icon: Settings,
    children: [
      { key: 'user-roles', title: 'User Roles', path: '/admin/settings/roles' },
      { key: 'permissions', title: 'Permissions Matrix', path: '/admin/settings/permissions' },
      { key: 'sms-settings', title: 'SMS DLT Settings', path: '/admin/settings/sms' },
      { key: 'email-settings', title: 'Email SMTP Settings', path: '/admin/settings/email' },
      { key: 'payment-gateway', title: 'Payment Gateway (Razorpay/Easebuzz)', path: '/admin/settings/gateway' },
      { key: 'theme-settings', title: 'Portal Theme Settings', path: '/admin/settings/theme' },
      { key: 'custom-lists', title: 'Custom Lists', path: '/admin/settings/custom-lists' },
      { key: 'backup-restore', title: 'Backup & Restore', path: '/admin/settings/backup' },
      { key: 'audit-logs', title: 'Audit Trail Logs', path: '/admin/settings/audit-logs' }
    ]
  }
];
