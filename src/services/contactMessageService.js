import apiClient from '../lib/apiClient';

export const contactMessageService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    });
    const queryString = params.toString();
    const { data } = await apiClient.get(`/admin/contact-messages${queryString ? `?${queryString}` : ''}`);
    return data;
  },

  getById: async (id) => {
    const { data } = await apiClient.get(`/admin/contact-messages/${id}`);
    return data;
  },

  updateStatus: async (id, status) => {
    const { data } = await apiClient.patch(`/admin/contact-messages/${id}/status`, { status });
    return data;
  },

  delete: async (id) => {
    const { data } = await apiClient.delete(`/admin/contact-messages/${id}`);
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await apiClient.get('/admin/contact-messages/unread-count');
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await apiClient.patch('/admin/contact-messages/mark-all-read');
    return data;
  },
};

