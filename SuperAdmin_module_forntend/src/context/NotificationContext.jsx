import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext();

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    accent: 'bg-emerald-500',
    iconWrap: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: AlertCircle,
    accent: 'bg-rose-500',
    iconWrap: 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400',
    bar: 'bg-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'bg-amber-500',
    iconWrap: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
  },
  info: {
    icon: Info,
    accent: 'bg-indigo-500',
    iconWrap: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    bar: 'bg-indigo-500',
  },
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = (msg, title = 'Success') => addToast(msg, 'success', title);
  const error = (msg, title = 'Error') => addToast(msg, 'error', title);
  const info = (msg, title = 'Information') => addToast(msg, 'info', title);
  const warning = (msg, title = 'Warning') => addToast(msg, 'warning', title);

  return (
    <NotificationContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none no-print">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className="pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 backdrop-blur-md animate-toast-in"
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${style.accent}`} />
              <div className="flex items-start gap-3 p-4 pl-4">
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${style.iconWrap}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  {toast.title && (
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{toast.title}</h4>
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-full ${style.bar} toast-progress-bar`} />
              </div>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
