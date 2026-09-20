import React, { useState, useEffect, useCallback } from 'react';
import FormSection from '../../components/common/FormSection';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle, Loader2 } from 'lucide-react';
import feeService from '../../services/feeService';
import courseService from '../../services/courseService';

export const BulkFeeAssignmentPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [structures, setStructures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feeStructureId, setFeeStructureId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [error, setError] = useState(false);

  const loadSetupData = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([feeService.getStructures(), courseService.getAll()])
      .then(([structRes, courseRes]) => {
        setStructures(structRes.data || []);
        setCourses(courseRes.data || []);
        if ((structRes.data || []).length > 0) setFeeStructureId(structRes.data[0].id);
        if ((courseRes.data || []).length > 0) setCourseId(courseRes.data[0].id);
      })
      .catch((err) => { notifyError(`Failed to load setup data: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { loadSetupData(); }, [loadSetupData]);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const selectedStructure = structures.find((s) => s.id === feeStructureId);

  const handleBulkAssign = async (e) => {
    e.preventDefault();
    if (!feeStructureId || !courseId) return;
    setSubmitting(true);
    try {
      const res = await feeService.bulkAssignFee({ feeStructureId, courseId });
      notifySuccess(res.message || `Fee structure assigned to ${res.data.assigned} student(s)!`, 'Bulk Fee Assigned');
    } catch (error) {
      notifyError(`Failed to bulk-assign fee: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={loadSetupData} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bulk Fee Assignment Module</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Assign a fee structure to every active student in a course in one action</p>
      </div>

      <form onSubmit={handleBulkAssign}>
        <FormSection title="Target Course & Fee Structure Mapping">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Target Course</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name} ({c._count?.students ?? 0} Students)</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Fee Structure Template</label>
              <select value={feeStructureId} onChange={(e) => setFeeStructureId(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
                {structures.map((s) => <option key={s.id} value={s.id}>{s.name} (₹{s.totalAmount.toLocaleString()})</option>)}
              </select>
            </div>
          </div>

          {selectedCourse && selectedStructure && (
            <p className="mt-4 text-xs text-slate-500">
              This will assign <b>{selectedStructure.name}</b> (₹{selectedStructure.totalAmount.toLocaleString()}) to every ACTIVE student in <b>{selectedCourse.name}</b> who doesn't already have it.
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={submitting || !feeStructureId || !courseId} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50">
              <CheckCircle className="w-4 h-4" />
              <span>{submitting ? 'Assigning...' : 'Assign Fee to Entire Course'}</span>
            </button>
          </div>
        </FormSection>
      </form>
    </div>
  );
};

export default BulkFeeAssignmentPage;
