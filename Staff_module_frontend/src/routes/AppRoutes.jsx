import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Dashboard
const StaffDashboardPage = lazy(() => import('../pages/dashboard/StaffDashboardPage'));
// Profile
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const EditProfilePage = lazy(() => import('../pages/profile/EditProfilePage'));
const QualificationDetailsPage = lazy(() => import('../pages/profile/QualificationDetailsPage'));
const ExperienceDetailsPage = lazy(() => import('../pages/profile/ExperienceDetailsPage'));
const DocumentsUploadPage = lazy(() => import('../pages/profile/DocumentsUploadPage'));
const BankDetailsPage = lazy(() => import('../pages/profile/BankDetailsPage'));
const EmergencyContactPage = lazy(() => import('../pages/profile/EmergencyContactPage'));
const PasswordChangePage = lazy(() => import('../pages/profile/PasswordChangePage'));
// Classes
const AssignedClassesPage = lazy(() => import('../pages/classes/AssignedClassesPage'));
const ClassDetailsPage = lazy(() => import('../pages/classes/ClassDetailsPage'));
const StudentListPage = lazy(() => import('../pages/classes/StudentListPage'));
const SubjectMappingPage = lazy(() => import('../pages/classes/SubjectMappingPage'));
const ClassStrengthPage = lazy(() => import('../pages/classes/ClassStrengthPage'));
// Attendance
const TakeAttendancePage = lazy(() => import('../pages/attendance/TakeAttendancePage'));
const EditAttendancePage = lazy(() => import('../pages/attendance/EditAttendancePage'));
const AttendanceCorrectionsPage = lazy(() => import('../pages/attendance/AttendanceCorrectionsPage'));
const SubjectAttendancePage = lazy(() => import('../pages/attendance/SubjectAttendancePage'));
const MonthlyAttendancePage = lazy(() => import('../pages/attendance/MonthlyAttendancePage'));
const AbsentStudentsPage = lazy(() => import('../pages/attendance/AbsentStudentsPage'));
const AttendanceReportsPage = lazy(() => import('../pages/attendance/AttendanceReportsPage'));
// Assignments
const CreateAssignmentPage = lazy(() => import('../pages/assignments/CreateAssignmentPage'));
const MyPublicationsPage = lazy(() => import('../pages/research/MyPublicationsPage'));
const AssignmentListPage = lazy(() => import('../pages/assignments/AssignmentListPage'));
const AssignmentDetailsPage = lazy(() => import('../pages/assignments/AssignmentDetailsPage'));
const StudentSubmissionsPage = lazy(() => import('../pages/assignments/StudentSubmissionsPage'));
const EvaluateAssignmentPage = lazy(() => import('../pages/assignments/EvaluateAssignmentPage'));
const AssignmentAnalyticsPage = lazy(() => import('../pages/assignments/AssignmentAnalyticsPage'));
// Study Materials
const UploadMaterialPage = lazy(() => import('../pages/materials/UploadMaterialPage'));
const MaterialLibraryPage = lazy(() => import('../pages/materials/MaterialLibraryPage'));
const SubjectMaterialsPage = lazy(() => import('../pages/materials/SubjectMaterialsPage'));
const DownloadHistoryPage = lazy(() => import('../pages/materials/DownloadHistoryPage'));
// Examinations
const MyExamDutiesPage = lazy(() => import('../pages/examination/MyExamDutiesPage'));
const QuestionBankPage = lazy(() => import('../pages/examination/QuestionBankPage'));
const CreateQuestionPage = lazy(() => import('../pages/examination/CreateQuestionPage'));
const ImportQuestionsPage = lazy(() => import('../pages/examination/ImportQuestionsPage'));
const QuestionPaperGeneratorPage = lazy(() => import('../pages/examination/QuestionPaperGeneratorPage'));
const PreviewQuestionPaperPage = lazy(() => import('../pages/examination/PreviewQuestionPaperPage'));
const MarksEntryPage = lazy(() => import('../pages/examination/MarksEntryPage'));
const InternalAssessmentPage = lazy(() => import('../pages/examination/InternalAssessmentPage'));
const PublishMarksPage = lazy(() => import('../pages/examination/PublishMarksPage'));
const ResultAnalysisPage = lazy(() => import('../pages/examination/ResultAnalysisPage'));
// Performance
const StudentProgressPage = lazy(() => import('../pages/performance/StudentProgressPage'));
const SubjectPerformancePage = lazy(() => import('../pages/performance/SubjectPerformancePage'));
const WeakStudentsPage = lazy(() => import('../pages/performance/WeakStudentsPage'));
const TopPerformersPage = lazy(() => import('../pages/performance/TopPerformersPage'));
const AttendanceVsMarksPage = lazy(() => import('../pages/performance/AttendanceVsMarksPage'));
const ParentMeetingNotesPage = lazy(() => import('../pages/performance/ParentMeetingNotesPage'));
const AchievementEntryPage = lazy(() => import('../pages/performance/AchievementEntryPage'));
const GalleryPage = lazy(() => import('../pages/communication/GalleryPage'));
// Timetable
const MyTimetablePage = lazy(() => import('../pages/timetable/MyTimetablePage'));
const DailyTimetablePage = lazy(() => import('../pages/timetable/DailyTimetablePage'));
const WeeklyTimetablePage = lazy(() => import('../pages/timetable/WeeklyTimetablePage'));
const SubstituteClassesPage = lazy(() => import('../pages/timetable/SubstituteClassesPage'));
const FreePeriodsPage = lazy(() => import('../pages/timetable/FreePeriodsPage'));
// Communication
const SendAnnouncementPage = lazy(() => import('../pages/communication/SendAnnouncementPage'));
const CircularsPage = lazy(() => import('../pages/communication/CircularsPage'));
const ClassNoticePage = lazy(() => import('../pages/communication/ClassNoticePage'));
const ParentMessagePage = lazy(() => import('../pages/communication/ParentMessagePage'));
const StudentChatPage = lazy(() => import('../pages/communication/StudentChatPage'));
const AppointmentRequestsPage = lazy(() => import('../pages/appointments/AppointmentRequestsPage'));
const SmsCenterPage = lazy(() => import('../pages/communication/SmsCenterPage'));
const EmailCenterPage = lazy(() => import('../pages/communication/EmailCenterPage'));
const MessageHistoryPage = lazy(() => import('../pages/communication/MessageHistoryPage'));
// Leave
const ApplyLeavePage = lazy(() => import('../pages/leave/ApplyLeavePage'));
const LeaveHistoryPage = lazy(() => import('../pages/leave/LeaveHistoryPage'));
const LeaveBalancePage = lazy(() => import('../pages/leave/LeaveBalancePage'));
const LeaveApprovalStatusPage = lazy(() => import('../pages/leave/LeaveApprovalStatusPage'));
const StudentLeaveApprovalPage = lazy(() => import('../pages/leave/StudentLeaveApprovalPage'));
const ScholarshipApprovalPage = lazy(() => import('../pages/classes/ScholarshipApprovalPage'));
// Events
const EventDutiesPage = lazy(() => import('../pages/events/EventDutiesPage'));
const AcademicCalendarPage = lazy(() => import('../pages/calendar/AcademicCalendarPage'));
const ClubActivitiesPage = lazy(() => import('../pages/events/ClubActivitiesPage'));
const CompetitionManagementPage = lazy(() => import('../pages/events/CompetitionManagementPage'));
const EventAttendancePage = lazy(() => import('../pages/events/EventAttendancePage'));
const CertificateEntryPage = lazy(() => import('../pages/events/CertificateEntryPage'));
// Self Attendance
const MyStaffAttendancePage = lazy(() => import('../pages/selfAttendance/MyStaffAttendancePage'));
const MonthlyStaffAttendancePage = lazy(() => import('../pages/selfAttendance/MonthlyStaffAttendancePage'));
const LateEntryPage = lazy(() => import('../pages/selfAttendance/LateEntryPage'));
const StaffAttendanceSummaryPage = lazy(() => import('../pages/selfAttendance/StaffAttendanceSummaryPage'));
// Library Staff
const BookIssuePage = lazy(() => import('../pages/library/BookIssuePage'));
const BookReturnPage = lazy(() => import('../pages/library/BookReturnPage'));
const FineCollectionPage = lazy(() => import('../pages/library/FineCollectionPage'));
const StudentLibraryStatusPage = lazy(() => import('../pages/library/StudentLibraryStatusPage'));
// Lab Staff
const LabInventoryPage = lazy(() => import('../pages/lab/LabInventoryPage'));
const EquipmentIssuePage = lazy(() => import('../pages/lab/EquipmentIssuePage'));
const EquipmentReturnPage = lazy(() => import('../pages/lab/EquipmentReturnPage'));
const LabUsageRegisterPage = lazy(() => import('../pages/lab/LabUsageRegisterPage'));
const LabMaintenanceRegisterPage = lazy(() => import('../pages/lab/LabMaintenanceRegisterPage'));
// Reports
const AttendanceReportPage = lazy(() => import('../pages/reports/AttendanceReportPage'));
const AssignmentReportPage = lazy(() => import('../pages/reports/AssignmentReportPage'));
const MarksEntryReportPage = lazy(() => import('../pages/reports/MarksEntryReportPage'));
const StudentPerformanceReportPage = lazy(() => import('../pages/reports/StudentPerformanceReportPage'));
const WorkloadReportPage = lazy(() => import('../pages/reports/WorkloadReportPage'));
const LeaveReportPage = lazy(() => import('../pages/reports/LeaveReportPage'));
// Print
const PrintAttendanceRegister = lazy(() => import('../pages/print/PrintAttendanceRegister'));
const PrintAssignmentEvaluation = lazy(() => import('../pages/print/PrintAssignmentEvaluation'));
const PrintMarkEntrySheet = lazy(() => import('../pages/print/PrintMarkEntrySheet'));
const PrintStudentProgressReport = lazy(() => import('../pages/print/PrintStudentProgressReport'));
const PrintParentMeetingRecord = lazy(() => import('../pages/print/PrintParentMeetingRecord'));
const PrintDutyAllotmentLetter = lazy(() => import('../pages/print/PrintDutyAllotmentLetter'));
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// Role Desks (Accountant / Transport Manager / Hostel Warden / Placement Officer / Exam Admin)
const FeeCollectionDeskPage = lazy(() => import('../pages/finance/FeeCollectionDeskPage'));
const ExpenseLogPage = lazy(() => import('../pages/finance/ExpenseLogPage'));
const TransportDeskPage = lazy(() => import('../pages/transport/TransportDeskPage'));
const HostelDeskPage = lazy(() => import('../pages/hostel/HostelDeskPage'));
const PlacementDeskPage = lazy(() => import('../pages/placement/PlacementDeskPage'));
const ExamSetupPage = lazy(() => import('../pages/exams/ExamSetupPage'));
// Shown while a page's code chunk downloads (first visit to that page only)
const PageLoader = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}><Routes>
      <Route path="/staff/login" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/staff/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />

      {/* Staff Layout Routes */}
      <Route path="/staff/*" element={
        <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<PageLoader />}><Routes>
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
            <Route path="communication/circulars" element={<CircularsPage />} />
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
            <Route path="scholarship-approvals" element={<ScholarshipApprovalPage />} />

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
            {/* Fee Desk closed — fees are handled by the Institute Admin only */}
            <Route path="finance/fee-desk" element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="finance/expenses" element={<ExpenseLogPage />} />
            <Route path="transport/desk" element={<TransportDeskPage />} />
            <Route path="hostel/desk" element={<HostelDeskPage />} />
            <Route path="placement/desk" element={<PlacementDeskPage />} />
            <Route path="exams/setup" element={<ExamSetupPage />} />

            <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
          </Routes></Suspense>
        </MainLayout>
        </ProtectedRoute>
      } />
    </Routes></Suspense>
  );
};

export default AppRoutes;
