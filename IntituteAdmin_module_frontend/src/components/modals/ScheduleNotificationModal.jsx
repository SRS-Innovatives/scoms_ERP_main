import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import notificationSchedulerService from '../../services/notificationSchedulerService';
import courseService from '../../services/courseService';

const CHANNELS = [
  { value: 'SMS', label: 'SMS' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
];

const RECIPIENT_OPTIONS = [
  { value: 'absentees', label: "Today's Absent Students' Parents" },
  { value: 'pending_fees', label: 'Students with Pending Fees' },
  { value: 'course', label: 'By Course (choose below)' },
  { value: 'all_students', label: 'All Enrolled Students' },
  { value: 'staff', label: 'Teaching & Non-Teaching Staff' },
  { value: 'pre_admission', label: 'Pre-Admission Applicants (Parents)' },
];

export const ScheduleNotificationModal = ({ isOpen, onClose }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [channel, setChannel] = useState('SMS');
  const [recipientGroup, setRecipientGroup] = useState('absentees');
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    courseService.getAll().then((res) => setCourses(res.data || [])).catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim() || !scheduledFor) { notifyError('Message and schedule time are required'); return; }
    if (recipientGroup === 'course' && !courseId) { notifyError('Select a course for this recipient group'); return; }
    if (channel === 'EMAIL' && !subject.trim()) { notifyError('Subject is required for Email'); return; }

    setSubmitting(true);
    try {
      await notificationSchedulerService.createScheduled({
        channel, recipientGroup, courseId: recipientGroup === 'course' ? courseId : undefined,
        subject: channel === 'EMAIL' ? subject : undefined, message,
        scheduledFor: new Date(scheduledFor).toISOString(),
      });
      notifySuccess('Notification scheduled successfully!');
      onClose();
    } catch (err) {
      notifyError(err.message || 'Failed to schedule notification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400"><Clock className="w-5 h-5" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Notification</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Queue a broadcast for a future date and time</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
                {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Send At</label>
              <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Recipients</label>
            <select value={recipientGroup} onChange={(e) => setRecipientGroup(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
              {RECIPIENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {recipientGroup === 'course' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Course</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                <option value="">Select course...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {channel === 'EMAIL' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium" />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Message</label>
            <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50">
            {submitting ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleNotificationModal;
