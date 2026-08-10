import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = (msg, title = 'Success') => addToast(msg, 'success', title);
  const error = (msg, title = 'Error') => addToast(msg, 'error', title);
  const info = (msg, title = 'Info') => addToast(msg, 'info', title);
  const warning = (msg, title = 'Warning') => addToast(msg, 'warning', title);

  return (
    <NotificationContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
                isSuccess
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : isError
                  ? 'bg-rose-50/90 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                  : isWarning
                  ? 'bg-amber-50/90 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                  : 'bg-sky-50/90 dark:bg-sky-950/80 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                {isError && <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
                {isWarning && <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
              </div>
              <div className="flex-1 min-w-0">
                {toast.title && <h5 className="text-sm font-semibold mb-0.5">{toast.title}</h5>}
                <p className="text-xs leading-relaxed opacity-90">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 opacity-70" />
              </button>
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
