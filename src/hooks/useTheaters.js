import { useQuery } from '@tanstack/react-query';
import { theaterService } from '../services/theaterService';
import { queryKeys } from '../lib/queryKeys';

export const useTheaters = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.theaters.all(filters),
    queryFn: () => theaterService.getAll(filters),
    keepPreviousData: true,
  });
};
