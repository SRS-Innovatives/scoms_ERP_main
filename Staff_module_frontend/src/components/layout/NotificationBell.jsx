import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, FileText, CheckCheck, Bell as BellDefault } from 'lucide-react';
import notificationService from '../../services/notificationService';

const POLL_MS = 20000;

const TYPE_ICON = {
  HOMEWORK: FileText,
};

const timeAgo = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

/** Real, polled notification bell — homework submissions and anything else this staff
 * member's own account generates, backed by the shared Notification table. */
export const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  const refreshCount = useCallback(() => {
    notificationService.getUnreadCount().then((res) => setUnreadCount(res.data?.count || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(interval);
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return;
    notificationService.getAll().then((res) => setItems(res.data || [])).catch(() => {});
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item) => {
    if (!item.isRead) {
      notificationService.markRead(item.id).catch(() => {});
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  const handleMarkAllRead = () => {
    notificationService.markAllRead().catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-0.5 flex items-center justify-center bg-rose-500 rounded-full text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-fadeIn bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Notifications</h4>
            {unreadCount > 0 ? (
              <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">All caught up</span>
            )}
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
            {items.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No notifications yet.</p>
            ) : (
              items.map((n) => {
                const Icon = TYPE_ICON[n.type] || BellDefault;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`flex gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      n.isRead
                        ? 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        : 'border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/30 hover:bg-sky-50 dark:hover:bg-sky-950/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{n.title}</h5>
                        <span className="text-[9px] text-slate-400 shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
