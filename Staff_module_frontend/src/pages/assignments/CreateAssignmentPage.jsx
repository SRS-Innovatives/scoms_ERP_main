import React, { useState } from 'react';
import FileUpload from '../../components/common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { PlusCircle, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CreateAssignmentPage = () => {
  const { success } = useNotification();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    class: 'Class 12-A',
    subject: 'Physics',
    dueDate: '',
    maxMarks: 25,
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    success(`Assignment "${formData.title}" created and published to ${formData.class}!`, 'Assignment Published');
    navigate('/staff/assignments/list');
  };

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Class</label>
            <select
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            >
              <option value="Class 12-A">Class 12-A</option>
              <option value="Class 11-B">Class 11-B</option>
              <option value="Class 10-A">Class 10-A</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            >
              <option value="Physics">Physics</option>
              <option value="Physics Lab">Physics Lab</option>
              <option value="Applied Physics">Applied Physics</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Marks</label>
            <input
              type="number"
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
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

        <FileUpload label="Attach Question Paper / Reference Resource (Optional PDF)" />

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition-all"
          >
            <Save className="w-4 h-4" /> Publish Assignment
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssignmentPage;
