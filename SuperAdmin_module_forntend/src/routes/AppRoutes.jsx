import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SuperAdminLayout from '../components/layout/SuperAdminLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// Main Dashboard
const SuperAdminDashboardPage = lazy(() => import('../pages/dashboard/SuperAdminDashboardPage'));
// Institution Pages
const InstitutionListPage = lazy(() => import('../pages/institutions/InstitutionListPage'));
const ReportManagementPage = lazy(() => import('../pages/reports/ReportManagementPage'));
const InstitutionReportAssignmentPage = lazy(() => import('../pages/reports/InstitutionReportAssignmentPage'));
const ReportRequestReviewPage = lazy(() => import('../pages/reports/ReportRequestReviewPage'));
const OnboardingWizardPage = lazy(() => import('../pages/institutions/OnboardingWizardPage'));
const InstitutionDetailPage = lazy(() => import('../pages/institutions/InstitutionDetailPage'));
const InstitutionModuleAccessPage = lazy(() => import('../pages/institutions/InstitutionModuleAccessPage'));
const InstitutionActivityPage = lazy(() => import('../pages/institutions/InstitutionActivityPage'));
const AdmissionFieldApprovalsPage = lazy(() => import('../pages/institutions/AdmissionFieldApprovalsPage'));
// Subscriptions
const PlansListPage = lazy(() => import('../pages/subscriptions/PlansListPage'));
const CreatePlanPage = lazy(() => import('../pages/subscriptions/CreatePlanPage'));
const ActiveSubscriptionsPage = lazy(() => import('../pages/subscriptions/ActiveSubscriptionsPage'));
const RenewalManagementPage = lazy(() => import('../pages/subscriptions/RenewalManagementPage'));
// Billing
const BillingDashboardPage = lazy(() => import('../pages/billing/BillingDashboardPage'));
const InvoicesPage = lazy(() => import('../pages/billing/InvoicesPage'));
const InvoicePrintPage = lazy(() => import('../pages/billing/InvoicePrintPage'));
const PaymentsPage = lazy(() => import('../pages/billing/PaymentsPage'));
const TaxSettingsPage = lazy(() => import('../pages/billing/TaxSettingsPage'));
// Users & RBAC
const AllUsersPage = lazy(() => import('../pages/users/AllUsersPage'));
const RolesListPage = lazy(() => import('../pages/users/RolesListPage'));
const PermissionMatrixPage = lazy(() => import('../pages/users/PermissionMatrixPage'));
// Modules
const ModuleManagerPage = lazy(() => import('../pages/modules/ModuleManagerPage'));
const ModuleRegistryDetailPage = lazy(() => import('../pages/modules/ModuleRegistryDetailPage'));
const FeatureFlagsPage = lazy(() => import('../pages/modules/FeatureFlagsPage'));
// Communication
const SmsManagerPage = lazy(() => import('../pages/communication/SmsManagerPage'));
const WhatsappManagerPage = lazy(() => import('../pages/communication/WhatsappManagerPage'));
const EmailManagerPage = lazy(() => import('../pages/communication/EmailManagerPage'));
const NotificationCenterPage = lazy(() => import('../pages/communication/NotificationCenterPage'));
const AnnouncementsPage = lazy(() => import('../pages/communication/AnnouncementsPage'));
// Support
const SupportTicketsPage = lazy(() => import('../pages/support/SupportTicketsPage'));
const TicketDetailPage = lazy(() => import('../pages/support/TicketDetailPage'));
const KnowledgeBasePage = lazy(() => import('../pages/support/KnowledgeBasePage'));
// Analytics
const PlatformAnalyticsPage = lazy(() => import('../pages/analytics/PlatformAnalyticsPage'));
const StateWiseAnalyticsPage = lazy(() => import('../pages/analytics/StateWiseAnalyticsPage'));
const RevenueAnalyticsPage = lazy(() => import('../pages/analytics/RevenueAnalyticsPage'));
// AI Management
const AiDashboardPage = lazy(() => import('../pages/ai/AiDashboardPage'));
const AiConfigPage = lazy(() => import('../pages/ai/AiConfigPage'));
// Security & Audit
const AuditLogsPage = lazy(() => import('../pages/security/AuditLogsPage'));
const SecurityCenterPage = lazy(() => import('../pages/security/SecurityCenterPage'));
const SessionsPage = lazy(() => import('../pages/security/SessionsPage'));
// System & Integrations
const IntegrationsPage = lazy(() => import('../pages/system/IntegrationsPage'));
const ApiManagementPage = lazy(() => import('../pages/system/ApiManagementPage'));
const StorageManagementPage = lazy(() => import('../pages/system/StorageManagementPage'));
const BackupManagementPage = lazy(() => import('../pages/system/BackupManagementPage'));
const SystemHealthPage = lazy(() => import('../pages/system/SystemHealthPage'));
const MaintenanceModePage = lazy(() => import('../pages/system/MaintenanceModePage'));
// Settings & Profile
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const BrandingSettingsPage = lazy(() => import('../pages/settings/BrandingSettingsPage'));
const SuperAdminProfilePage = lazy(() => import('../pages/profile/SuperAdminProfilePage'));
// Shown while a page's code chunk downloads (first visit to that page only)
const PageLoader = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}><Routes>
      {/* Standalone Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/super-admin/login" element={<LoginPage />} />
      <Route path="/super-admin/forgot-password" element={<ForgotPasswordPage />} />

      {/* Super Admin Layout Wrapped Routes */}
      <Route
        path="/super-admin/*"
        element={
          <SuperAdminLayout>
            <Suspense fallback={<PageLoader />}><Routes>
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
              <Route path="billing/dashboard" element={<BillingDashboardPage />} />
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
              <Route path="modules/:id" element={<ModuleRegistryDetailPage />} />
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
            </Routes></Suspense>
          </SuperAdminLayout>
        }
      />

      {/* Global Fallback */}
      <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
    </Routes></Suspense>
  );
};

export default AppRoutes;
