import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentLayout from '../components/layout/StudentLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import OtpPage from '../pages/auth/OtpPage';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage';
import SessionExpiredPage from '../pages/auth/SessionExpiredPage';
import UnauthorizedPage from '../pages/auth/UnauthorizedPage';

// Dashboard & Profile
const StudentDashboardPage = lazy(() => import('../pages/dashboard/StudentDashboardPage'));
const MyProfilePage = lazy(() => import('../pages/profile/MyProfilePage'));
const MyDocumentsPage = lazy(() => import('../pages/documents/MyDocumentsPage'));
// Academics
const MySubjectsPage = lazy(() => import('../pages/academics/MySubjectsPage'));
const SubjectDetailPage = lazy(() => import('../pages/academics/SubjectDetailPage'));
const AttendanceDashboardPage = lazy(() => import('../pages/attendance/AttendanceDashboardPage'));
const LeaveRequestPage = lazy(() => import('../pages/leave/LeaveRequestPage'));
const StudentTimetablePage = lazy(() => import('../pages/timetable/StudentTimetablePage'));
const MyClassesPage = lazy(() => import('../pages/classroom/MyClassesPage'));
const AssignmentsListPage = lazy(() => import('../pages/assignments/AssignmentsListPage'));
const AssignmentDetailPage = lazy(() => import('../pages/assignments/AssignmentDetailPage'));
const MaterialLibraryPage = lazy(() => import('../pages/materials/MaterialLibraryPage'));
const QuestionBankPage = lazy(() => import('../pages/questions/QuestionBankPage'));
const PracticeTestSimulatorPage = lazy(() => import('../pages/questions/PracticeTestSimulatorPage'));
// Exams & Results
const ExamSchedulePage = lazy(() => import('../pages/exams/ExamSchedulePage'));
const HallTicketPage = lazy(() => import('../pages/exams/HallTicketPage'));
const StudentResultsPage = lazy(() => import('../pages/results/StudentResultsPage'));
// Fees
const FeeOverviewPage = lazy(() => import('../pages/fees/FeeOverviewPage'));
const PayFeesPage = lazy(() => import('../pages/fees/PayFeesPage'));
const FeeReceiptsPage = lazy(() => import('../pages/fees/FeeReceiptsPage'));
const ScholarshipsPage = lazy(() => import('../pages/scholarships/ScholarshipsPage'));
// Campus
const AnnouncementsPage = lazy(() => import('../pages/campus/AnnouncementsPage'));
const CircularsPage = lazy(() => import('../pages/campus/CircularsPage'));
const EventsPage = lazy(() => import('../pages/campus/EventsPage'));
const ClubsPage = lazy(() => import('../pages/campus/ClubsPage'));
const DigitalLibraryPage = lazy(() => import('../pages/campus/DigitalLibraryPage'));
const TransportPage = lazy(() => import('../pages/campus/TransportPage'));
const HostelPage = lazy(() => import('../pages/campus/HostelPage'));
const MyHousePage = lazy(() => import('../pages/campus/MyHousePage'));
// Services
const CertificatesPage = lazy(() => import('../pages/services/CertificatesPage'));
const GrievancePage = lazy(() => import('../pages/services/GrievancePage'));
const AppointmentsPage = lazy(() => import('../pages/services/AppointmentsPage'));
const FeedbackPage = lazy(() => import('../pages/services/FeedbackPage'));
// Career
const ResumeBuilderPage = lazy(() => import('../pages/career/ResumeBuilderPage'));
const InternshipsPage = lazy(() => import('../pages/career/InternshipsPage'));
const PlacementsPage = lazy(() => import('../pages/career/PlacementsPage'));
const MyApplicationsPage = lazy(() => import('../pages/career/MyApplicationsPage'));
const AchievementsPage = lazy(() => import('../pages/career/AchievementsPage'));
// AI
const AiAssistantPage = lazy(() => import('../pages/ai/AiAssistantPage'));
const AiStudyPlanPage = lazy(() => import('../pages/ai/AiStudyPlanPage'));
// Documents & Comm
const DigitalIdCardPage = lazy(() => import('../pages/documents/DigitalIdCardPage'));
const MyDegreePage = lazy(() => import('../pages/documents/MyDegreePage'));
const MessagesPage = lazy(() => import('../pages/communication/MessagesPage'));
const GalleryPage = lazy(() => import('../pages/communication/GalleryPage'));
const NotificationsPage = lazy(() => import('../pages/communication/NotificationsPage'));
const AcademicCalendarPage = lazy(() => import('../pages/calendar/AcademicCalendarPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const HelpSupportPage = lazy(() => import('../pages/help/HelpSupportPage'));
// Shown while a page's code chunk downloads (first visit to that page only)
const PageLoader = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}><Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student/login" element={<LoginPage />} />
      <Route path="/student/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/student/reset-password" element={<ResetPasswordPage />} />
      <Route path="/student/otp" element={<OtpPage />} />
      <Route path="/student/change-password" element={<ChangePasswordPage />} />
      <Route path="/student/session-expired" element={<SessionExpiredPage />} />
      <Route path="/student/unauthorized" element={<UnauthorizedPage />} />

      {/* Main Student Portal App Layout Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
          <StudentLayout>
            <Suspense fallback={<PageLoader />}><Routes>
              <Route path="student/dashboard" element={<StudentDashboardPage />} />
              <Route path="student/profile" element={<MyProfilePage />} />
              <Route path="student/subjects" element={<MySubjectsPage />} />
              <Route path="student/subjects/:id" element={<SubjectDetailPage />} />
              <Route path="student/attendance" element={<AttendanceDashboardPage />} />
              <Route path="student/leave" element={<LeaveRequestPage />} />
              <Route path="student/timetable" element={<StudentTimetablePage />} />
              <Route path="student/classes" element={<MyClassesPage />} />
              <Route path="student/assignments" element={<AssignmentsListPage />} />
              <Route path="student/assignments/:id" element={<AssignmentDetailPage />} />
              <Route path="student/materials" element={<MaterialLibraryPage />} />
              <Route path="student/question-bank" element={<QuestionBankPage />} />
              <Route path="student/practice-tests" element={<PracticeTestSimulatorPage />} />
              <Route path="student/exams" element={<ExamSchedulePage />} />
              <Route path="student/exams/:examId/hall-ticket" element={<HallTicketPage />} />
              <Route path="student/results" element={<StudentResultsPage />} />
              <Route path="student/fees" element={<FeeOverviewPage />} />
              <Route path="student/fees/pay" element={<PayFeesPage />} />
              <Route path="student/fees/receipts" element={<FeeReceiptsPage />} />
              <Route path="student/scholarships" element={<ScholarshipsPage />} />
              <Route path="student/announcements" element={<AnnouncementsPage />} />
              <Route path="student/circulars" element={<CircularsPage />} />
              <Route path="student/events" element={<EventsPage />} />
              <Route path="student/clubs" element={<ClubsPage />} />
              <Route path="student/library" element={<DigitalLibraryPage />} />
              <Route path="student/transport" element={<TransportPage />} />
              <Route path="student/hostel" element={<HostelPage />} />
              <Route path="student/house" element={<MyHousePage />} />
              <Route path="student/certificates" element={<CertificatesPage />} />
              <Route path="student/documents" element={<MyDocumentsPage />} />
              <Route path="student/grievances" element={<GrievancePage />} />
              <Route path="student/appointments" element={<AppointmentsPage />} />
              <Route path="student/feedback" element={<FeedbackPage />} />
              <Route path="student/resume" element={<ResumeBuilderPage />} />
              <Route path="student/internships" element={<InternshipsPage />} />
              <Route path="student/placements" element={<PlacementsPage />} />
              <Route path="student/applications" element={<MyApplicationsPage />} />
              <Route path="student/achievements" element={<AchievementsPage />} />
              <Route path="student/ai" element={<AiAssistantPage />} />
              <Route path="student/ai/study-plan" element={<AiStudyPlanPage />} />
              <Route path="student/id-card" element={<DigitalIdCardPage />} />
              <Route path="student/degree" element={<MyDegreePage />} />
              <Route path="student/messages" element={<MessagesPage />} />
              <Route path="student/gallery" element={<GalleryPage />} />
              <Route path="student/notifications" element={<NotificationsPage />} />
              <Route path="student/calendar" element={<AcademicCalendarPage />} />
              <Route path="student/settings" element={<SettingsPage />} />
              <Route path="student/help" element={<HelpSupportPage />} />

              {/* Default Fallback Redirect */}
              <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
            </Routes></Suspense>
          </StudentLayout>
          </ProtectedRoute>
        }
      />
    </Routes></Suspense>
  );
};

export default AppRoutes;
