import apiClient from '../lib/apiClient';

export const bookingService = {
  getAll: async (filters = {}) => {
    const cleanParams = Object.entries(filters).reduce((acc, [key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        acc[key] = val;
      }
      return acc;
    }, {});
    const params = new URLSearchParams(cleanParams);
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
  exportBookings: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/admin/export/bookings?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  downloadInvoice: async (id) => {
    const response = await apiClient.get(`/bookings/${id}/invoice`, {
      responseType: 'blob',
    });
    return response.data;
  },
  reschedule: async (id, rescheduleData) => {
    const { data } = await apiClient.post(`/bookings/${id}/reschedule`, rescheduleData);
    return data;
  },
};
