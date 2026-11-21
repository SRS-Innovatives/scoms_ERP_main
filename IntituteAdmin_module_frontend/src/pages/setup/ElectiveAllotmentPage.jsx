import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useAcademic } from '../../context/InstitutionContext';
import subjectService from '../../services/subjectService';
import courseService from '../../services/courseService';
import { ListChecks, Check, Search, Users } from 'lucide-react';

/**
 * Elective Allotment — pick which students of a class take each elective subject.
 * A subject becomes an elective for a class in Subject Setup (mapping icon → "Elective").
 * Attendance, marks entry, exam schedules, hall tickets and the student's own subject
 * list include only the students ticked here.
 */
export const ElectiveAllotmentPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const academic = useAcademic();
  const unit = academic.label('course');

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [data, setData] = useState(null); // { totalStudents, electives }
  const [subjectId, setSubjectId] = useState('');
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    courseService.getAll()
      .then((res) => setCourses(res.data || []))
      .catch((e) => notifyError(`Failed to load ${unit.toLowerCase()}s: ${e.message}`));
  }, [notifyError, unit]);

  const loadElectives = useCallback(async (cid) => {
    if (!cid) { setData(null); return; }
    try {
      const res = await subjectService.getElectives(cid);
      setData(res.data);
    } catch (e) {
      notifyError(`Failed to load electives: ${e.message}`);
    }
  }, [notifyError]);

  useEffect(() => {
    setSubjectId('');
    setStudents([]);
    loadElectives(courseId);
  }, [courseId, loadElectives]);

  useEffect(() => {
    if (!subjectId || !courseId) { setStudents([]); return; }
    setLoading(true);
    subjectService.getElectiveStudents(subjectId, courseId)
      .then((res) => {
        const list = res.data?.students || [];
        setStudents(list);
        setSelected(new Set(list.filter((s) => s.takes).map((s) => s.id)));
      })
      .catch((e) => notifyError(`Failed to load students: ${e.message}`))
      .finally(() => setLoading(false));
  }, [subjectId, courseId, notifyError]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => `${s.firstName} ${s.lastName} ${s.rollNumber || ''} ${s.admissionNumber || ''}`.toLowerCase().includes(q));
  }, [students, search]);

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const setAllVisible = (on) => setSelected((prev) => {
    const next = new Set(prev);
    visible.forEach((s) => (on ? next.add(s.id) : next.delete(s.id)));
    return next;
  });

  const save = async () => {
    setSaving(true);
    try {
      const res = await subjectService.setElectiveStudents(subjectId, courseId, [...selected]);
      notifySuccess(res.message);
      loadElectives(courseId);
    } catch (e) {
      notifyError(`Failed to save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const subject = data?.electives?.find((e) => e.id === subjectId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Elective Allotment</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose which students take each elective. Only they appear in attendance, marks entry, exam schedules and hall tickets for that subject.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 space-y-1">
          <span>{unit}</span>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <option value="">Select {unit.toLowerCase()}…</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 space-y-1">
          <span>Elective subject</span>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!data?.electives?.length} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 disabled:opacity-50">
            <option value="">{data && !data.electives.length ? 'No electives for this class' : 'Select elective…'}</option>
            {(data?.electives || []).map((e) => <option key={e.id} value={e.id}>{e.name} ({e.code}) — {e.students}/{data.totalStudents} students</option>)}
          </select>
        </label>
      </div>

      {courseId && data && data.electives.length === 0 && (
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300">
          This {unit.toLowerCase()} has no elective subjects. In Subject Setup, open a subject's mapping and tick <b>Elective</b> next to this {unit.toLowerCase()}.
        </div>
      )}

      {subjectId && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between gap-3 flex-wrap p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
              <ListChecks className="w-4 h-4 text-indigo-600" /> {subject?.name}
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {selected.size} of {students.length} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students" className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
              </div>
              <button onClick={() => setAllVisible(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Select all</button>
              <button onClick={() => setAllVisible(false)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Clear</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50">
                <Check className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save Allotment'}
              </button>
            </div>
          </div>
          {loading ? (
            <p className="p-4 text-xs text-slate-400">Loading students…</p>
          ) : visible.length === 0 ? (
            <p className="p-4 text-xs text-slate-400">No active students found.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto">
              {visible.map((s) => (
                <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="w-4 h-4 rounded text-indigo-600" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">{s.firstName} {s.lastName}</span>
                  <span className="text-slate-400 font-mono">{s.rollNumber || s.admissionNumber}</span>
                  <span className="text-slate-500 w-20 text-right">{s.section?.name ? `Sec ${s.section.name}` : '—'}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ElectiveAllotmentPage;
