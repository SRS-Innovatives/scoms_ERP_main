import React, { useEffect, useState, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import supportService from '../../services/supportService';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ status: '', priority: '', assignedTo: '' });

  const load = useCallback(() => {
    setLoading(true);
    supportService.getTickets()
      .then((res) => {
        const found = (res.data || []).find((t) => t.id === id);
        setTicket(found || null);
        if (found) setForm({ status: found.status, priority: found.priority, assignedTo: found.assignedTo || '' });
      })
      .catch((err) => showError(err.message || 'Failed to load ticket', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [id, showError]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await supportService.updateTicket(id, form);
      success('Ticket updated successfully.', 'Ticket Updated');
      load();
    } catch (err) {
      showError(err.message || 'Failed to update ticket', 'Update Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <button onClick={() => navigate('/super-admin/tickets')} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <ArrowLeft className="w-4 h-4" /> Back to Ticket Queue
        </button>
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          Ticket not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/super-admin/tickets')} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
        <ArrowLeft className="w-4 h-4" /> Back to Ticket Queue
      </button>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="font-mono text-xs font-bold text-indigo-600">{ticket.ticketNumber}</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{ticket.subject}</h2>
            <p className="text-xs text-slate-500">{ticket.institution?.name || 'Unassigned'} • Category: {ticket.category || '—'} • Raised by: {ticket.raisedByEmail || '—'}</p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        {ticket.description && (
          <div className="text-xs">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Description</h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{ticket.description}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Agent</label>
            <input
              type="text"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              placeholder="Agent name or email"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 disabled:opacity-50">
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {ticket.resolvedAt && (
          <p className="text-[11px] text-slate-400">Resolved on {new Date(ticket.resolvedAt).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
};

export default TicketDetailPage;
