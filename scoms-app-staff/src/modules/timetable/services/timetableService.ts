import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface TimetableEntry {
  id: string;
  dayOfWeek: string; // MONDAY, TUESDAY, ...
  period: number;
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  roomNumber: string | null;
  label: string | null; // e.g. "Assembly", "Lunch Break" — set when there's no subject
  subject: { name: string; code: string } | null;
  timetable: { section: { id: string; name: string; semester: { course: { name: string } } } };
}

export async function fetchMyTimetable(): Promise<TimetableEntry[]> {
  const { data } = await apiClient.get<ApiEnvelope<TimetableEntry[]>>('/timetable/my');
  return data.data;
}
