import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClipboardList, Loader2, Plus, X, CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import examService from '../../services/examService';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const inputCls = 'px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200';

/** The "allot" row under one paper. */
const AssignRow = ({ paper, staff, roles, onAssigned }) => {
  const { notifySuccess, notifyError, notifyWarning } = useNotification();
  const [staffId, setStaffId] = useState('');
  const [role, setRole] = useState('INVIGILATOR');
  const [roomLabel, setRoomLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const taken = new Set(paper.duties.map((d) => d.staff.id));
  const options = staff.filter((s) => !taken.has(s.id));

  const assign = async () => {
    if (!staffId) { notifyError('Choose a staff member'); return; }
    setSaving(true);
    try {
      const res = await examService.assignDuty({ scheduleId: paper.id, staffId, role, roomLabel: roomLabel.trim() || undefined });
      notifySuccess(res.message || 'Duty allotted');
      if (res.data?.warning) notifyWarning(res.data.warning, 'On leave');
      setStaffId('');
      setRoomLabel('');
      onAssigned();
    } catch (err) {
      notifyError(err.message || 'Could not allot the duty');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
      <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className={`${inputCls} flex-1 min-w-[200px]`}>
        <option value="">Choose staff…</option>
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}{s.designation ? ` · ${s.designation}` : ''}{s.department?.name ? ` · ${s.department.name}` : ''}{s.dutiesInExam ? ` (${s.dutiesInExam} ${s.dutiesInExam > 1 ? 'duties' : 'duty'})` : ''}
          </option>
        ))}
      </select>
      <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
        {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <input value={roomLabel} onChange={(e) => setRoomLabel(e.target.value)} maxLength={100} placeholder={paper.room ? `Room (default ${paper.room})` : 'Room / hall (optional)'} className={`${inputCls} w-44`} />
      <button onClick={assign} disabled={saving || !staffId} className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Allot
      </button>
    </div>
  );
};

export const ExamDutiesPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    examService.getExams()
      .then((res) => {
        const list = res.data || [];
        setExams(list);
        if (list.length > 0) setExamId(list[0].id);
        else setLoading(false);
      })
      .catch((err) => { notifyError(`Failed to load exams: ${err.message}`); setError(true); setLoading(false); });
  }, [notifyError]);

  const load = useCallback(async (quiet = false) => {
    if (!examId) return;
    if (!quiet) setLoading(true);
    setError(false);
    try {
      const res = await examService.getExamDuties(examId);
      setData(res.data);
    } catch (err) {
      notifyError(`Failed to load duties: ${err.message}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [examId, notifyError]);
  useEffect(() => { load(); }, [load]);

  const remove = async (duty) => {
    setRemoving(duty.id);
    try {
      await examService.removeDuty(duty.id);
      notifySuccess(`${duty.staff.firstName} ${duty.staff.lastName} removed from this paper`);
      load(true);
    } catch (err) {
      notifyError(err.message || 'Could not remove the duty');
    } finally {
      setRemoving(null);
    }
  };

  const roleLabel = useMemo(() => Object.fromEntries((data?.roles || []).map((r) => [r.value, r.label])), [data]);
  const totals = useMemo(() => {
    if (!data) return null;
    const assigned = data.papers.reduce((n, p) => n + p.duties.length, 0);
    return { papers: data.papers.length, assigned, unstaffed: data.papers.filter((p) => p.duties.length === 0).length, people: data.staff.filter((s) => s.dutiesInExam > 0).length };
  }, [data]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-indigo-600" /> Exam Duties</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Allot invigilation and superintendent duties for each paper. Staff are notified and print their Duty Allotment Letter from the Staff portal.</p>
        </div>
        {exams.length > 0 && (
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className={`${inputCls} min-w-[220px]`}>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={() => load()} />
      ) : exams.length === 0 ? (
        <EmptyState title="No exams yet" description="Create an exam under Exam Setup and schedule its papers first." />
      ) : !data || data.papers.length === 0 ? (
        <EmptyState title="No papers scheduled" description="Schedule this exam's papers under Exam Schedule — duties are allotted per paper." />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['Papers', totals.papers], ['Duties allotted', totals.assigned], ['Papers without staff', totals.unstaffed], ['Staff on duty', totals.people]].map(([label, value]) => (
              <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
                <p className={`text-lg font-bold ${label === 'Papers without staff' && value > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {data.papers.map((p) => (
              <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{p.subject?.name} <span className="text-slate-400 font-medium">{p.subject?.code}</span></p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{p.course?.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {fmtDate(p.examDate)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {p.startTime}–{p.endTime}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {p.room || 'No room set'}</span>
                  </div>
                </div>

                {p.duties.length === 0 ? (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> No staff allotted yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {p.duties.map((d) => (
                      <span key={d.id} className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 text-[11px] text-indigo-800 dark:text-indigo-200">
                        <strong>{roleLabel[d.role] || d.role}:</strong> {d.staff.firstName} {d.staff.lastName}
                        {d.roomLabel && <span className="text-indigo-500">· {d.roomLabel}</span>}
                        <button onClick={() => remove(d)} disabled={removing === d.id} title="Remove" className="p-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900 disabled:opacity-50">
                          {removing === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <AssignRow paper={p} staff={data.staff} roles={data.roles} onAssigned={() => load(true)} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ExamDutiesPage;
