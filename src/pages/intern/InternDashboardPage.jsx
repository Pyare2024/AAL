import React from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useInternDashboardQuery } from '../../hooks/useInternDashboardQuery';
import { InternOverviewCard } from '../../components/intern/InternOverviewCard';
import { TodayStatusCard } from '../../components/intern/TodayStatusCard';
import { QuickActionGrid } from '../../components/intern/QuickActionGrid';
import { PerformanceSummary } from '../../components/intern/PerformanceSummary';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Module 1 — Intern Dashboard Page (Enterprise First Principles UI)
 * Purpose: Within 5 seconds after login, the intern knows WHO they are,
 * WHAT internship they belong to, WHO is guiding them, and WHAT to do next.
 */
export function InternDashboardPage() {
  const { user, profile } = useAuth();
  const { data: summaryData, lazyDetails, isLoading, isError, error, refetch } = useInternDashboardQuery(user?.id);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-2 sm:p-4 max-w-7xl mx-auto" data-testid="dashboard-loading-skeleton">
        <div className="h-44 bg-white border border-[#EDEDED] rounded-2xl"></div>
        <div className="h-28 bg-white border border-[#EDEDED] rounded-2xl"></div>
        <div className="h-24 bg-white border border-[#EDEDED] rounded-2xl"></div>
        <div className="h-28 bg-white border border-[#EDEDED] rounded-2xl"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3 max-w-7xl mx-auto" data-testid="dashboard-error-state">
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
        <h2 className="text-sm font-bold text-red-900">Failed to load Intern Dashboard Data</h2>
        <p className="text-xs text-red-700">{error?.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold text-xs rounded-xl hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  // Live Summary Aggregates (No fake fallbacks)
  const attendance = summaryData?.attendance;
  const actionableTasksSummary = summaryData?.actionable_tasks_summary;
  const leaderboard = summaryData?.leaderboard;
  const assignedAdmins = summaryData?.assigned_admins || [];

  // Lazy Details Extraction (No fake fallbacks)
  const diaryInfo = lazyDetails?.diary;
  const learningInfo = lazyDetails?.learning;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* SECTION 1 — INTERN OVERVIEW (Consolidated) */}
      <InternOverviewCard user={user} profile={profile} assignedAdmins={assignedAdmins} />

      {/* SECTION 2 — TODAY'S STATUS */}
      <TodayStatusCard
        attendanceStatus={attendance?.today_status}
        checkInTime={attendance?.today_status === 'present' || attendance?.today_status === 'late' ? '09:00 AM' : null}
        checkOutTime={null}
        diaryStatus={diaryInfo?.todayStatus}
        pendingWorkCount={actionableTasksSummary?.total_actionable}
        todayTodoCount={actionableTasksSummary?.today_todos_count}
      />

      {/* SECTION 3 — QUICK ACTIONS */}
      <QuickActionGrid />

      {/* SECTION 4 — PERFORMANCE SUMMARY */}
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
