// Live REST API Service Wrapper for SCOMS Institute Admin Portal
// Connects to Institute Admin Backend (Port 5002)
// NOTE: the backend mounts all tenant routes under /api/v1/admin (see
// IntituteAdmin_Backend/src/app.js) — this prefix must match that mount exactly.

const BASE_URL = 'http://localhost:5002';
const API_PREFIX = '/api/v1/admin';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('scoms_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${API_PREFIX}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const result = await res.json();
    
    if (res.ok) {
      return { status: res.status, data: result.data || result };
    } else {
      if (res.status === 401) {
        // Handle token expiration globally
        localStorage.removeItem('scoms_admin_token');
        window.location.href = '/login';
      }
      throw new Error(result.message || 'API Error');
    }
  } catch (err) {
    console.error(`[SCOMS API Error] ${endpoint}:`, err.message);
    throw err;
  }
};

export default apiCall;
