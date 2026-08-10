import React, { useState } from 'react';
import FileUpload from '../../components/common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { UploadCloud, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UploadMaterialPage = () => {
  const { success } = useNotification();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [targetClass, setTargetClass] = useState('Class 12-A');

  const handleSubmit = (e) => {
    e.preventDefault();
    success(`Study material "${title}" uploaded to library!`, 'Upload Complete');
    navigate('/staff/materials/library');
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-sky-500" /> Upload Class Notes & Learning Resources
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Resource Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Unit 4: Magnetism Solved Formula Sheet & Notes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            >
              <option value="Physics">Physics</option>
              <option value="Physics Lab">Physics Lab</option>
              <option value="Applied Physics">Applied Physics</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Class</label>
            <select
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            >
              <option value="Class 12-A">Class 12-A</option>
              <option value="Class 11-B">Class 11-B</option>
              <option value="Class 10-A">Class 10-A</option>
            </select>
          </div>
        </div>

        <FileUpload label="Select File (PDF, PPTX, DOCX, Images)" />

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition-all"
          >
            <Save className="w-4 h-4" /> Upload Material
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadMaterialPage;
