import apiClient from '../lib/apiClient';

export const reportService = {
  getRevenue: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/revenue-report?${params.toString()}`);
    return data;
  },
};
