// Transport Service — /api/v1/admin/transport/*
import apiCall from './api';

const getVehicles = () => apiCall('/transport/vehicles');
const createVehicle = (payload) => apiCall('/transport/vehicles', { method: 'POST', body: payload });

const getRoutes = () => apiCall('/transport/routes');
const createRoute = (payload) => apiCall('/transport/routes', { method: 'POST', body: payload });

const getMappings = () => apiCall('/transport/mappings');
const assignStudentToRoute = (payload) => apiCall('/transport/mappings', { method: 'POST', body: payload });

const getTrips = (date) => apiCall(`/transport/trips${date ? `?date=${date}` : ''}`);
const markTripComplete = (payload) => apiCall('/transport/trips/complete', { method: 'POST', body: payload });

export const transportService = {
  getVehicles, createVehicle,
  getRoutes, createRoute,
  getMappings, assignStudentToRoute,
  getTrips, markTripComplete,
};
export default transportService;
