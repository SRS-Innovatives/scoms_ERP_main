// Live REST API Service Wrapper for SCOMS Student Portal
// Connects to Student Backend (Port 5004)
// NOTE: the backend mounts all routes under /api/v1/student (see Student_Backend/src/app.js)
// — this prefix must match that mount exactly.

const BASE_URL = 'http://localhost:5004';
const API_PREFIX = '/api/v1/student';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('scoms_student_token');
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

    if (res.status === 401) {
      // Token missing/expired/invalid — clear it and send the user back to login instead
      // of letting every widget on the page fail silently with its own error toast.
      localStorage.removeItem('scoms_student_token');
      localStorage.removeItem('scoms_student_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/student/login';
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
