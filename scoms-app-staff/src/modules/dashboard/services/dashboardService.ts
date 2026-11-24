import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

/** GET /dashboard/summary — Staff_backend dashboardSummaryController. A section is null when
 * the institution doesn't have that module (timetable / homework) or the role can't use it. */
export interface StaffDashboardSummary {
  today: {
    day: string;
    count: number;
    classes: {
      id: string;
      period: number;
      startTime: string;
      endTime: string;
      roomNumber: string | null;
      subject: string | null;
      sectionId: string | null;
      className: string | null;
    }[];
  } | null;
  homework: { total: number; active: number; toReview: number } | null;
  leave: { pending: number; approved: number; rejected: number } | null;
  notifications: {
    unread: number;
    recent: { id: string; title: string; message: string; isRead: boolean; createdAt: string }[];
  } | null;
  /** Waiting for MY decision; a part is null when I can't act on it */
  approvals?: { studentLeave: number | null; corrections: number | null } | null;
  /** Desk roles only (Staff_backend deskSummary.js) */
  desk?: DeskSummary | null;
}

export type DeskSummary =
  | { kind: 'library'; issued: number; overdue: number; dueToday: number; unpaidFines: number; unpaidFineAmount: number }
  | { kind: 'transport'; vehicles: number; morningDone: number; eveningDone: number }
  | { kind: 'hostel'; beds: number; occupied: number; vacant: number }
  | { kind: 'exam_setup'; upcoming: number; ongoing: number }
  | { kind: 'placement'; openPostings: number; newApplications: number };

export async function fetchDashboardSummary(): Promise<StaffDashboardSummary> {
  const { data } = await apiClient.get<ApiEnvelope<StaffDashboardSummary>>('/dashboard/summary');
  return data.data;
}
