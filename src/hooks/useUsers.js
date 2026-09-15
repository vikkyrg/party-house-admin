import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { queryKeys } from '../lib/queryKeys';

export const useUsers = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.users.all(filters),
    queryFn: () => userService.getAll(filters),
    keepPreviousData: true,
  });
};
