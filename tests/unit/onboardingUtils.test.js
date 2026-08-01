import { describe, it, expect } from 'vitest';
import { 
  calculateCompletionPercentage, 
  getCurrentOnboardingStep, 
  getNextOnboardingRoute, 
  isOnboardingCompleted,
  getMatchingOnboardingStatus 
} from '../../src/utils/onboardingUtils';

describe('onboardingUtils Pure Functions', () => {
  it('TC-UT-ONB-01: returns 0% completion when progress is null', () => {
    expect(calculateCompletionPercentage(null)).toBe(0);
  });

  it('TC-UT-ONB-02: calculates completion percentage accurately', () => {
    const progress = {
      profile_completed: true,
      questionnaire_completed: true,
      learning_intro_completed: false,
      activities_completed: false,
      interview_completed: false,
      problem_statement_allocated: false,
    };
    expect(calculateCompletionPercentage(progress)).toBe(33); // 2/6 = 33%
  });

  it('TC-UT-ONB-03: returns Profile Completion step when profile is pending', () => {
    const progress = { profile_completed: false };
    expect(getCurrentOnboardingStep(progress)).toBe('Profile Completion');
  });

  it('TC-UT-ONB-04: returns next onboarding route correctly', () => {
    const progress = {
      profile_completed: true,
      questionnaire_completed: false,
    };
    expect(getNextOnboardingRoute(progress)).toBe('/onboarding/questionnaire');
  });

  it('TC-UT-ONB-05: verifies full completion status', () => {
    const incomplete = {
      profile_completed: true,
      questionnaire_completed: true,
      learning_intro_completed: true,
      activities_completed: true,
      interview_completed: true,
      problem_statement_allocated: false,
    };
    expect(isOnboardingCompleted(incomplete)).toBe(false);

    const complete = { ...incomplete, problem_statement_allocated: true };
    expect(isOnboardingCompleted(complete)).toBe(true);
  });

  it('TC-UT-ONB-06: returns matching PostgreSQL enum status string', () => {
    const progress = {
      profile_completed: true,
      questionnaire_completed: true,
      learning_intro_completed: false,
    };
    expect(getMatchingOnboardingStatus(progress)).toBe('learning_pending');
  });
});
