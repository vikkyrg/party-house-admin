import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';

export const useCakes = (params = {}) => {
  return useQuery({
    queryKey: ['cakes', params],
    queryFn: async () => {
      const response = await apiClient.get('/cakes', { params });
      return response.data;
    },
    keepPreviousData: true,
  });
};
