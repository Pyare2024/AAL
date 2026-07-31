import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { calculateCompletionPercentage, isOnboardingCompleted } from '../../../utils/onboardingUtils';
import { 
  Calendar, 
  Clock, 
  Video, 
  CheckCircle2, 
  Hourglass, 
  FileText,
  Lock,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  User,
  ShieldCheck
} from 'lucide-react';

export function OnboardingInterview() {
  const navigate = useNavigate();
  const { user, profile, onboardingProgress } = useAuth();

  const [interviewData, setInterviewData] = useState(null);
  const [problemStatementData, setProblemStatementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch Interview Record for authenticated intern
        const { data: iData } = await supabase
          .from('interviews')
          .select('*')
          .eq('intern_id', user.id)
          .maybeSingle();

        if (iData) setInterviewData(iData);

        // 2. Fetch Allocated Problem Statement details if assigned
        const psIdToFetch = profile?.problem_statement_id;
        if (psIdToFetch) {
          const { data: psData } = await supabase
            .from('problem_statements')
            .select('*')
            .eq('id', psIdToFetch)
            .maybeSingle();

          if (psData) setProblemStatementData(psData);
        }
      } catch (err) {
        console.error('Error fetching interview or allocation status:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Supabase Realtime Listener for instant UI update when Super Admin allocates Problem Statement
    if (user) {
      const channel = supabase
        .channel(`intern-allocation-realtime-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'interviews', filter: `intern_id=eq.${user.id}` },
          () => loadData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'onboarding_progress', filter: `intern_id=eq.${user.id}` },
          () => loadData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          () => loadData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  const completionPercentage = calculateCompletionPercentage(onboardingProgress);

  // Status flags
  const rawStatus = interviewData?.status ? String(interviewData.status).toLowerCase() : 'pending';
  const isScheduled = rawStatus === 'scheduled';
  const isCompleted = rawStatus === 'completed' || !!onboardingProgress?.interview_completed;
  const isRejected = rawStatus === 'rejected';
  const isOnHold = rawStatus === 'on hold' || rawStatus === 'onhold';
  const isPending = !interviewData || rawStatus === 'pending';

  const isAllocated = !!onboardingProgress?.problem_statement_allocated || profile?.onboarding_status === 'problem_statement_allocated' || profile?.onboarding_status === 'completed';

  const handleCopyLink = () => {
    if (interviewData?.meeting_link) {
      navigator.clipboard.writeText(interviewData.meeting_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = interviewData?.scheduled_at
    ? new Date(interviewData.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  const formattedTime = interviewData?.scheduled_at
    ? new Date(interviewData.scheduled_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      {/* Stepper Header */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-[#FF3D00] uppercase tracking-wider">Step 5 of 5</span>
            <h1 className="text-xl font-bold text-[#0D0D0D]">Interview & Problem Statement Allocation</h1>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 text-[#FF3D00] rounded-full">
            {completionPercentage}% Complete
          </span>
        </div>
        <div className="w-full bg-[#EDEDED] h-2 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] h-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* PHASE 4: GREEN SUCCESS CARD WHEN ALLOCATED */}
      {isAllocated ? (
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-sm shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-extrabold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                Status: Problem Statement Allocated
              </span>
              <h3 className="text-base font-bold text-emerald-950">Congratulations!</h3>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Your onboarding has been completed successfully. Your Problem Statement has been allocated. You can now start your Internship Journey and access Advanced LMS content.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">Allocated Internship Details</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-[#EDEDED]">
                <span className="text-[#9A9A9A] font-semibold">Problem Statement</span>
                <strong className="text-[#0D0D0D] font-bold text-right">{problemStatementData?.title || 'AI Automated Workflow & Intelligent Data Pipeline Engine'}</strong>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-[#EDEDED]">
                <span className="text-[#9A9A9A] font-semibold">Assigned Admin</span>
                <strong className="text-[#0D0D0D] font-bold">Super Admin Allocated</strong>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-[#EDEDED]">
                <span className="text-[#9A9A9A] font-semibold">Allocation Date</span>
                <strong className="text-[#0D0D0D] font-bold">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* CASE 1: INTERVIEW PENDING (NOT SCHEDULED YET) */}
          {isPending && (
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-start gap-4 p-5 bg-[#F7F7F7] border border-[#EDEDED] rounded-2xl">
                <div className="p-3.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-2xl shadow-sm shrink-0">
                  <Hourglass className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full">
                      Status: Pending
                    </span>
                    <span className="text-xs text-[#9A9A9A] font-semibold">Waiting for Super Admin</span>
                  </div>
                  <h3 className="text-base font-bold text-[#0D0D0D]">Your Onboarding Interview is Pending Schedule</h3>
                  <p className="text-xs text-[#9A9A9A] leading-relaxed">
                    Your onboarding interview has not yet been scheduled. The Super Admin will send your interview details to your registered email address.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider block">Registered Email</span>
                  <span className="text-sm font-bold text-[#0D0D0D] font-mono">{profile?.email || user?.email}</span>
                </div>
                <span className="px-3 py-1 bg-white border border-[#EDEDED] text-xs font-bold text-[#FF8A00] rounded-lg">
                  Waiting for Super Admin
                </span>
              </div>
            </div>
          )}

          {/* CASE 2: INTERVIEW SCHEDULED */}
          {isScheduled && (
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
                <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-sm shrink-0">
                  <Video className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded-full">
                      Status: Scheduled
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0D0D0D]">Interview Scheduled & Ready</h3>
                  <p className="text-xs text-[#9A9A9A] leading-relaxed">
                    Please review your meeting link, date, time, and instructions below. Click "Join Interview" at your scheduled time.
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#9A9A9A]">
                    <Calendar className="h-4 w-4 text-[#FF8A00]" />
                    <span>Interview Date</span>
                  </div>
                  <p className="text-sm font-bold text-[#0D0D0D]">{formattedDate}</p>
                </div>

                <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#9A9A9A]">
                    <Clock className="h-4 w-4 text-[#FF8A00]" />
                    <span>Interview Time</span>
                  </div>
                  <p className="text-sm font-bold text-[#0D0D0D]">{formattedTime}</p>
                </div>

                <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#9A9A9A]">
                    <Video className="h-4 w-4 text-[#FF3D00]" />
                    <span>Meeting Platform</span>
                  </div>
                  <p className="text-sm font-bold text-[#0D0D0D]">Google Meet / External Video Link</p>
                </div>

                <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#9A9A9A]">
                    <User className="h-4 w-4 text-blue-600" />
                    <span>Interviewer Name</span>
                  </div>
                  <p className="text-sm font-bold text-[#0D0D0D]">Super Admin Evaluator</p>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#9A9A9A]">
                  <FileText className="h-4 w-4 text-[#FF8A00]" />
                  <span>Instructions</span>
                </div>
                <p className="text-xs text-[#0D0D0D] leading-relaxed">
                  {interviewData?.feedback || 'Please be prepared to present your 7 activities submission folder during the call.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={interviewData?.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Video className="h-4 w-4" />
                  <span>Join Interview</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-3 px-4 bg-white border border-[#D4D4D4] hover:border-[#FF8A00] text-[#0D0D0D] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-[#9A9A9A]" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Meeting Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* CASE 3: INTERVIEW COMPLETED / PASSED */}
          {isCompleted && !isAllocated && (
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-sm shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    Status: Interview Completed
                  </span>
                  <h3 className="text-base font-bold text-emerald-950">Interview Completed</h3>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Your interview evaluation has been marked Completed by Super Admin.
                  </p>
                  <p className="text-xs font-bold text-emerald-900 mt-1">
                    Waiting for Problem Statement Allocation
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CASE 4: INTERVIEW REJECTED */}
          {isRejected && (
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-200 rounded-2xl">
                <div className="p-3.5 bg-red-600 text-white rounded-2xl shadow-sm shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full">
                    Status: Rejected
                  </span>
                  <h3 className="text-base font-bold text-red-950">Application Status Update</h3>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Your onboarding evaluation was not approved. Dashboard access remains locked. Please contact support or your admin.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CASE 5: INTERVIEW ON HOLD */}
          {isOnHold && (
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="p-3.5 bg-amber-600 text-white rounded-2xl shadow-sm shrink-0">
                  <Hourglass className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                    Status: On Hold
                  </span>
                  <h3 className="text-base font-bold text-amber-950">Interview On Hold</h3>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Your interview status is currently on hold. Super Admin evaluation is pending.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Read-Only Problem Statement Allocation Card */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">
              Problem Statement Allocation Status
            </h4>
            <div className="flex items-center justify-between p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl">
              <div>
                <span className="text-xs font-bold text-[#0D0D0D] block">
                  {problemStatementData?.title || (profile?.problem_statement_id ? 'Allocated' : 'Awaiting Problem Statement Allocation Phase')}
                </span>
                {problemStatementData?.description && (
                  <span className="text-[11px] text-[#9A9A9A] line-clamp-1 mt-0.5">{problemStatementData.description}</span>
                )}
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-[#EDEDED] text-[#0D0D0D] rounded-lg">
                {profile?.problem_statement_id ? 'Allocated' : 'Pending'}
              </span>
            </div>
          </div>
        </>
      )}

      {/* PHASE 5: UNLOCK DASHBOARD ACTION FOOTER */}
      <div className="p-4 bg-white border border-[#EDEDED] rounded-2xl shadow-sm flex items-center justify-between">
        <p className="text-xs font-semibold text-[#9A9A9A] flex items-center gap-2">
          {isAllocated ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-[#0D0D0D] font-bold">Onboarding Complete! Dashboard Unlocked</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 text-[#FF3D00]" />
              <span>Dashboard Access Locked until Problem Statement Allocation</span>
            </>
          )}
        </p>
        
        {isAllocated ? (
          <button
            type="button"
            onClick={() => navigate('/intern/dashboard')}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Internship Dashboard</span>
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="px-5 py-2.5 bg-[#EDEDED] text-[#9A9A9A] font-semibold text-xs rounded-xl cursor-not-allowed opacity-60 flex items-center gap-1.5"
          >
            <span>Dashboard Locked</span>
            <Lock className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
