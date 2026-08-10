import { apiCall } from './api';

export const settingsService = {
  getSettings: async () => {
    return apiCall('/api/super-admin/settings', {
      mockResponse: {
        appName: "SCOMS Platform",
        timezone: "Asia/Kolkata",
        currency: "INR (₹)",
        localization: "English",
        maintenanceMode: false
      }
    });
  }
};

export default settingsService;
