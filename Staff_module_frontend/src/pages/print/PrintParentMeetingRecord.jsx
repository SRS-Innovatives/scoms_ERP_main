import React, { useEffect, useState } from 'react';
import PrintLayout from '../../components/print/PrintLayout';
import parentMeetingService from '../../services/parentMeetingService';
import profileService from '../../services/profileService';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';

export const PrintParentMeetingRecord = () => {
  const { error: showError } = useNotification();
  const [notes, setNotes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [noteId, setNoteId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([parentMeetingService.getMyNotes(), profileService.getMyProfile()])
      .then(([notesRes, profileRes]) => {
        const list = notesRes.data || [];
        setNotes(list);
        if (list.length > 0) setNoteId(list[0].id);
        setProfile(profileRes.data);
      })
      .catch((err) => showError(err.message || 'Failed to load meeting notes', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (notes.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 space-y-2">
        <p>No Parent-Teacher Meeting notes logged yet.</p>
        <p>Log one in Performance → Parent Meeting Notes first.</p>
      </div>
    );
  }

  const note = notes.find((n) => n.id === noteId);

  return (
    <div className="space-y-4">
      <div className="no-print flex justify-end">
        <select value={noteId} onChange={(e) => setNoteId(e.target.value)} className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          {notes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.student?.firstName} {n.student?.lastName} — {new Date(n.meetingDate).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      <PrintLayout title="PARENT TEACHER MEETING RECORD SHEET" documentNo={`PTM-REC-${note.id.slice(0, 8).toUpperCase()}`}>
        <div className="text-xs space-y-3">
          <p><strong>Student Name:</strong> {note.student?.firstName} {note.student?.lastName} ({note.student?.section?.name})</p>
          <p><strong>Parent Present:</strong> {note.parentName || 'Not recorded'}</p>
          <p><strong>Teacher Conducted:</strong> {profile?.firstName} {profile?.lastName} ({profile?.designation})</p>
          <p><strong>Meeting Date:</strong> {new Date(note.meetingDate).toLocaleDateString()}</p>
          <div className="p-4 border border-slate-400 rounded-lg">
            <p className="font-bold mb-1">Meeting Summary & Recommendations:</p>
            <p className="leading-relaxed">{note.discussionNotes}</p>
          </div>
        </div>
      </PrintLayout>
    </div>
  );
};

export default PrintParentMeetingRecord;
