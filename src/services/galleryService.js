import apiClient from '../lib/apiClient';

export const galleryService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/gallery?${params.toString()}`);
    return data;
  },
};
