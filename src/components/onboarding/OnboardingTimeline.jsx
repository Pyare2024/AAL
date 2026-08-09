import React from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { calculateCompletionPercentage, ONBOARDING_ROUTES } from '../../utils/onboardingUtils';
import { Check, User, FileText, BookOpen, CheckSquare, Calendar, Sparkles } from 'lucide-react';

/**
 * OnboardingTimeline Component
 * Renders a single, continuous, horizontal onboarding timeline at the top of all onboarding pages.
 * Reuses existing onboardingProgress from AuthContext and calculateCompletionPercentage from onboardingUtils.
 * Fully responsive across Desktop, Tablet, and Mobile.
 */
export function OnboardingTimeline() {
  const { onboardingProgress } = useAuth();

  const completionPct = calculateCompletionPercentage(onboardingProgress);

  // Dynamic step definitions mapped to existing DB boolean flags in onboarding_progress
  const steps = [
    {
      id: 'profile',
      label: 'Profile',
      fullTitle: '1. Profile Completion',
      route: ONBOARDING_ROUTES.PROFILE,
      icon: User,
      isCompleted: !!onboardingProgress?.profile_completed,
    },
    {
      id: 'questionnaire',
      label: 'Questionnaire',
      fullTitle: '2. Technical Questionnaire',
      route: ONBOARDING_ROUTES.QUESTIONNAIRE,
      icon: FileText,
      isCompleted: !!onboardingProgress?.questionnaire_completed,
    },
    {
      id: 'learning',
      label: 'Learning',
      fullTitle: '3. Learning Setup',
      route: ONBOARDING_ROUTES.LEARNING,
      icon: BookOpen,
      isCompleted: !!onboardingProgress?.learning_intro_completed,
    },
    {
      id: 'activities',
      label: 'Activities',
      fullTitle: '4. Seven Activities',
      route: ONBOARDING_ROUTES.ACTIVITIES,
      icon: CheckSquare,
      isCompleted: !!onboardingProgress?.activities_completed,
    },
    {
      id: 'interview',
      label: 'Interview',
      fullTitle: '5. Interview & Allocation',
      route: ONBOARDING_ROUTES.INTERVIEW,
      icon: Calendar,
      isCompleted: !!onboardingProgress?.interview_completed && !!onboardingProgress?.problem_statement_allocated,
    },
  ];

  // Determine active step index: first incomplete step index (0-indexed), or last step if all complete
  let activeIndex = steps.findIndex((step) => !step.isCompleted);
  if (activeIndex === -1) {
    activeIndex = steps.length - 1;
  }

  // Progress line width percentage based on completed steps vs total steps
  const completedCount = steps.filter((s) => s.isCompleted).length;
  const lineProgressPct = ((completedCount) / (steps.length - 1)) * 100;
  const clampedLinePct = Math.min(100, Math.max(0, lineProgressPct));

  return (
    <div className="w-full bg-white border border-[#EDEDED] rounded-2xl p-4 sm:p-6 shadow-xs mb-6 space-y-4 font-sans">
      {/* Header bar showing overall percentage from existing utility */}
      <div className="flex justify-between items-center text-xs border-b border-[#F5F5F5] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FF3D00]/10 text-[#FF3D00] rounded-lg">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-extrabold text-[#171717] tracking-tight uppercase">
            INTERN ONBOARDING TIMELINE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#737373] font-semibold text-[11px] hidden sm:inline">Overall Progress:</span>
          <span className="font-black font-mono text-[#FF3D00] text-sm bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 px-2.5 py-0.5 rounded-full">
            {completionPct}%
          </span>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative pt-2 pb-1 px-2 sm:px-4">
        {/* Continuous Horizontal Connecting Line (Background Gray) */}
        <div className="absolute top-[26px] left-6 right-6 sm:left-10 sm:right-10 h-1 bg-[#EDEDED] rounded-full -translate-y-1/2 z-0" />

        {/* Continuous Horizontal Connecting Line (Completed Green Progress) */}
        <div 
          className="absolute top-[26px] left-6 sm:left-10 h-1 bg-emerald-500 rounded-full -translate-y-1/2 z-0 transition-all duration-700 ease-out"
          style={{ width: `calc(${clampedLinePct}% * (100% - 3rem) / 100)` }}
        />

        {/* Responsive Steps Grid */}
        <div className="relative z-10 flex justify-between items-center w-full">
          {steps.map((step, index) => {
            const isCompleted = step.isCompleted;
            const isActive = index === activeIndex && !isCompleted;
            const isPending = !isCompleted && !isActive;

            const StepIcon = step.icon;

            return (
              <div 
                key={step.id} 
                className="flex flex-col items-center group text-center flex-1"
              >
                {/* Circular Indicator */}
                <div 
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-xs ${
                    isCompleted 
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-50 scale-100' 
                      : isActive 
                        ? 'bg-[#FF3D00] text-white ring-4 ring-[#FF3D00]/15 scale-110 animate-pulse' 
                        : 'bg-white border-2 border-[#D4D4D4] text-[#737373]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 stroke-[3]" />
                  ) : (
                    <StepIcon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#737373]'}`} />
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 space-y-0.5">
                  <span className={`text-[10px] sm:text-xs font-extrabold tracking-tight block ${
                    isCompleted 
                      ? 'text-emerald-950 font-bold' 
                      : isActive 
                        ? 'text-[#FF3D00] font-black' 
                        : 'text-[#737373] font-medium'
                  }`}>
                    <span className="hidden sm:inline">{step.fullTitle}</span>
                    <span className="sm:hidden">{step.label}</span>
                  </span>

                  <span className={`text-[9px] font-mono uppercase tracking-wider block font-bold ${
                    isCompleted 
                      ? 'text-emerald-600' 
                      : isActive 
                        ? 'text-[#FF3D00]' 
                        : 'text-[#A3A3A3]'
                  }`}>
                    {isCompleted ? 'Done' : isActive ? 'Active' : 'Pending'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
