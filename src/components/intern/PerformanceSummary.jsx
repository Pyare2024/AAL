import React from 'react';
import { Calendar, FileText, ListTodo, Award, BookOpen } from 'lucide-react';

/**
 * Section 5 — Performance Summary
 * Small statistic cards displaying clear metrics:
 * Attendance %, Diary Completion %, Pending Works, Leaderboard Rank, Learning Progress
 */
export function PerformanceSummary({
  attendanceRate, // number | undefined
  attendanceNotStarted, // boolean | undefined
  diaryCompletionRate, // number | undefined
  pendingWorksCount, // number | undefined
  leaderboardRank, // number | undefined
  hasPoints, // boolean | undefined
  userPoints, // number | undefined
  learningProgressPercent // number | undefined
}) {
  const metrics = [
    {
      title: 'Attendance Rate',
      value: attendanceNotStarted ? 'Not Started' : (attendanceRate === undefined ? 'N/A' : `${attendanceRate}%`),
      subtitle: attendanceNotStarted ? 'No sessions yet' : 'Eligible sessions',
      icon: Calendar,
      color: attendanceRate === undefined ? 'text-gray-400' : 'text-[#FF8A00]'
    },
    {
      title: 'Diary Completion',
      value: diaryCompletionRate === undefined ? 'N/A' : `${diaryCompletionRate}%`,
      subtitle: 'Daily entries logged',
      icon: FileText,
      color: diaryCompletionRate === undefined ? 'text-gray-400' : 'text-[#FF3D00]'
    },
    {
      title: 'Pending Works',
      value: pendingWorksCount === undefined ? 'N/A' : `${pendingWorksCount}`,
      subtitle: 'Actionable tasks',
      icon: ListTodo,
      color: pendingWorksCount === undefined ? 'text-gray-400' : 'text-[#FF8A00]'
    },
    {
      title: 'Leaderboard Rank',
      value: hasPoints === undefined ? 'N/A' : (hasPoints ? `#${leaderboardRank}` : 'Unranked'),
      subtitle: hasPoints === undefined ? 'N/A' : (hasPoints ? `${userPoints} pts` : 'Earn points to rank'),
      icon: Award,
      color: hasPoints === undefined ? 'text-gray-400' : 'text-amber-600'
    },
    {
      title: 'Learning Progress',
      value: learningProgressPercent === undefined ? 'N/A' : `${learningProgressPercent}%`,
      subtitle: 'LMS course completion',
      icon: BookOpen,
      color: learningProgressPercent === undefined ? 'text-gray-400' : 'text-blue-600'
    }
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-[#171717] tracking-tight">
        Performance Summary
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-white border border-[#EDEDED] rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
                  {m.title}
                </span>
                <Icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <div>
                <p className={`text-xl font-extrabold ${m.value === 'N/A' ? 'text-gray-400' : 'text-[#171717]'}`}>
                  {m.value}
                </p>
                <p className="text-[11px] text-[#737373]">
                  {m.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
