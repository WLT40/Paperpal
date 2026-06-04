import { api } from './client';

export const categoriesApi = {
  list: () => api.get('/categories'),
  tree: () => api.get('/categories/tree'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};
