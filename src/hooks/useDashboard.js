import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { queryKeys } from '../lib/queryKeys';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => dashboardService.getStats(),
  });
};

export const useDashboardCharts = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.dashboard.charts(filters),
    queryFn: () => dashboardService.getCharts(filters),
    keepPreviousData: true,
  });
};

export const useRecentActivity = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.recent,
    queryFn: () => dashboardService.getRecentActivity(),
  });
};
