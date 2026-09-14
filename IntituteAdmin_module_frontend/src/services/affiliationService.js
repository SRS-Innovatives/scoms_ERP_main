// University Affiliation Oversight Service — /api/v1/admin/affiliated-colleges
import apiCall from './api';

export const affiliationService = {
  getAffiliatedColleges: () => apiCall('/affiliated-colleges'),
};

export default affiliationService;
