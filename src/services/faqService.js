import apiClient from '../lib/apiClient';

export const faqService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/faqs?${params.toString()}`);
    return data;
  },
};
