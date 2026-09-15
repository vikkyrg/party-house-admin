import apiClient from '../lib/apiClient';

export const bannerService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/banners?${params.toString()}`);
    return data;
  },
};
