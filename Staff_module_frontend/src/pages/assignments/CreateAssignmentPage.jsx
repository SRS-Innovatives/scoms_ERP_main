import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { PlusCircle, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import assignmentService from '../../services/assignmentService';

export const CreateAssignmentPage = () => {
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    classKey: '',
    dueDate: '',
    totalMarks: 25,
    description: ''
  });

  useEffect(() => {
    assignmentService.getMyClasses()
      .then((res) => {
        const data = res.data || [];
        setClasses(data);
        if (data.length > 0) setFormData((prev) => ({ ...prev, classKey: `${data[0].subjectId}|${data[0].sectionId}` }));
      })
      .catch((err) => showError(err.message || 'Failed to load your assigned classes', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classKey) return;
    const [subjectId, sectionId] = formData.classKey.split('|');
    setSubmitting(true);
    try {
      const res = await assignmentService.createAssignment({
        title: formData.title,
        subjectId,
        sectionId,
        dueDate: formData.dueDate,
        totalMarks: formData.totalMarks,
        description: formData.description,
      });
      success(`Assignment "${formData.title}" created and published to ${res.data.className}!`, 'Assignment Published');
      navigate('/staff/assignments/list');
    } catch (err) {
      showError(err.message || 'Failed to create assignment', 'Publish Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (classes.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-3xl text-center text-xs text-slate-500">
        You aren't assigned to teach any subject/section yet. Ask your Institute Admin to assign you before creating assignments.
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-3xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-sky-500" /> Create Homework / Student Assignment
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assignment Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Electrostatic Potential & Capacitance Numerical Problems"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Class & Subject</label>
            <select
              value={formData.classKey}
              onChange={(e) => setFormData({ ...formData, classKey: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            >
              {classes.map((c) => (
                <option key={`${c.subjectId}|${c.sectionId}`} value={`${c.subjectId}|${c.sectionId}`}>
                  {c.className} — {c.subjectName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Marks</label>
            <input
              type="number"
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
          <input
            type="date"
            required
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Instructions & Description</label>
          <textarea
            rows={4}
            placeholder="Provide detailed submission instructions..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
          ></textarea>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {submitting ? 'Publishing...' : 'Publish Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssignmentPage;
