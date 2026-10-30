import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingNotificationService } from '../services/bookingNotificationService';

export const useBookingNotifications = (options = {}) => {
  const queryClient = useQueryClient();

  // Query unread count with 5-second polling for real-time responsiveness
  const unreadQuery = useQuery({
    queryKey: ['adminBookingNotificationsUnread'],
    queryFn: bookingNotificationService.getUnreadCount,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 2000,
    ...options,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => bookingNotificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBookingNotificationsUnread']);
      queryClient.invalidateQueries(['adminBookingNotificationsList']);
    },
  });

  const markAsReadByBookingIdMutation = useMutation({
    mutationFn: (bookingId) => bookingNotificationService.markAsReadByBookingId(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBookingNotificationsUnread']);
      queryClient.invalidateQueries(['adminBookingNotificationsList']);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => bookingNotificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBookingNotificationsUnread']);
      queryClient.invalidateQueries(['adminBookingNotificationsList']);
    },
  });

  const unreadCount = unreadQuery.data?.data?.unreadCount || 0;

  return {
    unreadCount,
    latestNotification: unreadQuery.data?.data?.latestNotification,
    isLoading: unreadQuery.isLoading,
    refetch: unreadQuery.refetch,
    markAsRead: markAsReadMutation.mutate,
    markAsReadByBookingId: markAsReadByBookingIdMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
};

export const useBookingNotificationsList = (params = {}) => {
  return useQuery({
    queryKey: ['adminBookingNotificationsList', params],
    queryFn: () => bookingNotificationService.getNotifications(params),
    refetchInterval: 6000,
    refetchOnWindowFocus: true,
  });
};

