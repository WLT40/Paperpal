import { api } from './client';

export const papersApi = {
  list: (params = {}) => {
    const clean = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) clean[k] = v;
    }
    const qs = new URLSearchParams(clean).toString();
    return api.get(`/papers?${qs}`);
  },
  get: (id) => api.get(`/papers/${id}`),
  create: (data) => api.post('/papers', data),
  update: (id, data) => api.put(`/papers/${id}`, data),
  delete: (id) => api.delete(`/papers/${id}`),
  importPdf: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload('/papers/import', fd);
  },
  getPdfUrl: (id) => `/api/papers/${id}/pdf`,
  setCategories: (paperId, categoryIds) =>
    api.put(`/papers/${paperId}/categories`, categoryIds),
  setTags: (paperId, tagIds) =>
    api.put(`/papers/${paperId}/tags`, tagIds),
};
