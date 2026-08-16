import {
  LayoutDashboard,
  GraduationCap,
  FileCheck,
  CreditCard,
  Building,
  Wrench,
  Briefcase,
  Bot,
  Folder,
  MessageSquare,
  Calendar as CalendarIcon,
  User,
  Settings,
  HelpCircle
} from 'lucide-react';

export const navigationConfig = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/student/dashboard'
  },
  {
    key: 'academics',
    title: 'My Academics',
    icon: GraduationCap,
    children: [
      { key: 'acad-overview', title: 'Academic Overview', path: '/student/academics' },
      { key: 'subjects', title: 'My Subjects', path: '/student/subjects' },
      { key: 'attendance', title: 'Attendance', path: '/student/attendance' },
      { key: 'timetable', title: 'Timetable', path: '/student/timetable' },
      { key: 'assignments', title: 'Assignments', path: '/student/assignments', badge: '1 Due' },
      { key: 'materials', title: 'Study Materials', path: '/student/materials' },
      { key: 'question-bank', title: 'Question Bank', path: '/student/question-bank' },
      { key: 'practice-tests', title: 'Practice Tests', path: '/student/practice-tests' }
    ]
  },
  {
    key: 'examinations',
    title: 'Examinations',
    icon: FileCheck,
    children: [
      { key: 'exam-schedule', title: 'Exam Schedule', path: '/student/exams' },
      { key: 'results', title: 'Semester Results', path: '/student/results' },
      { key: 'performance', title: 'Performance Analytics', path: '/student/performance' }
    ]
  },
  {
    key: 'fees',
    title: 'Fees & Payments',
    icon: CreditCard,
    children: [
      { key: 'fee-overview', title: 'Fee Overview', path: '/student/fees', badge: 'Pending' },
      { key: 'pay-fees', title: 'Pay Fees Online', path: '/student/fees/pay' },
      { key: 'receipts', title: 'Fee Receipts', path: '/student/fees/receipts' },
      { key: 'scholarships', title: 'Scholarships', path: '/student/scholarships' }
    ]
  },
  {
    key: 'campus',
    title: 'Campus Life',
    icon: Building,
    children: [
      { key: 'announcements', title: 'Announcements', path: '/student/announcements' },
      { key: 'events', title: 'Campus Events', path: '/student/events' },
      { key: 'clubs', title: 'Clubs & Societies', path: '/student/clubs' },
      { key: 'library', title: 'Digital Library', path: '/student/library' },
      { key: 'transport', title: 'Transport', path: '/student/transport' },
      { key: 'hostel', title: 'Hostel & Mess', path: '/student/hostel' }
    ]
  },
  {
    key: 'services',
    title: 'Campus Services',
    icon: Wrench,
    children: [
      { key: 'certificates', title: 'Certificates', path: '/student/certificates' },
      { key: 'requests', title: 'Service Requests', path: '/student/services' },
      { key: 'grievances', title: 'Grievances & Complaints', path: '/student/grievances' },
      { key: 'appointments', title: 'Counselling Appointments', path: '/student/appointments' },
      { key: 'feedback', title: 'Faculty Feedback', path: '/student/feedback' }
    ]
  },
  {
    key: 'career',
    title: 'Career & Placement',
    icon: Briefcase,
    children: [
      { key: 'resume', title: 'Resume Builder', path: '/student/resume' },
      { key: 'internships', title: 'Internships', path: '/student/internships' },
      { key: 'placements', title: 'Placements', path: '/student/placements' },
      { key: 'achievements', title: 'Achievements Portfolio', path: '/student/achievements' }
    ]
  },
  {
    key: 'ai',
    title: 'AI Assistant',
    icon: Bot,
    badge: 'AI Powered',
    children: [
      { key: 'ai-assistant', title: 'AI Study Assistant', path: '/student/ai' },
      { key: 'ai-plan', title: 'AI Study Plan', path: '/student/ai/study-plan' },
      { key: 'study-progress', title: 'Study Progress Tracker', path: '/student/study-progress' }
    ]
  },
  {
    key: 'documents',
    title: 'Documents & ID',
    icon: Folder,
    children: [
      { key: 'my-documents', title: 'My Document Vault', path: '/student/documents' },
      { key: 'digital-id', title: 'Digital QR ID Card', path: '/student/id-card' }
    ]
  },
  {
    key: 'communication',
    title: 'Communication',
    icon: MessageSquare,
    children: [
      { key: 'messages', title: 'Teacher Chat Messages', path: '/student/messages' },
      { key: 'notifications', title: 'Notification Center', path: '/student/notifications' }
    ]
  },
  {
    key: 'calendar',
    title: 'Academic Calendar',
    icon: CalendarIcon,
    path: '/student/calendar'
  },
  {
    key: 'profile',
    title: 'My Profile',
    icon: User,
    path: '/student/profile'
  },
  {
    key: 'settings',
    title: 'Settings',
    icon: Settings,
    path: '/student/settings'
  },
  {
    key: 'help',
    title: 'Help & Support',
    icon: HelpCircle,
    path: '/student/help'
  }
];
