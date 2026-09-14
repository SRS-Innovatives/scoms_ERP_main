import { apiCall } from './api';

export const knowledgeBaseService = {
  getArticles: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/v1/super-admin/knowledge-base${query ? `?${query}` : ''}`);
  },
  createArticle: async (payload) => apiCall('/api/v1/super-admin/knowledge-base', { method: 'POST', body: payload }),
  updateArticle: async (id, payload) => apiCall(`/api/v1/super-admin/knowledge-base/${id}`, { method: 'PATCH', body: payload }),
  deleteArticle: async (id) => apiCall(`/api/v1/super-admin/knowledge-base/${id}`, { method: 'DELETE' }),
};

export default knowledgeBaseService;
