import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Tabs from '../../components/common/Tabs';
import { useNotification } from '../../context/NotificationContext';
import { Zap, Plus, Edit, Trash2, History, PlayCircle, Loader2 } from 'lucide-react';
import automationService from '../../services/automationService';

const ACTION_TYPES = [
  { value: 'SEND_SMS', label: 'Send SMS' },
  { value: 'SEND_EMAIL', label: 'Send Email' },
  { value: 'SEND_WHATSAPP', label: 'Send WhatsApp' },
];

const emptyForm = { name: '', triggerEvent: '', actionType: 'SEND_SMS', messageTemplate: '' };

export const AutomationEnginePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [tab, setTab] = useState('rules');
  const [rules, setRules] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [testFireOpen, setTestFireOpen] = useState(false);
  const [testEventType, setTestEventType] = useState('');

  const fetchRules = useCallback(() => {
    setLoading(true);
    Promise.all([automationService.getRules(), automationService.getEventTypes()])
      .then(([rulesRes, typesRes]) => { setRules(rulesRes.data || []); setEventTypes(typesRes.data || []); })
      .catch((err) => notifyError(`Failed to load automation rules: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    automationService.getEventHistory()
      .then((res) => setEvents(res.data || []))
      .catch((err) => notifyError(`Failed to load event history: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { tab === 'rules' ? fetchRules() : fetchEvents(); }, [tab, fetchRules, fetchEvents]);

  const openAddModal = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEditModal = (r) => { setEditingId(r.id); setForm({ name: r.name, triggerEvent: r.triggerEvent, actionType: r.actionType, messageTemplate: r.messageTemplate }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await automationService.updateRule(editingId, { name: form.name, messageTemplate: form.messageTemplate });
        notifySuccess(`Rule "${form.name}" updated successfully!`);
      } else {
        await automationService.createRule(form);
        notifySuccess(`Rule "${form.name}" created successfully!`);
      }
      setModalOpen(false);
      fetchRules();
    } catch (err) {
      notifyError(`Failed to save rule: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (rule) => {
    try {
      await automationService.updateRule(rule.id, { isActive: !rule.isActive });
      notifySuccess(`Rule ${rule.isActive ? 'deactivated' : 'activated'}`);
      fetchRules();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await automationService.deleteRule(deleteTarget.id);
      notifySuccess('Rule deleted');
      setDeleteTarget(null);
      fetchRules();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleTestFire = async () => {
    if (!testEventType) { notifyError('Select an event type'); return; }
    try {
      await automationService.testFireEvent({ eventType: testEventType, payload: { name: 'Test Person', admissionNumber: 'ADM/TEST/000', phone: '+910000000000', email: 'test@example.com' } });
      notifySuccess(`Test event "${testEventType}" fired — check Event History`);
      setTestFireOpen(false);
    } catch (err) {
      notifyError(err.message);
    }
  };

  const ruleColumns = [
    { header: 'Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Trigger Event', key: 'triggerEvent', render: (val) => <span className="font-mono text-[11px]">{val}</span> },
    { header: 'Action', key: 'actionType', render: (val) => ACTION_TYPES.find((a) => a.value === val)?.label || val },
    { header: 'Message', key: 'messageTemplate', render: (val) => <span className="truncate max-w-xs block">{val}</span> },
    {
      header: 'Active', key: 'isActive', sortable: false,
      render: (val, row) => (
        <button onClick={() => toggleActive(row)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${val ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
          {val ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(row)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  const eventColumns = [
    { header: 'Event Type', key: 'eventType', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Payload', key: 'payload', sortable: false, render: (val) => <span className="text-[11px] font-mono text-slate-500 truncate max-w-md block">{JSON.stringify(val)}</span> },
    { header: 'When', key: 'createdAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Event Automation</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure "when X happens, send this notification" rules</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTestFireOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl">
            <PlayCircle className="w-4 h-4" /><span>Test Fire Event</span>
          </button>
          <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs">
            <Plus className="w-4 h-4" /><span>New Rule</span>
          </button>
        </div>
      </div>

      <Tabs tabs={[{ id: 'rules', label: 'Automation Rules', icon: Zap }, { id: 'history', label: 'Event History', icon: History }]} activeTab={tab} onChange={setTab} />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : tab === 'rules' ? (
        rules.length === 0 ? (
          <EmptyState title="No Automation Rules" description="Create your first rule." actionLabel="New Rule" onAction={openAddModal} icon={Zap} />
        ) : (
          <DataTable columns={ruleColumns} data={rules} />
        )
      ) : events.length === 0 ? (
        <EmptyState title="No Events Yet" description="Events will appear here as real actions happen (or via Test Fire)." icon={History} />
      ) : (
        <DataTable columns={eventColumns} data={events} />
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Rule' : 'New Automation Rule'}
        icon={Zap}
        submitLabel={editingId ? 'Save Changes' : 'Create Rule'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'name', label: 'Rule Name', required: true, span: 'full' },
          { name: 'triggerEvent', label: 'Trigger Event', type: 'select', required: true, disabled: !!editingId, options: eventTypes.map((t) => ({ value: t, label: t })) },
          { name: 'actionType', label: 'Action', type: 'select', required: true, disabled: !!editingId, options: ACTION_TYPES },
          { name: 'messageTemplate', label: 'Message Template', type: 'textarea', required: true, span: 'full', placeholder: 'Use {{name}}, {{admissionNumber}}, etc.' },
        ]}
      />

      {testFireOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Test Fire an Event</h3>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Event Type</label>
            <select value={testEventType} onChange={(e) => setTestEventType(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium mb-4">
              <option value="">Select...</option>
              {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setTestFireOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
              <button onClick={handleTestFire} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs">Fire Test Event</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Automation Rule"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AutomationEnginePage;
