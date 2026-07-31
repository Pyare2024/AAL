import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { 
  UserCheck, 
  FileText, 
  BookOpen, 
  CheckSquare, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

import { calculateCompletionPercentage } from '../../../utils/onboardingUtils';

export function OnboardingDashboard() {
  const navigate = useNavigate();
  const { profile, onboardingProgress } = useAuth();

  const steps = [
    {
      id: 'profile',
      title: '1. Profile Completion',
      desc: 'Fill basic details, college, city, degree & socials.',
      link: '/onboarding/profile',
      isCompleted: onboardingProgress?.profile_completed || false,
    },
    {
      id: 'questionnaire',
      title: '2. Technical Questionnaire',
      desc: 'Complete technical, non-technical & career assessment.',
      link: '/onboarding/questionnaire',
      isCompleted: onboardingProgress?.questionnaire_completed || false,
    },
    {
      id: 'learning',
      title: '3. Learning & LMS Setup',
      desc: 'Verify Advanced LMS & Tenon platform integration.',
      link: '/onboarding/learning',
      isCompleted: onboardingProgress?.learning_intro_completed || false,
    },
    {
      id: 'activities',
      title: '4. Seven Mandatory Activities',
      desc: 'Submit NotebookLM, Mind Maps & Prompt Docs via Public Drive.',
      link: '/onboarding/activities',
      isCompleted: onboardingProgress?.activities_completed || false,
    },
    {
      id: 'interview',
      title: '5. Interview & Allocation Status',
      desc: 'Scheduled evaluation & Problem Statement allocation.',
      link: '/onboarding/interview',
      isCompleted: onboardingProgress?.interview_completed || false,
    },
  ];

  const completionPct = calculateCompletionPercentage(onboardingProgress);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <span>Onboarding Journey</span>
            <Clock className="h-3.5 w-3.5" />
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Intern Onboarding Hub</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Complete all 5 sequential steps to activate your Intern Dashboard and receive Problem Statement allocation.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-[#9A9A9A] block">Overall Completion</span>
          <span className="text-2xl font-black text-[#FF3D00]">{completionPct}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-[#0D0D0D]">
          <span>Track Onboarding Milestones</span>
          <span>{completionPct} / 100%</span>
        </div>
        <div className="w-full bg-[#EDEDED] h-3 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          ></div>
        </div>
      </div>

      {/* Step Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step, idx) => (
          <div 
            key={step.id} 
            className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm hover:border-[#FF8A00]/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#FF8A00] uppercase tracking-wider">Step {idx + 1}</span>
                {step.isCompleted ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FF3D00] bg-[#FF3D00]/10 px-2.5 py-0.5 rounded-full">
                    Completed <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#9A9A9A] bg-[#F7F7F7] px-2.5 py-0.5 rounded-full">
                    Pending
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-[#0D0D0D]">{step.title}</h3>
              <p className="text-xs text-[#9A9A9A] leading-relaxed">{step.desc}</p>
            </div>

            {!step.isCompleted && (
              <div className="pt-4 mt-2 border-t border-[#EDEDED] flex justify-end">
                <Link
                  to={step.link}
                  className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-sm hover:opacity-95 flex items-center gap-1.5"
                >
                  <span>Start Step</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
