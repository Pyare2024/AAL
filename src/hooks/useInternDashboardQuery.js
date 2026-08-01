import { useQuery } from '@tanstack/react-query';
import { fetchInternDashboardSummary } from '../services/internDashboardService';

export function useInternDashboardQuery(userId) {
  return useQuery({
    queryKey: ['intern-dashboard', userId],
    queryFn: fetchInternDashboardSummary,
    enabled: !!userId,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });
}
