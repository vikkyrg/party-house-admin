import apiClient from '../lib/apiClient';

export const dashboardService = {
  getStats: async () => {
    const { data } = await apiClient.get('/admin/dashboard/stats');
    return data;
  },
  
  getCharts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    
    const { data } = await apiClient.get(`/admin/dashboard/charts?${params.toString()}`);
    return data;
  },

  getRecentActivity: async () => {
    const { data } = await apiClient.get('/admin/dashboard/recent');
    return data;
  }
};
