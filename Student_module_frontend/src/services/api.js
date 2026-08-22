// Live REST API Service Wrapper for SCOMS Student Portal
// Connects to Student Backend (Port 5004)

const BASE_URL = 'http://localhost:5004';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('scoms_student_token');
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
