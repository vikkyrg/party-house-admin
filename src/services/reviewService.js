import apiClient from '../lib/apiClient';

export const reviewService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/reviews?${params.toString()}`);
    return data;
  },
};
