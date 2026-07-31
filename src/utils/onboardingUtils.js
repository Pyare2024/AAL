import { supabase } from '../lib/supabase';

/**
 * Single Source of Truth Utility for Intern Onboarding Journey.
 * Calculates step, completion percentage, route redirection, and final activation.
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
 * Updates an intern's onboarding step in Supabase.
 * Automatically recalculates completion_percentage, updates timestamps,
 * and synchronizes profiles.onboarding_status with the current step.
 */
export async function updateOnboardingStepProgress(internId, updates) {
  if (!internId) throw new Error('Intern ID is required for updating onboarding progress.');

  // 1. Fetch current progress row
  const { data: currentProgress, error: fetchErr } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('intern_id', internId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;

  // Merge proposed updates with current database record or default flags
  const mergedProgress = {
    ...(currentProgress || {
      intern_id: internId,
      profile_completed: false,
      questionnaire_completed: false,
      learning_intro_completed: false,
      activities_completed: false,
      interview_completed: false,
      problem_statement_allocated: false,
    }),
    ...updates,
  };

  const newPercentage = calculateCompletionPercentage(mergedProgress);
  const isFullyCompleted = isOnboardingCompleted(mergedProgress);
  const targetOnboardingStatus = getMatchingOnboardingStatus(mergedProgress);

  const payload = {
    intern_id: internId,
    ...mergedProgress,
    completion_percentage: newPercentage,
    updated_at: new Date().toISOString(),
    ...(isFullyCompleted ? { completed_at: new Date().toISOString() } : {}),
  };

  // Atomic UPSERT on onboarding_progress table
  const { data: updatedProgressRow, error: updateProgressErr } = await supabase
    .from('onboarding_progress')
    .upsert(payload, { onConflict: 'intern_id' })
    .select()
    .single();

  if (updateProgressErr) throw updateProgressErr;

  // 3. Synchronize profiles.onboarding_status after every progress update
  const profilePayload = {
    onboarding_status: targetOnboardingStatus,
    updated_at: new Date().toISOString(),
    ...(isFullyCompleted ? { account_status: 'active' } : {}),
  };

  const { error: profileUpdateErr } = await supabase
    .from('profiles')
    .update(profilePayload)
    .eq('id', internId);

  if (profileUpdateErr) throw profileUpdateErr;

  return {
    progress: updatedProgressRow || mergedProgress,
    isFullyCompleted,
    nextRoute: getNextOnboardingRoute(updatedProgressRow || mergedProgress),
  };
}

/**
 * Repair and synchronize existing inconsistent onboarding status records.
 * Scans all profiles & onboarding_progress rows and fixes mismatches.
 */
export async function synchronizeAllOnboardingStatuses() {
  try {
    const { data: progressRows, error: pErr } = await supabase
      .from('onboarding_progress')
      .select('*');

    if (pErr) throw pErr;

    let repairedCount = 0;
    for (const prog of progressRows || []) {
      const correctStatus = getMatchingOnboardingStatus(prog);

      // Check current profile status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_status')
        .eq('id', prog.intern_id)
        .maybeSingle();

      if (profile && profile.onboarding_status !== correctStatus) {
        await supabase
          .from('profiles')
          .update({
            onboarding_status: correctStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prog.intern_id);
        repairedCount++;
      }
    }
    return { success: true, repairedCount };
  } catch (err) {
    console.error('Error synchronizing onboarding statuses:', err);
    return { success: false, error: err.message };
  }
}

