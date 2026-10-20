import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Loader2, Send, UserCheck } from 'lucide-react';
import timetableService from '../../services/timetableService';
import { useNotification } from '../../context/NotificationContext';

const JS_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const card = 'glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4';
const input = 'w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg';
const btn = 'px-3 py-1.5 text-xs font-bold rounded-lg disabled:opacity-50';
const STATUS_STYLE = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

const personName = (p) => [p?.firstName, p?.lastName].filter(Boolean).join(' ') || p?.employeeCode || '—';
const sectionName = (e) => [e?.timetable?.section?.semester?.course?.name, e?.timetable?.section?.name].filter(Boolean).join(' - ');
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
const today = () => new Date().toISOString().slice(0, 10);

const RequestLine = ({ r, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
    <div>
      <p className="font-bold text-slate-900 dark:text-white">
        {fmtDate(r.date)} · Period {r.entry?.period} ({r.entry?.startTime}-{r.entry?.endTime}) · {r.entry?.subject?.name || '—'}
      </p>
      <p className="text-slate-600 dark:text-slate-300">{sectionName(r.entry)}{r.entry?.roomNumber ? ` · Room ${r.entry.roomNumber}` : ''} · {r.reason}</p>
      {r.substituteStaff && <p className="text-emerald-600">Covered by {personName(r.substituteStaff)}</p>}
      {r.reviewRemarks && <p className="text-slate-500">Remarks: {r.reviewRemarks}</p>}
    </div>
    {children}
  </div>
);

export const SubstituteClassesPage = () => {
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [mine, setMine] = useState([]);
  const [covering, setCovering] = useState([]);
  const [queue, setQueue] = useState(null);
  const [form, setForm] = useState({ timetableEntryId: '', date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [assign, setAssign] = useState({ id: null, options: [], staffId: '', remarks: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const [tt, my, cov, q] = await Promise.allSettled([
      timetableService.getMyTimetable(),
      timetableService.getMySubstituteRequests(),
      timetableService.getMyCoverClasses(),
      timetableService.getSubstituteQueue(),
    ]);
    setClasses(tt.status === 'fulfilled' ? (tt.value.data || []).filter((e) => e.subjectId || e.subject) : []);
    setMine(my.status === 'fulfilled' ? my.value.data || [] : []);
    setCovering(cov.status === 'fulfilled' ? cov.value.data || [] : []);
    setQueue(q.status === 'fulfilled' ? q.value.data || [] : null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = classes.find((c) => c.id === form.timetableEntryId);
  const dateMismatch = selected && form.date && JS_DAYS[new Date(`${form.date}T00:00:00Z`).getUTCDay()] !== selected.dayOfWeek;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.timetableEntryId || !form.date || !form.reason.trim()) { showError('Pick a class, date and reason', 'Missing details'); return; }
    setSubmitting(true);
    try {
      await timetableService.requestSubstitute(form);
      success('Cover request sent for approval', 'Requested');
      setForm({ timetableEntryId: '', date: '', reason: '' });
      load();
    } catch (err) {
      showError(err.message, 'Request Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const act = async (id, fn, okMsg) => {
    setBusyId(id);
    try {
      await fn();
      success(okMsg, 'Done');
      setAssign({ id: null, options: [], staffId: '', remarks: '' });
      load();
    } catch (err) {
      showError(err.message, 'Failed');
    } finally {
      setBusyId(null);
    }
  };

  const openAssign = async (id) => {
    setAssign({ id, options: [], staffId: '', remarks: '' });
    try {
      const res = await timetableService.getAvailableSubstitutes(id);
      setAssign((a) => ({ ...a, options: res.data || [] }));
    } catch (err) {
      showError(err.message, 'Load Failed');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className={card}>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" /> Classes I'm Covering
        </h3>
        {covering.length === 0 ? (
          <p className="text-xs text-slate-500">No upcoming substitute classes assigned to you.</p>
        ) : (
          <div className="space-y-2">{covering.map((r) => <RequestLine key={r.id} r={r}><span className="text-xs text-slate-500">for {personName(r.originalStaff)}</span></RequestLine>)}</div>
        )}
      </div>

      <div className={card}>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-500" /> Request Cover
        </h3>
        {classes.length === 0 ? (
          <p className="text-xs text-slate-500">You have no timetabled classes.</p>
        ) : (
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs">
            <label className="md:col-span-2">
              <span className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Class</span>
              <select value={form.timetableEntryId} onChange={(e) => setForm({ ...form, timetableEntryId: e.target.value })} className={input}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.dayOfWeek.slice(0, 3)} P{c.period} · {c.subject?.name} · {sectionName(c)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Date</span>
              <input type="date" min={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={input} />
            </label>
            <label>
              <span className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Reason</span>
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Medical leave" className={input} />
            </label>
            {dateMismatch && <p className="md:col-span-4 text-rose-600">That date is not a {selected.dayOfWeek.toLowerCase()}.</p>}
            <div className="md:col-span-4">
              <button type="submit" disabled={submitting || dateMismatch} className={`${btn} px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white`}>{submitting ? 'Sending...' : 'Send Request'}</button>
            </div>
          </form>
        )}

        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 pt-2">My Requests</h4>
        {mine.length === 0 ? (
          <p className="text-xs text-slate-500">No cover requests yet.</p>
        ) : (
          <div className="space-y-2">
            {mine.map((r) => (
              <RequestLine key={r.id} r={r}>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  {r.status === 'PENDING' && (
                    <button disabled={busyId === r.id} onClick={() => act(r.id, () => timetableService.cancelSubstituteRequest(r.id), 'Request cancelled')} className={`${btn} bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300`}>Cancel</button>
                  )}
                </div>
              </RequestLine>
            ))}
          </div>
        )}
      </div>

      {queue && (
        <div className={card}>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-500" /> Cover Approvals
          </h3>
          {queue.length === 0 ? (
            <p className="text-xs text-slate-500">No pending cover requests.</p>
          ) : (
            <div className="space-y-2">
              {queue.map((r) => (
                <div key={r.id} className="space-y-2">
                  <RequestLine r={r}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{personName(r.originalStaff)}</span>
                      <button disabled={busyId === r.id} onClick={() => openAssign(r.id)} className={`${btn} bg-emerald-600 hover:bg-emerald-700 text-white`}>Assign</button>
                    </div>
                  </RequestLine>
                  {assign.id === r.id && (
                    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <select value={assign.staffId} onChange={(e) => setAssign({ ...assign, staffId: e.target.value })} className={`${input} max-w-xs`}>
                        <option value="">{assign.options.length ? 'Select free teacher' : 'No free teacher found'}</option>
                        {assign.options.map((s) => <option key={s.id} value={s.id}>{personName(s)} ({s.employeeCode})</option>)}
                      </select>
                      <button disabled={!assign.staffId || busyId === r.id} onClick={() => act(r.id, () => timetableService.reviewSubstituteRequest(r.id, { decision: 'APPROVE', substituteStaffId: assign.staffId }), 'Substitute assigned')} className={`${btn} bg-emerald-600 text-white`}>Approve</button>
                      <input value={assign.remarks} onChange={(e) => setAssign({ ...assign, remarks: e.target.value })} placeholder="Reason to reject" className={`${input} max-w-xs`} />
                      <button disabled={!assign.remarks.trim() || busyId === r.id} onClick={() => act(r.id, () => timetableService.reviewSubstituteRequest(r.id, { decision: 'REJECT', remarks: assign.remarks }), 'Request rejected')} className={`${btn} bg-rose-600 text-white`}>Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubstituteClassesPage;
