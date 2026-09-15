import apiClient from '../lib/apiClient';

export const auditLogService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const { data } = await apiClient.get(`/admin/audit-logs?${params.toString()}`);
    return data;
  },
};
