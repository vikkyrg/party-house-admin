import { useQuery } from '@tanstack/react-query';
import { faqService } from '../services/faqService';
import { queryKeys } from '../lib/queryKeys';

export const useFAQs = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.faqs.all(filters),
    queryFn: () => faqService.getAll(filters),
    keepPreviousData: true,
  });
};
