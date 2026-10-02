import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Dashboard
import StaffDashboardPage from '../pages/dashboard/StaffDashboardPage';

// Profile
import ProfilePage from '../pages/profile/ProfilePage';
import EditProfilePage from '../pages/profile/EditProfilePage';
import QualificationDetailsPage from '../pages/profile/QualificationDetailsPage';
import ExperienceDetailsPage from '../pages/profile/ExperienceDetailsPage';
import DocumentsUploadPage from '../pages/profile/DocumentsUploadPage';
import BankDetailsPage from '../pages/profile/BankDetailsPage';
import EmergencyContactPage from '../pages/profile/EmergencyContactPage';
import PasswordChangePage from '../pages/profile/PasswordChangePage';

// Classes
import AssignedClassesPage from '../pages/classes/AssignedClassesPage';
import ClassDetailsPage from '../pages/classes/ClassDetailsPage';
import StudentListPage from '../pages/classes/StudentListPage';
import SubjectMappingPage from '../pages/classes/SubjectMappingPage';
import ClassStrengthPage from '../pages/classes/ClassStrengthPage';

// Attendance
import TakeAttendancePage from '../pages/attendance/TakeAttendancePage';
import EditAttendancePage from '../pages/attendance/EditAttendancePage';
import AttendanceCorrectionsPage from '../pages/attendance/AttendanceCorrectionsPage';
import SubjectAttendancePage from '../pages/attendance/SubjectAttendancePage';
import MonthlyAttendancePage from '../pages/attendance/MonthlyAttendancePage';
import AbsentStudentsPage from '../pages/attendance/AbsentStudentsPage';
import AttendanceReportsPage from '../pages/attendance/AttendanceReportsPage';

// Assignments
import CreateAssignmentPage from '../pages/assignments/CreateAssignmentPage';
import MyPublicationsPage from '../pages/research/MyPublicationsPage';
import AssignmentListPage from '../pages/assignments/AssignmentListPage';
import AssignmentDetailsPage from '../pages/assignments/AssignmentDetailsPage';
import StudentSubmissionsPage from '../pages/assignments/StudentSubmissionsPage';
import EvaluateAssignmentPage from '../pages/assignments/EvaluateAssignmentPage';
import AssignmentAnalyticsPage from '../pages/assignments/AssignmentAnalyticsPage';

// Study Materials
import UploadMaterialPage from '../pages/materials/UploadMaterialPage';
import MaterialLibraryPage from '../pages/materials/MaterialLibraryPage';
import SubjectMaterialsPage from '../pages/materials/SubjectMaterialsPage';
import DownloadHistoryPage from '../pages/materials/DownloadHistoryPage';

// Examinations
import MyExamDutiesPage from '../pages/examination/MyExamDutiesPage';
import QuestionBankPage from '../pages/examination/QuestionBankPage';
import CreateQuestionPage from '../pages/examination/CreateQuestionPage';
import ImportQuestionsPage from '../pages/examination/ImportQuestionsPage';
import QuestionPaperGeneratorPage from '../pages/examination/QuestionPaperGeneratorPage';
import PreviewQuestionPaperPage from '../pages/examination/PreviewQuestionPaperPage';
import MarksEntryPage from '../pages/examination/MarksEntryPage';
import InternalAssessmentPage from '../pages/examination/InternalAssessmentPage';
import PublishMarksPage from '../pages/examination/PublishMarksPage';
import ResultAnalysisPage from '../pages/examination/ResultAnalysisPage';

// Performance
import StudentProgressPage from '../pages/performance/StudentProgressPage';
import SubjectPerformancePage from '../pages/performance/SubjectPerformancePage';
import WeakStudentsPage from '../pages/performance/WeakStudentsPage';
import TopPerformersPage from '../pages/performance/TopPerformersPage';
import AttendanceVsMarksPage from '../pages/performance/AttendanceVsMarksPage';
import ParentMeetingNotesPage from '../pages/performance/ParentMeetingNotesPage';
import AchievementEntryPage from '../pages/performance/AchievementEntryPage';
import GalleryPage from '../pages/communication/GalleryPage';

// Timetable
import MyTimetablePage from '../pages/timetable/MyTimetablePage';
import DailyTimetablePage from '../pages/timetable/DailyTimetablePage';
import WeeklyTimetablePage from '../pages/timetable/WeeklyTimetablePage';
import SubstituteClassesPage from '../pages/timetable/SubstituteClassesPage';
import FreePeriodsPage from '../pages/timetable/FreePeriodsPage';

// Communication
import SendAnnouncementPage from '../pages/communication/SendAnnouncementPage';
import ClassNoticePage from '../pages/communication/ClassNoticePage';
import ParentMessagePage from '../pages/communication/ParentMessagePage';
import StudentChatPage from '../pages/communication/StudentChatPage';
import AppointmentRequestsPage from '../pages/appointments/AppointmentRequestsPage';
import SmsCenterPage from '../pages/communication/SmsCenterPage';
import EmailCenterPage from '../pages/communication/EmailCenterPage';
import MessageHistoryPage from '../pages/communication/MessageHistoryPage';

// Leave
import ApplyLeavePage from '../pages/leave/ApplyLeavePage';
import LeaveHistoryPage from '../pages/leave/LeaveHistoryPage';
import LeaveBalancePage from '../pages/leave/LeaveBalancePage';
import LeaveApprovalStatusPage from '../pages/leave/LeaveApprovalStatusPage';
import StudentLeaveApprovalPage from '../pages/leave/StudentLeaveApprovalPage';

// Events
import EventDutiesPage from '../pages/events/EventDutiesPage';
import AcademicCalendarPage from '../pages/calendar/AcademicCalendarPage';
import ClubActivitiesPage from '../pages/events/ClubActivitiesPage';
import CompetitionManagementPage from '../pages/events/CompetitionManagementPage';
import EventAttendancePage from '../pages/events/EventAttendancePage';
import CertificateEntryPage from '../pages/events/CertificateEntryPage';

// Self Attendance
import MyStaffAttendancePage from '../pages/selfAttendance/MyStaffAttendancePage';
import MonthlyStaffAttendancePage from '../pages/selfAttendance/MonthlyStaffAttendancePage';
import LateEntryPage from '../pages/selfAttendance/LateEntryPage';
import StaffAttendanceSummaryPage from '../pages/selfAttendance/StaffAttendanceSummaryPage';

// Library Staff
import BookIssuePage from '../pages/library/BookIssuePage';
import BookReturnPage from '../pages/library/BookReturnPage';
import FineCollectionPage from '../pages/library/FineCollectionPage';
import StudentLibraryStatusPage from '../pages/library/StudentLibraryStatusPage';

// Lab Staff
import LabInventoryPage from '../pages/lab/LabInventoryPage';
import EquipmentIssuePage from '../pages/lab/EquipmentIssuePage';
import EquipmentReturnPage from '../pages/lab/EquipmentReturnPage';
import LabUsageRegisterPage from '../pages/lab/LabUsageRegisterPage';
import LabMaintenanceRegisterPage from '../pages/lab/LabMaintenanceRegisterPage';

// Reports
import AttendanceReportPage from '../pages/reports/AttendanceReportPage';
import AssignmentReportPage from '../pages/reports/AssignmentReportPage';
import MarksEntryReportPage from '../pages/reports/MarksEntryReportPage';
import StudentPerformanceReportPage from '../pages/reports/StudentPerformanceReportPage';
import WorkloadReportPage from '../pages/reports/WorkloadReportPage';
import LeaveReportPage from '../pages/reports/LeaveReportPage';

// Print
import PrintAttendanceRegister from '../pages/print/PrintAttendanceRegister';
import PrintAssignmentEvaluation from '../pages/print/PrintAssignmentEvaluation';
import PrintMarkEntrySheet from '../pages/print/PrintMarkEntrySheet';
import PrintStudentProgressReport from '../pages/print/PrintStudentProgressReport';
import PrintParentMeetingRecord from '../pages/print/PrintParentMeetingRecord';
import PrintDutyAllotmentLetter from '../pages/print/PrintDutyAllotmentLetter';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// Role Desks (Accountant / Transport Manager / Hostel Warden / Placement Officer / Exam Admin)
import FeeCollectionDeskPage from '../pages/finance/FeeCollectionDeskPage';
import ExpenseLogPage from '../pages/finance/ExpenseLogPage';
import TransportDeskPage from '../pages/transport/TransportDeskPage';
import HostelDeskPage from '../pages/hostel/HostelDeskPage';
import PlacementDeskPage from '../pages/placement/PlacementDeskPage';
import ExamSetupPage from '../pages/exams/ExamSetupPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/staff/login" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/staff/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />

      {/* Staff Layout Routes */}
      <Route path="/staff/*" element={
        <ProtectedRoute>
        <MainLayout>
          <Routes>
            <Route path="dashboard" element={<StaffDashboardPage />} />

            {/* Profile */}
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/edit" element={<EditProfilePage />} />
            <Route path="profile/qualification" element={<QualificationDetailsPage />} />
            <Route path="profile/experience" element={<ExperienceDetailsPage />} />
            <Route path="profile/documents" element={<DocumentsUploadPage />} />
            <Route path="profile/bank" element={<BankDetailsPage />} />
            <Route path="profile/emergency" element={<EmergencyContactPage />} />
            <Route path="profile/password" element={<PasswordChangePage />} />

            {/* Classes */}
            <Route path="classes" element={<AssignedClassesPage />} />
            <Route path="classes/details" element={<ClassDetailsPage />} />
            <Route path="classes/students" element={<StudentListPage />} />
            <Route path="classes/mapping" element={<SubjectMappingPage />} />
            <Route path="classes/strength" element={<ClassStrengthPage />} />

            {/* Attendance */}
            <Route path="attendance/take" element={<TakeAttendancePage />} />
            <Route path="attendance/edit" element={<EditAttendancePage />} />
            <Route path="attendance/corrections" element={<AttendanceCorrectionsPage />} />
            <Route path="attendance/subject" element={<SubjectAttendancePage />} />
            <Route path="attendance/monthly" element={<MonthlyAttendancePage />} />
            <Route path="attendance/absent" element={<AbsentStudentsPage />} />
            <Route path="attendance/reports" element={<AttendanceReportsPage />} />

            {/* Assignments */}
            <Route path="assignments/create" element={<CreateAssignmentPage />} />
            <Route path="research" element={<MyPublicationsPage />} />
            <Route path="assignments/list" element={<AssignmentListPage />} />
            <Route path="assignments/details" element={<AssignmentDetailsPage />} />
            <Route path="assignments/submissions" element={<StudentSubmissionsPage />} />
            <Route path="assignments/evaluate" element={<EvaluateAssignmentPage />} />
            <Route path="assignments/analytics" element={<AssignmentAnalyticsPage />} />

            {/* Study Materials */}
            <Route path="materials/upload" element={<UploadMaterialPage />} />
            <Route path="materials/library" element={<MaterialLibraryPage />} />
            <Route path="materials/subject" element={<SubjectMaterialsPage />} />
            <Route path="materials/history" element={<DownloadHistoryPage />} />

            {/* Examinations */}
            <Route path="exams/duties" element={<MyExamDutiesPage />} />
            <Route path="exams/bank" element={<QuestionBankPage />} />
            <Route path="exams/create-q" element={<CreateQuestionPage />} />
            <Route path="exams/import-q" element={<ImportQuestionsPage />} />
            <Route path="exams/generator" element={<QuestionPaperGeneratorPage />} />
            <Route path="exams/preview" element={<PreviewQuestionPaperPage />} />
            <Route path="exams/marks-entry" element={<MarksEntryPage />} />
            <Route path="exams/internal" element={<InternalAssessmentPage />} />
            <Route path="exams/publish" element={<PublishMarksPage />} />
            <Route path="exams/analysis" element={<ResultAnalysisPage />} />

            {/* Performance */}
            <Route path="performance/progress" element={<StudentProgressPage />} />
            <Route path="performance/subject" element={<SubjectPerformancePage />} />
            <Route path="performance/weak" element={<WeakStudentsPage />} />
            <Route path="performance/top" element={<TopPerformersPage />} />
            <Route path="performance/marks-vs-attendance" element={<AttendanceVsMarksPage />} />
            <Route path="performance/parent-notes" element={<ParentMeetingNotesPage />} />
            <Route path="performance/achievements" element={<AchievementEntryPage />} />
            <Route path="gallery" element={<GalleryPage />} />

            {/* Timetable */}
            <Route path="timetable/my" element={<MyTimetablePage />} />
            <Route path="timetable/daily" element={<DailyTimetablePage />} />
            <Route path="timetable/weekly" element={<WeeklyTimetablePage />} />
            <Route path="timetable/substitute" element={<SubstituteClassesPage />} />
            <Route path="timetable/free" element={<FreePeriodsPage />} />

            {/* Communication */}
            <Route path="communication/announcements" element={<SendAnnouncementPage />} />
            <Route path="communication/notices" element={<ClassNoticePage />} />
            <Route path="communication/parent-messages" element={<ParentMessagePage />} />
            <Route path="communication/student-chat" element={<StudentChatPage />} />
            <Route path="appointments" element={<AppointmentRequestsPage />} />
            <Route path="communication/sms" element={<SmsCenterPage />} />
            <Route path="communication/email" element={<EmailCenterPage />} />
            <Route path="communication/history" element={<MessageHistoryPage />} />

            {/* Leave */}
            <Route path="leave/apply" element={<ApplyLeavePage />} />
            <Route path="leave/history" element={<LeaveHistoryPage />} />
            <Route path="leave/balance" element={<LeaveBalancePage />} />
            <Route path="leave/status" element={<LeaveApprovalStatusPage />} />
            <Route path="leave/student-approvals" element={<StudentLeaveApprovalPage />} />

            {/* Events */}
            <Route path="events/duties" element={<EventDutiesPage />} />
            <Route path="academic-calendar" element={<AcademicCalendarPage />} />
            <Route path="events/clubs" element={<ClubActivitiesPage />} />
            <Route path="events/competitions" element={<CompetitionManagementPage />} />
            <Route path="events/attendance" element={<EventAttendancePage />} />
            <Route path="events/certificates" element={<CertificateEntryPage />} />

            {/* Staff Self Attendance */}
            <Route path="self-attendance/my" element={<MyStaffAttendancePage />} />
            <Route path="self-attendance/monthly" element={<MonthlyStaffAttendancePage />} />
            <Route path="self-attendance/late" element={<LateEntryPage />} />
            <Route path="self-attendance/summary" element={<StaffAttendanceSummaryPage />} />

            {/* Library Staff */}
            <Route path="library/issue" element={<BookIssuePage />} />
            <Route path="library/return" element={<BookReturnPage />} />
            <Route path="library/fine" element={<FineCollectionPage />} />
            <Route path="library/status" element={<StudentLibraryStatusPage />} />

            {/* Lab Staff */}
            <Route path="lab/inventory" element={<LabInventoryPage />} />
            <Route path="lab/issue" element={<EquipmentIssuePage />} />
            <Route path="lab/return" element={<EquipmentReturnPage />} />
            <Route path="lab/usage" element={<LabUsageRegisterPage />} />
            <Route path="lab/maintenance" element={<LabMaintenanceRegisterPage />} />

            {/* Reports */}
            <Route path="reports/attendance" element={<AttendanceReportPage />} />
            <Route path="reports/assignments" element={<AssignmentReportPage />} />
            <Route path="reports/marks" element={<MarksEntryReportPage />} />
            <Route path="reports/performance" element={<StudentPerformanceReportPage />} />
            <Route path="reports/workload" element={<WorkloadReportPage />} />
            <Route path="reports/leave" element={<LeaveReportPage />} />

            {/* Print Templates */}
            <Route path="print/register" element={<PrintAttendanceRegister />} />
            <Route path="print/evaluation" element={<PrintAssignmentEvaluation />} />
            <Route path="print/marksheet" element={<PrintMarkEntrySheet />} />
            <Route path="print/progress" element={<PrintStudentProgressReport />} />
            <Route path="print/parent-record" element={<PrintParentMeetingRecord />} />
            <Route path="print/duty-letter" element={<PrintDutyAllotmentLetter />} />

            {/* Role Desks */}
            <Route path="finance/fee-desk" element={<FeeCollectionDeskPage />} />
            <Route path="finance/expenses" element={<ExpenseLogPage />} />
            <Route path="transport/desk" element={<TransportDeskPage />} />
            <Route path="hostel/desk" element={<HostelDeskPage />} />
            <Route path="placement/desk" element={<PlacementDeskPage />} />
            <Route path="exams/setup" element={<ExamSetupPage />} />

            <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
          </Routes>
        </MainLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AppRoutes;
