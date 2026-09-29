import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export const BulkFeeAssignmentPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bulk Fee Assignment (Legacy)</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">This module has been retired</p>
      </div>

      <div className="flex items-start gap-3 p-6 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300 space-y-2">
          <p>
            Bulk-assigning legacy fee structures is no longer available — two fee systems running side by side risked
            the same fee being assigned to a student twice, once from each system.
          </p>
          <p>
            To assign a fee to every student in a course or section, publish a fee structure in the Fee Structure
            Builder and use its "Assign to Students" action, which covers the same bulk-by-course/section case.
          </p>
          <button onClick={() => navigate('/admin/fee/structure-builder')} className="font-bold underline">
            Go to Fee Structure Builder
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkFeeAssignmentPage;
