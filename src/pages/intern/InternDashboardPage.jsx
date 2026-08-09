import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useInternDashboardQuery } from '../../hooks/useInternDashboardQuery';
import { DashboardHeader } from '../../components/intern/DashboardHeader';
import { InternIdentityCard } from '../../components/intern/InternIdentityCard';
import { TodayStatusCard } from '../../components/intern/TodayStatusCard';
import { QuickActionGrid } from '../../components/intern/QuickActionGrid';
import { PerformanceSummary } from '../../components/intern/PerformanceSummary';
import {
  calculateCompletionPercentage,
  getNextOnboardingRoute,
  getCurrentOnboardingStep
} from '../../utils/onboardingUtils';
import {
  AlertCircle,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingUp
} from 'lucide-react';

/**
 * Module 1 — Intern Dashboard Page (Modern SaaS Workspace)
 * Purpose: Within 5 seconds after login, the intern knows WHO they are,
 * WHAT internship they belong to, WHO is guiding them, and WHAT to do next.
 */
export function InternDashboardPage() {
  const navigate = useNavigate();
  const { user, profile, onboardingProgress } = useAuth();
  const { data: summaryData, lazyDetails, isLoading, isError, error, refetch } = useInternDashboardQuery(user?.id);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4 max-w-7xl mx-auto" data-testid="dashboard-loading-skeleton">
        <div className="h-24 bg-white border border-[#EDEDED] rounded-2xl"></div>
        <div className="h-44 bg-white border border-[#EDEDED] rounded-2xl"></div>
        <div className="h-28 bg-white border border-[#EDEDED] rounded-2xl"></div>
        <div className="h-24 bg-white border border-[#EDEDED] rounded-2xl"></div>
        <div className="h-28 bg-white border border-[#EDEDED] rounded-2xl"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3 max-w-7xl mx-auto my-8 shadow-xs" data-testid="dashboard-error-state">
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
        <h2 className="text-sm font-bold text-red-900">Failed to load Intern Dashboard Data</h2>
        <p className="text-xs text-red-700">{error?.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold text-xs rounded-xl hover:bg-red-700 transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  // Live Summary Aggregates from database
  const attendance = summaryData?.attendance || {
    attended: 0,
    total: 0,
    rate: 0,
    today_status: 'not_marked',
    attendance_not_started: true
  };

  const actionableTasksSummary = summaryData?.actionable_tasks_summary || {
    total_actionable: 0,
    due_today_count: 0,
    overdue_count: 0,
    resubmission_count: 0,
    today_todos_count: 0
  };

  const leaderboard = summaryData?.leaderboard || {
    user_rank: 1,
    user_points: 0,
    is_tied: true,
    has_points: false
  };

  const assignedAdmins = summaryData?.assigned_admins || [];

  // Lazy Details Extraction
  const diaryInfo = lazyDetails?.diary || { todayStatus: 'pending', submittedToday: false };
  const learningInfo = lazyDetails?.learning || { totalAssigned: 0, completed: 0, percentage: 0 };

  // Profile Information
  const userName = profile?.full_name || 'Intern';
  const userPhoto = profile?.profile_photo_url || null;
  const internshipId = profile?.intern_code || 'Not Assigned';
  const problemStatementName = profile?.problem_statement_title || 'Problem Statement Pending Allocation';

  const formattedAdmins = assignedAdmins.length > 0
    ? (assignedAdmins.length === 1 ? assignedAdmins[0] : assignedAdmins.length === 2 ? assignedAdmins.join(' & ') : `${assignedAdmins.length} Admins`)
    : 'No admin assigned';

  const startRaw = profile?.internship_start_date || profile?.joining_date || profile?.created_at;
  const startDate = startRaw ? new Date(startRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not configured';
  const endDate = profile?.internship_end_date ? new Date(profile.internship_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not configured';
  const status = profile?.account_status ? (profile.account_status.charAt(0).toUpperCase() + profile.account_status.slice(1)) : 'Active';

  // Onboarding & Next Best Action logic derived from actual database progress
  const completionPercentage = calculateCompletionPercentage(onboardingProgress);
  const nextRoute = getNextOnboardingRoute(onboardingProgress);
  const currentStepTitle = getCurrentOnboardingStep(onboardingProgress);
  const isFullyOnboarded = onboardingProgress?.problem_statement_allocated || profile?.onboarding_status === 'completed';

  // Current Week Calculation
  const startMs = startRaw ? new Date(startRaw).getTime() : null;
  const currentWeek = startMs ? Math.max(1, Math.ceil((Date.now() - startMs) / (1000 * 60 * 60 * 24 * 7))) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-[#0D0D0D] animate-fade-in">
      {/* SECTION 1 — HEADER */}
      <DashboardHeader
        userName={userName}
        userPhoto={userPhoto}
        internshipId={internshipId}
        onboardingStage={currentStepTitle}
      />

      {/* SECTION 2 — INTERNSHIP IDENTITY */}
      <InternIdentityCard
        problemStatementName={problemStatementName}
        assignedAdminName={formattedAdmins}
        assignedAdminPhoto={null}
        startDate={startDate}
        endDate={endDate}
        currentWeek={currentWeek}
        status={status}
      />

      {/* SECTION 3 — ONBOARDING PROGRESS (LIVE DATABASE PROGRESS) */}
      {!isFullyOnboarded && (
        <section className="bg-white border border-[#EDEDED] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-[10px] font-extrabold text-[#FF3D00] uppercase tracking-wider block flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Onboarding Journey Progress</span>
              </span>
              <h3 className="text-base font-bold text-[#0D0D0D] mt-0.5">
                Current Step: {currentStepTitle}
              </h3>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 text-[#FF3D00] rounded-full">
              {completionPercentage}% Complete
            </span>
          </div>

          <div className="w-full bg-[#EDEDED] h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </section>
      )}

      {/* SECTION 4 — NEXT BEST ACTION BANNER */}
      <section className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-white border border-[#FF8A00]/30 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-[#FF3D00] text-white rounded-xl shadow-xs shrink-0 mt-0.5">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-[#FF3D00] uppercase tracking-wider">Next Best Action</span>
            <h4 className="text-base font-bold text-[#0D0D0D]">
              {!isFullyOnboarded ? `Complete Your ${currentStepTitle}` : (attendance.today_status === 'not_marked' ? 'Mark Today\'s Attendance' : (!diaryInfo.submittedToday ? 'Submit Today\'s Daily Diary' : 'Continue Internship Activities'))}
            </h4>
            <p className="text-xs text-[#737373] font-medium">
              {!isFullyOnboarded ? 'Advance to the next onboarding stage to unlock full internship modules.' : (attendance.today_status === 'not_marked' ? 'Check in for today to keep your attendance rate up.' : (!diaryInfo.submittedToday ? 'Log your daily work summary for guide review.' : 'Explore learning modules and community discussions.'))}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(!isFullyOnboarded ? nextRoute : (attendance.today_status === 'not_marked' ? '/intern/attendance' : (!diaryInfo.submittedToday ? '/intern/diary' : '/intern/learning')))}
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF3D00] hover:bg-[#E03500] text-white text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow-md hover:translate-x-0.5"
        >
          <span>{!isFullyOnboarded ? 'Continue Onboarding' : 'Take Action Now'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* SECTION 5 — TODAY'S STATUS */}
      <TodayStatusCard
        attendanceStatus={attendance?.today_status}
        checkInTime={attendance?.today_status === 'present' || attendance?.today_status === 'late' ? '09:00 AM' : null}
        checkOutTime={null}
        diaryStatus={diaryInfo?.todayStatus}
        pendingWorkCount={actionableTasksSummary?.total_actionable}
        todayTodoCount={actionableTasksSummary?.today_todos_count}
      />

      {/* SECTION 6 — QUICK ACTIONS */}
      <QuickActionGrid />

      {/* SECTION 7 — PERFORMANCE SUMMARY */}
      <PerformanceSummary
        attendanceRate={attendance?.rate}
        attendanceNotStarted={attendance?.attendance_not_started}
        diaryCompletionRate={diaryInfo?.submittedToday ? 100 : (diaryInfo ? 0 : undefined)}
        pendingWorksCount={actionableTasksSummary?.total_actionable}
        leaderboardRank={leaderboard?.user_rank}
        hasPoints={leaderboard?.has_points}
        userPoints={leaderboard?.user_points}
        learningProgressPercent={learningInfo?.percentage}
      />
    </div>
  );
}

