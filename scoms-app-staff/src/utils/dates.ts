/** Local-time date helpers. Never use toISOString() for a calendar day — it's UTC, so in
 * India anything before 05:30 lands on the previous day. */

export const startOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Date → YYYY-MM-DD in local time. */
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** YYYY-MM-DD → local midnight Date. */
export const fromYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** "21 Nov" / "21 Nov 2025" (year only when it isn't this year). */
export const shortDate = (value: string | Date) => {
  const d = typeof value === 'string' ? new Date(value) : value;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
};

/** Whole days from today to the given date (negative = past). */
export const daysFromToday = (value: string | Date) => {
  const d = typeof value === 'string' ? new Date(value) : value;
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((day.getTime() - startOfToday().getTime()) / 86_400_000);
};

/** "just now", "5 min ago", "3 h ago", "yesterday", else a short date. */
export const timeAgo = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  if (daysFromToday(value) === -1) return 'yesterday';
  return shortDate(value);
};
