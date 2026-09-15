import { useQuery } from '@tanstack/react-query';
import { reviewService } from '../services/reviewService';
import { queryKeys } from '../lib/queryKeys';

export const useReviews = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.reviews.all(filters),
    queryFn: () => reviewService.getAll(filters),
    keepPreviousData: true,
  });
};
