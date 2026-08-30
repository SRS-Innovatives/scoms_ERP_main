import React, { useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { MessageSquareHeart, Star } from 'lucide-react';
import feedbackService from '../../services/feedbackService';

export const FeedbackSummaryPage = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feedbackService.getSummary()
      .then((res) => setSummary(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Subject', key: 'subjectName', render: (v) => <span className="font-bold text-slate-900 dark:text-white">{v}</span> },
    { header: 'Course', key: 'courseName' },
    { header: 'Responses', key: 'responseCount' },
    {
      header: 'Average Rating',
      key: 'averageRating',
      render: (v) => (
        <span className="flex items-center gap-1 font-bold text-amber-600">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {v} / 5
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Anonymous Faculty & Course Feedback Summary</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Aggregated ratings only — individual student submissions are never shown, preserving anonymity.</p>
      </div>

      {!loading && summary.length === 0 ? (
        <EmptyState title="No Feedback Yet" description="Aggregated ratings appear here once students submit anonymous feedback." icon={MessageSquareHeart} />
      ) : (
        <DataTable columns={columns} data={summary} loading={loading} />
      )}
    </div>
  );
};

export default FeedbackSummaryPage;
