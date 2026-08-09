import React, { useState } from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { MessageSquare, Save, CheckCircle2 } from 'lucide-react';

export const SMSSettingsPage = () => {
  const { notifySuccess } = useNotification();
  const [formData, setFormData] = useState({
    gateway: 'ValueFirst / CDAC DLT',
    senderId: 'SRCET',
    entityId: '1001492019482',
    apiKey: '************************'
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">DLT Bulk SMS Gateway Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">TRAI DLT Entity ID, Header Sender ID & API Key Configuration</p>
      </div>

      <FormSection title="TRAI DLT Gateway API Configuration" icon={MessageSquare}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">DLT Provider</label>
            <input type="text" value={formData.gateway} onChange={(e) => setFormData({ ...formData, gateway: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-lg font-medium" />
          </div>
          <div>
            <label className="block font-semibold mb-1">DLT Header Sender ID (6 Chars)</label>
            <input type="text" value={formData.senderId} onChange={(e) => setFormData({ ...formData, senderId: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono font-bold" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Principal Entity (PE) ID</label>
            <input type="text" value={formData.entityId} onChange={(e) => setFormData({ ...formData, entityId: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono font-bold" />
          </div>
          <div>
            <label className="block font-semibold mb-1">SMS API Secret Key</label>
            <input type="password" value={formData.apiKey} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono" />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={() => notifySuccess('SMS DLT Settings Saved!')} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md">
            <Save className="w-4 h-4" />
            <span>Save DLT Configuration</span>
          </button>
        </div>
      </FormSection>
    </div>
  );
};

export default SMSSettingsPage;
