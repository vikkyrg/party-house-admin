import { useQuery } from '@tanstack/react-query';
import { serviceService } from '../services/serviceService';
import { queryKeys } from '../lib/queryKeys';

export const useServices = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.services.all(filters),
    queryFn: () => serviceService.getAll(filters),
    keepPreviousData: true,
  });
};
