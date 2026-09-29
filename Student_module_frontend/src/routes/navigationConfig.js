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
      { key: 'subjects', title: 'My Subjects', path: '/student/subjects' },
      { key: 'attendance', title: 'Attendance', path: '/student/attendance', module: 'attendance' },
      { key: 'timetable', title: 'Timetable', path: '/student/timetable', module: 'timetable' },
      { key: 'assignments', title: 'Assignments', path: '/student/assignments', module: 'homework' },
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
      { key: 'exam-schedule', title: 'Exam Schedule', path: '/student/exams', module: 'examination' },
      { key: 'results', title: 'Results & Performance', path: '/student/results', module: 'examination' }
    ]
  },
  {
    key: 'fees',
    title: 'Fees & Scholarships',
    icon: CreditCard,
    module: 'fee',
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
      { key: 'announcements', title: 'Announcements', path: '/student/announcements', module: 'communication' },
      { key: 'events', title: 'Campus Events', path: '/student/events', module: 'events_clubs' },
      { key: 'clubs', title: 'Clubs & Societies', path: '/student/clubs', module: 'events_clubs' },
      { key: 'library', title: 'Digital Library', path: '/student/library', module: 'library' },
      { key: 'transport', title: 'Transport', path: '/student/transport', module: 'transport' },
      { key: 'hostel', title: 'Hostel & Mess', path: '/student/hostel', module: 'hostel' },
      { key: 'gallery', title: 'Photo Gallery', path: '/student/gallery', module: 'gallery' }
    ]
  },
  {
    key: 'services',
    title: 'Campus Services',
    icon: Wrench,
    children: [
      { key: 'certificates', title: 'Certificates & Documents', path: '/student/certificates', module: 'certificates' },
      { key: 'grievances', title: 'Grievances & Complaints', path: '/student/grievances', module: 'grievance_feedback' },
      { key: 'appointments', title: 'Counselling Appointments', path: '/student/appointments', module: 'counselling' },
      { key: 'feedback', title: 'Faculty Feedback', path: '/student/feedback', module: 'grievance_feedback' }
    ]
  },
  {
    key: 'career',
    title: 'Career & Placement',
    icon: Briefcase,
    children: [
      { key: 'resume', title: 'Resume Builder', path: '/student/resume', module: 'career_portfolio' },
      { key: 'internships', title: 'Internships', path: '/student/internships', module: 'placement' },
      { key: 'placements', title: 'Placements', path: '/student/placements', module: 'placement' },
      { key: 'my-applications', title: 'My Applications', path: '/student/applications', module: 'placement' },
      { key: 'achievements', title: 'Achievements Portfolio', path: '/student/achievements', module: 'career_portfolio' }
    ]
  },
  {
    key: 'ai',
    title: 'AI Study Tools',
    icon: Bot,
    badge: 'AI Powered',
    children: [
      { key: 'ai-assistant', title: 'AI Study Assistant', path: '/student/ai', module: 'ai_tutor' },
      { key: 'ai-plan', title: 'AI Study Plan', path: '/student/ai/study-plan' }
    ]
  },
  {
    key: 'documents',
    title: 'Documents & ID',
    icon: Folder,
    children: [
      { key: 'digital-id', title: 'Digital QR ID Card', path: '/student/id-card' },
      { key: 'my-degree', title: 'My Degree', path: '/student/degree', module: 'convocation' }
    ]
  },
  {
    key: 'communication',
    title: 'Messages',
    icon: MessageSquare,
    path: '/student/messages',
    module: 'messaging'
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
