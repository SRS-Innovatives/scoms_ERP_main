// Own Institution Profile Service — /api/v1/admin/institution-profile
import apiCall from './api';

const updateProfile = (payload) => apiCall('/institution-profile', { method: 'PATCH', body: payload });

export const institutionProfileService = { updateProfile };
export default institutionProfileService;
