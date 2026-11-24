import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

interface Trip {
  session: 'MORNING' | 'EVENING';
  status: 'PENDING' | 'COMPLETED' | string;
  completedAt: string | null;
}

/** GET /transport — the student's (active child's) bus assignment, or null if none. */
export interface MyTransport {
  id: string;
  pickupPoint: string;
  route: {
    id: string;
    routeName: string;
    startPoint: string;
    endPoint: string;
    monthlyFare: number;
    vehicle: {
      id: string;
      vehicleNumber: string;
      vehicleType: string;
      driverName: string | null;
      driverPhone: string | null;
      gpsEnabled: boolean;
    } | null;
  };
  /** today's trips for that bus (null when no bus is assigned to the route) */
  todayTrips: { morning: Trip | null; evening: Trip | null } | null;
}

export async function fetchMyTransport(): Promise<MyTransport | null> {
  const { data } = await apiClient.get<ApiEnvelope<MyTransport | null>>('/transport');
  return data.data ?? null;
}
