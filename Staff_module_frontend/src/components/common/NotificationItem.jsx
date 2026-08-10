import React from 'react';
import { Bell, BookOpen, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

export const NotificationItem = ({ notification, onClick }) => {
  const getIcon = (cat) => {
    switch (cat) {
      case 'assignment':
        return <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'leave':
        return <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div
      onClick={() => onClick && onClick(notification)}
      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
        notification.unread
          ? 'bg-sky-50/60 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 font-medium'
          : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
      }`}
    >
      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
        {getIcon(notification.category)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
            {notification.title}
          </h5>
          <span className="text-[10px] text-slate-400 shrink-0">{notification.time}</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
      </div>
    </div>
  );
};

export default NotificationItem;
