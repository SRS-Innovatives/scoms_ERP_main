import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { Database, ShieldCheck, Play, Download, Trash2, Calendar, FileDown } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const BackupManagementPage = () => {
  const { success } = useNotification();
  const [retentionDays, setRetentionDays] = useState(30);

  const backups = [
    { id: 1, name: 'scoms_db_backup_20260822_120000.sql.gz', size: '512.4 MB', type: 'Scheduled (Daily)', status: 'Success', date: '2026-08-22 12:00 PM' },
    { id: 2, name: 'scoms_db_backup_20260821_120000.sql.gz', size: '510.8 MB', type: 'Scheduled (Daily)', status: 'Success', date: '2026-08-21 12:00 PM' },
    { id: 3, name: 'scoms_db_backup_pre_upgrade_patch.sql.gz', size: '509.2 MB', type: 'Manual (Pre-update)', status: 'Success', date: '2026-08-20 03:30 PM' },
    { id: 4, name: 'scoms_db_backup_20260820_120000.sql.gz', size: '509.1 MB', type: 'Scheduled (Daily)', status: 'Success', date: '2026-08-20 12:00 PM' },
  ];

  const handleRunBackup = () => {
    success('Starting manual backup generation... Check back in a few moments.');
  };

  const columns = [
    { header: 'Backup Filename', key: 'name', render: (val) => <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{val}</span> },
    { header: 'File Size', key: 'size' },
    { header: 'Backup Trigger Type', key: 'type' },
    { header: 'Date Generated', key: 'date', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { 
      header: 'Status', 
      key: 'status',
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          {val}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (id, row) => (
        <div className="flex gap-2">
          <button onClick={() => success(`Downloading ${row.name}`)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => success(`Restoring database to ${row.name}`)} className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded text-emerald-600">
            <Database className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => success(`Deleted backup file`)} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded text-rose-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 text-xs">
      <PageHeader title="Database Backup & Recovery" subtitle="Manage automated backup policies, download archive snapshots, and restore database states" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="Total Backups" value="48 Files" subtitle="Stored in AWS S3" icon={Database} color="indigo" />
        <StatCard title="Last Snapshot" value="2 Hrs Ago" subtitle="12:00 PM Today" icon={ShieldCheck} color="emerald" />
        <StatCard title="Storage Space" value="24.8 GB" subtitle="Compressed sql.gz" icon={FileDown} color="indigo" />
        <StatCard title="S3 Gateway Connection" value="Healthy" subtitle="ap-south-1" icon={ShieldCheck} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Backup Policy Configuration</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Backup Frequency</label>
              <select className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <option value="daily">Every 24 Hours (Daily at 12:00 AM)</option>
                <option value="12h">Every 12 Hours</option>
                <option value="weekly">Every Sunday at 02:00 AM</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Retention Policy (Days to keep files)</label>
              <input 
                type="number" 
                value={retentionDays} 
                onChange={(e) => setRetentionDays(e.target.value)} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
          <div className="pt-2">
            <button onClick={() => success('Backup schedule policies updated successfully!')} className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
              Save Policies
            </button>
          </div>
        </div>

        {/* Manual Backup Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Play className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Trigger Manual Backup</h3>
          </div>
          <div className="space-y-4 text-slate-500">
            <p>Generate an immediate backup dump snapshot of the platform's PostgreSQL database. Stored securely inside the AWS S3 vault.</p>
            <button onClick={handleRunBackup} className="w-full py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              Trigger Backup Execution
            </button>
          </div>
        </div>
      </div>

      {/* Backups Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Historical Backups List</h3>
        <DataTable columns={columns} data={backups} />
      </div>
    </div>
  );
};

export default BackupManagementPage;
