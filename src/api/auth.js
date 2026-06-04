import { api } from './client';

export const authApi = {
  register: (email, password) =>
    api.post('/auth/register', { email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  updateApiConfig: (config) =>
    api.put('/auth/me/api-config', config),
};

export const aiApi = {
  analyze: (paperId) =>
    api.post(`/papers/${paperId}/analyze`),
  models: () => api.get('/ai/models'),
};
