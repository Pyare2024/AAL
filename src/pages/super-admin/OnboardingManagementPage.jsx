import React, { useState, useEffect, useCallback } from 'react';
import { useOnboardingInterns } from '../../hooks/useOnboardingInterns';
import { useOnboardingRealtime } from '../../hooks/useOnboardingRealtime';
import { ManagementFilterBar } from '../../components/common/ManagementFilterBar';
import { InternOnboardingDetailDrawer } from '../../components/super-admin/InternOnboardingDetailDrawer';
import { 
  UserCheck, 
  UserPlus, 
  FileText, 
  BookOpen, 
  CheckSquare, 
  Calendar, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

export function OnboardingManagementPage() {
  const [activeSubmodule, setActiveSubmodule] = useState('progress');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Reusable Filter Bar State
  const initialFilters = {
    search: '',
    problemStatement: 'all',
    college: 'all',
    city: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  };
  const [filters, setFilters] = useState(initialFilters);

  // Realtime Notifications state
  const [notifications, setNotifications] = useState([]);

  const handleRealtimeNotification = useCallback((notif) => {
    setNotifications((prev) => [notif, ...prev.slice(0, 4)]); // keep latest 5
  }, []);

  // Connect Realtime Subscription
  const { status: realtimeStatus } = useOnboardingRealtime(handleRealtimeNotification);

  // Connect React Query for Real Supabase Data
  const { data, isLoading, isError, error, refetch, isFetching } = useOnboardingInterns();

  const candidates = data?.interns || [];
  const problemStatementOptions = data?.problemStatements || [];

  // Keep selected candidate updated if refetch returns updated progress
  useEffect(() => {
    if (selectedCandidate) {
      const fresh = candidates.find((c) => c.id === selectedCandidate.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(selectedCandidate)) {
        console.log('Replacing selected candidate with fresh record:', fresh);
        setSelectedCandidate(fresh);
      }
    }
  }, [candidates, selectedCandidate]);

  // Extract unique colleges and cities dynamically from real data
  const collegeOptions = Array.from(
    new Set(candidates.map((c) => c.collegeName).filter((col) => col && col !== 'N/A'))
  );
  const cityOptions = Array.from(
    new Set(candidates.map((c) => c.city).filter((ct) => ct && ct !== 'N/A'))
  );

  const statusOptions = [
    { value: 'all', label: 'All Steps' },
    { value: 'Profile Completion', label: 'Profile Completion' },
    { value: 'Questionnaire', label: 'Questionnaire' },
    { value: 'Simple LMS Learning', label: 'Simple LMS Learning' },
    { value: 'Seven Activities', label: 'Seven Activities' },
    { value: 'Interview', label: 'Interview' },
    { value: 'Problem Statement Allocation', label: 'Problem Statement Allocation' },
  ];

  // Filtering Logic
  const filteredCandidates = candidates.filter((c) => {
    // 1. Search Query Match
    const searchMatch =
      !filters.search ||
      c.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
      c.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      (c.mobile && c.mobile.includes(filters.search)) ||
      c.id.includes(filters.search);

    // 2. College Match
    const collegeMatch = filters.college === 'all' || c.collegeName === filters.college;

    // 3. City Match
    const cityMatch = filters.city === 'all' || c.city === filters.city;

    // 4. Current Step Status Match
    const statusMatch = filters.status === 'all' || c.currentStep === filters.status;

    // 5. Problem Statement Match
    const psMatch =
      filters.problemStatement === 'all' ||
      c.allocatedProblemStatements.some((ps) => ps.id === filters.problemStatement);

    return searchMatch && collegeMatch && cityMatch && statusMatch && psMatch;
  });

  // Calculate Submodule Stage Counts accurately based on exact current step
  const submoduleCounts = {
    progress: candidates.length,
    newReg: candidates.filter((c) => c.currentStep === 'Profile Completion').length,
    profileVer: candidates.filter((c) => c.profileCompleted).length,
    questionnaire: candidates.filter((c) => c.currentStep === 'Questionnaire').length,
    lms: candidates.filter((c) => c.currentStep === 'Simple LMS Learning').length,
    activities: candidates.filter((c) => c.currentStep === 'Seven Activities').length,
    interview: candidates.filter((c) => c.currentStep === 'Interview').length,
    allocation: candidates.filter((c) => c.currentStep === 'Problem Statement Allocation').length,
  };

  const submodules = [
    { id: 'progress', label: 'Onboarding Progress', icon: TrendingUp, count: submoduleCounts.progress },
    { id: 'new-reg', label: 'New Registration', icon: UserPlus, count: submoduleCounts.newReg },
    { id: 'profile-ver', label: 'Profile Verification', icon: UserCheck, count: submoduleCounts.profileVer },
    { id: 'questionnaire', label: 'Questionnaire', icon: FileText, count: submoduleCounts.questionnaire },
    { id: 'lms', label: 'Simple LMS Learning', icon: BookOpen, count: submoduleCounts.lms },
    { id: 'activities', label: '7 Activities', icon: CheckSquare, count: submoduleCounts.activities },
    { id: 'interview', label: 'Interview', icon: Calendar, count: submoduleCounts.interview },
    { id: 'allocation', label: 'Problem Statement Allocation', icon: Target, count: submoduleCounts.allocation },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00]">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Real Supabase Data Pipeline</span>
            </div>

            {/* Realtime Connection Status Indicator */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
              realtimeStatus === 'LIVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : realtimeStatus === 'CONNECTING'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                realtimeStatus === 'LIVE'
                  ? 'bg-emerald-500 animate-pulse'
                  : realtimeStatus === 'CONNECTING'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-red-500'
              }`} />
              <span>Realtime: {realtimeStatus}</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#0D0D0D]">Onboarding Management</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Sequential 7-step onboarding control and stage tracking for registered candidates.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          title="Refetch Onboarding Data"
          className="px-4 py-2 bg-[#F7F7F7] border border-[#EDEDED] hover:bg-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-[#FF8A00]' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Realtime Activity Toast Notifications Banner */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs animate-fadeIn"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{n.message}</span>
                <span className="text-[10px] text-emerald-700 font-mono font-normal">[{n.timestamp}]</span>
              </div>
              <button
                onClick={() => setNotifications((prev) => prev.filter((item) => item.id !== n.id))}
                className="text-emerald-700 hover:text-emerald-950 text-xs px-2 py-0.5"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Common Management Filter Bar */}
      <ManagementFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters(initialFilters)}
        collegeOptions={collegeOptions}
        cityOptions={cityOptions}
        statusOptions={statusOptions}
        problemStatementOptions={problemStatementOptions}
        placeholderSearch="Search by Candidate Name, Email, Mobile, ID..."
      />

      {/* Submodule Overview Grid Cards */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wider">Onboarding Management Submodules</h2>
          <span className="text-xs text-[#9A9A9A]">Select a submodule card to view stage workspace</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {submodules.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubmodule(sub.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 group cursor-pointer ${
                activeSubmodule === sub.id
                  ? 'bg-white border-[#FF8A00] shadow-md ring-2 ring-[#FF8A00]/20'
                  : 'bg-white border-[#EDEDED] hover:border-[#FF8A00]/40 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <div className={`p-2.5 rounded-xl transition-colors ${
                  activeSubmodule === sub.id ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white' : 'bg-[#F7F7F7] text-[#FF8A00] group-hover:bg-[#FF8A00]/10'
                }`}>
                  <sub.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-black px-2.5 py-0.5 bg-[#F7F7F7] border border-[#EDEDED] text-[#0D0D0D] rounded-full">
                  {sub.count} Candidates
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#0D0D0D] group-hover:text-[#FF8A00] transition-colors">{sub.label}</h3>
                <p className="text-[11px] text-[#9A9A9A] mt-0.5">Manage & inspect stage entries</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Submodule Content Views */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-[#FF8A00] animate-spin mx-auto" />
            <p className="text-sm font-bold text-[#0D0D0D]">Loading Onboarding Interns...</p>
            <p className="text-xs text-[#9A9A9A]">Fetching real records from Supabase tables</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl space-y-3 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h3 className="text-sm font-bold text-red-800">Failed to Load Onboarding Candidates</h3>
            <p className="text-xs text-red-600">{error?.message || 'Supabase query encountered an error.'}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-red-700 transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty List State */}
        {!isLoading && !isError && candidates.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <UserCheck className="h-8 w-8 text-[#9A9A9A] mx-auto" />
            <h3 className="text-base font-bold text-[#0D0D0D]">No Onboarding Interns Found</h3>
            <p className="text-xs text-[#9A9A9A] max-w-sm mx-auto">
              There are currently no intern accounts pending onboarding in the system.
            </p>
          </div>
        )}

        {/* No Filter Results State */}
        {!isLoading && !isError && candidates.length > 0 && filteredCandidates.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <FileText className="h-8 w-8 text-[#9A9A9A] mx-auto" />
            <h3 className="text-base font-bold text-[#0D0D0D]">No Matching Candidates</h3>
            <p className="text-xs text-[#9A9A9A]">No candidates match your current filter criteria. Try resetting filters.</p>
            <button
              onClick={() => setFilters(initialFilters)}
              className="text-xs font-bold text-[#FF8A00] hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* SUBMODULE 1: ONBOARDING PIPELINE PROGRESS TRACKER */}
        {!isLoading && !isError && activeSubmodule === 'progress' && filteredCandidates.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <h2 className="text-base font-bold text-[#0D0D0D]">Onboarding Pipeline Progress Tracker ({filteredCandidates.length})</h2>
              <span className="text-xs font-semibold text-[#9A9A9A]">Showing real candidates in-progress</span>
            </div>

            <div className="space-y-3">
              {filteredCandidates.map((cand) => (
                <div key={cand.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#0D0D0D]">{cand.fullName}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 text-[#FF3D00] border border-[#FF8A00]/20 rounded">
                          Current Step: {cand.currentStep}
                        </span>
                        {!cand.hasProgressRow && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                            <AlertTriangle className="h-3 w-3" /> Progress record missing
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9A9A9A] mt-0.5">
                        {cand.email} | {cand.mobile} | Reg: {cand.registeredDate} | {cand.collegeName} ({cand.city})
                      </p>
                    </div>

                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-xs font-black text-[#FF3D00] block">{cand.completionPercentage}% Complete</span>
                      </div>
                      <button
                        onClick={() => setSelectedCandidate(cand)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-95 cursor-pointer shrink-0"
                      >
                        View Details & Actions
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#EDEDED] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] h-full rounded-full transition-all duration-500"
                      style={{ width: `${cand.completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMODULE 2: NEW REGISTRATION */}
        {!isLoading && !isError && activeSubmodule === 'new-reg' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">1. New Registration Queue</h2>
            <div className="space-y-3">
              {filteredCandidates.filter(c => c.currentStep === 'Profile Completion').length === 0 ? (
                <p className="text-xs text-[#9A9A9A] py-4 text-center">No newly registered candidates pending profile setup.</p>
              ) : (
                filteredCandidates.filter(c => c.currentStep === 'Profile Completion').map(c => (
                  <div key={c.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-[#0D0D0D]">{c.fullName}</h4>
                      <p className="text-xs text-[#9A9A9A]">{c.email} | Registered: {c.registeredDate}</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 bg-[#EDEDED] text-[#0D0D0D] rounded-lg">Awaiting Profile Fill</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUBMODULE 3: PROFILE VERIFICATION */}
        {!isLoading && !isError && activeSubmodule === 'profile-ver' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">2. Profile Verification Queue</h2>
            <div className="space-y-3">
              {filteredCandidates.filter(c => c.profileCompleted).length === 0 ? (
                <p className="text-xs text-[#9A9A9A] py-4 text-center">No completed profiles available for verification.</p>
              ) : (
                filteredCandidates.filter(c => c.profileCompleted).map(c => (
                  <div key={c.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-[#0D0D0D]">{c.fullName} ({c.collegeName})</h4>
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Profile Completed
                      </span>
                    </div>
                    <p className="text-xs text-[#9A9A9A]">
                      City: {c.city} | Mobile: {c.mobile} | Reg: {c.registeredDate}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUBMODULE 4: QUESTIONNAIRE */}
        {!isLoading && !isError && activeSubmodule === 'questionnaire' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">3. Questionnaire Assessment Queue</h2>
            <div className="space-y-3">
              {filteredCandidates.filter(c => c.currentStep === 'Questionnaire').length === 0 ? (
                <p className="text-xs text-[#9A9A9A] py-4 text-center">No candidates currently at Questionnaire step.</p>
              ) : (
                filteredCandidates.filter(c => c.currentStep === 'Questionnaire').map(c => (
                  <div key={c.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-[#0D0D0D]">{c.fullName}</h4>
                      <p className="text-xs text-[#9A9A9A]">{c.email} | Current Step: <strong className="text-[#0D0D0D]">Questionnaire</strong></p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">Awaiting Response Submission</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUBMODULE 5: SIMPLE LMS LEARNING */}
        {!isLoading && !isError && activeSubmodule === 'lms' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">4. Simple LMS Learning Queue</h2>
            <div className="space-y-3">
              {filteredCandidates.filter(c => c.currentStep === 'Simple LMS Learning').length === 0 ? (
                <p className="text-xs text-[#9A9A9A] py-4 text-center">No candidates currently at LMS Learning step.</p>
              ) : (
                filteredCandidates.filter(c => c.currentStep === 'Simple LMS Learning').map(c => (
                  <div key={c.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-[#0D0D0D]">{c.fullName}</h4>
                      <p className="text-xs text-[#9A9A9A]">{c.email} | LMS Status: <strong className="text-[#FF8A00]">Learning Intro Pending</strong></p>
                    </div>
                    <span className="text-xs font-semibold text-[#FF8A00] bg-[#FF8A00]/10 px-2.5 py-1 rounded-md">In Progress</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUBMODULE 6: 7 ACTIVITIES */}
        {!isLoading && !isError && activeSubmodule === 'activities' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">5. Seven Mandatory Activities Queue</h2>
            <div className="space-y-3">
              {filteredCandidates.filter(c => c.currentStep === 'Seven Activities').length === 0 ? (
                <p className="text-xs text-[#9A9A9A] py-4 text-center">No candidates currently at Seven Activities step.</p>
              ) : (
                filteredCandidates.filter(c => c.currentStep === 'Seven Activities').map(c => (
                  <div key={c.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-[#0D0D0D]">{c.fullName}</h4>
                      <p className="text-xs text-[#9A9A9A]">{c.email} | Step: <strong className="text-[#FF3D00]">Seven Activities Submission Pending</strong></p>
                    </div>
                    <span className="text-xs font-semibold text-[#FF3D00] bg-[#FF3D00]/10 px-2.5 py-1 rounded-md">Activities Pending</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUBMODULE 7: INTERVIEW */}
        {!isLoading && !isError && activeSubmodule === 'interview' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">6. Interview Queue</h2>
            <div className="space-y-3">
              {filteredCandidates.filter(c => c.currentStep === 'Interview').length === 0 ? (
                <p className="text-xs text-[#9A9A9A] py-4 text-center">No candidates currently awaiting Interview evaluation.</p>
              ) : (
                filteredCandidates.filter(c => c.currentStep === 'Interview').map(c => (
                  <div key={c.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-[#0D0D0D]">{c.fullName}</h4>
                      <p className="text-xs text-[#9A9A9A]">
                        Interview Status: <strong className="text-[#0D0D0D]">{c.interviewStatus}</strong> {c.interviewDate && `| ${c.interviewDate}`}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-[#EDEDED] text-xs font-semibold text-[#0D0D0D] rounded-lg">Read Only (Evaluation Pending)</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUBMODULE 8: PROBLEM STATEMENT ALLOCATION */}
        {!isLoading && !isError && activeSubmodule === 'allocation' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D] border-b border-[#EDEDED] pb-3">7. Problem Statement Allocation Queue</h2>
            <div className="space-y-3">
              {filteredCandidates.filter(c => c.currentStep === 'Problem Statement Allocation').length === 0 ? (
                <p className="text-xs text-[#9A9A9A] py-4 text-center">No candidates currently at Problem Statement Allocation step.</p>
              ) : (
                filteredCandidates.filter(c => c.currentStep === 'Problem Statement Allocation').map(c => (
                  <div key={c.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-[#0D0D0D]">{c.fullName}</h4>
                      <p className="text-xs text-[#9A9A9A]">
                        Allocation Status: <strong className="text-[#FF8A00]">{c.allocationStatus}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCandidate(c)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Intern Onboarding Detail Drawer Modal */}
      {selectedCandidate && (
        <InternOnboardingDetailDrawer
          candidate={selectedCandidate}
          problemStatements={data?.problemStatements || []}
          admins={data?.admins || []}
          onClose={() => setSelectedCandidate(null)}
          onRefresh={() => refetch()}
        />
      )}
    </div>
  );
}
