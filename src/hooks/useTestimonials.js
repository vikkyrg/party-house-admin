import { useQuery } from '@tanstack/react-query';
import { testimonialService } from '../services/testimonialService';
import { queryKeys } from '../lib/queryKeys';

export const useTestimonials = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.testimonials.all(filters),
    queryFn: () => testimonialService.getAll(),
    keepPreviousData: true,
  });
};
