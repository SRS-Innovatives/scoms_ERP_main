import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { CreditCard, MessageSquare, Mail, HardDrive, Video, Fingerprint, Radio, MapPin, Plus, X, Loader2, Pencil } from 'lucide-react';
import systemService from '../../services/systemService';

const CHANNEL_META = {
  SMS: { label: 'SMS', icon: MessageSquare },
  EMAIL: { label: 'Email', icon: Mail },
  WHATSAPP: { label: 'WhatsApp', icon: MessageSquare },
  PAYMENT_GATEWAY: { label: 'Payment Gateway', icon: CreditCard },
  CLOUD_STORAGE: { label: 'Cloud Storage', icon: HardDrive },
  VIDEO_MEETING: { label: 'Video Meeting', icon: Video },
  BIOMETRIC: { label: 'Biometric', icon: Fingerprint },
  RFID: { label: 'RFID', icon: Radio },
  GPS_TRACKING: { label: 'GPS Tracking', icon: MapPin },
};

const CHANNELS = Object.keys(CHANNEL_META);
const STATUSES = ['LIVE', 'SIMULATED', 'NOT_IMPLEMENTED'];

const statusLabel = (s) => (s === 'LIVE' ? 'Connected' : s === 'SIMULATED' ? 'Simulated' : 'Not Implemented');

const RegisterModal = ({ open, onClose, onRegistered }) => {
  const { success, error: showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ channel: 'PAYMENT_GATEWAY', providerName: '', status: 'NOT_IMPLEMENTED', notes: '' });

  if (!open) return null;
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.providerName.trim()) { showError('Provider name is required', 'Missing Field'); return; }
    setSubmitting(true);
    try {
      await systemService.registerIntegrationProvider(form);
      success(`"${form.providerName}" registered as a documented option for ${CHANNEL_META[form.channel].label}`, 'Registered');
      onRegistered();
      setForm({ channel: 'PAYMENT_GATEWAY', providerName: '', status: 'NOT_IMPLEMENTED', notes: '' });
    } catch (err) {
      showError(err.message, 'Registration Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Register Provider Option</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4">Documents a known alternative for a channel — this does not activate any real functionality; it's a tracked option for the future.</p>
        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Channel</label>
            <select value={form.channel} onChange={set('channel')} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium">
              {CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_META[c].label}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Provider Name</label>
            <input value={form.providerName} onChange={set('providerName')} placeholder="e.g. Stripe, Twilio, Zoom" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Notes</label>
            <textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Why this is being considered" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50">
            {submitting ? 'Registering...' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditProviderModal = ({ provider, onClose, onSaved }) => {
  const { success, error: showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(provider?.status || 'NOT_IMPLEMENTED');
  const [notes, setNotes] = useState(provider?.notes || '');

  if (!provider) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await systemService.updateIntegrationProvider(provider.id, { status, notes });
      success(`"${provider.providerName}" updated`, 'Saved');
      onSaved();
    } catch (err) {
      showError(err.message, 'Update Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit "{provider.providerName}"</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium">
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const IntegrationsPage = () => {
  const { success, error: showError } = useNotification();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    systemService.getIntegrationProviders()
      .then((res) => setProviders(res.data || []))
      .catch((err) => showError(err.message, 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const byChannel = CHANNELS.map((channel) => ({
    channel,
    active: providers.find((p) => p.channel === channel && p.isActive),
    alternatives: providers.filter((p) => p.channel === channel && !p.isActive),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integration Hub"
        subtitle="Real, honest status per channel — Connected only where real credentials are configured, Simulated where the code path exists but falls back, Not Implemented where nothing is wired yet."
        actionLabel="Register Provider"
        actionIcon={Plus}
        onAction={() => setModalOpen(true)}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {byChannel.map(({ channel, active, alternatives }) => {
            const Icon = CHANNEL_META[channel].icon;
            const status = active?.status || 'NOT_IMPLEMENTED';
            return (
              <div key={channel} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{active?.providerName || 'No provider registered'}</h3>
                      <p className="text-[11px] text-slate-500">{CHANNEL_META[channel].label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={statusLabel(status)} size="sm" />
                    {active && (
                      <button onClick={() => setEditingProvider(active)} title="Edit" className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{active?.notes || 'No real provider is wired for this channel yet.'}</p>

                {alternatives.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Documented alternatives</p>
                    <div className="flex flex-wrap gap-1.5">
                      {alternatives.map((alt) => (
                        <button
                          key={alt.id}
                          onClick={() => setEditingProvider(alt)}
                          title="Click to edit"
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                          {alt.providerName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RegisterModal open={modalOpen} onClose={() => setModalOpen(false)} onRegistered={() => { setModalOpen(false); fetchAll(); }} />
      <EditProviderModal provider={editingProvider} onClose={() => setEditingProvider(null)} onSaved={() => { setEditingProvider(null); fetchAll(); }} />
    </div>
  );
};

export default IntegrationsPage;
