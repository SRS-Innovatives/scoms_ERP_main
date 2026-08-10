// Service API abstraction wrapper for SCOMS Super Admin Portal
// Designed so mock data can easily be replaced with REST API Axios/Fetch calls later

export const apiCall = async (endpoint, options = {}) => {
  // Simulating async network delay for backend readiness
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: 200, data: options.mockResponse || {} });
    }, options.delay || 150);
  });
};

export default apiCall;
