import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { Star, CheckCircle2, Loader2 } from 'lucide-react';
import feedbackService from '../../services/feedbackService';
import ErrorState from '../../components/common/ErrorState';

export const FeedbackPage = () => {
  const { success, error: showError } = useNotification();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [submitting, setSubmitting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    feedbackService.getFeedbackSubjects()
      .then((res) => setSubjects(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load subjects', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const setDraft = (subjectId, field, value) => {
    setDrafts((prev) => ({ ...prev, [subjectId]: { ...prev[subjectId], [field]: value } }));
  };

  const handleSubmit = async (subjectId) => {
    const draft = drafts[subjectId];
    if (!draft?.rating) {
      showError('Please select a rating before submitting.', 'Rating Required');
      return;
    }
    setSubmitting(subjectId);
    try {
      await feedbackService.submitFeedback(subjectId, draft.rating, draft.comments || '');
      success('Feedback submitted anonymously. Thank you!', 'Feedback Submitted');
      load();
    } catch (err) {
      showError(err.message || 'Failed to submit feedback', 'Submission Failed');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Anonymous Faculty & Course Feedback" subtitle="Rate your subjects for this term. Submissions are never linked back to your identity." />

      {subjects.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No subjects set up for your course yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjects.map((sub) => (
            <div key={sub.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{sub.name}</h3>

              {sub.alreadySubmitted ? (
                <div className="flex items-center gap-2 text-emerald-600 font-semibold py-2">
                  <CheckCircle2 className="w-5 h-5" /> Feedback submitted (rated {sub.myRating}/5) — thank you!
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setDraft(sub.id, 'rating', n)}
                        className="p-0.5"
                      >
                        <Star className={`w-6 h-6 ${(drafts[sub.id]?.rating || 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Optional comments (anonymous)..."
                    value={drafts[sub.id]?.comments || ''}
                    onChange={(e) => setDraft(sub.id, 'comments', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  ></textarea>
                  <button
                    onClick={() => handleSubmit(sub.id)}
                    disabled={submitting === sub.id}
                    className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-xl disabled:opacity-50"
                  >
                    {submitting === sub.id ? 'Submitting...' : 'Submit Anonymous Rating'}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
