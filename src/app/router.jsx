import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthLayout, InternLayout, AdminLayout, SuperAdminLayout } from '../layouts/Layouts';

// Auth Module Imports
import { Login } from '../features/auth/pages/Login';
import { Register } from '../features/auth/pages/Register';
import { ForgotPassword } from '../features/auth/pages/ForgotPassword';
import { ResetPassword } from '../features/auth/pages/ResetPassword';
import { Unauthorized, SessionExpired } from '../features/auth/pages/StatusPages';
import { AuthGuard, RoleGuard, OnboardingGuard, OnboardingStepGuard } from '../guards/Guards';

// Onboarding Module Imports
import { OnboardingDashboard } from '../features/onboarding/pages/OnboardingDashboard';
import { OnboardingProfile } from '../features/onboarding/pages/OnboardingProfile';
import { OnboardingQuestionnaire } from '../features/onboarding/pages/OnboardingQuestionnaire';
import { OnboardingLearning } from '../features/onboarding/pages/OnboardingLearning';
import { OnboardingActivities } from '../features/onboarding/pages/OnboardingActivities';
import { OnboardingInterview } from '../features/onboarding/pages/OnboardingInterview';

import { InternDashboardPage } from '../pages/intern/InternDashboardPage';
import { SuperAdminDashboardPage } from '../pages/super-admin/SuperAdminDashboardPage';
import { OnboardingManagementPage } from '../pages/super-admin/OnboardingManagementPage';
import { QuestionnaireManagementPage } from '../pages/super-admin/QuestionnaireManagementPage';
import { InternManagementPage } from '../pages/super-admin/InternManagementPage';
import { LearningManagementPage } from '../pages/super-admin/LearningManagementPage';
import { OperationsManagementPage } from '../pages/super-admin/OperationsManagementPage';
import { OperationsAttendanceManagement } from '../pages/super-admin/OperationsAttendanceManagement';
import { ProblemStatementManagementPage } from '../pages/super-admin/ProblemStatementManagementPage';
import { AdminManagementPage } from '../pages/super-admin/AdminManagementPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';

// Placeholder Component for future modules
const ModulePlaceholder = ({ title, role }) => (
  <div className="bg-white border border-[#EDEDED] rounded-2xl p-8 shadow-sm">
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-3">
      <span>Role Access: {role || 'General'}</span>
    </div>
    <h2 className="text-2xl font-bold text-[#0D0D0D] mb-2">{title}</h2>
    <p className="text-sm text-[#9A9A9A] max-w-lg mb-6">
      Protected Super Admin submodule secured with Supabase Auth & RoleGuard.
    </p>
  </div>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default Landing Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/session-expired" element={<SessionExpired />} />
        </Route>

        {/* Intern Onboarding Sequential Steps */}
        <Route
          element={
            <AuthGuard>
              <RoleGuard allowedRoles={['intern']}>
                <InternLayout />
              </RoleGuard>
            </AuthGuard>
          }
        >
          <Route path="/onboarding/dashboard" element={<OnboardingStepGuard><OnboardingDashboard /></OnboardingStepGuard>} />
          <Route path="/onboarding/profile" element={<OnboardingStepGuard><OnboardingProfile /></OnboardingStepGuard>} />
          <Route path="/onboarding/questionnaire" element={<OnboardingStepGuard><OnboardingQuestionnaire /></OnboardingStepGuard>} />
          <Route path="/onboarding/learning" element={<OnboardingStepGuard><OnboardingLearning /></OnboardingStepGuard>} />
          <Route path="/onboarding/activities" element={<OnboardingStepGuard><OnboardingActivities /></OnboardingStepGuard>} />
          <Route path="/onboarding/interview" element={<OnboardingStepGuard><OnboardingInterview /></OnboardingStepGuard>} />
          <Route path="/onboarding/allocation" element={<OnboardingStepGuard><OnboardingInterview /></OnboardingStepGuard>} />
        </Route>

        {/* Intern Portal Dashboard & Modules */}
        <Route
          element={
            <AuthGuard>
              <RoleGuard allowedRoles={['intern']}>
                <OnboardingGuard>
                  <InternLayout />
                </OnboardingGuard>
              </RoleGuard>
            </AuthGuard>
          }
        >
          <Route path="/intern/dashboard" element={<InternDashboardPage />} />
          <Route path="/intern/attendance" element={<ModulePlaceholder title="Intern Attendance" role="Intern" />} />
          <Route path="/intern/diary" element={<ModulePlaceholder title="Daily Diary" role="Intern" />} />
          <Route path="/intern/learning" element={<ModulePlaceholder title="Learning Activities" role="Intern" />} />
          <Route path="/intern/leaderboard" element={<ModulePlaceholder title="Leaderboard" role="Intern" />} />
        </Route>

        {/* Admin Portal */}
        <Route
          element={
            <AuthGuard>
              <RoleGuard allowedRoles={['admin']}>
                <AdminLayout />
              </RoleGuard>
            </AuthGuard>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/interns" element={<ModulePlaceholder title="Onboarding Interns" role="Admin" />} />
          <Route path="/admin/active-interns" element={<ModulePlaceholder title="Allocated Active Interns" role="Admin" />} />
          <Route path="/admin/attendance" element={<ModulePlaceholder title="Attendance Review" role="Admin" />} />
        </Route>

        {/* Super Admin Portal (Hierarchical Submodule Routes) */}
        <Route
          element={
            <AuthGuard>
              <RoleGuard allowedRoles={['super_admin']}>
                <SuperAdminLayout />
              </RoleGuard>
            </AuthGuard>
          }
        >
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />

          {/* Onboarding Management */}
          <Route path="/super-admin/onboarding" element={<OnboardingManagementPage />} />
          <Route path="/super-admin/onboarding/new-registration" element={<OnboardingManagementPage />} />
          <Route path="/super-admin/onboarding/profile-verification" element={<OnboardingManagementPage />} />
          <Route path="/super-admin/onboarding/questionnaire" element={<OnboardingManagementPage />} />
          <Route path="/super-admin/onboarding/lms" element={<OnboardingManagementPage />} />
          <Route path="/super-admin/onboarding/activities" element={<OnboardingManagementPage />} />
          <Route path="/super-admin/onboarding/interview" element={<OnboardingManagementPage />} />
          <Route path="/super-admin/onboarding/allocation" element={<OnboardingManagementPage />} />
          <Route path="/super-admin/onboarding/progress" element={<OnboardingManagementPage />} />

          {/* Questionnaire Management */}
          <Route path="/super-admin/questionnaire-management" element={<QuestionnaireManagementPage />} />

          {/* Intern Management */}
          <Route path="/super-admin/interns" element={<InternManagementPage />} />
          <Route path="/super-admin/interns/all-active" element={<InternManagementPage />} />
          <Route path="/super-admin/interns/details" element={<InternManagementPage />} />
          <Route path="/super-admin/interns/allocation" element={<InternManagementPage />} />
          <Route path="/super-admin/interns/status" element={<InternManagementPage />} />
          <Route path="/super-admin/interns/performance" element={<InternManagementPage />} />
          <Route path="/super-admin/interns/completion" element={<InternManagementPage />} />
          <Route path="/super-admin/interns/reports" element={<InternManagementPage />} />

          {/* Learning Management (External API Integrations Only: Advanced LMS & Tenon) */}
          <Route path="/super-admin/learning" element={<LearningManagementPage />} />
          <Route path="/super-admin/learning/advanced-lms" element={<LearningManagementPage />} />
          <Route path="/super-admin/learning/tenon" element={<LearningManagementPage />} />
          <Route path="/super-admin/learning/course-assignment" element={<LearningManagementPage />} />
          <Route path="/super-admin/learning/progress" element={<LearningManagementPage />} />
          <Route path="/super-admin/learning/reports" element={<LearningManagementPage />} />

          {/* Operations */}
          <Route path="/super-admin/operations" element={<OperationsManagementPage />} />
          <Route path="/super-admin/operations/attendance" element={<OperationsAttendanceManagement />} />
          <Route path="/super-admin/operations/daily-diary" element={<OperationsManagementPage />} />
          <Route path="/super-admin/operations/todo-monitoring" element={<OperationsManagementPage />} />
          <Route path="/super-admin/operations/pending-work" element={<OperationsManagementPage />} />
          <Route path="/super-admin/operations/leave" element={<OperationsManagementPage />} />

          {/* Engagement */}
          <Route path="/super-admin/engagement/community" element={<ModulePlaceholder title="Community Management" role="Super Admin" />} />
          <Route path="/super-admin/engagement/ai-posts" element={<ModulePlaceholder title="AI Post Monitoring" role="Super Admin" />} />
          <Route path="/super-admin/engagement/leaderboard" element={<ModulePlaceholder title="Leaderboard Management" role="Super Admin" />} />
          <Route path="/super-admin/engagement/announcements" element={<ModulePlaceholder title="Announcements" role="Super Admin" />} />
          <Route path="/super-admin/engagement/feedback" element={<ModulePlaceholder title="Feedback & Suggestions" role="Super Admin" />} />

          {/* Problem Statement Management */}
          <Route path="/super-admin/problem-statements" element={<ProblemStatementManagementPage />} />
          <Route path="/super-admin/problem-statements/all" element={<ProblemStatementManagementPage />} />
          <Route path="/super-admin/problem-statements/create" element={<ProblemStatementManagementPage />} />
          <Route path="/super-admin/problem-statements/edit" element={<ProblemStatementManagementPage />} />
          <Route path="/super-admin/problem-statements/assign-admin" element={<ProblemStatementManagementPage />} />
          <Route path="/super-admin/problem-statements/assigned-interns" element={<ProblemStatementManagementPage />} />
          <Route path="/super-admin/problem-statements/archive" element={<ProblemStatementManagementPage />} />

          {/* Admin Management */}
          <Route path="/super-admin/admins" element={<AdminManagementPage />} />
          <Route path="/super-admin/admins/all" element={<AdminManagementPage />} />
          <Route path="/super-admin/admins/create" element={<AdminManagementPage />} />
          <Route path="/super-admin/admins/assign-statements" element={<AdminManagementPage />} />
          <Route path="/super-admin/admins/permissions" element={<AdminManagementPage />} />
          <Route path="/super-admin/admins/status" element={<AdminManagementPage />} />
          <Route path="/super-admin/admins/performance" element={<AdminManagementPage />} />
          <Route path="/super-admin/admins/activity-logs" element={<AdminManagementPage />} />

          {/* Reports & Analytics */}
          <Route path="/super-admin/reports/interns" element={<ModulePlaceholder title="Intern Reports" role="Super Admin" />} />
          <Route path="/super-admin/reports/attendance" element={<ModulePlaceholder title="Attendance Reports" role="Super Admin" />} />
          <Route path="/super-admin/reports/learning" element={<ModulePlaceholder title="Learning Reports" role="Super Admin" />} />
          <Route path="/super-admin/reports/pending-work" element={<ModulePlaceholder title="Pending Work Reports" role="Super Admin" />} />
          <Route path="/super-admin/reports/admin-performance" element={<ModulePlaceholder title="Admin Performance Reports" role="Super Admin" />} />
          <Route path="/super-admin/reports/problem-statements" element={<ModulePlaceholder title="Problem Statement Reports" role="Super Admin" />} />
          <Route path="/super-admin/reports/export" element={<ModulePlaceholder title="Export Reports" role="Super Admin" />} />

          {/* Single Pages */}
          <Route path="/super-admin/profile" element={<ModulePlaceholder title="Super Admin Profile" role="Super Admin" />} />
          <Route path="/super-admin/settings" element={<ModulePlaceholder title="System Settings" role="Super Admin" />} />
        </Route>

        {/* 404 Fallback */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
              <div className="bg-white border border-[#EDEDED] rounded-2xl p-8 shadow-xl text-center max-w-sm">
                <h1 className="text-4xl font-extrabold text-[#0D0D0D] mb-2">404</h1>
                <p className="text-sm text-[#9A9A9A] mb-6">Page not found.</p>
                <Link
                  to="/login"
                  className="inline-block w-full py-3 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-sm rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 transition-all"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
