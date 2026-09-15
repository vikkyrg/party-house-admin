import { useQuery } from '@tanstack/react-query';
import { cityService } from '../services/cityService';
import { queryKeys } from '../lib/queryKeys';

export const useCities = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.cities.all(filters),
    queryFn: () => cityService.getAll(filters),
    keepPreviousData: true,
  });
};
