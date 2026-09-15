import apiClient from '../lib/apiClient';

export const cityService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/cities?${params.toString()}`);
    return data;
  },
};
