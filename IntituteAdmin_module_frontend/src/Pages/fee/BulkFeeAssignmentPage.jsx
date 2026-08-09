import React from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle } from 'lucide-react';

export const BulkFeeAssignmentPage = () => {
  const { notifySuccess } = useNotification();

  const handleBulkAssign = (e) => {
    e.preventDefault();
    notifySuccess('Fee structure assigned to all 920 Computer Science students for Even Semester!', 'Bulk Fee Assigned');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bulk Fee Assignment Module</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Assign semester fee structures to entire departments, classes, or batches simultaneously</p>
      </div>

      <form onSubmit={handleBulkAssign}>
        <FormSection title="Target Batch & Fee Structure Mapping">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Target Department</label>
              <select className="w-full p-2.5 bg-slate-50 border rounded-lg font-medium">
                <option>Computer Science & Engineering (920 Students)</option>
                <option>AI & Data Science (540 Students)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Semester / Term</label>
              <select className="w-full p-2.5 bg-slate-50 border rounded-lg font-medium">
                <option>Semester 6 (Even Semester 2025-26)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Fee Structure Template</label>
              <select className="w-full p-2.5 bg-slate-50 border rounded-lg font-medium">
                <option>Tuition Fee (₹42,500) + Exam Fee (₹3,500)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md">
              <CheckCircle className="w-4 h-4" />
              <span>Assign Fee to Entire Batch</span>
            </button>
          </div>
        </FormSection>
      </form>
    </div>
  );
};

export default BulkFeeAssignmentPage;
