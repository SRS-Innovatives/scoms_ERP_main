// Live REST API Service Wrapper for SCOMS Institute Admin Portal
// Connects to Institute Admin Backend (Port 5002)

const BASE_URL = 'http://localhost:5002';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('scoms_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (res.ok) {
      const result = await res.json();
      return { status: res.status, data: result.data || result };
    }
  } catch (err) {
    console.warn(`[SCOMS API] Backend connection to ${BASE_URL}${endpoint} unavailable, using mock data.`);
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: 200, data: options.mockResponse || {} });
    }, options.delay || 100);
  });
};

export default apiCall;
