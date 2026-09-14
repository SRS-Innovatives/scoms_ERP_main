import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Receipt,
  MessageSquare,
  LifeBuoy,
  BarChart3,
  Bot,
  ShieldAlert,
  Server,
  Settings,
  FileBarChart
} from 'lucide-react';

export const navigationConfig = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/super-admin/dashboard'
  },
  {
    key: 'platform',
    title: 'Platform',
    icon: Building2,
    children: [
      { key: 'institutions-list', title: 'Institutions', path: '/super-admin/institutions' },
      { key: 'onboarding-wizard', title: 'Institution Onboarding', path: '/super-admin/institutions/new' },
      { key: 'institution-modules', title: 'Institution Modules', path: '/super-admin/institutions/modules' },
      { key: 'institution-activity', title: 'Institution Activity', path: '/super-admin/institutions/activity' },
      { key: 'admission-field-approvals', title: 'Admission Field Approvals', path: '/super-admin/institutions/admission-fields' }
    ]
  },
  {
    key: 'reports',
    title: 'Report Engine',
    icon: FileBarChart,
    children: [
      { key: 'reports-catalog', title: 'Report Catalog', path: '/super-admin/reports' },
      { key: 'reports-assignment', title: 'Institution Assignment', path: '/super-admin/reports/assignment' },
      { key: 'reports-requests', title: 'Custom Report Requests', path: '/super-admin/reports/requests' }
    ]
  },
  {
    key: 'users',
    title: 'Users & RBAC',
    icon: Users,
    children: [
      { key: 'all-users', title: 'All Users', path: '/super-admin/users' },
      { key: 'roles-list', title: 'Roles', path: '/super-admin/roles' },
      { key: 'permission-matrix', title: 'Permissions', path: '/super-admin/permissions' }
    ]
  },
  {
    key: 'subscriptions',
    title: 'Subscriptions',
    icon: CreditCard,
    children: [
      { key: 'plans-list', title: 'Plans & Limits', path: '/super-admin/plans' },
      { key: 'active-subscriptions', title: 'Active Subscriptions', path: '/super-admin/subscriptions' },
      { key: 'trial-subscriptions', title: 'Trials', path: '/super-admin/subscriptions/trials' },
      { key: 'renewals', title: 'Renewals', path: '/super-admin/subscriptions/renewals' }
    ]
  },
  {
    key: 'billing',
    title: 'Billing & GST',
    icon: Receipt,
    children: [
      { key: 'invoices', title: 'Invoices', path: '/super-admin/invoices' },
      { key: 'payments', title: 'Payments', path: '/super-admin/payments' },
      { key: 'refunds', title: 'Refunds', path: '/super-admin/billing/refunds' },
      { key: 'transactions', title: 'Transactions', path: '/super-admin/billing/transactions' },
      { key: 'tax-settings', title: 'Tax Settings (GST)', path: '/super-admin/billing/tax-settings' }
    ]
  },
  {
    key: 'communication',
    title: 'Communication',
    icon: MessageSquare,
    children: [
      { key: 'sms-manager', title: 'SMS Administration', path: '/super-admin/sms' },
      { key: 'whatsapp-manager', title: 'WhatsApp Integration', path: '/super-admin/whatsapp' },
      { key: 'email-manager', title: 'Email Administration', path: '/super-admin/email' },
      { key: 'notifications-mgr', title: 'Notifications', path: '/super-admin/notifications' },
      { key: 'announcements-mgr', title: 'Announcements', path: '/super-admin/announcements' }
    ]
  },
  {
    key: 'support',
    title: 'Support Desk',
    icon: LifeBuoy,
    badge: '3 Open',
    children: [
      { key: 'support-tickets', title: 'Tickets', path: '/super-admin/tickets' },
      { key: 'knowledge-base', title: 'Knowledge Base', path: '/super-admin/knowledge-base' }
    ]
  },
  {
    key: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    children: [
      { key: 'platform-analytics', title: 'Platform Analytics', path: '/super-admin/analytics' },
      { key: 'state-analytics', title: 'State-wise Analytics', path: '/super-admin/analytics/state' },
      { key: 'revenue-analytics', title: 'Revenue Analytics', path: '/super-admin/analytics/revenue' },
      { key: 'user-analytics', title: 'User Analytics', path: '/super-admin/analytics/users' },
      { key: 'usage-analytics', title: 'Usage Analytics', path: '/super-admin/analytics/usage' }
    ]
  },
  {
    key: 'ai',
    title: 'AI Administration',
    icon: Bot,
    children: [
      { key: 'ai-dashboard', title: 'AI Dashboard', path: '/super-admin/ai' },
      { key: 'ai-usage', title: 'AI Usage & Token Cost', path: '/super-admin/ai/usage' },
      { key: 'ai-config', title: 'AI Configuration', path: '/super-admin/ai/config' }
    ]
  },
  {
    key: 'security',
    title: 'Security Center',
    icon: ShieldAlert,
    children: [
      { key: 'audit-logs', title: 'Audit Logs', path: '/super-admin/audit-logs' },
      { key: 'login-activity', title: 'Login Activity', path: '/super-admin/security/login-activity' },
      { key: 'sessions', title: 'Active Sessions', path: '/super-admin/security/sessions' },
      { key: 'security-center', title: 'Security Policies', path: '/super-admin/security' }
    ]
  },
  {
    key: 'system',
    title: 'System & Health',
    icon: Server,
    children: [
      { key: 'integrations', title: 'Integrations', path: '/super-admin/integrations' },
      { key: 'api-management', title: 'API Management', path: '/super-admin/api' },
      { key: 'storage-mgr', title: 'Storage Management', path: '/super-admin/storage' },
      { key: 'backups-mgr', title: 'Backup & Restore', path: '/super-admin/backups' },
      { key: 'system-health', title: 'System Health', path: '/super-admin/system-health' },
      { key: 'maintenance-mode', title: 'Maintenance Mode', path: '/super-admin/maintenance' }
    ]
  },
  {
    key: 'settings',
    title: 'Platform Settings',
    icon: Settings,
    children: [
      { key: 'settings-general', title: 'General & Localization', path: '/super-admin/settings' },
      { key: 'settings-branding', title: 'Branding & White Label', path: '/super-admin/settings/branding' }
    ]
  }
];
