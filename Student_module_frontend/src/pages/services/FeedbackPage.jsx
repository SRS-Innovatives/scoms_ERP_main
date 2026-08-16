import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';

export const FeedbackPage = () => {
  const { success } = useNotification();

  return (
    <div className="space-y-6">
      <PageHeader title="Anonymous Faculty & Course Feedback" subtitle="Submit end-of-semester feedback rating for enrolled subjects." />

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <h3 className="font-bold text-sm">Semester 4 Faculty Evaluation Form</h3>
        <p className="text-slate-500">All submissions are completely anonymous and used for quality improvement.</p>
        <button
          onClick={() => success('Feedback ratings submitted for all 5 subjects.', 'Feedback Submitted')}
          className="px-6 py-2.5 font-bold text-white bg-indigo-600 rounded-xl"
        >
          Submit Anonymous Ratings
        </button>
      </div>
    </div>
  );
};

export default FeedbackPage;
