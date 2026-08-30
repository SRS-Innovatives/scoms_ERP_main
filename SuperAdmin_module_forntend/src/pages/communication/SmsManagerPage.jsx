import React, { useState, useEffect, useCallback } from 'react';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import PurchaseSmsCreditsModal from '../../components/modals/PurchaseSmsCreditsModal';
import AllocateSmsCreditsModal from '../../components/modals/AllocateSmsCreditsModal';
import { useNotification } from '../../context/NotificationContext';
import smsService from '../../services/smsService';
import { MessageSquare, CheckCircle, AlertTriangle, Wallet, ShoppingCart, Send, Loader2 } from 'lucide-react';

export const SmsManagerPage = () => {
  const { error: showError } = useNotification();
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
        smsService.getSmsStats(),
        smsService.getWalletOverview(),
      ]);
      setStats(statsRes.data || []);
      setWallet(walletRes.data);
    } catch (err) {
      showError(err.message || 'Failed to load SMS data', 'Load Failed');
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
          onClick={() => {
            setPreselectedInstitutionId(id);
            setAllocateModalOpen(true);
          }}
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
        title="SMS & Telecommunication Administration"
        subtitle="Purchase SMS credits from a provider, allocate them to institutions, and monitor delivery."
        actionLabel="Purchase Credits"
        actionIcon={ShoppingCart}
        onAction={() => setPurchaseModalOpen(true)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total SMS Sent" value={totalSent.toLocaleString()} icon={MessageSquare} color="indigo" />
        <StatCard title="SMS Delivered" value={totalDelivered.toLocaleString()} icon={CheckCircle} color="emerald" badgeText={deliveryRate} />
        <StatCard title="SMS Failed" value={totalFailed.toLocaleString()} icon={AlertTriangle} color="rose" />
        <StatCard title="Platform SMS Balance" value={(wallet?.platformWallet.balance ?? 0).toLocaleString()} icon={Wallet} color="sky" subtitle="Unallocated pool" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Institution-wise SMS Credit Wallets</h3>
        <button
          onClick={() => {
            setPreselectedInstitutionId(null);
            setAllocateModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
        >
          <Send className="w-4 h-4" /> Allocate to Institution
        </button>
      </div>

      {wallet?.institutionWallets.length === 0 ? (
        <EmptyState
          title="No Institutions Have SMS Credits Yet"
          message="Purchase credits from a provider, then allocate them to an institution to enable SMS sending for it."
          actionLabel="Allocate to Institution"
          onAction={() => setAllocateModalOpen(true)}
        />
      ) : (
        <DataTable columns={walletColumns} data={wallet?.institutionWallets || []} keyField="institutionId" searchPlaceholder="Search institution..." />
      )}

      {(wallet?.recentPurchases.length > 0 || wallet?.recentAllocations.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Purchases</h4>
            <div className="space-y-2 text-xs">
              {wallet.recentPurchases.length === 0 ? (
                <p className="text-slate-400">No purchases recorded yet.</p>
              ) : (
                wallet.recentPurchases.map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{p.provider} — {p.credits.toLocaleString()} credits</span>
                    <span className="text-slate-400 font-mono">₹{p.amountINR.toLocaleString('en-IN')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Allocations</h4>
            <div className="space-y-2 text-xs">
              {wallet.recentAllocations.length === 0 ? (
                <p className="text-slate-400">No allocations recorded yet.</p>
              ) : (
                wallet.recentAllocations.map((a) => (
                  <div key={a.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{a.institution?.name}</span>
                    <span className="text-emerald-600 font-mono font-bold">+{a.credits.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <PurchaseSmsCreditsModal isOpen={purchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} onPurchased={fetchAll} />
      <AllocateSmsCreditsModal
        isOpen={allocateModalOpen}
        onClose={() => setAllocateModalOpen(false)}
        onAllocated={fetchAll}
        platformBalance={wallet?.platformWallet.balance}
        preselectedInstitutionId={preselectedInstitutionId}
      />
    </div>
  );
};

export default SmsManagerPage;
