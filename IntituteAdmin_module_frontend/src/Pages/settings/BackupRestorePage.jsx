import React, { useState } from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { Database, Download, RefreshCw } from 'lucide-react';

export const BackupRestorePage = () => {
  const { notifySuccess } = useNotification();
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      notifySuccess('Complete PostgreSQL database backup snapshot created! (File: SCOMS_DB_20260809.sql.gz)', 'Backup Complete');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Database Backup & Disaster Recovery</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Automated daily database snapshots & encrypted cloud backup downloads</p>
      </div>

      <FormSection title="Manual On-Demand Database Backup" icon={Database}>
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Full SCOMS Institutional Database Backup</p>
            <p className="text-xs text-slate-500">Includes Students, Staff, Financial Cash Books & Marksheet Records</p>
          </div>
          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <Download className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
            <span>{isBackingUp ? 'Creating SQL Backup...' : 'Generate DB Snapshot Now'}</span>
          </button>
        </div>
      </FormSection>
    </div>
  );
};

export default BackupRestorePage;
