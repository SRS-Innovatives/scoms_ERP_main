// Transport Desk Service (Transport Manager) — /api/v1/staff/transport/*
import apiCall from './api';

export const transportDeskService = {
  getVehicles: async () => apiCall('/transport/vehicles'),
  createVehicle: async (payload) => apiCall('/transport/vehicles', { method: 'POST', body: payload }),
  getRoutes: async () => apiCall('/transport/routes'),
  createRoute: async (payload) => apiCall('/transport/routes', { method: 'POST', body: payload }),
  getMappings: async () => apiCall('/transport/mappings'),
  assignStudent: async (payload) => apiCall('/transport/mappings', { method: 'POST', body: payload }),
  getTrips: async (date) => apiCall(`/transport/trips${date ? `?date=${date}` : ''}`),
  markTripComplete: async (payload) => apiCall('/transport/trips/complete', { method: 'POST', body: payload }),
};

export default transportDeskService;
