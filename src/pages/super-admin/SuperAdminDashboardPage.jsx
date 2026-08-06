import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  Users, 
  BookOpen, 
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
  Info
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

  useEffect(() => {
    let mounted = true;
    loadDashboardStats(true);

    const unsubscribe = subscribeToSuperAdminDashboardChanges(() => {
      if (mounted) loadDashboardStats(false);
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
  }, [loadDashboardStats]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8A00]" />
        <p className="text-[#737373] text-sm font-semibold">Loading command center...</p>
      </div>
    );
  }

  // Real data metrics
  const activeAdmins = stats?.admins?.active || 0;
  const activeInterns = stats?.platformInterns?.active || 0;
  const activeProblemStatements = stats?.problemStatements?.active || 0;
  const pendingOnboarding = stats?.onboardingInterns?.total || 0;
  const waitingInterviews = stats?.onboardingInterns?.waitingInterview || 0;
  const publishedAnnouncements = stats?.announcements?.published || 0;
  const scheduledAnnouncements = stats?.announcements?.scheduled || 0;

  // Operational Overview Calculations
  const totalAdmins = stats?.admins?.total || 0;
  const adminCoveragePct = totalAdmins > 0 ? Math.round((activeAdmins / totalAdmins) * 100) : 0;
  
  const totalProblemStatements = stats?.problemStatements?.total || 0;
  const allocatedProblemStatements = stats?.problemStatements?.allocated || 0;
  const psUtilizationPct = totalProblemStatements > 0 ? Math.round((allocatedProblemStatements / totalProblemStatements) * 100) : 0;

  const currentDate = new Intl.DateTimeFormat('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }).format(new Date());

  return (
    <div className="space-y-6 pb-12 text-[#171717]">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-3">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Super Admin Command Center</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name || 'Super Admin'}</h1>
          <p className="text-sm text-[#737373] mt-1">{currentDate}</p>
        </div>
        
        {/* PLATFORM HEALTH */}
        <div className="flex flex-wrap items-center gap-3 bg-[#F7F7F7] p-3 rounded-xl border border-[#EDEDED]">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#EDEDED] rounded-lg shadow-sm">
            <Database className={`h-4 w-4 ${dbStatus === 'Connected' ? 'text-emerald-500' : 'text-red-500'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-[#9A9A9A] font-bold uppercase leading-none">Database</span>
              <span className="text-xs font-semibold leading-none mt-1">{dbStatus}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#EDEDED] rounded-lg shadow-sm">
            <UserCheck className={`h-4 w-4 ${session ? 'text-emerald-500' : 'text-red-500'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-[#9A9A9A] font-bold uppercase leading-none">Auth Session</span>
              <span className="text-xs font-semibold leading-none mt-1">{session ? 'Active' : 'Unavailable'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#EDEDED] rounded-lg shadow-sm">
            <Activity className={`h-4 w-4 ${realtimeStatus === 'Connected' ? 'text-emerald-500' : 'text-yellow-500'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-[#9A9A9A] font-bold uppercase leading-none">Realtime</span>
              <span className="text-xs font-semibold leading-none mt-1">{realtimeStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2 text-red-700 text-sm font-semibold">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadDashboardStats(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-md"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* KPI OVERVIEW */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">KPI Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <KpiCard icon={Users} label="Total Active Admins" value={activeAdmins} />
          <KpiCard icon={UserCheck} label="Total Active Interns" value={activeInterns} />
          <KpiCard icon={FolderOpen} label="Active Problem Statements" value={activeProblemStatements} />
          <KpiCard icon={UserPlus} label="Pending Onboarding" value={pendingOnboarding} />
          <KpiCard icon={Calendar} label="Waiting Interviews" value={waitingInterviews} />
          <KpiCard icon={Bell} label="Published Announcements" value={publishedAnnouncements} />
          <KpiCard icon={Clock} label="Scheduled Announcements" value={scheduledAnnouncements} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PRIORITY ACTIONS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold">Priority Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionCard 
              label="Pending Onboarding" 
              count={pendingOnboarding} 
              onClick={() => navigate('/super-admin/onboarding')}
              urgent={pendingOnboarding > 0}
            />
            <ActionCard 
              label="Waiting Interviews" 
              count={waitingInterviews} 
              onClick={() => navigate('/super-admin/onboarding/interview')}
              urgent={waitingInterviews > 0}
            />
            <ActionCard 
              label="Scheduled Announcements" 
              count={scheduledAnnouncements} 
              onClick={() => navigate('/super-admin/announcements')}
              urgent={scheduledAnnouncements > 0}
            />
          </div>
          
          <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-2xl flex items-start gap-3">
            <Info className="h-5 w-5 text-[#9A9A9A] shrink-0 mt-0.5" />
            <p className="text-sm text-[#737373] font-medium leading-relaxed">
              Additional operational metrics will appear here when their backend aggregation is connected.
            </p>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Quick Actions</h2>
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-2 shadow-sm flex flex-col gap-1">
            <QuickActionButton label="Admin Management" icon={Users} onClick={() => navigate('/super-admin/admins')} />
            <QuickActionButton label="Problem Statement Management" icon={FolderOpen} onClick={() => navigate('/super-admin/problem-statements')} />
            <QuickActionButton label="Onboarding Management" icon={UserPlus} onClick={() => navigate('/super-admin/onboarding')} />
            <QuickActionButton label="Announcement Management" icon={Bell} onClick={() => navigate('/super-admin/announcements')} />
            <QuickActionButton label="Attendance Operations" icon={CheckCircle2} onClick={() => navigate('/super-admin/operations/attendance')} />
          </div>
        </div>
      </div>

      {/* OPERATIONAL OVERVIEW */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Operational Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-bold text-[#737373]">Admin Coverage</span>
              <span className="text-2xl font-black text-[#171717]">{adminCoveragePct}%</span>
            </div>
            <div className="w-full bg-[#F5F5F5] h-3 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] h-full" style={{ width: `${adminCoveragePct}%` }} />
            </div>
            <div className="flex justify-between items-center mt-3 text-xs font-semibold text-[#9A9A9A]">
              <span>{activeAdmins} Active</span>
              <span>{totalAdmins} Total Registered</span>
            </div>
          </div>
          
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-bold text-[#737373]">Problem Statement Utilization</span>
              <span className="text-2xl font-black text-[#171717]">{psUtilizationPct}%</span>
            </div>
            <div className="w-full bg-[#F5F5F5] h-3 rounded-full overflow-hidden">
              <div className="bg-[#171717] h-full" style={{ width: `${psUtilizationPct}%` }} />
            </div>
            <div className="flex justify-between items-center mt-3 text-xs font-semibold text-[#9A9A9A]">
              <span>{allocatedProblemStatements} Allocated</span>
              <span>{totalProblemStatements} Total Created</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

// -------------------------------------------------------------
// Helper Components
// -------------------------------------------------------------

function KpiCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start gap-4">
      <div className="h-10 w-10 rounded-full bg-[#F7F7F7] border border-[#EDEDED] flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-[#FF8A00]" />
      </div>
      <div>
        <p className="text-2xl font-black leading-none mb-1 text-[#171717]">{value}</p>
        <p className="text-[11px] font-bold text-[#9A9A9A] uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function ActionCard({ label, count, onClick, urgent }) {
  return (
    <button 
      onClick={onClick}
      className={`group flex flex-col items-start justify-between p-5 rounded-2xl border text-left transition-all ${
        urgent 
          ? 'bg-gradient-to-br from-white to-orange-50/50 border-[#FF8A00]/30 shadow-sm hover:shadow-md hover:border-[#FF8A00]/60' 
          : 'bg-white border-[#EDEDED] hover:bg-[#F7F7F7]'
      }`}
    >
      <div className="w-full flex justify-between items-start mb-4">
        <span className="text-3xl font-black leading-none text-[#171717]">{count}</span>
        <ArrowRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${urgent ? 'text-[#FF8A00]' : 'text-[#737373]'}`} />
      </div>
      <span className={`text-sm font-bold ${urgent ? 'text-[#171717]' : 'text-[#737373]'}`}>{label}</span>
    </button>
  );
}

function QuickActionButton({ label, icon: Icon, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 hover:bg-[#F7F7F7] rounded-xl transition-colors text-left group"
    >
      <div className="h-8 w-8 rounded-lg bg-white border border-[#EDEDED] shadow-sm flex items-center justify-center shrink-0 group-hover:border-[#FF8A00]/50 transition-colors">
        <Icon className="h-4 w-4 text-[#737373] group-hover:text-[#FF8A00] transition-colors" />
      </div>
      <span className="text-sm font-bold text-[#171717]">{label}</span>
    </button>
  );
}
