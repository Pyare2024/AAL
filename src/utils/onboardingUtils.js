import { 
  updateOnboardingStepProgressService,
  synchronizeAllOnboardingStatusesService 
} from '../services/onboardingService';

/**
 * Pure Utility Module for Intern Onboarding Journey.
 * Calculates step, completion percentage, route redirection, and final activation.
 * Pure functions contain zero direct database client calls.
 */

export { 
  ONBOARDING_ROUTES,
  STEP_ORDER,
  calculateCompletionPercentage,
  getCurrentOnboardingStep,
  getNextOnboardingRoute,
  isOnboardingCompleted,
  getMatchingOnboardingStatus,
} from './onboardingProgressUtils';

/**
 * Compatibility adapter for updating onboarding step progress.
 * Delegates database mutation to onboardingService.js.
 */
export async function updateOnboardingStepProgress(internId, updates) {
  return await updateOnboardingStepProgressService(internId, updates);
}

/**
 * Compatibility adapter for synchronizing onboarding statuses.
 * Delegates database query to onboardingService.js.
 */
export async function synchronizeAllOnboardingStatuses() {
  return await synchronizeAllOnboardingStatusesService();
}

