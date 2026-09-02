import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import PurchaseEmailCreditsModal from '../../components/modals/PurchaseEmailCreditsModal';
import AllocateEmailCreditsModal from '../../components/modals/AllocateEmailCreditsModal';
import { Mail, Settings, AlertCircle, Play, CheckCircle, Wallet, ShoppingCart, Send, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import emailService from '../../services/emailService';

export const EmailManagerPage = () => {
  const { success, error: showError } = useNotification();
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    user: 'notifications@scoms.in',
    encryption: 'TLS',
  });
  const [testEmail, setTestEmail] = useState('');

  const [stats, setStats] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [preselectedInstitutionId, setPreselectedInstitutionId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes, walletRes] = await Promise.all([
        emailService.getEmailStats(),
        emailService.getRecentLogs(),
        emailService.getWalletOverview(),
      ]);
      setStats(statsRes.data || []);
      setRecentLogs(logsRes.data || []);
      setWallet(walletRes.data);
    } catch (err) {
      showError(err.message || 'Failed to load email data', 'Load Failed');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totalSent = stats.reduce((sum, s) => sum + s.totalSent, 0);
  const totalDelivered = stats.reduce((sum, s) => sum + s.delivered, 0);
  const totalFailed = stats.reduce((sum, s) => sum + s.failed, 0);
  const deliveryRate = totalSent > 0 ? `${((totalDelivered / totalSent) * 100).toFixed(1)}%` : '—';
  const bounceRate = totalSent > 0 ? `${((totalFailed / totalSent) * 100).toFixed(1)}%` : '0.0%';

  const handleSave = (e) => {
    e.preventDefault();
    success('SMTP configurations updated successfully!');
  };

  const handleTest = (e) => {
    e.preventDefault();
    success(`Test email dispatched to ${testEmail}! Check mailbox.`);
    setTestEmail('');
  };

  const logColumns = [
    { header: 'Recipient', key: 'recipientEmail', render: (val) => <span className="font-semibold">{val}</span> },
    { header: 'Subject', key: 'subject' },
    { header: 'Institution', key: 'institution', sortable: false, render: (v) => v?.name || 'Platform' },
    { header: 'Date & Time', key: 'createdAt', render: (val) => <span className="font-mono text-xs">{new Date(val).toLocaleString('en-IN')}</span> },
    {
      header: 'Status',
      key: 'status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'SENT' || val === 'SIMULATED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'}`}>
          {val}
        </span>
      )
    }
  ];

  const walletColumns = [
    { header: 'Institution', key: 'institution', sortable: false, render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v?.name}</span> },
    { header: 'Code', key: 'institution2', sortable: false, render: (_, row) => <span className="font-mono text-xs text-indigo-600">{row.institution?.code}</span> },
    { header: 'Total Allocated', key: 'totalAllocated', render: (v) => `${v.toLocaleString()} Credits` },
    { header: 'Used', key: 'totalUsed', render: (v) => `${v.toLocaleString()} Credits` },
    {
      header: 'Remaining Balance',
      key: 'balance',
      render: (v) => (
        <span className={`font-bold ${v === 0 ? 'text-rose-600' : v < 100 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {v.toLocaleString()} Credits
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'institutionId',
      sortable: false,
      render: (id) => (
        <button
          onClick={() => { setPreselectedInstitutionId(id); setAllocateModalOpen(true); }}
          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100"
        >
          Allocate More
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Server Configuration"
        subtitle="Purchase email credits from a provider, allocate them to institutions, and monitor delivery."
        actionLabel="Purchase Credits"
        actionIcon={ShoppingCart}
        onAction={() => setPurchaseModalOpen(true)}
      />

      {/* KPI Stats — real, from EmailLog */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Mails Sent" value={totalSent.toLocaleString()} subtitle="All-time" icon={Mail} color="indigo" />
        <StatCard title="Delivery Rate" value={deliveryRate} subtitle={`${totalDelivered.toLocaleString()} delivered`} icon={CheckCircle} color="emerald" />
        <StatCard title="Bounce Rate" value={bounceRate} subtitle={`${totalFailed.toLocaleString()} failed`} icon={AlertCircle} color="rose" />
        <StatCard title="Platform Email Balance" value={(wallet?.platformWallet.balance ?? 0).toLocaleString()} subtitle="Unallocated pool" icon={Wallet} color="sky" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form (unchanged) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">SMTP Server Configuration</h3>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">SMTP Host</label>
              <input
                type="text"
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">SMTP Port</label>
              <input
                type="text"
                value={smtpConfig.port}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">SMTP Username</label>
              <input
                type="email"
                value={smtpConfig.user}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Encryption Protocol</label>
              <select
                value={smtpConfig.encryption}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, encryption: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="TLS">STARTTLS (Port 587)</option>
                <option value="SSL">SSL / TLS (Port 465)</option>
                <option value="None">None (Port 25)</option>
              </select>
            </div>
            <div className="sm:col-span-2 pt-2">
              <button type="submit" className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                Save Email Settings
              </button>
            </div>
          </form>
        </div>

        {/* Test Email Card (unchanged) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Play className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Send Test Email</h3>
          </div>
          <form onSubmit={handleTest} className="space-y-4 text-xs">
            <p className="text-slate-500">Dispatch a mock email to verify SMTP gateway connection credentials.</p>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Recipient Address</label>
              <input
                type="email"
                required
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <button type="submit" className="w-full py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              Dispatch Test Message
            </button>
          </form>
        </div>
      </div>

      {/* Institution-wise Email Credit Wallets */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Institution-wise Email Credit Wallets</h3>
        <button
          onClick={() => { setPreselectedInstitutionId(null); setAllocateModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
        >
          <Send className="w-4 h-4" /> Allocate to Institution
        </button>
      </div>

      {wallet?.institutionWallets.length === 0 ? (
        <EmptyState
          title="No Institutions Have Email Credits Yet"
          message="Purchase credits from a provider, then allocate them to an institution to enable email sending for it."
          actionLabel="Allocate to Institution"
          onAction={() => setAllocateModalOpen(true)}
        />
      ) : (
        <DataTable columns={walletColumns} data={wallet?.institutionWallets || []} keyField="institutionId" searchPlaceholder="Search institution..." />
      )}

      {/* Real Activity Audit Trail */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">SMTP Activity Audit Trail</h3>
        {recentLogs.length === 0 ? (
          <EmptyState title="No Emails Sent Yet" message="Once welcome-credential or other system emails go out, they'll appear here." />
        ) : (
          <DataTable columns={logColumns} data={recentLogs} />
        )}
      </div>

      <PurchaseEmailCreditsModal isOpen={purchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} onPurchased={fetchAll} />
      <AllocateEmailCreditsModal
        isOpen={allocateModalOpen}
        onClose={() => setAllocateModalOpen(false)}
        onAllocated={fetchAll}
        platformBalance={wallet?.platformWallet.balance}
        preselectedInstitutionId={preselectedInstitutionId}
      />
    </div>
  );
};

export default EmailManagerPage;
