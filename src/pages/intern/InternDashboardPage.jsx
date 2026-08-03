import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useInternDashboardQuery } from '../../hooks/useInternDashboardQuery';
import { 
  User, 
  Calendar, 
  FileText, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Bell, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  ListTodo,
  RefreshCw,
  Video,
  UserCheck
} from 'lucide-react';

export function InternDashboardPage() {
  const { user, profile } = useAuth();
  const { data: summaryData, lazyDetails, isLoading, isError, error, refetch } = useInternDashboardQuery(user?.id);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" data-testid="dashboard-loading-skeleton">
        <div className="h-28 bg-white border border-[#EDEDED] rounded-2xl p-6"></div>
        <div className="h-24 bg-white border border-[#EDEDED] rounded-2xl p-5"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-white border border-[#EDEDED] rounded-2xl"></div>
          <div className="h-28 bg-white border border-[#EDEDED] rounded-2xl"></div>
          <div className="h-28 bg-white border border-[#EDEDED] rounded-2xl"></div>
          <div className="h-28 bg-white border border-[#EDEDED] rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3" data-testid="dashboard-error-state">
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

  // Summary Data Extraction
  const attendance = summaryData?.attendance || {
    attended: 0,
    total: 0,
    rate: 0,
    present_days: 0,
    late_days: 0,
    absent_days: 0,
    leave_days: 0,
    today_status: 'not_marked',
    attendance_not_started: true
  };

  const actionableTasksSummary = summaryData?.actionable_tasks_summary || {
    total_actionable: 0,
    due_today_count: 0,
    overdue_count: 0,
    resubmission_count: 0,
    top_3: []
  };

  const announcements = summaryData?.announcements || [];
  const leaderboard = summaryData?.leaderboard || {
    user_rank: 1,
    user_points: 0,
    is_tied: true,
    has_points: false,
    top_interns: []
  };
  const assignedAdmins = summaryData?.assigned_admins || [];

  // Lazy Details Extraction
  const diaryInfo = lazyDetails?.diary || { todayStatus: 'pending', submittedToday: false, lastSubmittedDate: null };
  const learningInfo = lazyDetails?.learning || { totalAssigned: 0, completed: 0, inProgress: 0, percentage: 0 };
  const onboardingInfo = lazyDetails?.onboarding || null;
  const upcomingInterview = lazyDetails?.upcomingInterview || null;

  // Profile Header Info
  const internInfo = {
    name: profile?.full_name || 'Active Intern',
    photo: profile?.profile_photo_url || null,
    status: profile?.account_status ? profile.account_status.charAt(0).toUpperCase() + profile.account_status.slice(1) : 'Active Intern',
    problemStatement: profile?.problem_statement_title || 'AI Automated Workflow & Intelligent Data Pipeline Engine',
    formattedAdmins: assignedAdmins.length > 0 
      ? (assignedAdmins.length === 1 ? assignedAdmins[0] : assignedAdmins.length === 2 ? assignedAdmins.join(' & ') : `Support Team (${assignedAdmins.length} Admins)`)
      : 'Support Team (Unassigned)',
    startDate: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : null
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  // Onboarding Step Check
  const onboardingSteps = [
    { label: 'Profile', completed: !!onboardingInfo?.profile_completed },
    { label: 'Questionnaire', completed: !!onboardingInfo?.questionnaire_completed },
    { label: 'Learning Intro', completed: !!onboardingInfo?.learning_intro_completed },
    { label: 'Activities', completed: !!onboardingInfo?.activities_completed },
    { label: 'Interview', completed: !!onboardingInfo?.interview_completed },
    { label: 'Problem Statement', completed: !!onboardingInfo?.problem_statement_allocated },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Welcome Header */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF8A00] to-[#FF3D00] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#FF3D00]/25 shrink-0 overflow-hidden">
            {internInfo.photo ? (
              <img src={internInfo.photo} alt={internInfo.name} className="w-full h-full object-cover" />
            ) : (
              <span>{internInfo.name.split(' ').map((n) => n[0]).join('')}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Welcome Back 👋</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> {internInfo.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">{internInfo.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#9A9A9A]">
              <p>Problem Statement: <strong className="text-[#0D0D0D]">{internInfo.problemStatement}</strong></p>
              <p className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#FF8A00]" />
                <span>Admins: <strong className="text-[#0D0D0D]">{internInfo.formattedAdmins}</strong></span>
              </p>
              {internInfo.startDate && (
                <p>Started: <strong className="text-[#0D0D0D]">{internInfo.startDate}</strong></p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Date Display */}
        <div className="px-4 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-right shrink-0 hidden sm:block">
          <span className="text-[11px] font-semibold text-[#9A9A9A] block uppercase">Today's Date</span>
          <span className="text-xs font-bold text-[#0D0D0D]">{todayFormatted}</span>
        </div>
      </div>

      {/* 2. Today's Action Items */}
      <div className="bg-gradient-to-r from-[#FF8A00]/10 via-[#FF3D00]/5 to-transparent border border-[#FF8A00]/20 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#0D0D0D] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF3D00]" />
            <span>Today's Action Items</span>
          </h2>
          <span className="text-xs font-bold text-[#FF3D00] bg-white px-2.5 py-0.5 rounded-full border border-[#FF3D00]/20">
            {actionableTasksSummary.total_actionable} Actionable Tasks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Mark Attendance Card */}
          <Link to="/intern/attendance" className="p-3 bg-white border border-[#EDEDED] rounded-xl hover:border-[#FF8A00] transition-all flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#FF8A00]/10 text-[#FF8A00] rounded-lg">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0D0D0D]">Mark Attendance</p>
                <p className={`text-[10px] font-semibold ${
                  attendance.today_status === 'present' ? 'text-emerald-600' : attendance.today_status === 'late' ? 'text-amber-600' : 'text-[#FF3D00]'
                }`}>
                  {attendance.today_status === 'present' ? 'Present Today' : attendance.today_status === 'late' ? 'Late Today' : 'Not Marked Yet'}
                </p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[#9A9A9A] group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Daily Diary Card */}
          <Link to="/intern/diary" className="p-3 bg-white border border-[#EDEDED] rounded-xl hover:border-[#FF8A00] transition-all flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#FF3D00]/10 text-[#FF3D00] rounded-lg">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0D0D0D]">Submit Daily Diary</p>
                <p className={`text-[10px] font-semibold ${diaryInfo.submittedToday ? 'text-emerald-600' : 'text-[#FF3D00]'}`}>
                  {diaryInfo.submittedToday ? 'Submitted Today' : 'Pending for Today'}
                </p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[#9A9A9A] group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Pending Work Card */}
          <Link to="/intern/pending-work" className="p-3 bg-white border border-[#EDEDED] rounded-xl hover:border-[#FF8A00] transition-all flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#FF8A00]/10 text-[#FF8A00] rounded-lg">
                <ListTodo className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0D0D0D]">Actionable Work</p>
                <p className="text-[10px] text-[#9A9A9A]">{actionableTasksSummary.total_actionable} Tasks ({actionableTasksSummary.due_today_count} Due Today)</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[#9A9A9A] group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Learning Card */}
          <Link to="/intern/learning" className="p-3 bg-white border border-[#EDEDED] rounded-xl hover:border-[#FF8A00] transition-all flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0D0D0D]">Learning Modules</p>
                <p className="text-[10px] text-blue-600 font-semibold">{learningInfo.totalAssigned} Assigned ({learningInfo.inProgress} In-Progress)</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[#9A9A9A] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Conditional Pending Interview Event Card */}
        {upcomingInterview && (
          <div className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between mt-2">
            <div className="flex items-center gap-2.5">
              <Video className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-[#0D0D0D]">Upcoming Interview Evaluation</p>
                <p className="text-[10px] text-amber-700">Scheduled: {new Date(upcomingInterview.scheduled_at).toLocaleString()}</p>
              </div>
            </div>
            {upcomingInterview.meeting_link && (
              <a href={upcomingInterview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1">
                <span>Join Meeting</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* 3. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Summary */}
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Attendance Summary</span>
            <div className="p-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl shadow-sm">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          {attendance.attendance_not_started ? (
            <div>
              <p className="text-base font-bold text-[#0D0D0D]">Attendance Not Started</p>
              <p className="text-xs text-[#9A9A9A]">No eligible attendance sessions available yet</p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-black text-[#0D0D0D]">{attendance.rate}%</p>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> {attendance.attended} of {attendance.total} sessions present
              </p>
              <p className="text-[10px] text-[#9A9A9A] mt-1">
                P: {attendance.present_days} | L: {attendance.late_days} | A: {attendance.absent_days} | Leave: {attendance.leave_days}
              </p>
            </div>
          )}
        </div>

        {/* Pending Work KPI */}
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Pending Work</span>
            <div className="p-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl shadow-sm">
              <ListTodo className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0D0D0D]">{actionableTasksSummary.total_actionable} Tasks</p>
          <p className="text-xs text-[#FF3D00] font-semibold">
            {actionableTasksSummary.overdue_count > 0 ? `${actionableTasksSummary.overdue_count} Overdue` : 'Actionable Pending Work'}
          </p>
        </div>

        {/* Daily Diary Status */}
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Daily Diary Status</span>
            <div className="p-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-[#0D0D0D]">
            {diaryInfo.submittedToday ? 'Submitted Today' : 'Pending Submission'}
          </p>
          <p className="text-xs text-[#9A9A9A]">
            {diaryInfo.lastSubmittedDate ? `Last entry: ${diaryInfo.lastSubmittedDate}` : 'No entries submitted yet'}
          </p>
        </div>

        {/* Leaderboard Summary */}
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Leaderboard Rank</span>
            <div className="p-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl shadow-sm">
              <Award className="h-4 w-4" />
            </div>
          </div>
          {leaderboard.has_points ? (
            <div>
              <p className="text-2xl font-black text-[#0D0D0D]">Rank #{leaderboard.user_rank}</p>
              <p className="text-xs text-blue-600 font-semibold">{leaderboard.user_points} Total Points</p>
            </div>
          ) : (
            <div>
              <p className="text-base font-bold text-[#0D0D0D]">Rank Not Available Yet</p>
              <p className="text-xs text-[#9A9A9A]">Earn points to appear on the leaderboard</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Onboarding Progress Section (For Onboarding Stage Interns) */}
      {onboardingInfo && (
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
            <h2 className="text-base font-bold text-[#0D0D0D] flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#FF8A00]" />
              <span>Onboarding Progress</span>
            </h2>
            <span className="text-xs font-black text-[#FF3D00]">{onboardingInfo.completion_percentage || 0}% Completed</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
            {onboardingSteps.map((step, idx) => (
              <div key={idx} className={`p-2.5 rounded-xl border text-center text-xs font-semibold ${
                step.completed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-[#F7F7F7] border-[#EDEDED] text-[#9A9A9A]'
              }`}>
                <span>{step.label}</span>
                <span className="block text-[10px] mt-0.5">{step.completed ? '✓ Done' : 'Pending'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Actionable Pending Work Preview */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#0D0D0D]">Pending Actionable Tasks</h2>
                <p className="text-xs text-[#9A9A9A]">Tasks requiring your submission or correction</p>
              </div>
              <Link to="/intern/pending-work" className="text-xs font-bold text-[#FF8A00] hover:text-[#FF3D00] flex items-center gap-1 transition-colors">
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {actionableTasksSummary.top_3.length === 0 ? (
              <div className="p-6 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-center">
                <p className="text-xs text-[#9A9A9A] font-medium">No pending tasks assigned today. Great job!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actionableTasksSummary.top_3.map((task) => (
                  <div key={task.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex items-center justify-between hover:bg-white hover:border-[#D4D4D4] transition-all">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-[#0D0D0D]">{task.title}</h3>
                      <div className="flex items-center gap-3 text-[11px] text-[#9A9A9A]">
                        <span>Due: <strong className="text-[#0D0D0D]">{task.due_at ? new Date(task.due_at).toLocaleDateString() : 'Today'}</strong></span>
                        <span>•</span>
                        <span>Status: <strong className="text-[#FF8A00]">{task.status}</strong></span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 ${
                      task.priority === 'high' ? 'bg-[#FF3D00]/10 text-[#FF3D00]' : 'bg-[#FF8A00]/10 text-[#FF8A00]'
                    }`}>
                      {task.priority || 'medium'} Priority
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Diary & Learning Progress Preview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Diary Preview Card */}
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
                  <h3 className="text-sm font-bold text-[#0D0D0D] flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#FF3D00]" />
                    <span>Daily Diary Log</span>
                  </h3>
                  <span className="text-[10px] font-bold text-[#FF3D00] bg-[#FF3D00]/10 px-2 py-0.5 rounded">
                    Due Daily
                  </span>
                </div>
                <p className="text-xs text-[#9A9A9A] leading-relaxed">
                  Log your daily learnings, completed features, blockages, and code screenshots.
                </p>
                <div className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs space-y-1">
                  <p className="text-[#0D0D0D] font-bold">Today's Entry Status: <span className={diaryInfo.submittedToday ? 'text-emerald-600' : 'text-[#FF3D00]'}>{diaryInfo.submittedToday ? 'Submitted' : 'Pending'}</span></p>
                  <p className="text-[11px] text-[#9A9A9A]">Last Submission: {diaryInfo.lastSubmittedDate || 'None'}</p>
                </div>
              </div>

              <Link to="/intern/diary" className="w-full py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 flex items-center justify-center gap-2 transition-all mt-4">
                <span>{diaryInfo.submittedToday ? 'View Today\'s Entry' : 'Write Today\'s Diary'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* LMS Learning Progress Preview Card */}
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
                  <h3 className="text-sm font-bold text-[#0D0D0D] flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span>Learning & LMS</span>
                  </h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {learningInfo.totalAssigned} Modules
                  </span>
                </div>

                {learningInfo.totalAssigned === 0 ? (
                  <div className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-center space-y-1">
                    <p className="text-xs font-bold text-[#0D0D0D]">0%</p>
                    <p className="text-[11px] text-[#9A9A9A]">No LMS learning modules assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-[#0D0D0D]">
                      <span>LMS Progress</span>
                      <span className="text-blue-600">{learningInfo.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#EDEDED] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${learningInfo.percentage}%` }}></div>
                    </div>
                    <p className="text-[11px] text-[#9A9A9A]">Completed: {learningInfo.completed} | In-Progress: {learningInfo.inProgress}</p>
                  </div>
                )}
              </div>

              <Link to="/intern/learning" className="w-full py-2.5 bg-white border border-[#D4D4D4] text-[#0D0D0D] font-semibold text-xs rounded-xl hover:border-[#FF8A00] hover:text-[#FF8A00] flex items-center justify-center gap-2 transition-all mt-4">
                <span>Continue Learning</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col wide) */}
        <div className="space-y-6">
          {/* Recent Alerts (Announcements) */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <h2 className="text-base font-bold text-[#0D0D0D] flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#FF8A00]" />
                <span>Recent Alerts</span>
              </h2>
              <span className="text-xs font-bold text-[#9A9A9A]">{announcements.length} Active</span>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-[#9A9A9A] text-center py-4">No active system alerts.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((item) => (
                  <div key={item.id} className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-1 hover:bg-white hover:border-[#D4D4D4] transition-all">
                    <h4 className="text-xs font-bold text-[#0D0D0D] leading-snug">{item.title}</h4>
                    <span className="text-[10px] text-[#9A9A9A] block">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DB-Side Leaderboard Preview (PII Isolated) */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <h2 className="text-base font-bold text-[#0D0D0D] flex items-center gap-2">
                <Award className="h-4 w-4 text-[#FF3D00]" />
                <span>Leaderboard Preview</span>
              </h2>
              <Link to="/intern/leaderboard" className="text-xs font-bold text-[#FF8A00] hover:underline">
                View All
              </Link>
            </div>

            <div className="p-3 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-[#9A9A9A] uppercase block">Your Rank</span>
                <span className="text-lg font-black text-[#FF3D00]">
                  {leaderboard.has_points ? `Rank #${leaderboard.user_rank}` : 'Rank Not Available'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#9A9A9A] uppercase block">Points</span>
                <span className="text-lg font-black text-[#0D0D0D]">{leaderboard.user_points} pts</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {(leaderboard.top_interns || []).map((top, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                    <span className="font-bold text-[#0D0D0D]">{top.full_name || 'Intern'}</span>
                  </div>
                  <span className="font-extrabold text-[#FF8A00]">{top.total_points} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Navigation Grid */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D]">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <Link to="/intern/attendance" className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-center hover:border-[#FF8A00] hover:bg-white transition-all space-y-1">
                <Calendar className="h-5 w-5 text-[#FF8A00] mx-auto" />
                <span className="text-xs font-bold text-[#0D0D0D] block">Attendance</span>
              </Link>

              <Link to="/intern/diary" className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-center hover:border-[#FF8A00] hover:bg-white transition-all space-y-1">
                <FileText className="h-5 w-5 text-[#FF3D00] mx-auto" />
                <span className="text-xs font-bold text-[#0D0D0D] block">Daily Diary</span>
              </Link>

              <Link to="/intern/learning" className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-center hover:border-[#FF8A00] hover:bg-white transition-all space-y-1">
                <BookOpen className="h-5 w-5 text-blue-600 mx-auto" />
                <span className="text-xs font-bold text-[#0D0D0D] block">Learning</span>
              </Link>

              <Link to="/intern/leaderboard" className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-center hover:border-[#FF8A00] hover:bg-white transition-all space-y-1">
                <Award className="h-5 w-5 text-[#FF8A00] mx-auto" />
                <span className="text-xs font-bold text-[#0D0D0D] block">Leaderboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
