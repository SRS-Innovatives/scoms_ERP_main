import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { HardDrive, ShieldCheck, Settings, FolderOpen, AlertCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const StorageManagementPage = () => {
  const { success } = useNotification();
  const [maxSize, setMaxSize] = useState(10);

  const handleSave = (e) => {
    e.preventDefault();
    success('Storage limits saved successfully!');
  };

  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="Storage & CDN Management" subtitle="Inspect object storage bucket size, configure S3 integrations and define tenant upload limits" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="AWS S3 Storage" value="156.4 GB" subtitle="Bucket: scoms-docs" icon={HardDrive} color="indigo" />
        <StatCard title="Total Files Uploaded" value="42,500" subtitle="PDFs, Images, Sheets" icon={FolderOpen} color="indigo" />
        <StatCard title="CDN Access Latency" value="12ms" subtitle="CloudFront Active" icon={ShieldCheck} color="emerald" />
        <StatCard title="Daily Upload Vol." value="1.84 GB" subtitle="Last 24 Hours" icon={HardDrive} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">S3 Connection Parameters</h3>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">AWS S3 Bucket Name</label>
              <input type="text" readOnly value="scoms-documents" className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500" />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">AWS S3 Region</label>
              <input type="text" readOnly value="ap-south-1" className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500" />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Max File Size Limit (MB)</label>
              <input 
                type="number" 
                value={maxSize} 
                onChange={(e) => setMaxSize(e.target.value)} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Allowed File Formats</label>
              <input type="text" readOnly value="PDF, PNG, JPG, XLSX, CSV" className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500" />
            </div>
            <div className="sm:col-span-2 pt-2">
              <button type="submit" className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                Save Storage Settings
              </button>
            </div>
          </form>
        </div>

        {/* Storage utilization breakdown */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <AlertCircle className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Storage Usage Breakdown</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400 mb-1">
                <span>PDF Documents</span>
                <span>84 GB (53%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '53%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400 mb-1">
                <span>Avatars & Profile Images</span>
                <span>42 GB (27%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: '27%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400 mb-1">
                <span>Data Export Templates</span>
                <span>12 GB (8%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-600 h-full rounded-full" style={{ width: '8%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400 mb-1">
                <span>System Cache & Other</span>
                <span>18.4 GB (12%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageManagementPage;
