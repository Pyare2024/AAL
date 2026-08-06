/**
 * Learning Overview Typed Placeholder Data
 */

export interface LearningSummaryData {
  activeCourses: number;
  completedCourses: number;
  certificatesEarned: number;
  overallProgress: number; // percentage
  learningHours: number;
  lastSyncedAt: string;
}

export interface LearningPlatformInfo {
  id: string;
  name: string;
  type: 'advanced_lms' | 'tenon';
  description: string;
  assignedCourseCount: number;
  completedCourseCount: number;
  overallProgress: number;
  lastActivity: string;
  route: string;
  buttonText: string;
  isConnected: boolean;
}

export const sampleLearningSummary: LearningSummaryData = {
  activeCourses: 3,
  completedCourses: 5,
  certificatesEarned: 2,
  overallProgress: 68,
  learningHours: 42.5,
  lastSyncedAt: '2026-08-03T12:30:00Z'
};

export const sampleLearningPlatforms: LearningPlatformInfo[] = [
  {
    id: 'advanced-lms',
    name: 'Advanced LMS',
    type: 'advanced_lms',
    description: 'Access advanced technical specialization, deep-dive modules, and interactive assessments assigned to your track.',
    assignedCourseCount: 4,
    completedCourseCount: 3,
    overallProgress: 75,
    lastActivity: 'Completed Unit 4: Vector Embeddings (2 hours ago)',
    route: '/intern/learning/lms',
    buttonText: 'Open Advanced LMS',
    isConnected: true
  },
  {
    id: 'tenon-integration',
    name: 'Tenon Integration',
    type: 'tenon',
    description: 'Explore external Tenon AI learning paths, hands-on labs, and automated skill verification benchmarks.',
    assignedCourseCount: 2,
    completedCourseCount: 1,
    overallProgress: 50,
    lastActivity: 'Started Module 2: Prompt Optimization (1 day ago)',
    route: '/intern/learning/tenon',
    buttonText: 'Open Tenon',
    isConnected: true
  }
];
