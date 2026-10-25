import React, { useState } from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { Database, Download } from 'lucide-react';
import settingsService from '../../services/settingsService';

export const BackupRestorePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [requesting, setRequesting] = useState(false);

  const handleBackup = async () => {
    setRequesting(true);
    try {
      const res = await settingsService.requestBackup();
      notifySuccess(res.message, 'Backup Requested');
    } catch (error) {
      notifyError(`Failed to log backup request: ${error.message}`);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Database Backup & Disaster Recovery</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Request an on-demand database snapshot — logged to the audit trail and actioned by the platform operations team</p>
      </div>

      <FormSection title="Manual On-Demand Database Backup" icon={Database}>
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Full SCOMS Institutional Database Backup</p>
            <p className="text-xs text-slate-500">Includes Students, Staff, Financial Cash Books & Marksheet Records</p>
          </div>
          <button
            onClick={handleBackup}
            disabled={requesting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${requesting ? 'animate-spin' : ''}`} />
            <span>{requesting ? 'Logging Request...' : 'Request Backup Snapshot'}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          Automated daily backups run on the platform's own schedule regardless of this request — this button is for an out-of-cycle on-demand snapshot, tracked in Audit Logs.
        </p>
      </FormSection>
    </div>
  );
};

export default BackupRestorePage;
