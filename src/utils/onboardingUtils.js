import { 
  updateOnboardingStepProgressService,
  synchronizeAllOnboardingStatusesService 
} from '../services/onboardingService';

/**
 * Pure Utility Module for Intern Onboarding Journey.
 * Calculates step, completion percentage, route redirection, and final activation.
 * Pure functions contain zero direct database client calls.
 */

// Step Route Enums
export const ONBOARDING_ROUTES = {
  PROFILE: '/onboarding/profile',
  QUESTIONNAIRE: '/onboarding/questionnaire',
  LEARNING: '/onboarding/learning',
  ACTIVITIES: '/onboarding/activities',
  INTERVIEW: '/onboarding/interview',
  ALLOCATION: '/onboarding/allocation',
  DASHBOARD: '/intern/dashboard',
};

// Sequential Step Order Mapping
export const STEP_ORDER = {
  [ONBOARDING_ROUTES.PROFILE]: 1,
  [ONBOARDING_ROUTES.QUESTIONNAIRE]: 2,
  [ONBOARDING_ROUTES.LEARNING]: 3,
  [ONBOARDING_ROUTES.ACTIVITIES]: 4,
  [ONBOARDING_ROUTES.INTERVIEW]: 5,
  [ONBOARDING_ROUTES.ALLOCATION]: 6,
  [ONBOARDING_ROUTES.DASHBOARD]: 7,
};

/**
 * 1. Calculate precise completion percentage based on 6 onboarding fields.
 * Weight per step: ~16.66% (Total 100%)
 */
export function calculateCompletionPercentage(progress) {
  if (!progress) return 0;

  let count = 0;
  if (progress.profile_completed) count++;
  if (progress.questionnaire_completed) count++;
  if (progress.learning_intro_completed) count++;
  if (progress.activities_completed) count++;
  if (progress.interview_completed) count++;
  if (progress.problem_statement_allocated) count++;

  return Math.round((count / 6) * 100);
}

/**
 * 2. Get current onboarding step title based on exact order:
 * Order: Profile -> Questionnaire -> Learning -> Activities -> Interview -> Allocation -> Completed
 */
export function getCurrentOnboardingStep(progress) {
  if (!progress || !progress.profile_completed) {
    return 'Profile Completion';
  }
  if (!progress.questionnaire_completed) {
    return 'Questionnaire';
  }
  if (!progress.learning_intro_completed) {
    return 'Simple LMS Learning';
  }
  if (!progress.activities_completed) {
    return 'Seven Activities';
  }
  if (!progress.interview_completed) {
    return 'Interview';
  }
  if (!progress.problem_statement_allocated) {
    return 'Problem Statement Allocation';
  }
  return 'Onboarding Completed';
}

/**
 * 3. Get next required onboarding route for an intern based on progress.
 */
export function getNextOnboardingRoute(progress) {
  if (!progress || !progress.profile_completed) {
    return ONBOARDING_ROUTES.PROFILE;
  }
  if (!progress.questionnaire_completed) {
    return ONBOARDING_ROUTES.QUESTIONNAIRE;
  }
  if (!progress.learning_intro_completed) {
    return ONBOARDING_ROUTES.LEARNING;
  }
  if (!progress.activities_completed) {
    return ONBOARDING_ROUTES.ACTIVITIES;
  }
  if (!progress.interview_completed) {
    return ONBOARDING_ROUTES.INTERVIEW;
  }
  if (!progress.problem_statement_allocated) {
    return ONBOARDING_ROUTES.ALLOCATION;
  }
  return ONBOARDING_ROUTES.DASHBOARD;
}

/**
 * 4. Check if final onboarding is 100% completed.
 * Only returns true if all 6 boolean flags are true.
 */
export function isOnboardingCompleted(progress) {
  if (!progress) return false;
  return (
    !!progress.profile_completed &&
    !!progress.questionnaire_completed &&
    !!progress.learning_intro_completed &&
    !!progress.activities_completed &&
    !!progress.interview_completed &&
    !!progress.problem_statement_allocated
  );
}

/**
 * Map progress state to corresponding profiles.onboarding_status enum value
 */
export function getMatchingOnboardingStatus(progress) {
  if (!progress || !progress.profile_completed) {
    return 'profile_pending';
  }
  if (!progress.questionnaire_completed) {
    return 'questionnaire_pending';
  }
  if (!progress.learning_intro_completed) {
    return 'learning_pending';
  }
  if (!progress.activities_completed) {
    return 'activities_pending';
  }
  if (!progress.interview_completed) {
    return 'interview_pending';
  }
  if (!progress.problem_statement_allocated) {
    return 'allocation_pending';
  }
  return 'completed';
}

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

