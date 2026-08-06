import React from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useInternDashboardQuery } from '../../hooks/useInternDashboardQuery';
import { DashboardHeader } from '../../components/intern/DashboardHeader';
import { InternIdentityCard } from '../../components/intern/InternIdentityCard';
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

  // Live Summary Aggregates
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
  const problemStatementName = profile?.problem_statement_title || 'Not Assigned';

  const formattedAdmins = assignedAdmins.length > 0
    ? (assignedAdmins.length === 1 ? assignedAdmins[0] : assignedAdmins.length === 2 ? assignedAdmins.join(' & ') : `${assignedAdmins.length} Admins`)
    : 'No admin assigned';

  const startRaw = profile?.internship_start_date || profile?.joining_date || profile?.created_at;
  const startDate = startRaw ? new Date(startRaw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not configured';
  const endDate = profile?.internship_end_date ? new Date(profile.internship_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not configured';
  const status = profile?.account_status ? (profile.account_status.charAt(0).toUpperCase() + profile.account_status.slice(1)) : 'Active';

  // Current Week Calculation
  const startMs = startRaw ? new Date(startRaw).getTime() : null;
  const currentWeek = startMs ? Math.max(1, Math.ceil((Date.now() - startMs) / (1000 * 60 * 60 * 24 * 7))) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* SECTION 1 — HEADER */}
      <DashboardHeader
        userName={userName}
        userPhoto={userPhoto}
        internshipId={internshipId}
        unreadNotifications={0}
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

      {/* SECTION 3 — TODAY'S STATUS */}
      <TodayStatusCard
        attendanceStatus={attendance.today_status}
        checkInTime={attendance.today_status === 'present' || attendance.today_status === 'late' ? '09:00 AM' : null}
        checkOutTime={null}
        diaryStatus={diaryInfo.submittedToday ? 'submitted' : 'pending'}
        pendingWorkCount={actionableTasksSummary.total_actionable}
        todayTodoCount={actionableTasksSummary.today_todos_count || 0}
      />

      {/* SECTION 4 — QUICK ACTIONS */}
      <QuickActionGrid />

      {/* SECTION 5 — PERFORMANCE SUMMARY */}
      <PerformanceSummary
        attendanceRate={attendance.rate}
        attendanceNotStarted={attendance.attendance_not_started}
        diaryCompletionRate={diaryInfo.submittedToday ? 100 : 0}
        pendingWorksCount={actionableTasksSummary.total_actionable}
        leaderboardRank={leaderboard.user_rank}
        hasPoints={leaderboard.has_points}
        userPoints={leaderboard.user_points}
        learningProgressPercent={learningInfo.percentage}
      />
    </div>
  );
}
