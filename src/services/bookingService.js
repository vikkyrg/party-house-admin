import apiClient from '../lib/apiClient';

export const bookingService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/bookings?${params.toString()}`);
    return data;
  },
  getById: async (id) => {
    const { data } = await apiClient.get(`/admin/bookings/${id}`);
    return data;
  },
  updateStatus: async (id, statusData) => {
    const { data } = await apiClient.put(`/admin/bookings/${id}/status`, statusData);
    return data;
  },
};
