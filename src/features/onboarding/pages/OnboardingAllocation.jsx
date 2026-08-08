import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { updateOnboardingStepProgress, calculateCompletionPercentage } from '../../../utils/onboardingUtils';
import { 
  Briefcase, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Layers,
  FileCheck,
  Building2,
  Loader2,
  AlertCircle
} from 'lucide-react';

export function OnboardingAllocation() {
  const navigate = useNavigate();
  const { user, profile, onboardingProgress, refreshUserData } = useAuth();

  const [problemStatement, setProblemStatement] = useState(null);
  const [assignedAdmin, setAssignedAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState(null);

  const progressPercent = calculateCompletionPercentage(onboardingProgress);

  useEffect(() => {
    async function fetchAllocationDetails() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch problem statement if assigned to intern
        const psId = profile?.problem_statement_id;

        if (psId) {
          const { data: psData, error: psErr } = await supabase
            .from('problem_statements')
            .select('*')
            .eq('id', psId)
            .maybeSingle();

          if (!psErr && psData) {
            setProblemStatement(psData);

            // Fetch assigned admin details if admin_id exists on problem statement or user_roles
            if (psData.assigned_admin_id) {
              const { data: adminProfile } = await supabase
                .from('profiles')
                .select('full_name, email, role')
                .eq('id', psData.assigned_admin_id)
                .maybeSingle();

              if (adminProfile) setAssignedAdmin(adminProfile);
            }
          }
        }
      } catch (err) {
        console.error('Error loading allocation details:', err);
        setError('Unable to load allocation details.');
      } finally {
        setLoading(false);
      }
    }

    fetchAllocationDetails();
  }, [user, profile]);

  const handleActivateInternship = async () => {
    if (!user) return;
    setActivating(true);
    setError(null);

    try {
      // 1. Update onboarding_progress boolean flag
      await updateOnboardingStepProgress(user.id, {
        problem_statement_allocated: true,
      });

      // 2. Update profile onboarding_status & account_status
      await supabase
        .from('profiles')
        .update({
          onboarding_status: 'completed',
          account_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // 3. Refresh user context
      if (refreshUserData) {
        await refreshUserData();
      }

      // 4. Redirect to Intern Dashboard
      navigate('/intern/dashboard', { replace: true });
    } catch (err) {
      console.error('Error activating internship:', err);
      setError(err?.message || 'Failed to activate internship. Please try again.');
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-[#FF3D00] animate-spin" />
        <p className="text-xs font-semibold text-[#9A9A9A]">Loading allocation status...</p>
      </div>
    );
  }

  const isAllocated = Boolean(problemStatement || profile?.problem_statement_id);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* HEADER & PROGRESS BAR */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Onboarding Step 6 of 6 — Final Activation</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0D0D0D]">Problem Statement & Activation</h1>
            <p className="text-xs text-[#9A9A9A] mt-1">
              Review your allocated Problem Statement and activate your official internship.
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-xs font-bold text-[#9A9A9A]">Overall Progress</span>
            <div className="text-xl font-extrabold text-[#0D0D0D]">{progressPercent}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#F3F3F3] rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FF3D00]/10 border border-[#FF3D00]/20 rounded-xl flex items-center gap-3 text-xs font-semibold text-[#FF3D00]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STATUS CONTENT */}
      {isAllocated ? (
        /* ALLOCATED STATE */
        <div className="space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-emerald-800 space-y-2">
            <div className="flex items-center gap-2.5 font-bold text-sm text-emerald-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Problem Statement Allocated & Ready</span>
            </div>
            <p className="text-xs leading-relaxed text-emerald-700">
              Congratulations! Super Admin has reviewed your questionnaire and interview responses and successfully allocated your internship Problem Statement.
            </p>
          </div>

          {/* PROBLEM STATEMENT CARD */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#FF8A00]/10 to-[#FF3D00]/10 rounded-xl text-[#FF3D00]">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9A9A9A]">Allocated Problem Statement</span>
                <h3 className="text-lg font-bold text-[#0D0D0D]">
                  {problemStatement?.title || profile?.problem_statement_title || 'Assigned Problem Statement'}
                </h3>
              </div>
            </div>

            {problemStatement?.description && (
              <p className="text-xs text-[#555] leading-relaxed border-t border-[#F3F3F3] pt-4">
                {problemStatement.description}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-[#F9F9F9] rounded-xl border border-[#EDEDED]">
                <span className="text-[#9A9A9A] text-[10px] font-bold block">Domain / Track</span>
                <span className="font-semibold text-[#0D0D0D]">{problemStatement?.category || 'AI & Software Engineering'}</span>
              </div>
              <div className="p-3 bg-[#F9F9F9] rounded-xl border border-[#EDEDED]">
                <span className="text-[#9A9A9A] text-[10px] font-bold block">Assigned Admin</span>
                <span className="font-semibold text-[#0D0D0D]">{assignedAdmin?.full_name || 'Admin Team'}</span>
              </div>
              <div className="p-3 bg-[#F9F9F9] rounded-xl border border-[#EDEDED]">
                <span className="text-[#9A9A9A] text-[10px] font-bold block">Status</span>
                <span className="font-semibold text-emerald-600">Active Allocation</span>
              </div>
            </div>
          </div>

          {/* ACTIVATION CTA */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm text-center space-y-4">
            <h3 className="text-base font-bold text-[#0D0D0D]">Ready to Launch Your Internship?</h3>
            <p className="text-xs text-[#9A9A9A] max-w-md mx-auto">
              Click below to finalize your onboarding process and activate your full Intern Portal Dashboard access.
            </p>
            <button
              onClick={handleActivateInternship}
              disabled={activating}
              className="px-8 py-3.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#FF3D00]/25 hover:opacity-95 transition-all inline-flex items-center gap-2 disabled:opacity-50"
            >
              {activating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Activating Internship...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  <span>Activate Internship & Open Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* PENDING ALLOCATION STATE */
        <div className="space-y-6">
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-8 shadow-sm text-center space-y-5">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-xl font-bold text-[#0D0D0D]">Allocation & Review Pending</h2>
              <p className="text-xs text-[#777] leading-relaxed">
                You have completed all preliminary onboarding steps (Profile, Questionnaire, LMS, Activities & Interview). 
                The Super Admin and Admin team are currently reviewing your profile to assign you the best Problem Statement.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto pt-4 border-t border-[#EDEDED]">
              <div className="p-3 bg-[#F9F9F9] rounded-xl border border-[#EDEDED] flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-[#9A9A9A] block">Questionnaire</span>
                  <span className="text-xs font-semibold text-emerald-700">Submitted</span>
                </div>
              </div>
              <div className="p-3 bg-[#F9F9F9] rounded-xl border border-[#EDEDED] flex items-center gap-3">
                <Layers className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-[#9A9A9A] block">7 Activities</span>
                  <span className="text-xs font-semibold text-emerald-700">Completed</span>
                </div>
              </div>
              <div className="p-3 bg-[#F9F9F9] rounded-xl border border-[#EDEDED] flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-[#9A9A9A] block">Admin Review</span>
                  <span className="text-xs font-semibold text-amber-700">In Progress</span>
                </div>
              </div>
            </div>

            {/* TEMP DEV ACTIVATION OVERRIDE */}
            <div className="pt-6 border-t border-[#EDEDED]">
              <p className="text-[11px] text-[#9A9A9A] mb-3">
                (Development Mode: You can complete onboarding to preview the Intern Dashboard anytime)
              </p>
              <button
                onClick={handleActivateInternship}
                disabled={activating}
                className="px-6 py-2.5 bg-[#0D0D0D] text-white font-semibold text-xs rounded-xl hover:bg-[#222] transition-colors inline-flex items-center gap-2"
              >
                {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                <span>Bypass Allocation & Complete Onboarding</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
