/**
 * Canonical Application Role Enumerations
 */
export const APP_ROLES = {
  INTERN: 'intern',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

/**
 * Account Status Enumerations
 */
export const ACCOUNT_STATUSES = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

/**
 * Onboarding Status Enumerations
 */
export const ONBOARDING_STATUSES = {
  REGISTERED: 'registered',
  PROFILE_PENDING: 'profile_pending',
  QUESTIONNAIRE_PENDING: 'questionnaire_pending',
  LEARNING_PENDING: 'learning_pending',
  ACTIVITIES_PENDING: 'activities_pending',
  INTERVIEW_PENDING: 'interview_pending',
  ALLOCATION_PENDING: 'allocation_pending',
  COMPLETED: 'completed',
};

/**
 * Submission Status Enumerations
 */
export const SUBMISSION_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RESUBMISSION_REQUIRED: 'resubmission_required',
};
