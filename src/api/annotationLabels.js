import { api } from './client';

export const annotationLabelsApi = {
  list: () => api.get('/annotation-labels'),
  create: (data) => api.post('/annotation-labels', data),
  update: (id, data) => api.put(`/annotation-labels/${id}`, data),
  delete: (id) => api.delete(`/annotation-labels/${id}`),
};
