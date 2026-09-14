import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import broadcastService from '../../services/broadcastService';
import courseService from '../../services/courseService';
import templateService from '../../services/templateService';

const RECIPIENT_OPTIONS = [
  { value: 'absentees', label: "Today's Absent Students' Parents" },
  { value: 'pending_fees', label: 'Students with Pending Fees' },
  { value: 'course', label: 'By Course (choose below)' },
  { value: 'all_students', label: 'All Enrolled Students' },
  { value: 'staff', label: 'Teaching & Non-Teaching Staff' },
  { value: 'pre_admission', label: 'Pre-Admission Applicants (Parents)' },
];

export const SMSComposeModal = ({ isOpen, onClose, defaultRecipientType = 'absentees' }) => {
  const { success, error: showError } = useNotification();
  const [recipientType, setRecipientType] = useState(defaultRecipientType);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    courseService.getAll().then((res) => setCourses(res.data || [])).catch(() => {});
    templateService.getAll('SMS').then((res) => setTemplates(res.data || [])).catch(() => {});
  }, [isOpen]);

  const handleTemplateChange = (id) => {
    setTemplateId(id);
    const t = templates.find((tpl) => tpl.id === id);
    if (t) setMessage(t.body);
  };

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    if (recipientType === 'course' && !courseId) {
      showError('Select a course for this recipient group.', 'Course Required');
      return;
    }
    setIsSending(true);
    try {
      const res = await broadcastService.broadcastSms({ recipientGroup: recipientType, courseId: recipientType === 'course' ? courseId : undefined, message });
      success(`SMS sent to ${res.data.sent} of ${res.data.totalRecipients} recipients (${res.data.skipped} had no phone on file).`, 'Broadcast Complete');
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to send broadcast', 'Send Failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Compose SMS Broadcast</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sent via your configured SMS gateway (or simulated if none set)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Recipients</label>
            <select
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
            >
              {RECIPIENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {recipientType === 'course' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Course</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                <option value="">Select course...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Use Template</label>
            <select
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="">— Start blank —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.title}{t.isSystem ? '' : ' (Custom)'}</option>)}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Message Text</label>
              <span className="text-[10px] font-mono text-slate-400">{message.length} / 160 chars</span>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message, or pick a template above..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              <span className="font-mono">{'{{name}}'}</span> is filled in automatically per recipient. Other placeholders like <span className="font-mono">{'{{otp}}'}</span> or <span className="font-mono">{'{{amount}}'}</span> need to be filled in by hand before sending.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'Dispatching...' : 'Dispatch SMS'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SMSComposeModal;
