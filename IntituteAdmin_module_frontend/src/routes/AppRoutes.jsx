import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

// Dashboard
import DashboardPage from '../pages/dashboard/DashboardPage';

// Homework
import HomeworkListPage from '../pages/homework/HomeworkListPage';
import HomeworkDetailPage from '../pages/homework/HomeworkDetailPage';

// Setup
import InstituteProfilePage from '../pages/setup/InstituteProfilePage';
import ModuleSettingsPage from '../pages/setup/ModuleSettingsPage';
import AcademicYearSetupPage from '../pages/setup/AcademicYearSetupPage';
import CampusSetupPage from '../pages/setup/CampusSetupPage';
import DepartmentSetupPage from '../pages/setup/DepartmentSetupPage';
import CourseClassSetupPage from '../pages/setup/CourseClassSetupPage';
import SemesterSetupPage from '../pages/setup/SemesterSetupPage';
import SectionSetupPage from '../pages/setup/SectionSetupPage';
import SubjectSetupPage from '../pages/setup/SubjectSetupPage';
import BatchSetupPage from '../pages/setup/BatchSetupPage';
import ProgramSetupPage from '../pages/setup/ProgramSetupPage';
import HouseGroupSetupPage from '../pages/setup/HouseGroupSetupPage';
import AffiliatedCollegesPage from '../pages/setup/AffiliatedCollegesPage';
import VisitorManagementPage from '../pages/setup/VisitorManagementPage';
import EnquiryManagementPage from '../pages/admissions/EnquiryManagementPage';
import PreAdmissionListPage from '../pages/admissions/PreAdmissionListPage';
import PreAdmissionSettingsPage from '../pages/admissions/PreAdmissionSettingsPage';
import AdmissionFormBuilderPage from '../pages/admissions/AdmissionFormBuilderPage';

// Student
import StudentAdmissionPage from '../pages/student/StudentAdmissionPage';
import BulkAdmissionPage from '../pages/student/BulkAdmissionPage';
import StudentListPage from '../pages/student/StudentListPage';
import StudentProfilePage from '../pages/student/StudentProfilePage';
import TransferCertificatePage from '../pages/student/TransferCertificatePage';
import BonafideCertificatePage from '../pages/student/BonafideCertificatePage';
import IDCardPreviewPage from '../pages/student/IDCardPreviewPage';
import StudentDocumentsPage from '../pages/student/StudentDocumentsPage';
import StudentExitPage from '../pages/student/StudentExitPage';
import PromoteStudentsPage from '../pages/student/PromoteStudentsPage';
import AlumniManagementPage from '../pages/student/AlumniManagementPage';
import DegreeIssuancePage from '../pages/student/DegreeIssuancePage';
import DisciplineRecordsPage from '../pages/student/DisciplineRecordsPage';
import HealthRecordsPage from '../pages/student/HealthRecordsPage';

// Staff
import StaffRegistrationPage from '../pages/staff/StaffRegistrationPage';
import StaffProfileFieldsPage from '../pages/staff/StaffProfileFieldsPage';
import TeachingStaffPage from '../pages/staff/TeachingStaffPage';
import NonTeachingStaffPage from '../pages/staff/NonTeachingStaffPage';
import StaffProfilePage from '../pages/staff/StaffProfilePage';
import QualificationDetailsPage from '../pages/staff/QualificationDetailsPage';
import ExperienceDetailsPage from '../pages/staff/ExperienceDetailsPage';
import SalaryStructurePage from '../pages/staff/SalaryStructurePage';
import StaffLeavePage from '../pages/staff/StaffLeavePage';
import StaffAttendancePage from '../pages/staff/StaffAttendancePage';
import StaffIDCardPage from '../pages/staff/StaffIDCardPage';
import ServiceCertificatePage from '../pages/staff/ServiceCertificatePage';
import TeacherAssignmentsPage from '../pages/staff/TeacherAssignmentsPage';
import ResearchOversightPage from '../pages/staff/ResearchOversightPage';
import AiTutorContentPage from '../pages/staff/AiTutorContentPage';
import PayrollPage from '../pages/staff/PayrollPage';

// Attendance
import DailyAttendancePage from '../pages/attendance/DailyAttendancePage';
import AttendanceCorrectionsPage from '../pages/attendance/AttendanceCorrectionsPage';
import SubjectAttendancePage from '../pages/attendance/SubjectAttendancePage';
import BiometricImportPage from '../pages/attendance/BiometricImportPage';
import AbsentStudentsPage from '../pages/attendance/AbsentStudentsPage';
import AttendanceReportsPage from '../pages/attendance/AttendanceReportsPage';

// Timetable
import ClassTimetablePage from '../pages/timetable/ClassTimetablePage';
import TeacherTimetablePage from '../pages/timetable/TeacherTimetablePage';
import ExamTimetablePage from '../pages/timetable/ExamTimetablePage';
import TimetableGeneratorPage from '../pages/timetable/TimetableGeneratorPage';
import SubstituteRequestsPage from '../pages/timetable/SubstituteRequestsPage';

// Examination
import ExamSetupPage from '../pages/examination/ExamSetupPage';
import ExamSchedulePage from '../pages/examination/ExamSchedulePage';
import HallTicketPage from '../pages/examination/HallTicketPage';
import MarksEntryPage from '../pages/examination/MarksEntryPage';
import GradeSetupPage from '../pages/examination/GradeSetupPage';
import ResultPublishPage from '../pages/examination/ResultPublishPage';
import MarksheetTemplatePage from '../pages/examination/MarksheetTemplatePage';
import RankListPage from '../pages/examination/RankListPage';
import SubjectAnalysisPage from '../pages/examination/SubjectAnalysisPage';
import ProgressReportPage from '../pages/examination/ProgressReportPage';

// Fee
import FeeDashboardPage from '../pages/fee/FeeDashboardPage';
import FeeHeadsPage from '../pages/fee/FeeHeadsPage';
import FeeStructureBuilderPage from '../pages/fee/FeeStructureBuilderPage';
import FeeCategorySetupPage from '../pages/fee/FeeCategorySetupPage';
import FeeStructurePage from '../pages/fee/FeeStructurePage';
import StudentFeeAssignmentPage from '../pages/fee/StudentFeeAssignmentPage';
import BulkFeeAssignmentPage from '../pages/fee/BulkFeeAssignmentPage';
import CollectFeePage from '../pages/fee/CollectFeePage';
import FeeCollectionV2Page from '../pages/fee/FeeCollectionV2Page';
import PendingFeesPage from '../pages/fee/PendingFeesPage';
import InstallmentManagementPage from '../pages/fee/InstallmentManagementPage';
import ScholarshipManagementPage from '../pages/fee/ScholarshipManagementPage';
import RefundManagementPage from '../pages/fee/RefundManagementPage';
import FeeReportsPage from '../pages/fee/FeeReportsPage';
import CashBookPage from '../pages/fee/CashBookPage';
import DayBookPage from '../pages/fee/DayBookPage';
import ChallanGenerationPage from '../pages/fee/ChallanGenerationPage';
import PrintableReceiptPage from '../pages/fee/PrintableReceiptPage';
import FeeAssignmentFieldsPage from '../pages/fee/FeeAssignmentFieldsPage';

// Communication
import AnnouncementsPage from '../pages/communication/AnnouncementsPage';
import CircularsPage from '../pages/communication/CircularsPage';
import SMSCenterPage from '../pages/communication/SMSCenterPage';
import ScheduledNotificationsPage from '../pages/communication/ScheduledNotificationsPage';
import AutomationEnginePage from '../pages/communication/AutomationEnginePage';
import WorkflowEnginePage from '../pages/staff/WorkflowEnginePage';
import EmailCenterPage from '../pages/communication/EmailCenterPage';
import WhatsAppNoticePage from '../pages/communication/WhatsAppNoticePage';
import TemplateLibraryPage from '../pages/communication/TemplateLibraryPage';
import EventNotificationsPage from '../pages/communication/EventNotificationsPage';
import GrievanceManagementPage from '../pages/communication/GrievanceManagementPage';
import GalleryManagementPage from '../pages/communication/GalleryManagementPage';
import ClubManagementPage from '../pages/communication/ClubManagementPage';

// Library
import BookMasterPage from '../pages/library/BookMasterPage';
import IssueBookPage from '../pages/library/IssueBookPage';
import ReturnBookPage from '../pages/library/ReturnBookPage';
import FineCollectionPage from '../pages/library/FineCollectionPage';
import StudentLibraryCardPage from '../pages/library/StudentLibraryCardPage';
import LibraryReportsPage from '../pages/library/LibraryReportsPage';
import LibraryMembershipFieldsPage from '../pages/library/LibraryMembershipFieldsPage';

// Transport
import RouteManagementPage from '../pages/transport/RouteManagementPage';
import VehicleManagementPage from '../pages/transport/VehicleManagementPage';
import DriverManagementPage from '../pages/transport/DriverManagementPage';
import StudentRouteMappingPage from '../pages/transport/StudentRouteMappingPage';
import TransportFeePage from '../pages/transport/TransportFeePage';
import VehicleAttendancePage from '../pages/transport/VehicleAttendancePage';
import TransportEnrollmentFieldsPage from '../pages/transport/TransportEnrollmentFieldsPage';

// Hostel
import HostelSetupPage from '../pages/hostel/HostelSetupPage';
import RoomAllocationPage from '../pages/hostel/RoomAllocationPage';
import BedAllocationPage from '../pages/hostel/BedAllocationPage';
import HostelAttendancePage from '../pages/hostel/HostelAttendancePage';
import MessFeePage from '../pages/hostel/MessFeePage';
import VisitorRegisterPage from '../pages/hostel/VisitorRegisterPage';
import HostelAllocationFieldsPage from '../pages/hostel/HostelAllocationFieldsPage';

// Inventory
import AssetRegisterPage from '../pages/inventory/AssetRegisterPage';
import LabEquipmentPage from '../pages/inventory/LabEquipmentPage';
import ComputerLabPage from '../pages/inventory/ComputerLabPage';
import PurchaseEntryPage from '../pages/inventory/PurchaseEntryPage';
import StockInOutPage from '../pages/inventory/StockInOutPage';
import VendorManagementPage from '../pages/inventory/VendorManagementPage';
import AssetMaintenancePage from '../pages/inventory/AssetMaintenancePage';
import AcademicCalendarPage from '../pages/academic/AcademicCalendarPage';
import ExpenseManagementPage from '../pages/finance/ExpenseManagementPage';
import RecruitmentPage from '../pages/staff/RecruitmentPage';

// Certificates
import TransferCertificatesPage from '../pages/certificates/TransferCertificatesPage';
import CertificateFormatPage from '../pages/certificates/CertificateFormatPage';
import BonafideCertificatesPage from '../pages/certificates/BonafideCertificatesPage';
import CourseCompletionPage from '../pages/certificates/CourseCompletionPage';
import ConductCertificatesPage from '../pages/certificates/ConductCertificatesPage';
import CertificateRequestsPage from '../pages/certificates/CertificateRequestsPage';
import PlacementPostingsPage from '../pages/placement/PlacementPostingsPage';
import FeePaidCertificatesPage from '../pages/certificates/FeePaidCertificatesPage';
import ExperienceCertificatesPage from '../pages/certificates/ExperienceCertificatesPage';

// Reports
import AdmissionReportPage from '../pages/reports/AdmissionReportPage';
import ReportCenterPage from '../pages/reports/ReportCenterPage';
import ReportBuilderPage from '../pages/reports/ReportBuilderPage';
import ReportHistoryPage from '../pages/reports/ReportHistoryPage';
import SavedReportsPage from '../pages/reports/SavedReportsPage';
import ReportRequestPage from '../pages/reports/ReportRequestPage';
import AttendanceReportPage from '../pages/reports/AttendanceReportPage';
import FeeCollectionReportPage from '../pages/reports/FeeCollectionReportPage';
import OutstandingReportPage from '../pages/reports/OutstandingReportPage';
import ExamResultReportPage from '../pages/reports/ExamResultReportPage';
import StaffReportPage from '../pages/reports/StaffReportPage';
import TransportReportPage from '../pages/reports/TransportReportPage';
import LibraryReportPage from '../pages/reports/LibraryReportPage';
import FeedbackSummaryPage from '../pages/reports/FeedbackSummaryPage';
import ConsolidatedMarksReportPage from '../pages/reports/ConsolidatedMarksReportPage';
import ConsolidatedAttendanceReportPage from '../pages/reports/ConsolidatedAttendanceReportPage';
import DateWiseAttendanceReportPage from '../pages/reports/DateWiseAttendanceReportPage';

// Settings
import UserRolesPage from '../pages/settings/UserRolesPage';
import PermissionsPage from '../pages/settings/PermissionsPage';
import SMSSettingsPage from '../pages/settings/SMSSettingsPage';
import EmailSettingsPage from '../pages/settings/EmailSettingsPage';
import PaymentGatewaySettingsPage from '../pages/settings/PaymentGatewaySettingsPage';
import ThemeSettingsPage from '../pages/settings/ThemeSettingsPage';
import CustomListsSettingsPage from '../pages/settings/CustomListsSettingsPage';
import BackupRestorePage from '../pages/settings/BackupRestorePage';
import AuditLogsPage from '../pages/settings/AuditLogsPage';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AdminProfilePage from '../pages/profile/AdminProfilePage';

export const AppRoutes = () => {
  return (
    <Routes>
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
        <Route path="setup/department" element={<DepartmentSetupPage />} />
        <Route path="setup/course" element={<CourseClassSetupPage />} />
        <Route path="setup/semester" element={<SemesterSetupPage />} />
        <Route path="setup/section" element={<SectionSetupPage />} />
        <Route path="setup/subject" element={<SubjectSetupPage />} />
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
        <Route path="timetable/generator" element={<TimetableGeneratorPage />} />
        <Route path="timetable/substitutes" element={<SubstituteRequestsPage />} />

        {/* Examination */}
        <Route path="examination/setup" element={<ExamSetupPage />} />
        <Route path="examination/schedule" element={<ExamSchedulePage />} />
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
    </Routes>
  );
};

export default AppRoutes;
