import React, { useState } from 'react';
import FileUpload from '../../components/common/FileUpload';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';

export const BiometricImportPage = () => {
  const { notifySuccess } = useNotification();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      notifySuccess('Biometric RFID Fingerprint machine logs synced! 3,210 punch entries processed.', 'Biometric Synced');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Biometric Device Integration</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Sync RFID Card / Facial Recognition / Fingerprint turnstile gate logs</p>
      </div>

      <FormSection title="Real-time Machine API Sync" subtitle="IP Connection: 192.168.10.45 (Main Gate Turnstiles)" icon={Cpu}>
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
          <div>
            <p className="font-bold text-slate-900 dark:text-white">ESSL / Matrix / ZKTeco Biometric Machine</p>
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-3.5 h-3.5" /> Machine Online & Listening</p>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Device Logs...' : 'Pull Biometric Logs Now'}</span>
          </button>
        </div>
      </FormSection>

      <FormSection title="Manual Machine Log Upload (.dat / .csv)" subtitle="Import offline USB machine export file">
        <FileUpload label="Select Biometric File" onFileSelect={() => notifySuccess('File uploaded')} />
      </FormSection>
    </div>
  );
};

export default BiometricImportPage;
