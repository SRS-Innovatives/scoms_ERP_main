import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onCancel, // alias for onClose, so either prop name works
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to execute this action?',
  confirmText = 'Confirm Action',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info'
}) => {
  if (!isOpen) return null;

  const handleCancel = onClose || onCancel || (() => {});

  const theme = {
    danger: {
      iconBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700',
    },
    warning: {
      iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      confirmBtn: 'bg-indigo-600 hover:bg-indigo-700',
    },
  }[type] || {};

  const Icon = type === 'info' ? Info : AlertTriangle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${theme.iconBg}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            </div>
          </div>
          <button onClick={handleCancel} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all ${theme.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
