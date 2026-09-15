import apiClient from '../lib/apiClient';

export const userService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/users?${params.toString()}`);
    return data;
  },
};
