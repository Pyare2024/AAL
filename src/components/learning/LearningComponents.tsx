import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Clock, 
  TrendingUp, 
  ExternalLink,
  Layers,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { LearningSummaryData, LearningPlatformInfo } from '../../types/learningTypes';

/**
 * Compact Learning Summary Component
 * Displays 5 core metric tiles: Active Courses, Completed Courses, Certificates Earned, Overall Progress, Learning Hours.
 */
export function LearningSummaryCard({ summary }: { summary: LearningSummaryData }) {
  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#EDEDED] pb-3">
        <h3 className="text-sm font-bold text-[#171717]">Overall Learning Summary</h3>
        <span className="text-[11px] font-semibold text-[#737373]">
          Last Synced: {new Date(summary.lastSyncedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-[#FF8A00]">
            <BookOpen className="h-4 w-4" />
            <span className="text-[10px] font-bold text-[#737373] uppercase">Active</span>
          </div>
          <span className="text-xl font-bold text-[#171717] block">{summary.activeCourses}</span>
          <span className="text-[11px] text-[#737373]">Courses in progress</span>
        </div>

        <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-[10px] font-bold text-[#737373] uppercase">Completed</span>
          </div>
          <span className="text-xl font-bold text-[#171717] block">{summary.completedCourses}</span>
          <span className="text-[11px] text-[#737373]">Verified courses</span>
        </div>

        <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-purple-600">
            <Award className="h-4 w-4" />
            <span className="text-[10px] font-bold text-[#737373] uppercase">Certificates</span>
          </div>
          <span className="text-xl font-bold text-[#171717] block">{summary.certificatesEarned}</span>
          <span className="text-[11px] text-[#737373]">Earned & verified</span>
        </div>

        <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-blue-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-[10px] font-bold text-[#737373] uppercase">Progress</span>
          </div>
          <span className="text-xl font-bold text-[#171717] block">{summary.overallProgress}%</span>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${summary.overallProgress}%` }} />
          </div>
        </div>

        <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-amber-600">
            <Clock className="h-4 w-4" />
            <span className="text-[10px] font-bold text-[#737373] uppercase">Hours Logged</span>
          </div>
          <span className="text-xl font-bold text-[#171717] block">{summary.learningHours} hrs</span>
          <span className="text-[11px] text-[#737373]">Verified learning time</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual Learning Platform Card (Advanced LMS / Tenon Integration)
 */
export function LearningPlatformCard({ platform }: { platform: LearningPlatformInfo }) {
  const navigate = useNavigate();
  const isLms = platform.type === 'advanced_lms';

  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5 hover:border-gray-300 transition-all">
      <div className="space-y-4">
        {/* Header Badge & Title */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center font-bold shrink-0 ${
              isLms ? 'bg-orange-50 text-[#FF8A00] border-orange-200' : 'bg-purple-50 text-purple-600 border-purple-200'
            }`}>
              {isLms ? <BookOpen className="h-6 w-6" /> : <Layers className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#171717]">{platform.name}</h3>
              <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase mt-0.5 ${
                platform.isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {platform.isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#737373] leading-relaxed">{platform.description}</p>

        {/* Platform Progress Metrics */}
        <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-[#737373]">Assigned Courses</span>
            <span className="font-bold text-[#171717]">{platform.assignedCourseCount}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-[#737373]">Completed Courses</span>
            <span className="font-bold text-[#171717]">{platform.completedCourseCount} / {platform.assignedCourseCount}</span>
          </div>

          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="font-bold text-[#737373]">Platform Completion</span>
              <span className="font-bold text-[#171717]">{platform.overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${isLms ? 'bg-[#FF8A00]' : 'bg-purple-600'}`} 
                style={{ width: `${platform.overallProgress}%` }} 
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#EDEDED]">
            <span className="text-[10px] font-bold text-[#737373] uppercase block">Last Activity</span>
            <span className="text-xs text-[#171717] font-medium block truncate mt-0.5">{platform.lastActivity}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => navigate(platform.route)}
        className="w-full py-3 bg-[#FAFAFA] border border-[#EDEDED] hover:bg-gray-100 text-[#171717] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <span>{platform.buttonText}</span>
        <ArrowRight className="h-4 w-4 text-[#FF8A00]" />
      </button>
    </div>
  );
}
