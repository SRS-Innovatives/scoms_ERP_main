// Live REST API Service Wrapper for SCOMS Super Admin Portal
// Connects to Super Admin Backend (Port 5001)

const BASE_URL = 'http://localhost:5001';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('scoms_superadmin_token');
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

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      if (res.status === 401) {
        localStorage.removeItem('scoms_superadmin_user');
        localStorage.removeItem('scoms_superadmin_token');
        window.location.href = '/super-admin/login';
      }
      throw new Error(errorData.message || `API Error: ${res.status}`);
    }

    const result = await res.json();
    return { status: res.status, data: result.data || result };
  } catch (err) {
    console.error(`[SCOMS API] Backend connection to ${BASE_URL}${endpoint} failed:`, err);
    throw err;
  }
};

export default apiCall;
