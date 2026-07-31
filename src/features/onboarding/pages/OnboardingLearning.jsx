import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { updateOnboardingStepProgress } from '../../../utils/onboardingUtils';
import { BookOpen, ExternalLink, CheckCircle2, ArrowRight, Loader2, Play } from 'lucide-react';

export function OnboardingLearning() {
  const navigate = useNavigate();
  const { user, refreshUserData } = useAuth();

  const [loading, setLoading] = useState(false);
  const [lmsConnected, setLmsConnected] = useState(false);

  const handleLMSConnect = () => {
    setLmsConnected(true);
  };

  const handleContinue = async () => {
    if (!user) {
      navigate('/onboarding/activities');
      return;
    }

    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_status: 'learning_pending', updated_at: new Date().toISOString() })
        .eq('id', user.id);

      const { nextRoute } = await updateOnboardingStepProgress(user.id, {
        learning_intro_completed: true,
      });

      await refreshUserData();
      navigate(nextRoute || '/onboarding/activities');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Stepper */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-[#FF3D00] uppercase tracking-wider">Step 3 of 5</span>
            <h1 className="text-xl font-bold text-[#0D0D0D]">Learning & LMS Introduction</h1>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 text-[#FF3D00] rounded-full">
            60% Complete
          </span>
        </div>
        <div className="w-full bg-[#EDEDED] h-2 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] h-full w-[60%] transition-all duration-500"></div>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-[#0D0D0D]">Welcome to AI Apex Launchpad LMS</h2>
          <p className="text-xs text-[#9A9A9A] leading-relaxed">
            During your internship, you will have access to our integrated Advanced LMS & Tenon platform to complete interactive training modules and skill certifications.
          </p>
        </div>

        {/* LMS API Button Integration */}
        <div className="p-5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl shadow-sm">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0D0D0D]">Advanced LMS Integration</h4>
                <p className="text-xs text-[#9A9A9A]">Launch learning session & verify integration</p>
              </div>
            </div>
            {lmsConnected && (
              <span className="flex items-center gap-1 text-xs font-bold text-[#FF8A00]">
                <CheckCircle2 className="h-4 w-4" /> Connected
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleLMSConnect}
            className="w-full py-3 px-4 bg-white border border-[#D4D4D4] hover:border-[#FF8A00] text-[#0D0D0D] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Play className="h-4 w-4 text-[#FF8A00]" />
            <span>{lmsConnected ? 'Re-open LMS Portal Session' : 'Access External LMS Platform API'}</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#9A9A9A]" />
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 flex items-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Continue to Mandatory Activities</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
