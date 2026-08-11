// Service API abstraction wrapper for SCOMS Student Portal
// Decouples UI components from mock data for future REST API backend connectivity

export const apiCall = async (endpoint, options = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: 200, data: options.mockResponse || {} });
    }, options.delay || 120);
  });
};

export default apiCall;
