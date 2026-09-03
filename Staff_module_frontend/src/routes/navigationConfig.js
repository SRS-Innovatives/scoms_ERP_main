import {
  LayoutDashboard,
  UserCheck,
  Users,
  CheckSquare,
  FileText,
  FolderDown,
  GraduationCap,
  TrendingUp,
  Calendar,
  MessageSquare,
  Clock,
  Award,
  BookOpen,
  FlaskConical,
  BarChart3,
  Printer,
  ShieldCheck
} from 'lucide-react';

export const navigationConfig = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/staff/dashboard'
  },
  {
    key: 'profile',
    title: 'My Profile',
    icon: UserCheck,
    children: [
      { key: 'profile-main', title: 'View Profile', path: '/staff/profile' },
      { key: 'profile-edit', title: 'Edit Profile', path: '/staff/profile/edit' },
      { key: 'profile-qual', title: 'Qualifications', path: '/staff/profile/qualification' },
      { key: 'profile-exp', title: 'Experience Details', path: '/staff/profile/experience' },
      { key: 'profile-docs', title: 'Documents Upload', path: '/staff/profile/documents' },
      { key: 'profile-bank', title: 'Bank Details', path: '/staff/profile/bank' },
      { key: 'profile-emerg', title: 'Emergency Contacts', path: '/staff/profile/emergency' },
      { key: 'profile-pwd', title: 'Change Password', path: '/staff/profile/password' }
    ]
  },
  {
    key: 'classes',
    title: 'My Classes',
    icon: Users,
    children: [
      { key: 'assigned-classes', title: 'Assigned Classes', path: '/staff/classes' },
      { key: 'class-details', title: 'Class Overview', path: '/staff/classes/details' },
      { key: 'student-list', title: 'Student Directory', path: '/staff/classes/students' },
      { key: 'subject-mapping', title: 'Subject Mapping', path: '/staff/classes/mapping' },
      { key: 'class-strength', title: 'Class Strength Summary', path: '/staff/classes/strength' }
    ]
  },
  {
    key: 'attendance',
    title: 'Attendance Module',
    icon: CheckSquare,
    badge: 'Pending',
    children: [
      { key: 'take-attendance', title: 'Take Attendance', path: '/staff/attendance/take' },
      { key: 'edit-attendance', title: 'Edit Attendance', path: '/staff/attendance/edit' },
      { key: 'subject-attendance', title: 'Subject-wise Attendance', path: '/staff/attendance/subject' },
      { key: 'monthly-attendance', title: 'Monthly Attendance', path: '/staff/attendance/monthly' },
      { key: 'absent-students', title: 'Absent Student List', path: '/staff/attendance/absent' },
      { key: 'attendance-reports', title: 'Attendance Reports', path: '/staff/attendance/reports' }
    ]
  },
  {
    key: 'homework',
    title: 'Assignments & Homework',
    icon: FileText,
    children: [
      { key: 'create-assignment', title: 'Create Assignment', path: '/staff/assignments/create' },
      { key: 'assignment-list', title: 'Assignment List', path: '/staff/assignments/list' },
      { key: 'assignment-details', title: 'Assignment Details', path: '/staff/assignments/details' },
      { key: 'student-submissions', title: 'Student Submissions', path: '/staff/assignments/submissions' },
      { key: 'evaluate-assignment', title: 'Evaluate Homework', path: '/staff/assignments/evaluate' },
      { key: 'assignment-analytics', title: 'Assignment Analytics', path: '/staff/assignments/analytics' }
    ]
  },
  {
    key: 'materials',
    title: 'Study Materials',
    icon: FolderDown,
    children: [
      { key: 'upload-material', title: 'Upload Material', path: '/staff/materials/upload' },
      { key: 'material-library', title: 'Material Library', path: '/staff/materials/library' },
      { key: 'subject-materials', title: 'Subject Materials', path: '/staff/materials/subject' },
      { key: 'download-history', title: 'Download History', path: '/staff/materials/history' }
    ]
  },
  {
    key: 'examination',
    title: 'Examinations & Question Paper',
    icon: GraduationCap,
    children: [
      { key: 'exam-duties', title: 'My Exam Duties', path: '/staff/exams/duties' },
      { key: 'question-bank', title: 'Question Bank', path: '/staff/exams/bank' },
      { key: 'create-question', title: 'Create Question', path: '/staff/exams/create-q' },
      { key: 'import-questions', title: 'Import Questions', path: '/staff/exams/import-q' },
      { key: 'paper-generator', title: 'Question Paper Generator', path: '/staff/exams/generator' },
      { key: 'preview-paper', title: 'Preview Question Paper', path: '/staff/exams/preview' },
      { key: 'marks-entry', title: 'Marks Entry', path: '/staff/exams/marks-entry' },
      { key: 'internal-assessment', title: 'Internal Assessment', path: '/staff/exams/internal' },
      { key: 'publish-marks', title: 'Publish Marks', path: '/staff/exams/publish' },
      { key: 'result-analysis', title: 'Result Analysis', path: '/staff/exams/analysis' }
    ]
  },
  {
    key: 'performance',
    title: 'Student Performance',
    icon: TrendingUp,
    children: [
      { key: 'student-progress', title: 'Student Progress', path: '/staff/performance/progress' },
      { key: 'subject-perf', title: 'Subject Performance', path: '/staff/performance/subject' },
      { key: 'weak-students', title: 'Weak Students', path: '/staff/performance/weak' },
      { key: 'top-performers', title: 'Top Performers', path: '/staff/performance/top' },
      { key: 'marks-vs-attd', title: 'Attendance vs Marks', path: '/staff/performance/marks-vs-attendance' },
      { key: 'parent-notes', title: 'Parent Meeting Notes', path: '/staff/performance/parent-notes' }
    ]
  },
  {
    key: 'timetable',
    title: 'My Timetable',
    icon: Calendar,
    children: [
      { key: 'my-timetable', title: 'My Full Timetable', path: '/staff/timetable/my' },
      { key: 'daily-timetable', title: 'Daily Schedule', path: '/staff/timetable/daily' },
      { key: 'weekly-timetable', title: 'Weekly Schedule Grid', path: '/staff/timetable/weekly' },
      { key: 'substitute-classes', title: 'Substitute Classes', path: '/staff/timetable/substitute' },
      { key: 'free-periods', title: 'Free Periods', path: '/staff/timetable/free' }
    ]
  },
  {
    key: 'communication',
    title: 'Communication & Notices',
    icon: MessageSquare,
    children: [
      { key: 'send-announcement', title: 'Send Announcement', path: '/staff/communication/announcements' },
      { key: 'class-notice', title: 'Class Notice Board', path: '/staff/communication/notices' },
      { key: 'parent-message', title: 'Parent Messaging', path: '/staff/communication/parent-messages' },
      { key: 'student-chat', title: 'Student Chat', path: '/staff/communication/student-chat' },
      { key: 'appointment-requests', title: 'Appointment Requests', path: '/staff/appointments' },
      { key: 'sms-center', title: 'SMS Broadcast Center', path: '/staff/communication/sms' },
      { key: 'email-center', title: 'Email Broadcast Center', path: '/staff/communication/email' },
      { key: 'message-history', title: 'Message History', path: '/staff/communication/history' }
    ]
  },
  {
    key: 'leave',
    title: 'Leave Management',
    icon: Clock,
    children: [
      { key: 'apply-leave', title: 'Apply Leave', path: '/staff/leave/apply' },
      { key: 'leave-history', title: 'Leave History', path: '/staff/leave/history' },
      { key: 'leave-balance', title: 'Leave Balance', path: '/staff/leave/balance' },
      { key: 'leave-status', title: 'Leave Approval Status', path: '/staff/leave/status' },
      { key: 'student-leave-approvals', title: 'Student Leave Approvals', path: '/staff/leave/student-approvals' }
    ]
  },
  {
    key: 'events',
    title: 'Events & Co-Curricular',
    icon: Award,
    children: [
      { key: 'event-duties', title: 'Event Duties', path: '/staff/events/duties' },
      { key: 'club-activities', title: 'Club Activities', path: '/staff/events/clubs' },
      { key: 'competitions', title: 'Competition Management', path: '/staff/events/competitions' },
      { key: 'event-attd', title: 'Event Attendance', path: '/staff/events/attendance' },
      { key: 'certificates', title: 'Certificate Entry', path: '/staff/events/certificates' }
    ]
  },
  {
    key: 'self-attendance',
    title: 'Staff Self Attendance',
    icon: ShieldCheck,
    children: [
      { key: 'my-attendance', title: 'My Attendance Calendar', path: '/staff/self-attendance/my' },
      { key: 'monthly-self', title: 'Monthly Heatmap', path: '/staff/self-attendance/monthly' },
      { key: 'late-entry', title: 'Late Entry Logs', path: '/staff/self-attendance/late' },
      { key: 'self-summary', title: 'Attendance Summary', path: '/staff/self-attendance/summary' }
    ]
  },
  {
    key: 'library',
    title: 'Library Staff',
    icon: BookOpen,
    children: [
      { key: 'book-issue', title: 'Book Issue', path: '/staff/library/issue' },
      { key: 'book-return', title: 'Book Return', path: '/staff/library/return' },
      { key: 'fine-collection', title: 'Fine Collection', path: '/staff/library/fine' },
      { key: 'student-lib-status', title: 'Student Library Register', path: '/staff/library/status' }
    ]
  },
  {
    key: 'lab',
    title: 'Lab Staff & Assets',
    icon: FlaskConical,
    children: [
      { key: 'lab-inventory', title: 'Lab Inventory', path: '/staff/lab/inventory' },
      { key: 'equipment-issue', title: 'Equipment Issue', path: '/staff/lab/issue' },
      { key: 'equipment-return', title: 'Equipment Return', path: '/staff/lab/return' },
      { key: 'lab-usage', title: 'Lab Usage Register', path: '/staff/lab/usage' },
      { key: 'lab-maintenance', title: 'Maintenance Register', path: '/staff/lab/maintenance' }
    ]
  },
  {
    key: 'reports',
    title: 'Reports & Analytics',
    icon: BarChart3,
    children: [
      { key: 'rep-attd', title: 'Attendance Taken Report', path: '/staff/reports/attendance' },
      { key: 'rep-asn', title: 'Assignment Report', path: '/staff/reports/assignments' },
      { key: 'rep-marks', title: 'Marks Entry Report', path: '/staff/reports/marks' },
      { key: 'rep-perf', title: 'Student Performance Report', path: '/staff/reports/performance' },
      { key: 'rep-workload', title: 'Workload Analysis Report', path: '/staff/reports/workload' },
      { key: 'rep-leave', title: 'Staff Leave Report', path: '/staff/reports/leave' }
    ]
  },
  {
    key: 'print',
    title: 'Printable Templates',
    icon: Printer,
    children: [
      { key: 'print-register', title: 'Attendance Register (A4)', path: '/staff/print/register' },
      { key: 'print-eval', title: 'Assignment Evaluation Sheet', path: '/staff/print/evaluation' },
      { key: 'print-marksheet', title: 'Mark Entry Sheet', path: '/staff/print/marksheet' },
      { key: 'print-progress', title: 'Student Progress Report Card', path: '/staff/print/progress' },
      { key: 'print-parent', title: 'Parent Meeting Record Sheet', path: '/staff/print/parent-record' },
      { key: 'print-duty', title: 'Duty Allotment Letter', path: '/staff/print/duty-letter' }
    ]
  }
];
