import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Tabs from '../../components/common/Tabs';
import { useNotification } from '../../context/NotificationContext';
import { GitBranch, Plus, X, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import workflowService from '../../services/workflowService';

const ROLES = ['INSTITUTE_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STAFF', 'ACCOUNTANT', 'LIBRARIAN', 'TRANSPORT_MANAGER', 'HOSTEL_WARDEN', 'EXAM_ADMIN', 'PLACEMENT_OFFICER'];

const NewDefinitionModal = ({ open, onClose, onCreated }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [workflowType, setWorkflowType] = useState('');
  const [name, setName] = useState('');
  const [steps, setSteps] = useState([{ approverRole: '' }]);

  if (!open) return null;

  const addStep = () => setSteps((s) => [...s, { approverRole: '' }]);
  const removeStep = (idx) => setSteps((s) => s.filter((_, i) => i !== idx));
  const updateStep = (idx, role) => setSteps((s) => s.map((step, i) => (i === idx ? { approverRole: role } : step)));

  const handleSubmit = async () => {
    if (!workflowType.trim() || !name.trim()) { notifyError('Workflow type and name are required'); return; }
    if (steps.some((s) => !s.approverRole)) { notifyError('Every step needs an approver role'); return; }
    setSubmitting(true);
    try {
      await workflowService.createDefinition({ workflowType: workflowType.trim().toUpperCase().replace(/\s+/g, '_'), name: name.trim(), steps });
      notifySuccess(`Workflow "${name}" created successfully!`);
      onCreated();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">New Approval Chain</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Workflow Type Key</label>
            <input value={workflowType} onChange={(e) => setWorkflowType(e.target.value)} placeholder="e.g. LEAVE_REQUEST" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-medium" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Staff Leave Approval Chain" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Approval Steps (in order)</label>
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 w-5">{idx + 1}.</span>
                  <select value={step.approverRole} onChange={(e) => updateStep(idx, e.target.value)} className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
                    <option value="">Select role...</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(idx)} className="text-rose-500 p-1"><X className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addStep} className="mt-2 text-indigo-600 font-semibold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Step</button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Workflow'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DecisionModal = ({ instance, onClose, onDecided }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');

  if (!instance) return null;

  const decide = async (decision) => {
    setBusy(true);
    try {
      const res = await workflowService.decideStep(instance.id, { decision, comment: comment.trim() || undefined });
      notifySuccess(res.message || 'Decision recorded');
      onDecided();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{instance.workflowDefinition?.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-slate-500 mb-3">{instance.entityType} — {instance.entityId}</p>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Comment (optional)</label>
        <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium" />
        <div className="flex items-center justify-end gap-2 mt-4">
          <button onClick={() => decide('REJECTED')} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg font-semibold text-xs disabled:opacity-50"><XCircle className="w-3.5 h-3.5" />Reject</button>
          <button onClick={() => decide('APPROVED')} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50"><CheckCircle2 className="w-3.5 h-3.5" />Approve</button>
        </div>
      </div>
    </div>
  );
};

export const WorkflowEnginePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [tab, setTab] = useState('definitions');
  const [definitions, setDefinitions] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [decidingInstance, setDecidingInstance] = useState(null);

  const fetchDefinitions = useCallback(() => {
    setLoading(true);
    setError(false);
    workflowService.getDefinitions().then((res) => setDefinitions(res.data || [])).catch((err) => { notifyError(err.message); setError(true); }).finally(() => setLoading(false));
  }, [notifyError]);

  const fetchPending = useCallback(() => {
    setLoading(true);
    setError(false);
    workflowService.getMyPendingApprovals().then((res) => setPending(res.data || [])).catch((err) => { notifyError(err.message); setError(true); }).finally(() => setLoading(false));
  }, [notifyError]);

  const reload = useCallback(() => { tab === 'definitions' ? fetchDefinitions() : fetchPending(); }, [tab, fetchDefinitions, fetchPending]);

  useEffect(() => { reload(); }, [reload]);

  const defColumns = [
    { header: 'Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Type', key: 'workflowType', render: (val) => <span className="font-mono text-[11px]">{val}</span> },
    {
      header: 'Steps', key: 'steps', sortable: false,
      render: (steps) => (
        <div className="flex items-center gap-1 flex-wrap">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">{s.approverRole}</span>
              {i < steps.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
            </React.Fragment>
          ))}
        </div>
      ),
    },
    { header: 'Status', key: 'isActive', render: (val) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${val ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{val ? 'Active' : 'Inactive'}</span> },
  ];

  const pendingColumns = [
    { header: 'Workflow', key: 'workflowDefinition', sortable: false, render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.name}</span> },
    { header: 'Record', key: 'entityType', render: (val, row) => <span className="text-[11px]">{val} — {row.entityId}</span> },
    { header: 'Step', key: 'currentStepIndex', render: (val, row) => <span className="font-mono">{val + 1} / {row.workflowDefinition?.steps.length}</span> },
    { header: 'Requested', key: 'createdAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString()}</span> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (_, row) => <button onClick={() => setDecidingInstance(row)} className="text-indigo-600 font-semibold hover:underline">Review & Decide</button>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Workflow Engine</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure multi-step approval chains and act on what's waiting on you</p>
        </div>
        {tab === 'definitions' && (
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs">
            <Plus className="w-4 h-4" /><span>New Workflow</span>
          </button>
        )}
      </div>

      <Tabs tabs={[{ id: 'definitions', label: 'Approval Chains', icon: GitBranch }, { id: 'pending', label: 'My Approvals', icon: CheckCircle2, badge: pending.length || undefined }]} activeTab={tab} onChange={setTab} />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : tab === 'definitions' ? (
        definitions.length === 0 ? (
          <EmptyState title="No Approval Chains Yet" description="Configure your first multi-step workflow." actionLabel="New Workflow" onAction={() => setModalOpen(true)} icon={GitBranch} />
        ) : (
          <DataTable columns={defColumns} data={definitions} />
        )
      ) : pending.length === 0 ? (
        <EmptyState title="Nothing Waiting On You" description="No workflow steps are currently pending your decision." icon={CheckCircle2} />
      ) : (
        <DataTable columns={pendingColumns} data={pending} />
      )}

      <NewDefinitionModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => { setModalOpen(false); fetchDefinitions(); }} />
      <DecisionModal instance={decidingInstance} onClose={() => setDecidingInstance(null)} onDecided={() => { setDecidingInstance(null); fetchPending(); }} />
    </div>
  );
};

export default WorkflowEnginePage;
