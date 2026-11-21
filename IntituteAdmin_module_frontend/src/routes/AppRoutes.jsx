import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

// Dashboard
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
// Homework
const HomeworkListPage = lazy(() => import('../pages/homework/HomeworkListPage'));
const HomeworkDetailPage = lazy(() => import('../pages/homework/HomeworkDetailPage'));
// Setup
const InstituteProfilePage = lazy(() => import('../pages/setup/InstituteProfilePage'));
const ModuleSettingsPage = lazy(() => import('../pages/setup/ModuleSettingsPage'));
const AcademicYearSetupPage = lazy(() => import('../pages/setup/AcademicYearSetupPage'));
const CampusSetupPage = lazy(() => import('../pages/setup/CampusSetupPage'));
const DepartmentSetupPage = lazy(() => import('../pages/setup/DepartmentSetupPage'));
const FacultySetupPage = lazy(() => import('../pages/setup/FacultySetupPage'));
const CourseClassSetupPage = lazy(() => import('../pages/setup/CourseClassSetupPage'));
const SemesterSetupPage = lazy(() => import('../pages/setup/SemesterSetupPage'));
const SectionSetupPage = lazy(() => import('../pages/setup/SectionSetupPage'));
const SubjectSetupPage = lazy(() => import('../pages/setup/SubjectSetupPage'));
const ElectiveAllotmentPage = lazy(() => import('../pages/setup/ElectiveAllotmentPage'));
const BatchSetupPage = lazy(() => import('../pages/setup/BatchSetupPage'));
const ProgramSetupPage = lazy(() => import('../pages/setup/ProgramSetupPage'));
const HouseGroupSetupPage = lazy(() => import('../pages/setup/HouseGroupSetupPage'));
const AffiliatedCollegesPage = lazy(() => import('../pages/setup/AffiliatedCollegesPage'));
const VisitorManagementPage = lazy(() => import('../pages/setup/VisitorManagementPage'));
const EnquiryManagementPage = lazy(() => import('../pages/admissions/EnquiryManagementPage'));
const PreAdmissionListPage = lazy(() => import('../pages/admissions/PreAdmissionListPage'));
const PreAdmissionSettingsPage = lazy(() => import('../pages/admissions/PreAdmissionSettingsPage'));
const AdmissionFormBuilderPage = lazy(() => import('../pages/admissions/AdmissionFormBuilderPage'));
// Student
const StudentAdmissionPage = lazy(() => import('../pages/student/StudentAdmissionPage'));
const BulkAdmissionPage = lazy(() => import('../pages/student/BulkAdmissionPage'));
const StudentListPage = lazy(() => import('../pages/student/StudentListPage'));
const StudentLeaveRequestsPage = lazy(() => import('../pages/student/StudentLeaveRequestsPage'));
const StudentProfilePage = lazy(() => import('../pages/student/StudentProfilePage'));
const TransferCertificatePage = lazy(() => import('../pages/student/TransferCertificatePage'));
const BonafideCertificatePage = lazy(() => import('../pages/student/BonafideCertificatePage'));
const IDCardPreviewPage = lazy(() => import('../pages/student/IDCardPreviewPage'));
const StudentDocumentsPage = lazy(() => import('../pages/student/StudentDocumentsPage'));
const StudentExitPage = lazy(() => import('../pages/student/StudentExitPage'));
const PromoteStudentsPage = lazy(() => import('../pages/student/PromoteStudentsPage'));
const AlumniManagementPage = lazy(() => import('../pages/student/AlumniManagementPage'));
const DegreeIssuancePage = lazy(() => import('../pages/student/DegreeIssuancePage'));
const DisciplineRecordsPage = lazy(() => import('../pages/student/DisciplineRecordsPage'));
const HealthRecordsPage = lazy(() => import('../pages/student/HealthRecordsPage'));
// Staff
const StaffRegistrationPage = lazy(() => import('../pages/staff/StaffRegistrationPage'));
const StaffProfileFieldsPage = lazy(() => import('../pages/staff/StaffProfileFieldsPage'));
const TeachingStaffPage = lazy(() => import('../pages/staff/TeachingStaffPage'));
const NonTeachingStaffPage = lazy(() => import('../pages/staff/NonTeachingStaffPage'));
const StaffProfilePage = lazy(() => import('../pages/staff/StaffProfilePage'));
const QualificationDetailsPage = lazy(() => import('../pages/staff/QualificationDetailsPage'));
const ExperienceDetailsPage = lazy(() => import('../pages/staff/ExperienceDetailsPage'));
const SalaryStructurePage = lazy(() => import('../pages/staff/SalaryStructurePage'));
const StaffLeavePage = lazy(() => import('../pages/staff/StaffLeavePage'));
const StaffAttendancePage = lazy(() => import('../pages/staff/StaffAttendancePage'));
const StaffIDCardPage = lazy(() => import('../pages/staff/StaffIDCardPage'));
const ServiceCertificatePage = lazy(() => import('../pages/staff/ServiceCertificatePage'));
const TeacherAssignmentsPage = lazy(() => import('../pages/staff/TeacherAssignmentsPage'));
const ResearchOversightPage = lazy(() => import('../pages/staff/ResearchOversightPage'));
const AiTutorContentPage = lazy(() => import('../pages/staff/AiTutorContentPage'));
const PayrollPage = lazy(() => import('../pages/staff/PayrollPage'));
// Attendance
const DailyAttendancePage = lazy(() => import('../pages/attendance/DailyAttendancePage'));
const AttendanceCorrectionsPage = lazy(() => import('../pages/attendance/AttendanceCorrectionsPage'));
const SubjectAttendancePage = lazy(() => import('../pages/attendance/SubjectAttendancePage'));
const BiometricImportPage = lazy(() => import('../pages/attendance/BiometricImportPage'));
const AbsentStudentsPage = lazy(() => import('../pages/attendance/AbsentStudentsPage'));
const AttendanceReportsPage = lazy(() => import('../pages/attendance/AttendanceReportsPage'));
// Timetable
const ClassTimetablePage = lazy(() => import('../pages/timetable/ClassTimetablePage'));
const TeacherTimetablePage = lazy(() => import('../pages/timetable/TeacherTimetablePage'));
const ExamTimetablePage = lazy(() => import('../pages/timetable/ExamTimetablePage'));
const SubstituteRequestsPage = lazy(() => import('../pages/timetable/SubstituteRequestsPage'));
// Examination
const ExamSetupPage = lazy(() => import('../pages/examination/ExamSetupPage'));
const ExamSchedulePage = lazy(() => import('../pages/examination/ExamSchedulePage'));
const ExamDutiesPage = lazy(() => import('../pages/examination/ExamDutiesPage'));
const HallTicketPage = lazy(() => import('../pages/examination/HallTicketPage'));
const MarksEntryPage = lazy(() => import('../pages/examination/MarksEntryPage'));
const GradeSetupPage = lazy(() => import('../pages/examination/GradeSetupPage'));
const ResultPublishPage = lazy(() => import('../pages/examination/ResultPublishPage'));
const MarksheetTemplatePage = lazy(() => import('../pages/examination/MarksheetTemplatePage'));
const RankListPage = lazy(() => import('../pages/examination/RankListPage'));
const SubjectAnalysisPage = lazy(() => import('../pages/examination/SubjectAnalysisPage'));
const ProgressReportPage = lazy(() => import('../pages/examination/ProgressReportPage'));
// Fee
const FeeDashboardPage = lazy(() => import('../pages/fee/FeeDashboardPage'));
const FeeHeadsPage = lazy(() => import('../pages/fee/FeeHeadsPage'));
const FeeStructureBuilderPage = lazy(() => import('../pages/fee/FeeStructureBuilderPage'));
const FeeCategorySetupPage = lazy(() => import('../pages/fee/FeeCategorySetupPage'));
const FeeStructurePage = lazy(() => import('../pages/fee/FeeStructurePage'));
const StudentFeeAssignmentPage = lazy(() => import('../pages/fee/StudentFeeAssignmentPage'));
const BulkFeeAssignmentPage = lazy(() => import('../pages/fee/BulkFeeAssignmentPage'));
const CollectFeePage = lazy(() => import('../pages/fee/CollectFeePage'));
const FeeCollectionV2Page = lazy(() => import('../pages/fee/FeeCollectionV2Page'));
const PendingFeesPage = lazy(() => import('../pages/fee/PendingFeesPage'));
const InstallmentManagementPage = lazy(() => import('../pages/fee/InstallmentManagementPage'));
const ScholarshipManagementPage = lazy(() => import('../pages/fee/ScholarshipManagementPage'));
const LateFeesPage = lazy(() => import('../pages/fee/LateFeesPage'));
const FeePolicyPage = lazy(() => import('../pages/fee/FeePolicyPage'));
const RefundManagementPage = lazy(() => import('../pages/fee/RefundManagementPage'));
const FeeReportsPage = lazy(() => import('../pages/fee/FeeReportsPage'));
const CashBookPage = lazy(() => import('../pages/fee/CashBookPage'));
const DayBookPage = lazy(() => import('../pages/fee/DayBookPage'));
const ChallanGenerationPage = lazy(() => import('../pages/fee/ChallanGenerationPage'));
const PrintableReceiptPage = lazy(() => import('../pages/fee/PrintableReceiptPage'));
const FeeAssignmentFieldsPage = lazy(() => import('../pages/fee/FeeAssignmentFieldsPage'));
// Communication
const AnnouncementsPage = lazy(() => import('../pages/communication/AnnouncementsPage'));
const CircularsPage = lazy(() => import('../pages/communication/CircularsPage'));
const SMSCenterPage = lazy(() => import('../pages/communication/SMSCenterPage'));
const ScheduledNotificationsPage = lazy(() => import('../pages/communication/ScheduledNotificationsPage'));
const AutomationEnginePage = lazy(() => import('../pages/communication/AutomationEnginePage'));
const WorkflowEnginePage = lazy(() => import('../pages/staff/WorkflowEnginePage'));
const EmailCenterPage = lazy(() => import('../pages/communication/EmailCenterPage'));
const WhatsAppNoticePage = lazy(() => import('../pages/communication/WhatsAppNoticePage'));
const TemplateLibraryPage = lazy(() => import('../pages/communication/TemplateLibraryPage'));
const EventNotificationsPage = lazy(() => import('../pages/communication/EventNotificationsPage'));
const GrievanceManagementPage = lazy(() => import('../pages/communication/GrievanceManagementPage'));
const GalleryManagementPage = lazy(() => import('../pages/communication/GalleryManagementPage'));
const ClubManagementPage = lazy(() => import('../pages/communication/ClubManagementPage'));
// Library
const BookMasterPage = lazy(() => import('../pages/library/BookMasterPage'));
const IssueBookPage = lazy(() => import('../pages/library/IssueBookPage'));
const ReturnBookPage = lazy(() => import('../pages/library/ReturnBookPage'));
const FineCollectionPage = lazy(() => import('../pages/library/FineCollectionPage'));
const StudentLibraryCardPage = lazy(() => import('../pages/library/StudentLibraryCardPage'));
const LibraryReportsPage = lazy(() => import('../pages/library/LibraryReportsPage'));
const LibraryMembershipFieldsPage = lazy(() => import('../pages/library/LibraryMembershipFieldsPage'));
// Transport
const RouteManagementPage = lazy(() => import('../pages/transport/RouteManagementPage'));
const VehicleManagementPage = lazy(() => import('../pages/transport/VehicleManagementPage'));
const DriverManagementPage = lazy(() => import('../pages/transport/DriverManagementPage'));
const StudentRouteMappingPage = lazy(() => import('../pages/transport/StudentRouteMappingPage'));
const TransportFeePage = lazy(() => import('../pages/transport/TransportFeePage'));
const VehicleAttendancePage = lazy(() => import('../pages/transport/VehicleAttendancePage'));
const TransportEnrollmentFieldsPage = lazy(() => import('../pages/transport/TransportEnrollmentFieldsPage'));
// Hostel
const HostelSetupPage = lazy(() => import('../pages/hostel/HostelSetupPage'));
const RoomAllocationPage = lazy(() => import('../pages/hostel/RoomAllocationPage'));
const BedAllocationPage = lazy(() => import('../pages/hostel/BedAllocationPage'));
const HostelAttendancePage = lazy(() => import('../pages/hostel/HostelAttendancePage'));
const MessFeePage = lazy(() => import('../pages/hostel/MessFeePage'));
const VisitorRegisterPage = lazy(() => import('../pages/hostel/VisitorRegisterPage'));
const HostelAllocationFieldsPage = lazy(() => import('../pages/hostel/HostelAllocationFieldsPage'));
// Inventory
const AssetRegisterPage = lazy(() => import('../pages/inventory/AssetRegisterPage'));
const LabEquipmentPage = lazy(() => import('../pages/inventory/LabEquipmentPage'));
const ComputerLabPage = lazy(() => import('../pages/inventory/ComputerLabPage'));
const PurchaseEntryPage = lazy(() => import('../pages/inventory/PurchaseEntryPage'));
const StockInOutPage = lazy(() => import('../pages/inventory/StockInOutPage'));
const VendorManagementPage = lazy(() => import('../pages/inventory/VendorManagementPage'));
const AssetMaintenancePage = lazy(() => import('../pages/inventory/AssetMaintenancePage'));
const AcademicCalendarPage = lazy(() => import('../pages/academic/AcademicCalendarPage'));
const ExpenseManagementPage = lazy(() => import('../pages/finance/ExpenseManagementPage'));
const RecruitmentPage = lazy(() => import('../pages/staff/RecruitmentPage'));
// Certificates
const TransferCertificatesPage = lazy(() => import('../pages/certificates/TransferCertificatesPage'));
const CertificateFormatPage = lazy(() => import('../pages/certificates/CertificateFormatPage'));
const BonafideCertificatesPage = lazy(() => import('../pages/certificates/BonafideCertificatesPage'));
const CourseCompletionPage = lazy(() => import('../pages/certificates/CourseCompletionPage'));
const ConductCertificatesPage = lazy(() => import('../pages/certificates/ConductCertificatesPage'));
const CertificateRequestsPage = lazy(() => import('../pages/certificates/CertificateRequestsPage'));
const PlacementPostingsPage = lazy(() => import('../pages/placement/PlacementPostingsPage'));
const FeePaidCertificatesPage = lazy(() => import('../pages/certificates/FeePaidCertificatesPage'));
const ExperienceCertificatesPage = lazy(() => import('../pages/certificates/ExperienceCertificatesPage'));
// Reports
const AdmissionReportPage = lazy(() => import('../pages/reports/AdmissionReportPage'));
const ReportCenterPage = lazy(() => import('../pages/reports/ReportCenterPage'));
const ReportBuilderPage = lazy(() => import('../pages/reports/ReportBuilderPage'));
const ReportHistoryPage = lazy(() => import('../pages/reports/ReportHistoryPage'));
const SavedReportsPage = lazy(() => import('../pages/reports/SavedReportsPage'));
const ReportRequestPage = lazy(() => import('../pages/reports/ReportRequestPage'));
const AttendanceReportPage = lazy(() => import('../pages/reports/AttendanceReportPage'));
const FeeCollectionReportPage = lazy(() => import('../pages/reports/FeeCollectionReportPage'));
const OutstandingReportPage = lazy(() => import('../pages/reports/OutstandingReportPage'));
const ExamResultReportPage = lazy(() => import('../pages/reports/ExamResultReportPage'));
const StaffReportPage = lazy(() => import('../pages/reports/StaffReportPage'));
const TransportReportPage = lazy(() => import('../pages/reports/TransportReportPage'));
const LibraryReportPage = lazy(() => import('../pages/reports/LibraryReportPage'));
const FeedbackSummaryPage = lazy(() => import('../pages/reports/FeedbackSummaryPage'));
const ConsolidatedMarksReportPage = lazy(() => import('../pages/reports/ConsolidatedMarksReportPage'));
const ConsolidatedAttendanceReportPage = lazy(() => import('../pages/reports/ConsolidatedAttendanceReportPage'));
const DateWiseAttendanceReportPage = lazy(() => import('../pages/reports/DateWiseAttendanceReportPage'));
// Settings
const UserRolesPage = lazy(() => import('../pages/settings/UserRolesPage'));
const PermissionsPage = lazy(() => import('../pages/settings/PermissionsPage'));
const SMSSettingsPage = lazy(() => import('../pages/settings/SMSSettingsPage'));
const EmailSettingsPage = lazy(() => import('../pages/settings/EmailSettingsPage'));
const PaymentGatewaySettingsPage = lazy(() => import('../pages/settings/PaymentGatewaySettingsPage'));
const ThemeSettingsPage = lazy(() => import('../pages/settings/ThemeSettingsPage'));
const CustomListsSettingsPage = lazy(() => import('../pages/settings/CustomListsSettingsPage'));
const BackupRestorePage = lazy(() => import('../pages/settings/BackupRestorePage'));
const AuditLogsPage = lazy(() => import('../pages/settings/AuditLogsPage'));
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
const AdminProfilePage = lazy(() => import('../pages/profile/AdminProfilePage'));
// Shown while a page's code chunk downloads (first visit to that page only)
const PageLoader = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}><Routes>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<AdminProfilePage />} />

        {/* Homework */}
        <Route path="homework" element={<HomeworkListPage />} />
        <Route path="homework/:id" element={<HomeworkDetailPage />} />

        {/* Institution Setup */}
        <Route path="setup/profile" element={<InstituteProfilePage />} />
        <Route path="setup/module-settings" element={<ModuleSettingsPage />} />
        <Route path="setup/academic-year" element={<AcademicYearSetupPage />} />
        <Route path="setup/campus" element={<CampusSetupPage />} />
        <Route path="setup/faculty" element={<FacultySetupPage />} />
        <Route path="setup/department" element={<DepartmentSetupPage />} />
        <Route path="setup/course" element={<CourseClassSetupPage />} />
        <Route path="setup/semester" element={<SemesterSetupPage />} />
        <Route path="setup/section" element={<SectionSetupPage />} />
        <Route path="setup/subject" element={<SubjectSetupPage />} />
        <Route path="setup/electives" element={<ElectiveAllotmentPage />} />
        <Route path="setup/batch" element={<BatchSetupPage />} />
        <Route path="setup/program" element={<ProgramSetupPage />} />
        <Route path="setup/house" element={<HouseGroupSetupPage />} />
        <Route path="setup/affiliated-colleges" element={<AffiliatedCollegesPage />} />
        <Route path="setup/visitors" element={<VisitorManagementPage />} />

        {/* Front Office */}
        <Route path="admissions/enquiries" element={<EnquiryManagementPage />} />

        {/* Pre-Admission */}
        <Route path="admissions/pre-admission" element={<PreAdmissionListPage />} />
        <Route path="admissions/pre-admission/settings" element={<PreAdmissionSettingsPage />} />
        <Route path="admissions/form-builder" element={<AdmissionFormBuilderPage />} />

        {/* Student Management */}
        <Route path="student/admission" element={<StudentAdmissionPage />} />
        <Route path="student/bulk-admission" element={<BulkAdmissionPage />} />
        <Route path="student/list" element={<StudentListPage />} />
        <Route path="student/leave" element={<StudentLeaveRequestsPage />} />
        <Route path="student/profile" element={<StudentProfilePage />} />
        <Route path="student/tc" element={<TransferCertificatePage />} />
        <Route path="student/bonafide" element={<BonafideCertificatePage />} />
        <Route path="student/id-card" element={<IDCardPreviewPage />} />
        <Route path="student/documents" element={<StudentDocumentsPage />} />
        <Route path="student/exit" element={<StudentExitPage />} />
        <Route path="student/promote" element={<PromoteStudentsPage />} />
        <Route path="student/alumni" element={<AlumniManagementPage />} />
        <Route path="student/degrees" element={<DegreeIssuancePage />} />
        <Route path="student/discipline" element={<DisciplineRecordsPage />} />
        <Route path="student/health" element={<HealthRecordsPage />} />

        {/* Staff Management */}
        <Route path="staff/registration" element={<StaffRegistrationPage />} />
        <Route path="staff/form-builder" element={<StaffProfileFieldsPage />} />
        <Route path="staff/teaching" element={<TeachingStaffPage />} />
        <Route path="staff/non-teaching" element={<NonTeachingStaffPage />} />
        <Route path="staff/profile" element={<StaffProfilePage />} />
        <Route path="staff/qualifications" element={<QualificationDetailsPage />} />
        <Route path="staff/experience" element={<ExperienceDetailsPage />} />
        <Route path="staff/salary" element={<SalaryStructurePage />} />
        <Route path="staff/leave" element={<StaffLeavePage />} />
        <Route path="staff/attendance" element={<StaffAttendancePage />} />
        <Route path="staff/id-card" element={<StaffIDCardPage />} />
        <Route path="staff/service-cert" element={<ServiceCertificatePage />} />
        <Route path="staff/assignments" element={<TeacherAssignmentsPage />} />
        <Route path="staff/research" element={<ResearchOversightPage />} />
        <Route path="staff/ai-tutor-content" element={<AiTutorContentPage />} />
        <Route path="staff/payroll" element={<PayrollPage />} />

        {/* Attendance */}
        <Route path="attendance/daily" element={<DailyAttendancePage />} />
        <Route path="attendance/corrections" element={<AttendanceCorrectionsPage />} />
        <Route path="attendance/subject" element={<SubjectAttendancePage />} />
        <Route path="attendance/biometric" element={<BiometricImportPage />} />
        <Route path="attendance/absentee" element={<AbsentStudentsPage />} />
        <Route path="attendance/reports" element={<AttendanceReportsPage />} />

        {/* Timetable */}
        <Route path="timetable/class" element={<ClassTimetablePage />} />
        <Route path="timetable/teacher" element={<TeacherTimetablePage />} />
        <Route path="timetable/exam" element={<ExamTimetablePage />} />
        {/* The auto-generator was a placeholder — old links land on the real class timetable */}
        <Route path="timetable/generator" element={<Navigate to="/admin/timetable/class" replace />} />
        <Route path="timetable/substitutes" element={<SubstituteRequestsPage />} />

        {/* Examination */}
        <Route path="examination/setup" element={<ExamSetupPage />} />
        <Route path="examination/schedule" element={<ExamSchedulePage />} />
        <Route path="examination/duties" element={<ExamDutiesPage />} />
        <Route path="examination/hall-ticket" element={<HallTicketPage />} />
        <Route path="examination/marks-entry" element={<MarksEntryPage />} />
        <Route path="examination/grade-setup" element={<GradeSetupPage />} />
        <Route path="examination/result-publish" element={<ResultPublishPage />} />
        <Route path="examination/marksheet" element={<MarksheetTemplatePage />} />
        <Route path="examination/rank-list" element={<RankListPage />} />
        <Route path="examination/progress-report" element={<ProgressReportPage />} />

        {/* Fee Management */}
        <Route path="fee/dashboard" element={<FeeDashboardPage />} />
        <Route path="fee/heads" element={<FeeHeadsPage />} />
        <Route path="fee/structure-builder" element={<FeeStructureBuilderPage />} />
        <Route path="fee/policy" element={<FeePolicyPage />} />
        <Route path="fee/category" element={<FeeCategorySetupPage />} />
        <Route path="fee/structure" element={<FeeStructurePage />} />
        <Route path="fee/assignment" element={<StudentFeeAssignmentPage />} />
        <Route path="fee/bulk-assignment" element={<BulkFeeAssignmentPage />} />
        <Route path="fee/collect" element={<CollectFeePage />} />
        <Route path="fee/collect-v2" element={<FeeCollectionV2Page />} />
        <Route path="fee/pending" element={<PendingFeesPage />} />
        <Route path="fee/challan" element={<ChallanGenerationPage />} />
        <Route path="fee/receipt" element={<PrintableReceiptPage />} />
        <Route path="fee/installments" element={<InstallmentManagementPage />} />
        <Route path="fee/scholarship" element={<ScholarshipManagementPage />} />
        <Route path="fee/late-fees" element={<LateFeesPage />} />
        <Route path="fee/refund" element={<RefundManagementPage />} />
        <Route path="fee/reports" element={<FeeReportsPage />} />
        <Route path="fee/cash-book" element={<CashBookPage />} />
        <Route path="fee/day-book" element={<DayBookPage />} />
        <Route path="fee/form-builder" element={<FeeAssignmentFieldsPage />} />

        {/* Communication */}
        <Route path="communication/announcements" element={<AnnouncementsPage />} />
        <Route path="communication/circulars" element={<CircularsPage />} />
        <Route path="communication/sms-center" element={<SMSCenterPage />} />
        <Route path="communication/scheduled" element={<ScheduledNotificationsPage />} />
        <Route path="automation" element={<AutomationEnginePage />} />
        <Route path="workflows" element={<WorkflowEnginePage />} />
        <Route path="communication/email-center" element={<EmailCenterPage />} />
        <Route path="communication/whatsapp" element={<WhatsAppNoticePage />} />
        <Route path="communication/templates" element={<TemplateLibraryPage />} />
        <Route path="communication/events" element={<EventNotificationsPage />} />
        <Route path="communication/grievances" element={<GrievanceManagementPage />} />
        <Route path="communication/gallery" element={<GalleryManagementPage />} />
        <Route path="communication/clubs" element={<ClubManagementPage />} />

        {/* Library */}
        <Route path="library/books" element={<BookMasterPage />} />
        <Route path="library/issue" element={<IssueBookPage />} />
        <Route path="library/return" element={<ReturnBookPage />} />
        <Route path="library/fines" element={<FineCollectionPage />} />
        <Route path="library/card" element={<StudentLibraryCardPage />} />
        <Route path="library/reports" element={<LibraryReportsPage />} />
        <Route path="library/form-builder" element={<LibraryMembershipFieldsPage />} />

        {/* Transport */}
        <Route path="transport/routes" element={<RouteManagementPage />} />
        <Route path="transport/vehicles" element={<VehicleManagementPage />} />
        <Route path="transport/drivers" element={<DriverManagementPage />} />
        <Route path="transport/mapping" element={<StudentRouteMappingPage />} />
        <Route path="transport/fee" element={<TransportFeePage />} />
        <Route path="transport/attendance" element={<VehicleAttendancePage />} />
        <Route path="transport/form-builder" element={<TransportEnrollmentFieldsPage />} />

        {/* Hostel */}
        <Route path="hostel/setup" element={<HostelSetupPage />} />
        <Route path="hostel/rooms" element={<RoomAllocationPage />} />
        <Route path="hostel/beds" element={<BedAllocationPage />} />
        <Route path="hostel/attendance" element={<HostelAttendancePage />} />
        <Route path="hostel/mess-fee" element={<MessFeePage />} />
        <Route path="hostel/visitors" element={<VisitorRegisterPage />} />
        <Route path="hostel/form-builder" element={<HostelAllocationFieldsPage />} />

        {/* Inventory */}
        <Route path="inventory/assets" element={<AssetRegisterPage />} />
        <Route path="inventory/lab-equipment" element={<LabEquipmentPage />} />
        <Route path="inventory/computer-lab" element={<ComputerLabPage />} />
        <Route path="inventory/purchase" element={<PurchaseEntryPage />} />
        <Route path="inventory/stock" element={<StockInOutPage />} />
        <Route path="inventory/vendors" element={<VendorManagementPage />} />
        <Route path="inventory/maintenance" element={<AssetMaintenancePage />} />
        <Route path="academic-calendar" element={<AcademicCalendarPage />} />
        <Route path="finance/expenses" element={<ExpenseManagementPage />} />
        <Route path="staff/recruitment" element={<RecruitmentPage />} />

        {/* Certificates */}
        <Route path="certificates/format" element={<CertificateFormatPage />} />
        <Route path="certificates/tc" element={<TransferCertificatesPage />} />
        <Route path="certificates/bonafide" element={<BonafideCertificatesPage />} />
        <Route path="certificates/completion" element={<CourseCompletionPage />} />
        <Route path="certificates/conduct" element={<ConductCertificatesPage />} />
        <Route path="certificates/requests" element={<CertificateRequestsPage />} />
        <Route path="placement/postings" element={<PlacementPostingsPage />} />
        <Route path="certificates/feepaid" element={<FeePaidCertificatesPage />} />
        <Route path="certificates/experience" element={<ExperienceCertificatesPage />} />

        {/* Reports */}
        <Route path="reports/center" element={<ReportCenterPage />} />
        <Route path="reports/builder" element={<ReportBuilderPage />} />
        <Route path="reports/history" element={<ReportHistoryPage />} />
        <Route path="reports/saved" element={<SavedReportsPage />} />
        <Route path="reports/request" element={<ReportRequestPage />} />
        <Route path="reports/admission" element={<AdmissionReportPage />} />
        <Route path="reports/attendance" element={<AttendanceReportPage />} />
        <Route path="reports/attendance-datewise" element={<DateWiseAttendanceReportPage />} />
        <Route path="reports/attendance-consolidated" element={<ConsolidatedAttendanceReportPage />} />
        <Route path="reports/fee-collection" element={<FeeCollectionReportPage />} />
        <Route path="reports/outstanding" element={<OutstandingReportPage />} />
        <Route path="reports/exam-results" element={<ExamResultReportPage />} />
        <Route path="reports/marks-consolidated" element={<ConsolidatedMarksReportPage />} />
        <Route path="reports/staff" element={<StaffReportPage />} />
        <Route path="reports/transport" element={<TransportReportPage />} />
        <Route path="reports/library" element={<LibraryReportPage />} />
        <Route path="reports/feedback" element={<FeedbackSummaryPage />} />

        {/* Settings */}
        <Route path="settings/roles" element={<UserRolesPage />} />
        <Route path="settings/permissions" element={<PermissionsPage />} />
        <Route path="settings/sms" element={<SMSSettingsPage />} />
        <Route path="settings/email" element={<EmailSettingsPage />} />
        <Route path="settings/gateway" element={<PaymentGatewaySettingsPage />} />
        <Route path="settings/theme" element={<ThemeSettingsPage />} />
        <Route path="settings/custom-lists" element={<CustomListsSettingsPage />} />
        <Route path="settings/backup" element={<BackupRestorePage />} />
        <Route path="settings/audit-logs" element={<AuditLogsPage />} />

        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes></Suspense>
  );
};

export default AppRoutes;
