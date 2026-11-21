// Student Leave Service — /api/v1/admin/student-leave
// Every student leave request in the institution; class teachers decide theirs in the
// Staff portal, the Institute Admin can see all and approve/reject as well.
import apiCall from './api';

const getAll = (status) => apiCall(`/student-leave${status ? `?status=${status}` : ''}`);
const updateStatus = (id, status) => apiCall(`/student-leave/${id}`, { method: 'PATCH', body: { status } });

const studentLeaveService = { getAll, updateStatus };
export default studentLeaveService;
