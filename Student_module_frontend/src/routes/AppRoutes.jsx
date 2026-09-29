import React from 'react';
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
import StudentDashboardPage from '../pages/dashboard/StudentDashboardPage';
import MyProfilePage from '../pages/profile/MyProfilePage';

// Academics
import MySubjectsPage from '../pages/academics/MySubjectsPage';
import SubjectDetailPage from '../pages/academics/SubjectDetailPage';
import AttendanceDashboardPage from '../pages/attendance/AttendanceDashboardPage';
import LeaveRequestPage from '../pages/leave/LeaveRequestPage';
import StudentTimetablePage from '../pages/timetable/StudentTimetablePage';
import MyClassesPage from '../pages/classroom/MyClassesPage';
import AssignmentsListPage from '../pages/assignments/AssignmentsListPage';
import AssignmentDetailPage from '../pages/assignments/AssignmentDetailPage';
import MaterialLibraryPage from '../pages/materials/MaterialLibraryPage';
import QuestionBankPage from '../pages/questions/QuestionBankPage';
import PracticeTestSimulatorPage from '../pages/questions/PracticeTestSimulatorPage';

// Exams & Results
import ExamSchedulePage from '../pages/exams/ExamSchedulePage';
import StudentResultsPage from '../pages/results/StudentResultsPage';

// Fees
import FeeOverviewPage from '../pages/fees/FeeOverviewPage';
import PayFeesPage from '../pages/fees/PayFeesPage';
import FeeReceiptsPage from '../pages/fees/FeeReceiptsPage';
import ScholarshipsPage from '../pages/scholarships/ScholarshipsPage';

// Campus
import AnnouncementsPage from '../pages/campus/AnnouncementsPage';
import EventsPage from '../pages/campus/EventsPage';
import ClubsPage from '../pages/campus/ClubsPage';
import DigitalLibraryPage from '../pages/campus/DigitalLibraryPage';
import TransportPage from '../pages/campus/TransportPage';
import HostelPage from '../pages/campus/HostelPage';

// Services
import CertificatesPage from '../pages/services/CertificatesPage';
import GrievancePage from '../pages/services/GrievancePage';
import AppointmentsPage from '../pages/services/AppointmentsPage';
import FeedbackPage from '../pages/services/FeedbackPage';

// Career
import ResumeBuilderPage from '../pages/career/ResumeBuilderPage';
import InternshipsPage from '../pages/career/InternshipsPage';
import PlacementsPage from '../pages/career/PlacementsPage';
import MyApplicationsPage from '../pages/career/MyApplicationsPage';
import AchievementsPage from '../pages/career/AchievementsPage';

// AI
import AiAssistantPage from '../pages/ai/AiAssistantPage';
import AiStudyPlanPage from '../pages/ai/AiStudyPlanPage';

// Documents & Comm
import DigitalIdCardPage from '../pages/documents/DigitalIdCardPage';
import MyDegreePage from '../pages/documents/MyDegreePage';
import MessagesPage from '../pages/communication/MessagesPage';
import GalleryPage from '../pages/communication/GalleryPage';
import NotificationsPage from '../pages/communication/NotificationsPage';
import AcademicCalendarPage from '../pages/calendar/AcademicCalendarPage';
import SettingsPage from '../pages/settings/SettingsPage';
import HelpSupportPage from '../pages/help/HelpSupportPage';

export const AppRoutes = () => {
  return (
    <Routes>
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
            <Routes>
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
              <Route path="student/results" element={<StudentResultsPage />} />
              <Route path="student/fees" element={<FeeOverviewPage />} />
              <Route path="student/fees/pay" element={<PayFeesPage />} />
              <Route path="student/fees/receipts" element={<FeeReceiptsPage />} />
              <Route path="student/scholarships" element={<ScholarshipsPage />} />
              <Route path="student/announcements" element={<AnnouncementsPage />} />
              <Route path="student/events" element={<EventsPage />} />
              <Route path="student/clubs" element={<ClubsPage />} />
              <Route path="student/library" element={<DigitalLibraryPage />} />
              <Route path="student/transport" element={<TransportPage />} />
              <Route path="student/hostel" element={<HostelPage />} />
              <Route path="student/certificates" element={<CertificatesPage />} />
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
            </Routes>
          </StudentLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
