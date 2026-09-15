import apiClient from '../lib/apiClient';

export const testimonialService = {
  getAll: async () => {
    const { data } = await apiClient.get(`/admin/testimonials`);
    return data;
  },
};
