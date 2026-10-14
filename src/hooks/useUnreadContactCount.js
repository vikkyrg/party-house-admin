import { useQuery } from '@tanstack/react-query';
import { contactMessageService } from '../services/contactMessageService';
import { queryKeys } from '../lib/queryKeys';
import { useAuthStore } from '../store/authStore';

export function useUnreadContactCount() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.contactMessages.unreadCount,
    queryFn: async () => {
      const res = await contactMessageService.getUnreadCount();
      return res?.data?.unreadCount ?? 0;
    },
    enabled: isAuthenticated,
    refetchInterval: 10000, // Lightweight 10-second polling for real-time unread messages
    refetchIntervalInBackground: false,
    staleTime: 5000,
  });
}
