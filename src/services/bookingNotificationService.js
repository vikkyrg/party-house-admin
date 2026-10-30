import apiClient from '../lib/apiClient';

export const bookingNotificationService = {
  getNotifications: async (params = {}) => {
    const { data } = await apiClient.get('/admin/booking-notifications', { params });
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await apiClient.get('/admin/booking-notifications/unread-count');
    return data;
  },

  markAsRead: async (id) => {
    const { data } = await apiClient.patch(`/admin/booking-notifications/${id}/read`);
    return data;
  },

  markAsReadByBookingId: async (bookingId) => {
    const { data } = await apiClient.patch(`/admin/booking-notifications/booking/${bookingId}/read`);
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await apiClient.patch('/admin/booking-notifications/mark-all-read');
    return data;
  },
};

