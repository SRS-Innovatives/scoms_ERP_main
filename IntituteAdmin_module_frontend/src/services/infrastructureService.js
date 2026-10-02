// Infrastructure Service - /api/v1/setup/{campuses,buildings,floors,rooms}
import apiCall from './api';

const qs = (params = {}) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')).toString();
  return s ? `?${s}` : '';
};

const crud = (base) => ({
  getAll: (params) => apiCall(`${base}${qs(params)}`),
  create: (payload) => apiCall(base, { method: 'POST', body: payload }),
  update: (id, payload) => apiCall(`${base}/${id}`, { method: 'PATCH', body: payload }),
  remove: (id) => apiCall(`${base}/${id}`, { method: 'DELETE' }),
});

export const campusService = crud('/setup/campuses');
export const buildingService = {
  ...crud('/setup/buildings'),
  addFloor: (buildingId, payload) => apiCall(`/setup/buildings/${buildingId}/floors`, { method: 'POST', body: payload }),
  removeFloor: (floorId) => apiCall(`/setup/floors/${floorId}`, { method: 'DELETE' }),
};
export const roomService = crud('/setup/rooms');

export const ROOM_TYPES = ['CLASSROOM', 'LAB', 'HALL', 'OFFICE', 'LIBRARY', 'HOSTEL_ROOM', 'STAFF_ROOM', 'OTHER'];

export const roomLabel = (r) => `${r.building?.code ? `${r.building.code}-` : ''}${r.roomNumber}${r.name ? ` (${r.name})` : ''}`;

export default { campusService, buildingService, roomService, ROOM_TYPES, roomLabel };
