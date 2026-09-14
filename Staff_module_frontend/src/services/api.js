// Live REST API Service Wrapper for SCOMS Staff Portal
// Connects to Staff Backend (Port 5003)
// NOTE: the backend mounts all routes under /api/v1/staff (see Staff_backend/src/app.js)
// — this prefix must match that mount exactly.

const BASE_URL = 'http://localhost:5003';
const API_PREFIX = '/api/v1/staff';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('scoms_staff_token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    // Let the browser set the multipart boundary itself for FormData bodies (file uploads)
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${API_PREFIX}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined,
    });

    if (res.status === 401) {
      // Token missing/expired/invalid — clear it and send the user back to login instead
      // of letting every widget on the page fail silently with its own error toast.
      localStorage.removeItem('scoms_staff_token');
      localStorage.removeItem('scoms_staff_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/staff/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${res.status}`);
    }

    const result = await res.json();
    return { status: res.status, data: result.data || result };
  } catch (err) {
    console.error(`[SCOMS API] Backend connection to ${BASE_URL}${API_PREFIX}${endpoint} failed:`, err);
    throw err;
  }
};

export default apiCall;
