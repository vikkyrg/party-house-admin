import { useQuery } from '@tanstack/react-query';
import { bannerService } from '../services/bannerService';
import { queryKeys } from '../lib/queryKeys';

export const useBanners = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.banners.all(filters),
    queryFn: () => bannerService.getAll(filters),
    keepPreviousData: true,
  });
};
