import apiClient from '../lib/apiClient';

export const serviceService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/services?${params.toString()}`);
    return data;
  },
};
