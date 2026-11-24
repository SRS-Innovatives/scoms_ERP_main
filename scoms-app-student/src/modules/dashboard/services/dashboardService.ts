import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';
import { NotificationItem } from '../../notifications/services/notificationsService';

/** GET /dashboard/summary — Student_Backend dashboardSummaryController. A section is null
 * when the caller can't see that module (institution off, hidden in the app, not their role). */
export interface DashboardSummary {
  attendance: { percentage: number; presentCount: number; absentCount: number; totalClasses: number } | null;
  homework: { pending: number; total: number; nextDue: { id: string; title: string; subjectName: string; dueDate: string } | null } | null;
  fees: { totalDue: number; dueAmount: number; lateFeeDue: number; openCount: number } | null;
  notifications: { unread: number; recent: NotificationItem[] } | null;
  parent: { openDiscipline: number | null; recentHealthVisits: number | null; recentHospitalReferrals: number | null } | null;
}

export type SummarySection = 'attendance' | 'homework' | 'fees' | 'notifications' | 'parent';

export async function fetchDashboardSummary(sections: SummarySection[]): Promise<DashboardSummary> {
  const { data } = await apiClient.get<ApiEnvelope<DashboardSummary>>('/dashboard/summary', {
    params: { sections: sections.join(',') },
  });
  return data.data;
}
