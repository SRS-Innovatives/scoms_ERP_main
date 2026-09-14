// Admission Form Custom Fields — thin ADMISSION-scoped wrapper over the generalized
// customFieldService (see that file — the same approval lifecycle now also serves
// Staff Profile custom fields, entityType-scoped).
import customFieldService from './customFieldService';

const getAll = () => customFieldService.getAll('ADMISSION');
const getApproved = () => customFieldService.getApproved('ADMISSION');
const create = (payload) => customFieldService.create(payload, 'ADMISSION');
const update = (id, payload) => customFieldService.update(id, payload);
const remove = (id) => customFieldService.remove(id);
const submitForApproval = (fieldIds) => customFieldService.submitForApproval('ADMISSION', fieldIds);

export const admissionCustomFieldService = { getAll, getApproved, create, update, remove, submitForApproval };
export default admissionCustomFieldService;
