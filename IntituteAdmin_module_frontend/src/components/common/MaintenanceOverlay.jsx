import { useEffect, useState } from 'react';

/**
 * Full-screen "Under maintenance" notice. services/api.js fires `scoms:maintenance` when the
 * server answers 503 MAINTENANCE_MODE (the Super Admin switched Maintenance Mode on); this
 * covers the app until the user tries again after it is switched off.
 */
export const MaintenanceOverlay = () => {
  const [message, setMessage] = useState(null);
  useEffect(() => {
    const onMaintenance = (e) => setMessage(e.detail || 'SCOMS is under maintenance right now. Please try again in a little while.');
    window.addEventListener('scoms:maintenance', onMaintenance);
    return () => window.removeEventListener('scoms:maintenance', onMaintenance);
  }, []);
  if (!message) return null;
  return (
    <div role="alertdialog" aria-live="assertive" className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm">
      <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-3xl" aria-hidden="true">🛠️</div>
        <h1 className="text-lg font-black text-slate-900 dark:text-white">Under maintenance</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
          Try again
        </button>
      </div>
    </div>
  );
};

export default MaintenanceOverlay;
