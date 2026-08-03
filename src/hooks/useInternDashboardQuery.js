import { useQuery } from '@tanstack/react-query';
import { fetchInternDashboardSummary, fetchInternDashboardLazyDetails } from '../services/internDashboardService';

export function useInternDashboardQuery(userId) {
  const summaryQuery = useQuery({
    queryKey: ['intern-dashboard-summary', userId],
    queryFn: fetchInternDashboardSummary,
    enabled: !!userId,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });

  const lazyQuery = useQuery({
    queryKey: ['intern-dashboard-lazy', userId],
    queryFn: () => fetchInternDashboardLazyDetails(userId),
    enabled: !!userId,
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });

  return {
    data: summaryQuery.data || {},
    lazyDetails: lazyQuery.data || {},
    isLoading: summaryQuery.isLoading,
    isError: summaryQuery.isError,
    error: summaryQuery.error,
    refetch: () => {
      summaryQuery.refetch();
      lazyQuery.refetch();
    },
  };
}

