import React, { useState } from 'react';
import { X, Send, MessageSquare, Filter, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const SMSComposeModal = ({ isOpen, onClose, defaultRecipientType = 'absentees' }) => {
  const { notifySuccess } = useNotification();
  const [recipientType, setRecipientType] = useState(defaultRecipientType);
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [smsTemplate, setSmsTemplate] = useState('absent');
  const [customMessage, setCustomMessage] = useState(
    "Dear Parent, Your ward Kavitha R. Sharma (Roll: 21CS101) was marked ABSENT today (09-Aug-2026). Please contact the HOD/Class Advisor for details. - SRCET Admin"
  );
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleTemplateChange = (tmpl) => {
    setSmsTemplate(tmpl);
    if (tmpl === 'absent') {
      setCustomMessage(
        "Dear Parent, Your ward Kavitha R. Sharma (Roll: 21CS101) was marked ABSENT today (09-Aug-2026). Please contact HOD for details. - SRCET Admin"
      );
    } else if (tmpl === 'fee') {
      setCustomMessage(
        "Dear Parent/Student, This is a reminder to pay the pending Even Semester Fee of Rs 25,000 before 25-Aug-2026 to avoid late fees. - SRCET Accounts"
      );
    } else if (tmpl === 'exam') {
      setCustomMessage(
        "Dear Student, End Semester Examination timetable and Hall Tickets are published on the admin portal. Download your copy. - COE, SRCET"
      );
    }
  };

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      notifySuccess("SMS Broadcast dispatched successfully via DLT Gateway to 48 recipients!", "SMS Sent");
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Compose SMS Broadcast</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Integrated DLT Bulk SMS Sender</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs">
          {/* Target Filter */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Recipients</label>
            <select
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="absentees">Today's Absent Students' Parents (48 Contacts)</option>
              <option value="pending_fees">Students with Pending Fees (142 Contacts)</option>
              <option value="dept">Department-wise Students (CSE - 920 Contacts)</option>
              <option value="all_students">All Enrolled Students (3,450 Contacts)</option>
              <option value="staff">Teaching & Non-Teaching Staff (285 Contacts)</option>
            </select>
          </div>

          {/* Template Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select DLT Template</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTemplateChange('absent')}
                className={`flex-1 p-2 rounded-lg border text-center transition-all font-semibold ${
                  smsTemplate === 'absent'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Absent Alert
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('fee')}
                className={`flex-1 p-2 rounded-lg border text-center transition-all font-semibold ${
                  smsTemplate === 'fee'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Fee Reminder
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('exam')}
                className={`flex-1 p-2 rounded-lg border text-center transition-all font-semibold ${
                  smsTemplate === 'exam'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Exam Notice
              </button>
            </div>
          </div>

          {/* Message Box */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Message Text</label>
              <span className="text-[10px] font-mono text-slate-400">{customMessage.length} / 160 chars (1 SMS Credit)</span>
            </div>
            <textarea
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> DLT Sender ID: SRCET-SMS
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Dispatching...' : 'Dispatch SMS'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSComposeModal;
