import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface TripSession {
  id: string;
  status: string;
  remarks: string | null;
}

export interface VehicleTripRow {
  id: string;
  vehicleNumber: string;
  routeName: string;
  morning: TripSession | null;
  evening: TripSession | null;
}

const TODAY = () => new Date().toISOString().slice(0, 10);

export async function fetchTodaysTrips(): Promise<VehicleTripRow[]> {
  const { data } = await apiClient.get<ApiEnvelope<VehicleTripRow[]>>('/transport/trips', {
    params: { date: TODAY() },
  });
  return data.data;
}

export async function markTripComplete(vehicleId: string, session: 'MORNING' | 'EVENING') {
  await apiClient.post('/transport/trips/complete', { vehicleId, session, date: TODAY() });
}

export interface TransportRoute {
  id: string;
  routeName: string;
}

export async function fetchRoutes(): Promise<TransportRoute[]> {
  const { data } = await apiClient.get<ApiEnvelope<TransportRoute[]>>('/transport/routes');
  return data.data;
}
