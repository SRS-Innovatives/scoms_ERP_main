import React from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { RotateCcw, CheckCircle } from 'lucide-react';

export const ReturnBookPage = () => {
  const { notifySuccess } = useNotification();

  const handleReturn = (e) => {
    e.preventDefault();
    notifySuccess('Book returned to library stack! Zero overdue fine incurred.', 'Book Returned');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Library Return & Renewal Desk</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Process returned books, check condition & calculate overdue fine</p>
      </div>

      <form onSubmit={handleReturn}>
        <FormSection title="Book Return Entry" icon={RotateCcw}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Scan Book Barcode / Accession ID</label>
              <input type="text" defaultValue="BK-001" className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono font-bold" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Return Book</span>
            </button>
          </div>
        </FormSection>
      </form>
    </div>
  );
};

export default ReturnBookPage;
