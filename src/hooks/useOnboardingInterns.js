import { useQuery } from '@tanstack/react-query';
import { fetchOnboardingInterns } from '../services/onboardingService';

export const ONBOARDING_INTERNS_QUERY_KEY = ['superAdmin', 'onboardingInterns'];

/**
 * Custom React Query Hook for Super Admin Onboarding Management.
 * Provides caching, loading, error states, and refetch handler.
 */
export function useOnboardingInterns() {
  return useQuery({
    queryKey: ['super-admin-onboarding-interns'],
    queryFn: async () => {
      const result = await fetchAllOnboardingInterns();
      return result;
    },
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });
}
