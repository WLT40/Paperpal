import { api } from './client';

export const analysisApi = {
  get: (paperId) => api.get(`/papers/${paperId}/analysis`),
  upsert: (paperId, data) => api.put(`/papers/${paperId}/analysis`, data),
  patch: (paperId, data) => api.patch(`/papers/${paperId}/analysis`, data),
};
