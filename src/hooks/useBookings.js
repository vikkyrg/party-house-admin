import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { queryKeys } from '../lib/queryKeys';

export const useBookings = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.bookings.all(filters),
    queryFn: () => bookingService.getAll(filters),
    keepPreviousData: true,
  });
};

export const useBooking = (id) => {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingService.getById(id),
    enabled: !!id,
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => bookingService.updateStatus(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
};
