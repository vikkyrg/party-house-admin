import { useQuery } from '@tanstack/react-query';
import { locationService } from '../services/locationService';
import { queryKeys } from '../lib/queryKeys';

export const useLocations = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.locations.all(filters),
    queryFn: () => locationService.getAll(filters),
    keepPreviousData: true,
  });
};
