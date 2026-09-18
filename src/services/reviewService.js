import apiClient from '../lib/apiClient';

export const reviewService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/reviews/admin/list?${params.toString()}`);
    return data;
  },
  create: async (formData) => {
    const { data } = await apiClient.post('/reviews/admin/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  update: async (id, formData) => {
    const { data } = await apiClient.put(`/reviews/admin/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  delete: async (id) => {
    const { data } = await apiClient.delete(`/reviews/${id}`);
    return data;
  },
};
