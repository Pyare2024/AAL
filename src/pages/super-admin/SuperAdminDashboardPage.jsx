import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  Users, 
  UserCheck, 
  Bell, 
  Clock, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Database,
  Activity,
  UserPlus,
  FolderOpen,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Sliders,
  Layers,
  Sparkles,
  Search,
  Filter,
  Check,
  Zap,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  fetchSuperAdminDashboardStats, 
  subscribeToSuperAdminDashboardChanges 
} from '../../services/superAdminDashboardService';

export function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { profile, session } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [realtimeStatus, setRealtimeStatus] = useState('Connecting...');

  // Live Audit Logs stream state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);

  // Search filter for Quick Command / Candidates
  const [searchQuery, setSearchQuery] = useState('');

  const loadDashboardStats = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    setDbStatus('Checking...');
    try {
      const data = await fetchSuperAdminDashboardStats();
      setStats(data);
      setDbStatus('Connected');
    } catch (err) {
      console.error('Error fetching Super Admin Dashboard stats:', err);
      setError(err.message || 'Failed to fetch dashboard metrics.');
      setDbStatus('Unavailable');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Fetch real audit logs from Supabase
  const loadAuditLogs = useCallback(async () => {
    try {
      setAuditLoading(true);
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (logs) setAuditLogs(logs);
    } catch (err) {
      console.warn('Note on audit log fetch:', err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadDashboardStats(true);
    loadAuditLogs();

    const unsubscribe = subscribeToSuperAdminDashboardChanges(() => {
      if (mounted) {
        loadDashboardStats(false);
        loadAuditLogs();
      }
    });

    const channel = supabase.channel('realtime-health-check');
    channel.subscribe((status) => {
      if (mounted) {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('Connected');
        } else {
          setRealtimeStatus('Unavailable');
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [loadDashboardStats, loadAuditLogs]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-[#F7F7F7]">
        <div className="p-5 bg-white rounded-xl border border-[#EDEDED] shadow-xs flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#FF3D00]" />
          <span className="text-xs font-bold text-[#171717] tracking-wider uppercase font-mono">Initializing APEX Command Center...</span>
        </div>
      </div>
    );
  }

  // Real database metrics from backend service
  const activeAdmins = stats?.admins?.active || 0;
  const totalAdmins = stats?.admins?.total || 0;
  const activeInterns = stats?.platformInterns?.active || 0;
  const activeProblemStatements = stats?.problemStatements?.active || 0;
  const totalProblemStatements = stats?.problemStatements?.total || 0;
  const allocatedProblemStatements = stats?.problemStatements?.allocated || 0;
  const pendingOnboarding = stats?.onboardingInterns?.total || 0;
  const waitingInterviews = stats?.onboardingInterns?.waitingInterview || 0;
  const publishedAnnouncements = stats?.announcements?.published || 0;
  const scheduledAnnouncements = stats?.announcements?.scheduled || 0;

  // Operational Overview Calculations
  const adminCoveragePct = totalAdmins > 0 ? Math.round((activeAdmins / totalAdmins) * 100) : 0;
  const psUtilizationPct = totalProblemStatements > 0 ? Math.round((allocatedProblemStatements / totalProblemStatements) * 100) : 0;

  // Onboarding Funnel breakdown calculated strictly from existing candidate list
  const onboardingList = stats?.onboardingInterns?.list || [];
  const funnelProfile = onboardingList.filter(i => i.profileCompleted).length;
  const funnelQuestionnaire = onboardingList.filter(i => i.questionnaireCompleted).length;
  const funnelLearning = onboardingList.filter(i => i.learningCompleted).length;
  const funnelActivities = onboardingList.filter(i => i.activitiesCompleted).length;
  const funnelInterview = onboardingList.filter(i => i.interviewCompleted).length;
  const funnelAllocated = onboardingList.filter(i => i.allocatedPS).length;

  // Filter candidate list for Recent Interns Table
  const filteredCandidates = onboardingList.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentDate = new Intl.DateTimeFormat('en-US', { 
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  }).format(new Date());

  return (
    <div className="space-y-6 pb-12 text-[#171717] bg-[#F7F7F7] min-h-screen animate-fade-in font-sans">
      {/* 1. HEADER / COMMAND BAR */}
      <div className="bg-[#171717] text-white rounded-xl p-4 sm:p-5 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FF3D00] text-white rounded-lg shadow-xs shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-[#FF3D00] uppercase font-mono">APEX ECOSYSTEM CONTROL ROOM</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF3D00] animate-ping" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              SUPER ADMIN COMMAND CENTER
            </h1>
          </div>
        </div>

        {/* Command Search */}
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#737373]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates or commands..."
            className="w-full bg-[#262626] border border-[#404040] text-xs text-white placeholder-[#737373] rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-[#FF3D00] transition-colors"
          />
        </div>

        {/* System & Identity Badge */}
        <div className="flex items-center gap-3 text-xs font-semibold text-[#A3A3A3] w-full xl:w-auto justify-between xl:justify-end">
          <span className="font-mono text-[11px]">{currentDate}</span>
          <div className="h-4 w-px bg-[#404040]" />
          <span className="text-white font-bold">{profile?.full_name || 'Super Admin'}</span>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 text-red-700 text-xs font-bold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadDashboardStats(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* 2. COMPACT SYSTEM STATUS STRIP */}
      <div className="bg-white border border-[#EDEDED] rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="font-black text-[#171717] uppercase tracking-wider">SYSTEM STATUS:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-semibold">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dbStatus === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-[#737373]">DATABASE</span>
            <span className="font-bold text-[#171717]">{dbStatus}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${realtimeStatus === 'Connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-[#737373]">REALTIME</span>
            <span className="font-bold text-[#171717]">{realtimeStatus}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${session ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-[#737373]">AUTH</span>
            <span className="font-bold text-[#171717]">{session ? 'Active' : 'Unavailable'}</span>
          </div>

          <div className="h-4 w-px bg-[#EDEDED] hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-[#737373]">ACTIVE ADMINS:</span>
            <span className="font-extrabold text-[#171717] font-mono">{activeAdmins}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#737373]">ACTIVE INTERNS:</span>
            <span className="font-extrabold text-[#171717] font-mono">{activeInterns}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#FF3D00]/10 px-2 py-0.5 rounded text-[#FF3D00]">
            <span className="font-bold">PENDING ACTIONS:</span>
            <span className="font-black font-mono">{pendingOnboarding + waitingInterviews}</span>
          </div>
        </div>
      </div>

      {/* 3 & 4. MAIN FEATURE SPLIT: ONBOARDING FUNNEL & LIVE ACTIVITY STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. INTERNSHIP ONBOARDING FUNNEL (2 COLS) */}
        <div className="lg:col-span-2 bg-white border border-[#EDEDED] rounded-xl p-5 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#FF3D00]" />
                <h2 className="text-xs font-black text-[#171717] uppercase tracking-wider">
                  Internship Onboarding Conversion Funnel
                </h2>
              </div>
              <p className="text-[11px] text-[#737373] mt-0.5">
                Visualizing intern candidate progression across all 6 onboarding stages
              </p>
            </div>
            <span className="text-xs font-extrabold font-mono text-[#FF3D00] bg-[#FF3D00]/10 px-2.5 py-1 rounded-md">
              {pendingOnboarding} Total Candidates
            </span>
          </div>

          <div className="space-y-3 py-2">
            <FunnelBar label="Profile Completion" count={funnelProfile} max={pendingOnboarding || 1} />
            <FunnelBar label="Technical Questionnaire" count={funnelQuestionnaire} max={pendingOnboarding || 1} />
            <FunnelBar label="Simple LMS Learning" count={funnelLearning} max={pendingOnboarding || 1} />
            <FunnelBar label="7 Mandatory Activities" count={funnelActivities} max={pendingOnboarding || 1} />
            <FunnelBar label="Interview Evaluation" count={funnelInterview} max={pendingOnboarding || 1} isBottleneck={waitingInterviews > 0} />
            <FunnelBar label="Problem Statement Allocation" count={funnelAllocated} max={pendingOnboarding || 1} />
          </div>

          {/* 5. HORIZONTAL PIPELINE STEPPER */}
          <div className="pt-4 border-t border-[#EDEDED]">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-3 font-mono">ONBOARDING STAGE PIPELINE</span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[10px] font-bold">
              <div className="p-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-lg">
                <span className="text-[#737373] block">1. Profile</span>
                <span className="text-[#171717] font-mono text-xs">{funnelProfile}</span>
              </div>
              <div className="p-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-lg">
                <span className="text-[#737373] block">2. Quiz</span>
                <span className="text-[#171717] font-mono text-xs">{funnelQuestionnaire}</span>
              </div>
              <div className="p-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-lg">
                <span className="text-[#737373] block">3. LMS</span>
                <span className="text-[#171717] font-mono text-xs">{funnelLearning}</span>
              </div>
              <div className="p-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-lg">
                <span className="text-[#737373] block">4. Activities</span>
                <span className="text-[#171717] font-mono text-xs">{funnelActivities}</span>
              </div>
              <div className={`p-2 border rounded-lg ${waitingInterviews > 0 ? 'bg-orange-50 border-[#FF3D00]/40 text-[#FF3D00]' : 'bg-[#F7F7F7] border-[#EDEDED]'}`}>
                <span className="block">5. Interview</span>
                <span className="font-mono text-xs">{funnelInterview}</span>
              </div>
              <div className="p-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-lg">
                <span className="text-[#737373] block">6. Allocated</span>
                <span className="text-[#171717] font-mono text-xs">{funnelAllocated}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. LIVE ACTIVITY TIMELINE (1 COL) */}
        <div className="bg-white border border-[#EDEDED] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#FF3D00]" />
              <h2 className="text-xs font-black text-[#171717] uppercase tracking-wider">
                Live Audit Activity Stream
              </h2>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
            {auditLoading ? (
              <div className="py-12 text-center text-xs text-[#737373]">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#FF3D00]" />
                Loading audit trail stream...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#737373] space-y-1">
                <FileText className="h-6 w-6 mx-auto text-[#D4D4D4]" />
                <p className="font-bold text-[#171717]">No audit log activity recorded yet.</p>
                <p className="text-[11px]">System events will appear here live when actions occur.</p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs border-b border-[#F5F5F5] pb-2.5 last:border-0">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[#FF3D00] shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-[#171717] truncate">{log.action || 'System Event'}</p>
                    <p className="text-[10px] text-[#737373] font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-[#EDEDED] text-[11px] text-[#737373] flex justify-between items-center">
            <span>Audit Trail Engine</span>
            <span className="font-mono font-bold text-[#171717]">{auditLogs.length} Events Logged</span>
          </div>
        </div>
      </div>

      {/* 6. OPERATIONAL ATTENTION REQUIRED & QUICK TOOLBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ATTENTION REQUIRED (2 COLS) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#FF3D00]" />
            <h2 className="text-xs font-black text-[#171717] uppercase tracking-wider">
              Operational Priority List — Attention Required
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <AttentionTask 
              title="Pending Onboarding"
              count={pendingOnboarding}
              desc="Candidates active in onboarding funnel"
              onClick={() => navigate('/super-admin/onboarding')}
              urgent={pendingOnboarding > 0}
            />
            <AttentionTask 
              title="Waiting Interviews"
              count={waitingInterviews}
              desc="Candidates awaiting interview evaluation"
              onClick={() => navigate('/super-admin/onboarding/interview')}
              urgent={waitingInterviews > 0}
            />
            <AttentionTask 
              title="Scheduled Announcements"
              count={scheduledAnnouncements}
              desc="Upcoming platform system announcements"
              onClick={() => navigate('/super-admin/announcements')}
              urgent={scheduledAnnouncements > 0}
            />
          </div>
        </div>

        {/* 12. COMPACT QUICK ACTION TOOLBAR (1 COL) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#FF3D00]" />
            <h2 className="text-xs font-black text-[#171717] uppercase tracking-wider">
              Quick Action Toolbar
            </h2>
          </div>
          <div className="bg-white border border-[#EDEDED] rounded-xl p-2 shadow-xs grid grid-cols-1 gap-1">
            <QuickToolbarBtn label="Admin Management" icon={Users} onClick={() => navigate('/super-admin/admins')} />
            <QuickToolbarBtn label="Problem Statement Management" icon={FolderOpen} onClick={() => navigate('/super-admin/problem-statements')} />
            <QuickToolbarBtn label="Onboarding Management" icon={UserPlus} onClick={() => navigate('/super-admin/onboarding')} />
            <QuickToolbarBtn label="Announcement Management" icon={Bell} onClick={() => navigate('/super-admin/announcements')} />
            <QuickToolbarBtn label="Attendance Operations" icon={CheckCircle2} onClick={() => navigate('/super-admin/operations/attendance')} />
          </div>
        </div>
      </div>

      {/* 8 & 11. PROBLEM STATEMENT UTILIZATION & ADMIN COVERAGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Problem Statement Utilization */}
        <div className="bg-white border border-[#EDEDED] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
            <h3 className="text-xs font-black text-[#171717] uppercase tracking-wider">
              Problem Statement Project Utilization
            </h3>
            <span className="text-xs font-bold font-mono text-[#FF3D00]">{psUtilizationPct}%</span>
          </div>
          <div className="space-y-2">
            <div className="w-full bg-[#EDEDED] h-3 rounded-full overflow-hidden p-0.5">
              <div 
                className="bg-[#171717] h-full rounded-full transition-all duration-1000" 
                style={{ width: `${psUtilizationPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-semibold text-[#737373]">
              <span>{allocatedProblemStatements} Allocated Projects</span>
              <span>{totalProblemStatements} Total Created</span>
            </div>
          </div>
        </div>

        {/* Admin Coverage */}
        <div className="bg-white border border-[#EDEDED] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
            <h3 className="text-xs font-black text-[#171717] uppercase tracking-wider">
              Admin Coverage & Active Engagement
            </h3>
            <span className="text-xs font-bold font-mono text-[#FF3D00]">{adminCoveragePct}%</span>
          </div>
          <div className="space-y-2">
            <div className="w-full bg-[#EDEDED] h-3 rounded-full overflow-hidden p-0.5">
              <div 
                className="bg-[#FF3D00] h-full rounded-full transition-all duration-1000" 
                style={{ width: `${adminCoveragePct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-semibold text-[#737373]">
              <span>{activeAdmins} Active Admins</span>
              <span>{totalAdmins} Total Registered</span>
            </div>
          </div>
        </div>
      </div>

      {/* 9. RECENT INTERNS CANDIDATES DATA TABLE */}
      <div className="bg-white border border-[#EDEDED] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#EDEDED] pb-3">
          <div>
            <h3 className="text-xs font-black text-[#171717] uppercase tracking-wider">
              Active Onboarding Candidates Directory
            </h3>
            <p className="text-[11px] text-[#737373]">Real candidate records retrieved from database</p>
          </div>
          <span className="text-xs font-bold font-mono text-[#171717] bg-[#F7F7F7] px-2.5 py-1 rounded border border-[#EDEDED]">
            {filteredCandidates.length} Candidates Listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EDEDED] bg-[#F7F7F7] text-[#737373] uppercase text-[10px] font-black">
                <th className="p-3">Candidate Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Current Onboarding Stage</th>
                <th className="p-3 text-center">Progress %</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#737373] text-xs font-medium">
                    No onboarding candidate records found.
                  </td>
                </tr>
              ) : (
                filteredCandidates.slice(0, 10).map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-[#F7F7F7] transition-colors">
                    <td className="p-3 font-bold text-[#171717]">{candidate.name}</td>
                    <td className="p-3 text-[#737373] font-mono">{candidate.email}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-[#F7F7F7] border border-[#EDEDED] font-semibold text-[#171717] rounded-md text-[11px]">
                        {candidate.currentStep}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-[#FF3D00]">
                      {candidate.progressPct}%
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate('/super-admin/onboarding')}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF3D00] hover:underline"
                      >
                        <span>Manage</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Component Visual Helpers
// -------------------------------------------------------------

function FunnelBar({ label, count, max, isBottleneck }) {
  const pct = max > 0 ? Math.min(100, Math.round((count / max) * 100)) : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className={`font-bold ${isBottleneck ? 'text-[#FF3D00]' : 'text-[#171717]'}`}>
          {label} {isBottleneck && <span className="text-[10px] bg-[#FF3D00]/10 text-[#FF3D00] px-1.5 py-0.5 rounded font-mono ml-1">Bottleneck</span>}
        </span>
        <span className="font-mono font-bold text-[#171717]">{count}</span>
      </div>
      <div className="w-full bg-[#EDEDED] h-4 rounded-md overflow-hidden p-0.5">
        <div 
          className={`h-full rounded transition-all duration-1000 ${isBottleneck ? 'bg-[#FF3D00]' : 'bg-[#171717]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AttentionTask({ title, count, desc, onClick, urgent }) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all hover:translate-x-0.5 ${
        urgent 
          ? 'bg-white border-[#FF3D00]/40 shadow-xs hover:border-[#FF3D00]' 
          : 'bg-white border-[#EDEDED] hover:border-[#9A9A9A]'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="text-2xl font-black font-mono text-[#171717]">{count}</span>
        <div className={`p-1.5 rounded-md ${urgent ? 'bg-[#FF3D00]/10 text-[#FF3D00]' : 'bg-[#F7F7F7] text-[#737373]'}`}>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
      <div>
        <span className="text-xs font-extrabold text-[#171717] block">{title}</span>
        <span className="text-[11px] text-[#737373] font-medium leading-tight block mt-0.5">{desc}</span>
      </div>
    </button>
  );
}

function QuickToolbarBtn({ label, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors text-left group"
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-[#737373] group-hover:text-[#FF3D00] transition-colors" />
        <span className="text-xs font-bold text-[#171717] group-hover:text-[#FF3D00] transition-colors">{label}</span>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-[#A3A3A3] group-hover:text-[#171717] transition-colors" />
    </button>
  );
}

