import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export type CalendarEventType = 'HOLIDAY' | 'EXAM' | 'EVENT' | 'DEADLINE' | 'OTHER';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: CalendarEventType;
  startDate: string;
  endDate: string | null; // null = single-day
}

/** Events overlapping [from, to] (YYYY-MM-DD). */
export async function fetchCalendarEvents(from: string, to: string): Promise<CalendarEvent[]> {
  const { data } = await apiClient.get<ApiEnvelope<CalendarEvent[]>>('/academic-calendar', { params: { from, to } });
  return data.data ?? [];
}
