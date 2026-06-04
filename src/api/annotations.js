import { api } from './client';

export const annotationsApi = {
  list: (paperId) => api.get(`/papers/${paperId}/annotations`),
  get: (id) => api.get(`/annotations/${id}`),
  create: (paperId, data) => api.post(`/papers/${paperId}/annotations`, data),
  update: (id, data) => api.put(`/annotations/${id}`, data),
  delete: (id) => api.delete(`/annotations/${id}`),
};
