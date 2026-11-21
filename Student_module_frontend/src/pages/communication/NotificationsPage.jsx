import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, CalendarX, FileCheck, CreditCard, Megaphone, BookOpen, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import notificationService from '../../services/notificationService';

// Icon by notification type (anything else gets the plain bell)
const TYPE_ICON = {
  LEAVE: CalendarX,
  RESULT: FileCheck,
  EXAM: FileCheck,
  FEE: CreditCard,
  ANNOUNCEMENT: Megaphone,
  HOMEWORK: BookOpen,
  ASSIGNMENT: BookOpen,
};

const timeAgo = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * The student's own notifications — leave decisions, results published, fee reminders,
 * homework and anything else the institution sends them. (This page used to show the
 * institution's Announcements instead; those still have their own Announcements page.)
 */
export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL | UNREAD
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    notificationService.getAll(100)
      .then((res) => setItems(res.data || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const unread = items.filter((n) => !n.isRead).length;
  const shown = filter === 'UNREAD' ? items.filter((n) => !n.isRead) : items;

  const open = (n) => {
    if (!n.isRead) {
      notificationService.markRead(n.id).catch(() => {});
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    if (n.link) navigate(n.link);
  };

  const markAllRead = () => {
    notificationService.markAllRead().catch(() => {});
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
  };

  if (loading) return <LoadingState message="Loading your notifications..." />;
  if (error) return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Updates meant for you — leave decisions, results, fee reminders, homework and more."
        badge={unread > 0 ? `${unread} unread` : undefined}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          {[['ALL', `All (${items.length})`], ['UNREAD', `Unread (${unread})`]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filter === key ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'UNREAD' ? "You're all caught up" : 'No notifications yet'}
          message={filter === 'UNREAD' ? 'You have no unread notifications.' : 'When your institution sends you an update, it will appear here.'}
        />
      ) : (
        <div className="space-y-2">
          {shown.map((n) => {
            const Icon = TYPE_ICON[n.type] || Bell;
            return (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`w-full text-left flex gap-3 p-4 rounded-2xl border transition-all ${
                  n.isRead
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                }`}
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.isRead ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className={`text-sm ${n.isRead ? 'font-semibold text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>{n.title}</span>
                    <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(n.createdAt)}</span>
                  </span>
                  <span className="block text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{n.message}</span>
                </span>
                {n.link && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 self-center" />}
              </button>
            );
          })}
          {items.length >= 100 && (
            <p className="text-center text-[11px] text-slate-400 pt-2">Showing your latest 100 notifications.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
