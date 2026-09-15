import apiClient from '../lib/apiClient';

export const locationService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/locations?${params.toString()}`);
    return data;
  },
};
