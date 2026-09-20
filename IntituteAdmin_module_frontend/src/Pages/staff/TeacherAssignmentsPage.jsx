import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';
import { Users, BookOpen, X, Loader2, GraduationCap } from 'lucide-react';
import staffService from '../../services/staffService';
import sectionService from '../../services/sectionService';
import subjectService from '../../services/subjectService';

const TABS = [
  { key: 'class', label: 'Class Teachers', icon: GraduationCap },
  { key: 'subject', label: 'Subject Teachers', icon: BookOpen },
];

/** Institute Admin's single workflow for both class-teacher (homeroom) assignment per
 * section and subject-teacher assignment per section+subject — the two pieces of "who
 * teaches what" a Staff member's Take Attendance / gradebook screens depend on. */
export const TeacherAssignmentsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [tab, setTab] = useState('class');
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyKey, setBusyKey] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      sectionService.getAll(),
      staffService.getAll('TEACHING'),
      staffService.getTeacherAssignments(),
    ])
      .then(([sectionRes, staffRes, assignRes]) => {
        setSections(sectionRes.data || []);
        setTeachers(staffRes.data || []);
        setAssignments(assignRes.data || []);
      })
      .catch((err) => { notifyError(`Failed to load assignment data: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const courseId = selectedSection?.semester?.course?.id;

  useEffect(() => {
    if (!courseId) { setSubjects([]); return; }
    subjectService.getAll(courseId)
      .then((res) => setSubjects(res.data || []))
      .catch((err) => notifyError(`Failed to load subjects: ${err.message}`));
  }, [courseId, notifyError]);

  const teacherLabel = (t) => `${t.firstName} ${t.lastName}`.trim() || t.user?.email || t.employeeCode;

  const handleAssignClassTeacher = async (sectionId, staffId) => {
    setBusyKey(`class-${sectionId}`);
    try {
      await sectionService.update(sectionId, { classTeacherId: staffId || null });
      notifySuccess(staffId ? 'Class teacher assigned successfully.' : 'Class teacher unassigned.');
      fetchAll();
    } catch (err) {
      notifyError(err.message || 'Failed to update class teacher');
    } finally {
      setBusyKey(null);
    }
  };

  const assignmentFor = (sectionId, subjectId) =>
    assignments.find((a) => a.sectionId === sectionId && a.subjectId === subjectId);

  const handleAssignSubjectTeacher = async (subjectId, staffId) => {
    if (!staffId) return;
    setBusyKey(`subject-${subjectId}`);
    try {
      await staffService.assignTeacher({ staffId, subjectId, sectionId: selectedSectionId });
      notifySuccess('Subject teacher assigned successfully.');
      fetchAll();
    } catch (err) {
      notifyError(err.message || 'Failed to assign subject teacher');
    } finally {
      setBusyKey(null);
    }
  };

  const handleRemoveSubjectTeacher = async (assignmentId) => {
    setBusyKey(`remove-${assignmentId}`);
    try {
      await staffService.removeTeacherAssignment(assignmentId);
      notifySuccess('Assignment removed.');
      fetchAll();
    } catch (err) {
      notifyError(err.message || 'Failed to remove assignment');
    } finally {
      setBusyKey(null);
    }
  };

  const sectionLabel = (s) => `${s.semester?.course?.name || ''} • ${s.semester?.name || ''} • ${s.name}`;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchAll} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Teacher Assignments</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Assign a class (homeroom) teacher to every section, and a subject teacher for every subject a section studies.
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {sections.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No sections found yet. Create courses, semesters, and sections under Institution Setup first.
        </div>
      ) : tab === 'class' ? (
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Section</th>
                <th className="text-left px-4 py-3 font-semibold">Students</th>
                <th className="text-left px-4 py-3 font-semibold">Class Teacher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sections.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{sectionLabel(s)}</td>
                  <td className="px-4 py-3 text-slate-500">{s._count?.students ?? 0}</td>
                  <td className="px-4 py-3">
                    <select
                      value={s.classTeacherId || ''}
                      disabled={busyKey === `class-${s.id}`}
                      onChange={(e) => handleAssignClassTeacher(s.id, e.target.value)}
                      className="w-full max-w-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium disabled:opacity-50"
                    >
                      <option value="">— Not Assigned —</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{teacherLabel(t)} ({t.designation})</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" /> Select a Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full max-w-md px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
            >
              <option value="">Choose a section...</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{sectionLabel(s)}</option>
              ))}
            </select>
          </div>

          {!selectedSectionId ? (
            <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              Select a section above to assign subject teachers.
            </div>
          ) : subjects.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No subjects found for this section's course. Add subjects under Institution Setup first.
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Subject</th>
                    <th className="text-left px-4 py-3 font-semibold">Assigned Teacher</th>
                    <th className="text-right px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {subjects.map((sub) => {
                    const existing = assignmentFor(selectedSectionId, sub.id);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{sub.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{sub.code}</p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={existing?.staffId || ''}
                            disabled={busyKey === `subject-${sub.id}`}
                            onChange={(e) => handleAssignSubjectTeacher(sub.id, e.target.value)}
                            className="w-full max-w-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium disabled:opacity-50"
                          >
                            <option value="">— Not Assigned —</option>
                            {teachers.map((t) => (
                              <option key={t.id} value={t.id}>{teacherLabel(t)} ({t.designation})</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {existing && (
                            <button
                              onClick={() => handleRemoveSubjectTeacher(existing.id)}
                              disabled={busyKey === `remove-${existing.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentsPage;
