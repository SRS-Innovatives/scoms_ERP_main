import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SuperAdminLayout from '../components/layout/SuperAdminLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// Main Dashboard
import SuperAdminDashboardPage from '../pages/dashboard/SuperAdminDashboardPage';

// Institution Pages
import InstitutionListPage from '../pages/institutions/InstitutionListPage';
import ReportManagementPage from '../pages/reports/ReportManagementPage';
import InstitutionReportAssignmentPage from '../pages/reports/InstitutionReportAssignmentPage';
import ReportRequestReviewPage from '../pages/reports/ReportRequestReviewPage';
import OnboardingWizardPage from '../pages/institutions/OnboardingWizardPage';
import InstitutionDetailPage from '../pages/institutions/InstitutionDetailPage';
import InstitutionModuleAccessPage from '../pages/institutions/InstitutionModuleAccessPage';
import InstitutionActivityPage from '../pages/institutions/InstitutionActivityPage';
import AdmissionFieldApprovalsPage from '../pages/institutions/AdmissionFieldApprovalsPage';

// Subscriptions
import PlansListPage from '../pages/subscriptions/PlansListPage';
import CreatePlanPage from '../pages/subscriptions/CreatePlanPage';
import ActiveSubscriptionsPage from '../pages/subscriptions/ActiveSubscriptionsPage';
import RenewalManagementPage from '../pages/subscriptions/RenewalManagementPage';

// Billing
import InvoicesPage from '../pages/billing/InvoicesPage';
import InvoicePrintPage from '../pages/billing/InvoicePrintPage';
import PaymentsPage from '../pages/billing/PaymentsPage';
import TaxSettingsPage from '../pages/billing/TaxSettingsPage';

// Users & RBAC
import AllUsersPage from '../pages/users/AllUsersPage';
import RolesListPage from '../pages/users/RolesListPage';
import PermissionMatrixPage from '../pages/users/PermissionMatrixPage';

// Modules
import ModuleManagerPage from '../pages/modules/ModuleManagerPage';
import FeatureFlagsPage from '../pages/modules/FeatureFlagsPage';

// Communication
import SmsManagerPage from '../pages/communication/SmsManagerPage';
import WhatsappManagerPage from '../pages/communication/WhatsappManagerPage';
import EmailManagerPage from '../pages/communication/EmailManagerPage';
import NotificationCenterPage from '../pages/communication/NotificationCenterPage';
import AnnouncementsPage from '../pages/communication/AnnouncementsPage';

// Support
import SupportTicketsPage from '../pages/support/SupportTicketsPage';
import TicketDetailPage from '../pages/support/TicketDetailPage';
import KnowledgeBasePage from '../pages/support/KnowledgeBasePage';

// Analytics
import PlatformAnalyticsPage from '../pages/analytics/PlatformAnalyticsPage';
import StateWiseAnalyticsPage from '../pages/analytics/StateWiseAnalyticsPage';
import RevenueAnalyticsPage from '../pages/analytics/RevenueAnalyticsPage';

// AI Management
import AiDashboardPage from '../pages/ai/AiDashboardPage';
import AiConfigPage from '../pages/ai/AiConfigPage';

// Security & Audit
import AuditLogsPage from '../pages/security/AuditLogsPage';
import SecurityCenterPage from '../pages/security/SecurityCenterPage';
import SessionsPage from '../pages/security/SessionsPage';

// System & Integrations
import IntegrationsPage from '../pages/system/IntegrationsPage';
import ApiManagementPage from '../pages/system/ApiManagementPage';
import StorageManagementPage from '../pages/system/StorageManagementPage';
import BackupManagementPage from '../pages/system/BackupManagementPage';
import SystemHealthPage from '../pages/system/SystemHealthPage';
import MaintenanceModePage from '../pages/system/MaintenanceModePage';

// Settings & Profile
import SettingsPage from '../pages/settings/SettingsPage';
import BrandingSettingsPage from '../pages/settings/BrandingSettingsPage';
import SuperAdminProfilePage from '../pages/profile/SuperAdminProfilePage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Standalone Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/super-admin/login" element={<LoginPage />} />
      <Route path="/super-admin/forgot-password" element={<ForgotPasswordPage />} />

      {/* Super Admin Layout Wrapped Routes */}
      <Route
        path="/super-admin/*"
        element={
          <SuperAdminLayout>
            <Routes>
              <Route path="dashboard" element={<SuperAdminDashboardPage />} />

              {/* Institution Routes */}
              <Route path="institutions" element={<InstitutionListPage />} />
              <Route path="institutions/new" element={<OnboardingWizardPage />} />
              <Route path="institutions/modules" element={<InstitutionModuleAccessPage />} />
              <Route path="institutions/activity" element={<InstitutionActivityPage />} />
              <Route path="institutions/admission-fields" element={<AdmissionFieldApprovalsPage />} />
              <Route path="institutions/:id" element={<InstitutionDetailPage />} />

              {/* Dynamic Report Engine Management */}
              <Route path="reports" element={<ReportManagementPage />} />
              <Route path="reports/assignment" element={<InstitutionReportAssignmentPage />} />
              <Route path="reports/requests" element={<ReportRequestReviewPage />} />

              {/* Subscriptions */}
              <Route path="plans" element={<PlansListPage />} />
              <Route path="plans/new" element={<CreatePlanPage />} />
              <Route path="subscriptions" element={<ActiveSubscriptionsPage />} />
              <Route path="subscriptions/trials" element={<ActiveSubscriptionsPage />} />
              <Route path="subscriptions/renewals" element={<RenewalManagementPage />} />

              {/* Billing */}
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/:id" element={<InvoicePrintPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="billing/refunds" element={<InvoicesPage />} />
              <Route path="billing/transactions" element={<InvoicesPage />} />
              <Route path="billing/tax-settings" element={<TaxSettingsPage />} />

              {/* Users & RBAC */}
              <Route path="users" element={<AllUsersPage />} />
              <Route path="roles" element={<RolesListPage />} />
              <Route path="permissions" element={<PermissionMatrixPage />} />

              {/* Modules */}
              <Route path="modules" element={<ModuleManagerPage />} />
              <Route path="feature-flags" element={<FeatureFlagsPage />} />

              {/* Communication */}
              <Route path="sms" element={<SmsManagerPage />} />
              <Route path="whatsapp" element={<WhatsappManagerPage />} />
              <Route path="email" element={<EmailManagerPage />} />
              <Route path="notifications" element={<NotificationCenterPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />

              {/* Support */}
              <Route path="tickets" element={<SupportTicketsPage />} />
              <Route path="tickets/:id" element={<TicketDetailPage />} />
              <Route path="knowledge-base" element={<KnowledgeBasePage />} />

              {/* Analytics */}
              <Route path="analytics" element={<PlatformAnalyticsPage />} />
              <Route path="analytics/state" element={<StateWiseAnalyticsPage />} />
              <Route path="analytics/revenue" element={<RevenueAnalyticsPage />} />
              <Route path="analytics/users" element={<PlatformAnalyticsPage />} />
              <Route path="analytics/usage" element={<PlatformAnalyticsPage />} />

              {/* AI Management */}
              <Route path="ai" element={<AiDashboardPage />} />
              <Route path="ai/usage" element={<AiDashboardPage />} />
              <Route path="ai/config" element={<AiConfigPage />} />

              {/* Security & Audit */}
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="security/login-activity" element={<AuditLogsPage />} />
              <Route path="security/sessions" element={<SessionsPage />} />
              <Route path="security" element={<SecurityCenterPage />} />

              {/* System & Integrations */}
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="api" element={<ApiManagementPage />} />
              <Route path="storage" element={<StorageManagementPage />} />
              <Route path="backups" element={<BackupManagementPage />} />
              <Route path="system-health" element={<SystemHealthPage />} />
              <Route path="maintenance" element={<MaintenanceModePage />} />

              {/* Settings & Profile */}
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/branding" element={<BrandingSettingsPage />} />
              <Route path="profile" element={<SuperAdminProfilePage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
            </Routes>
          </SuperAdminLayout>
        }
      />

      {/* Global Fallback */}
      <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
