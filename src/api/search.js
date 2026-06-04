import { api } from './client';

export const searchApi = {
  search: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.scope) qs.set('scope', params.scope);
    if (params.field) qs.set('field', params.field);
    if (params.tag_ids) qs.set('tag_ids', params.tag_ids);
    if (params.category_id) qs.set('category_id', params.category_id);
    if (params.year_from) qs.set('year_from', params.year_from);
    if (params.year_to) qs.set('year_to', params.year_to);
    if (params.page) qs.set('page', params.page);
    if (params.page_size) qs.set('page_size', params.page_size);
    return api.get(`/search?${qs.toString()}`);
  },
  suggestions: (q, limit = 10) =>
    api.get(`/search/suggestions?q=${encodeURIComponent(q)}&limit=${limit}`),
};
