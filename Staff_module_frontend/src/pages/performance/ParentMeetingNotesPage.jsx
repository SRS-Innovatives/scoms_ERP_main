import React, { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { MessageSquare, Save, Loader2 } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import parentMeetingService from '../../services/parentMeetingService';

export const ParentMeetingNotesPage = () => {
  const { success, error: showError } = useNotification();
  const [students, setStudents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [parentName, setParentName] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0, 10));
  const [discussionNotes, setDiscussionNotes] = useState('');

  const load = () => {
    Promise.all([attendanceService.getMyClasses(), parentMeetingService.getMyNotes()])
      .then(async ([classesRes, notesRes]) => {
        const mappings = classesRes.data || [];
        const seenSections = new Map();
        mappings.forEach((m) => { if (!seenSections.has(m.section.id)) seenSections.set(m.section.id, m.section); });
        const rosters = await Promise.all(
          Array.from(seenSections.values()).map((section) =>
            attendanceService.getRoster(section.id).then((res) => (res.data || []).map((s) => ({ ...s, sectionName: section.name })))
          )
        );
        const flat = rosters.flat();
        const unique = Array.from(new Map(flat.map((s) => [s.id, s])).values());
        setStudents(unique);
        if (unique.length > 0) setStudentId((prev) => prev || unique[0].id);
        setNotes(notesRes.data || []);
      })
      .catch((err) => showError(err.message || 'Failed to load data', 'Load Failed'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault();
    if (!studentId || !discussionNotes.trim()) return;
    setSaving(true);
    try {
      await parentMeetingService.createNote({ studentId, parentName, discussionNotes, meetingDate });
      const student = students.find((s) => s.id === studentId);
      success(`PTM notes recorded for ${student?.firstName} ${student?.lastName}!`, 'Meeting Logged');
      setDiscussionNotes('');
      setParentName('');
      load();
    } catch (err) {
      showError(err.message || 'Failed to save meeting notes', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (students.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-2xl">
        You have no assigned classes yet. Ask your Institute Admin to assign you to a subject/section first.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-500" /> Log Parent Teacher Meeting (PTM) Minutes
        </h3>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student</label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.sectionName} (Roll {s.rollNumber})</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Parent / Guardian Name</label>
              <input type="text" value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="e.g. Mr. Suresh Verma" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Date</label>
            <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Discussion Summary & Action Plan</label>
            <textarea
              required
              rows={4}
              value={discussionNotes}
              onChange={(e) => setDiscussionNotes(e.target.value)}
              placeholder="e.g. Discussed low attendance in Period 1 and physics numerical practice homework..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            ></textarea>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-5 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Record PTM Notes'}
            </button>
          </div>
        </form>
      </div>

      {notes.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            Previously Logged Meetings
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
            {notes.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {n.student?.firstName} {n.student?.lastName} ({n.student?.section?.name})
                  </span>
                  <span className="text-slate-400">{new Date(n.meetingDate).toLocaleDateString()}</span>
                </div>
                {n.parentName && <p className="text-slate-500 dark:text-slate-400 mt-0.5">With: {n.parentName}</p>}
                <p className="text-slate-600 dark:text-slate-300 mt-1">{n.discussionNotes}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentMeetingNotesPage;
