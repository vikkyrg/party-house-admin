import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '../services/auditLogService';
import { queryKeys } from '../lib/queryKeys';

export const useAuditLogs = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.auditLogs.all(filters),
    queryFn: () => auditLogService.getAll(filters),
    keepPreviousData: true,
  });
};
