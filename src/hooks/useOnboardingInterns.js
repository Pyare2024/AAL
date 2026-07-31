import { useQuery } from '@tanstack/react-query';
import { fetchOnboardingInterns } from '../services/onboardingService';

export const ONBOARDING_INTERNS_QUERY_KEY = ['superAdmin', 'onboardingInterns'];

/**
 * Custom React Query Hook for Super Admin Onboarding Management.
 * Provides caching, loading, error states, and refetch handler.
 */
export function useOnboardingInterns() {
  return useQuery({
    queryKey: ONBOARDING_INTERNS_QUERY_KEY,
    queryFn: fetchOnboardingInterns,
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
    refetchOnWindowFocus: false,
  });
}
