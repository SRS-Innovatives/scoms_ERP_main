import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import PurchaseWhatsappCreditsModal from '../../components/modals/PurchaseWhatsappCreditsModal';
import AllocateWhatsappCreditsModal from '../../components/modals/AllocateWhatsappCreditsModal';
import { MessageSquareCode, Settings, CheckCircle, AlertTriangle, Wallet, ShoppingCart, Send, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import whatsappService from '../../services/whatsappService';

export const WhatsappManagerPage = () => {
  const { success, error: showError } = useNotification();
  const [waConfig, setWaConfig] = useState({
    phoneNumberId: '10928471928',
    wabaId: '984712093874102',
    accessToken: 'EAAGb5ZCh8ZB40BA...',
  });

  const [stats, setStats] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [preselectedInstitutionId, setPreselectedInstitutionId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, walletRes] = await Promise.all([
        whatsappService.getWhatsappStats(),
        whatsappService.getWalletOverview(),
      ]);
      setStats(statsRes.data || []);
      setWallet(walletRes.data);
    } catch (err) {
      showError(err.message || 'Failed to load WhatsApp data', 'Load Failed');
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

  const handleSave = (e) => {
    e.preventDefault();
    success('WhatsApp Business settings updated successfully!');
  };

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
        title="WhatsApp Business API"
        subtitle="Purchase WhatsApp conversation credits from Meta/a BSP, allocate them to institutions, and monitor delivery."
        actionLabel="Purchase Credits"
        actionIcon={ShoppingCart}
        onAction={() => setPurchaseModalOpen(true)}
      />

      {/* KPI Stats — real, from WhatsappLog */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Messages Sent" value={totalSent.toLocaleString()} subtitle="All-time" icon={MessageSquareCode} color="indigo" />
        <StatCard title="Delivered" value={totalDelivered.toLocaleString()} subtitle={deliveryRate} icon={CheckCircle} color="emerald" />
        <StatCard title="Failed" value={totalFailed.toLocaleString()} subtitle="Blocked or errored" icon={AlertTriangle} color="rose" />
        <StatCard title="Platform WhatsApp Balance" value={(wallet?.platformWallet.balance ?? 0).toLocaleString()} subtitle="Unallocated pool" icon={Wallet} color="sky" />
      </div>

      {/* Settings Form (unchanged) */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Settings className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Meta API Credentials</h3>
        </div>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Phone Number ID</label>
            <input
              type="text"
              value={waConfig.phoneNumberId}
              onChange={(e) => setWaConfig({ ...waConfig, phoneNumberId: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">WhatsApp Business Account ID</label>
            <input
              type="text"
              value={waConfig.wabaId}
              onChange={(e) => setWaConfig({ ...waConfig, wabaId: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Permanent Access Token</label>
            <input
              type="password"
              value={waConfig.accessToken}
              onChange={(e) => setWaConfig({ ...waConfig, accessToken: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>
          <div className="sm:col-span-2 pt-2">
            <button type="submit" className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
              Save WhatsApp Settings
            </button>
          </div>
        </form>
      </div>

      {/* Institution-wise WhatsApp Credit Wallets */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Institution-wise WhatsApp Credit Wallets</h3>
        <button
          onClick={() => { setPreselectedInstitutionId(null); setAllocateModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
        >
          <Send className="w-4 h-4" /> Allocate to Institution
        </button>
      </div>

      {wallet?.institutionWallets.length === 0 ? (
        <EmptyState
          title="No Institutions Have WhatsApp Credits Yet"
          message="Purchase credits from Meta/a BSP, then allocate them to an institution to enable WhatsApp sending for it."
          actionLabel="Allocate to Institution"
          onAction={() => setAllocateModalOpen(true)}
        />
      ) : (
        <DataTable columns={walletColumns} data={wallet?.institutionWallets || []} keyField="institutionId" searchPlaceholder="Search institution..." />
      )}

      <PurchaseWhatsappCreditsModal isOpen={purchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} onPurchased={fetchAll} />
      <AllocateWhatsappCreditsModal
        isOpen={allocateModalOpen}
        onClose={() => setAllocateModalOpen(false)}
        onAllocated={fetchAll}
        platformBalance={wallet?.platformWallet.balance}
        preselectedInstitutionId={preselectedInstitutionId}
      />
    </div>
  );
};

export default WhatsappManagerPage;
