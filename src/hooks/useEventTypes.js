import { useQuery } from '@tanstack/react-query';
import { eventTypeService } from '../services/eventTypeService';
import { queryKeys } from '../lib/queryKeys';

export const useEventTypes = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.eventTypes.all(filters),
    queryFn: () => eventTypeService.getAll(),
    keepPreviousData: true,
  });
};
