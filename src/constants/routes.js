/**
 * Canonical Application Route Enums
 */
export const ROUTES = {
  PUBLIC: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    UNAUTHORIZED: '/unauthorized',
    SESSION_EXPIRED: '/session-expired',
  },
  ONBOARDING: {
    DASHBOARD: '/onboarding/dashboard',
    PROFILE: '/onboarding/profile',
    QUESTIONNAIRE: '/onboarding/questionnaire',
    LEARNING: '/onboarding/learning',
    ACTIVITIES: '/onboarding/activities',
    INTERVIEW: '/onboarding/interview',
    ALLOCATION: '/onboarding/allocation',
  },
  INTERN: {
    DASHBOARD: '/intern/dashboard',
    ATTENDANCE: '/intern/attendance',
    DIARY: '/intern/diary',
    LEARNING: '/intern/learning',
    LEADERBOARD: '/intern/leaderboard',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    INTERNS: '/admin/interns',
    ACTIVE_INTERNS: '/admin/active-interns',
    ATTENDANCE: '/admin/attendance',
  },
  SUPER_ADMIN: {
    DASHBOARD: '/super-admin/dashboard',
    ONBOARDING: '/super-admin/onboarding',
    QUESTIONNAIRE: '/super-admin/questionnaire-management',
    INTERNS: '/super-admin/interns',
    LEARNING: '/super-admin/learning',
    OPERATIONS: '/super-admin/operations',
    ENGAGEMENT: '/super-admin/engagement',
    PROBLEM_STATEMENTS: '/super-admin/problem-statements',
    ADMINS: '/super-admin/admins',
    REPORTS: '/super-admin/reports',
    PROFILE: '/super-admin/profile',
    SETTINGS: '/super-admin/settings',
  },
};
