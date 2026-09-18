import { useQuery } from '@tanstack/react-query';
import { galleryService } from '../services/galleryService';
import { queryKeys } from '../lib/queryKeys';

export const useGallery = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.gallery.all(filters),
    queryFn: () => galleryService.getAll(filters),
    keepPreviousData: true,
  });
};
