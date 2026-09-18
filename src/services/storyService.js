import apiClient from '../lib/apiClient';

export const storyService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/stories?${params.toString()}`);
    return data;
  },
};
