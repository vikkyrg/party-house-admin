import { useQuery } from '@tanstack/react-query';
import { storyService } from '../services/storyService';
import { queryKeys } from '../lib/queryKeys';

export const useStories = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.stories.all(filters),
    queryFn: () => storyService.getAll(filters),
    keepPreviousData: true,
  });
};
