import { useQuery } from '@tanstack/react-query';
import { addonService } from '../services/addonService';
import { queryKeys } from '../lib/queryKeys';

export const useAddOns = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.addOns.all(filters),
    queryFn: () => addonService.getAll(filters),
    keepPreviousData: true,
  });
};
