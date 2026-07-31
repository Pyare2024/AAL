import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  BookOpen, 
  Plus, 
  FastForward, 
  TrendingUp, 
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  fetchSuperAdminDashboardStats, 
  subscribeToSuperAdminDashboardChanges 
} from '../../services/superAdminDashboardService';

export function SuperAdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [skipModalIntern, setSkipModalIntern] = useState(null);
  const [skipReason, setSkipReason] = useState('');
  const [skipStepName, setSkipStepName] = useState('Learning Setup');

  const admins = stats?.admins?.list || [];
  const problemStatements = stats?.problemStatements?.list || [];
  const onboardingInterns = stats?.onboardingInterns?.list || [];

  // Stable Data Refetcher
  const loadDashboardStats = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const data = await fetchSuperAdminDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching Super Admin Dashboard stats:', err);
      setError(err.message || 'Failed to fetch dashboard metrics.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Initial Fetch & Realtime Subscription Lifecycle
  useEffect(() => {
    loadDashboardStats(true);

    const unsubscribe = subscribeToSuperAdminDashboardChanges(() => {
      if (import.meta.env.DEV) console.log('Realtime update: refetching dashboard stats');
      loadDashboardStats(false);
    });

    return () => {
      unsubscribe();
    };
  }, [loadDashboardStats]);

  const handleSkipStep = async () => {
    if (!skipModalIntern || !skipReason.trim()) return;

    try {
      const stepKeyMap = {
        'Profile Completion': 'profile_completed',
        'Technical Questionnaire': 'questionnaire_completed',
        'Learning Setup': 'learning_intro_completed',
        'Seven Mandatory Activities': 'activities_completed',
      };
      const stepKey = stepKeyMap[skipStepName] || 'learning_intro_completed';
      
      const { skipOnboardingStep } = await import('../../services/superAdminActionService');
      await skipOnboardingStep({
        internId: skipModalIntern.id,
        stepKey,
        reason: skipReason.trim(),
      });
      await loadDashboardStats(false);
    } catch (err) {
      console.error('Error skipping step:', err);
    } finally {
      setSkipModalIntern(null);
      setSkipReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Ownership Header */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Platform Super Owner Console</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Super Admin Foundation</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Full platform ownership: Admins, Problem Statements, Intern Onboarding & Global Controls.
          </p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#F7F7F7] p-1.5 border border-[#EDEDED] rounded-xl">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white shadow-sm'
                  : 'text-[#0D0D0D] hover:bg-white'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error state alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-700 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadDashboardStats(true)}
            className="inline-flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Total Active Admins</span>
              {loading ? (
                <div className="py-1 flex items-center space-x-2 text-[#9A9A9A]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#FF8A00]" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-black text-[#0D0D0D]">{stats?.admins?.total ?? 0} Admins</p>
                  <p className="text-xs text-emerald-600 font-semibold">{stats?.admins?.inactive ?? 0} Inactive</p>
                </>
              )}
            </div>

            <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Problem Statements</span>
              {loading ? (
                <div className="py-1 flex items-center space-x-2 text-[#9A9A9A]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#FF8A00]" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-black text-[#0D0D0D]">{stats?.problemStatements?.allocated ?? 0} Allocated</p>
                  <p className="text-xs text-[#FF3D00] font-semibold">{stats?.problemStatements?.active ?? 0} Active Projects</p>
                </>
              )}
            </div>

            <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Onboarding Interns</span>
              {loading ? (
                <div className="py-1 flex items-center space-x-2 text-[#9A9A9A]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#FF8A00]" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-black text-[#0D0D0D]">{stats?.onboardingInterns?.total ?? 0} Interns</p>
                  <p className="text-xs text-blue-600 font-semibold">{stats?.onboardingInterns?.waitingInterview ?? 0} Waiting Interview</p>
                </>
              )}
            </div>

            <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Total Platform Active</span>
              {loading ? (
                <div className="py-1 flex items-center space-x-2 text-[#9A9A9A]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#FF8A00]" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-black text-[#0D0D0D]">{stats?.platformInterns?.total ?? 0} Interns</p>
                  <p className="text-xs text-emerald-600 font-semibold">Full Dashboard Unlocked</p>
                </>
              )}
            </div>
          </div>

          {/* Platform Controls & Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => setActiveTab('admins')}
              className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm hover:border-[#FF8A00] transition-all cursor-pointer space-y-3 group"
            >
              <div className="p-3 bg-[#FF8A00]/10 text-[#FF8A00] rounded-xl w-fit">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#0D0D0D] group-hover:text-[#FF8A00] transition-colors">Admin Management</h3>
              <p className="text-xs text-[#9A9A9A] leading-relaxed">
                Create new Admin accounts, toggle active/inactive status, and assign Problem Statements.
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('problem-statements')}
              className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm hover:border-[#FF8A00] transition-all cursor-pointer space-y-3 group"
            >
              <div className="p-3 bg-[#FF3D00]/10 text-[#FF3D00] rounded-xl w-fit">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#0D0D0D] group-hover:text-[#FF3D00] transition-colors">Problem Statements</h3>
              <p className="text-xs text-[#9A9A9A] leading-relaxed">
                Create, update, activate/deactivate Problem Statements and monitor assigned interns.
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('onboarding')}
              className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm hover:border-[#FF8A00] transition-all cursor-pointer space-y-3 group"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#0D0D0D] group-hover:text-blue-600 transition-colors">Onboarding Control Hub</h3>
              <p className="text-xs text-[#9A9A9A] leading-relaxed">
                Review, skip onboarding steps with reasons, schedule interviews, and unlock Intern Dashboards.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN MANAGEMENT TAB */}
      {activeTab === 'admins' && (
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-[#EDEDED] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0D0D0D]">Admin Management</h2>
              <p className="text-xs text-[#9A9A9A]">Create Admins, manage activation status, and allocate Problem Statements.</p>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-sm hover:opacity-95 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Create New Admin</span>
            </button>
          </div>

          <div className="space-y-3">
            {admins.map((adm) => (
              <div key={adm.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#0D0D0D]">{adm.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      adm.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#EDEDED] text-[#9A9A9A]'
                    }`}>
                      {adm.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#9A9A9A]">{adm.email}</p>
                  <p className="text-xs text-[#0D0D0D]">
                    Allocated Statements: <strong className="text-[#FF8A00]">{adm.problemStatements.join(', ') || 'None Allocated'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 bg-white border border-[#D4D4D4] text-xs font-semibold text-[#0D0D0D] rounded-lg hover:border-[#FF8A00]">
                    Edit Allocation
                  </button>
                  <button className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                    adm.status === 'Active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}>
                    {adm.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PROBLEM STATEMENT MANAGEMENT TAB */}
      {activeTab === 'problem-statements' && (
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-[#EDEDED] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0D0D0D]">Problem Statement Management</h2>
              <p className="text-xs text-[#9A9A9A]">Define, update, activate, and manage all Problem Statements.</p>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-sm hover:opacity-95 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Create Problem Statement</span>
            </button>
          </div>

          <div className="space-y-3">
            {problemStatements.map((ps) => (
              <div key={ps.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#0D0D0D]">{ps.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      ps.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#EDEDED] text-[#9A9A9A]'
                    }`}>
                      {ps.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#9A9A9A]">Slug: {ps.slug} | Active Interns: <strong className="text-[#0D0D0D]">{ps.internsCount}</strong></p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 bg-white border border-[#D4D4D4] text-xs font-semibold text-[#0D0D0D] rounded-lg hover:border-[#FF8A00]">
                    Edit
                  </button>
                  <button className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                    ps.status === 'Active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}>
                    {ps.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ONBOARDING CONTROL HUB TAB */}
      {activeTab === 'onboarding' && (
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-[#EDEDED] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0D0D0D]">Complete Onboarding Management</h2>
              <p className="text-xs text-[#9A9A9A]">Full ownership to review, skip steps with reason, schedule interview & allocate.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 text-[#FF3D00] rounded-full">
              Super Admin Overrides Active
            </span>
          </div>

          <div className="space-y-4">
            {onboardingInterns.map((intern) => (
              <div key={intern.id} className="p-5 bg-[#F7F7F7] border border-[#EDEDED] rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#EDEDED] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#0D0D0D]">{intern.name}</h3>
                    <p className="text-xs text-[#9A9A9A]">{intern.email} | Progress: <strong className="text-[#FF3D00]">{intern.progressPct}%</strong></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSkipModalIntern(intern)}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-sm hover:opacity-95 flex items-center gap-1.5"
                    >
                      <FastForward className="h-3.5 w-3.5" />
                      <span>Skip Step</span>
                    </button>
                  </div>
                </div>

                {/* Display Skipped Steps Info if any */}
                {intern.skippedSteps.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                    <p className="font-bold text-amber-800 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Step Override Log:
                    </p>
                    {intern.skippedSteps.map((sk, i) => (
                      <p key={i} className="text-amber-700">
                        • <strong>{sk.step}</strong>: Skipped by {sk.by} on {sk.date}. Reason: "{sk.reason}"
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skip Step Modal */}
      {skipModalIntern && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <h3 className="text-base font-bold text-[#0D0D0D]">Skip Onboarding Step</h3>
              <button onClick={() => setSkipModalIntern(null)} className="text-[#9A9A9A] hover:text-[#0D0D0D]">✕</button>
            </div>

            <p className="text-xs text-[#9A9A9A]">
              Skipping step for <strong className="text-[#0D0D0D]">{skipModalIntern.name}</strong>. Please select the step and provide a mandatory reason.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Select Step to Skip</label>
              <select
                value={skipStepName}
                onChange={(e) => setSkipStepName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D]"
              >
                <option value="Profile Completion">Profile Completion</option>
                <option value="Technical Questionnaire">Technical Questionnaire</option>
                <option value="Learning Setup">Learning Setup</option>
                <option value="Seven Mandatory Activities">Seven Mandatory Activities</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                Reason for Skipping <span className="text-[#FF3D00]">*</span>
              </label>
              <textarea
                rows={3}
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="Enter mandatory reason for skipping step (e.g. Prior verified skills)..."
                required
                className="w-full p-3 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSkipModalIntern(null)}
                className="px-4 py-2 bg-[#EDEDED] text-[#0D0D0D] font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!skipReason.trim()}
                onClick={handleSkipStep}
                className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                Confirm Skip Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
