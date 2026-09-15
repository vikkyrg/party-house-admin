import apiClient from '../lib/apiClient';

export const theaterService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/theaters?${params.toString()}`);
    return data;
  },
};
