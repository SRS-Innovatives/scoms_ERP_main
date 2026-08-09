import React, { useState } from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle2, Globe, Lock } from 'lucide-react';

export const ResultPublishPage = () => {
  const { notifySuccess } = useNotification();
  const [isPublished, setIsPublished] = useState(true);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Exam Result Publication Console</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Publish or unpublish semester exam results to Student Portal & Parent SMS</p>
      </div>

      <FormSection title="Current Publication Status" icon={Globe}>
        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200">
          <div>
            <p className="font-bold text-emerald-900 dark:text-emerald-200">Even Semester 2025 Examination Results - LIVE</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Published on 08-Aug-2026. Accessible via Student Login.</p>
          </div>
          <button
            onClick={() => {
              setIsPublished(!isPublished);
              notifySuccess(isPublished ? 'Results unpublished.' : 'Results published live to portal!');
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
          >
            {isPublished ? 'Unpublish Results' : 'Publish Results Live'}
          </button>
        </div>
      </FormSection>
    </div>
  );
};

export default ResultPublishPage;
