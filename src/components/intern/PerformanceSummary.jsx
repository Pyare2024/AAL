import React, { useState, useEffect } from 'react';
import { Calendar, FileText, ListTodo, Award, BookOpen } from 'lucide-react';

function useCountUp(targetValue, duration = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const end = Number(targetValue) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [targetValue, duration]);

  return count;
}

/**
 * Section 5 — Performance Summary
 * Statistic cards displaying metrics: Attendance %, Diary Completion %, Pending Works, Leaderboard Rank, Learning Progress
 */
export function PerformanceSummary({
  attendanceRate = 0,
  attendanceNotStarted = false,
  diaryCompletionRate = 0,
  pendingWorksCount = 0,
  leaderboardRank = 1,
  hasPoints = false,
  userPoints = 0,
  learningProgressPercent = 0
}) {
  const animatedAttendance = useCountUp(attendanceRate);
  const animatedDiary = useCountUp(diaryCompletionRate);
  const animatedPending = useCountUp(pendingWorksCount);
  const animatedLearning = useCountUp(learningProgressPercent);

  const metrics = [
    {
      title: 'Attendance Rate',
      displayValue: attendanceNotStarted ? 'Not Started' : `${animatedAttendance}%`,
      pct: attendanceNotStarted ? 0 : attendanceRate,
      subtitle: attendanceNotStarted ? 'No sessions yet' : 'Eligible sessions',
      icon: Calendar,
      color: 'text-[#FF8A00]',
      barColor: 'bg-[#FF8A00]'
    },
    {
      title: 'Diary Completion',
      displayValue: `${animatedDiary}%`,
      pct: diaryCompletionRate,
      subtitle: 'Daily entries logged',
      icon: FileText,
      color: 'text-[#FF3D00]',
      barColor: 'bg-[#FF3D00]'
    },
    {
      title: 'Pending Works',
      displayValue: `${animatedPending}`,
      pct: null,
      subtitle: 'Actionable tasks',
      icon: ListTodo,
      color: 'text-[#FF8A00]',
      barColor: 'bg-[#FF8A00]'
    },
    {
      title: 'Leaderboard Rank',
      displayValue: hasPoints ? `#${leaderboardRank}` : 'Unranked',
      pct: null,
      subtitle: hasPoints ? `${userPoints} pts` : 'Earn points to rank',
      icon: Award,
      color: 'text-amber-600',
      barColor: 'bg-amber-500'
    },
    {
      title: 'Learning Progress',
      displayValue: `${animatedLearning}%`,
      pct: learningProgressPercent,
      subtitle: 'LMS course modules',
      icon: BookOpen,
      color: 'text-blue-600',
      barColor: 'bg-blue-600'
    }
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-extrabold text-[#0D0D0D] uppercase tracking-wider">
        Performance Summary
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-white border border-[#EDEDED] hover:border-[#9A9A9A] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider">
                  {m.title}
                </span>
                <div className="p-1.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-lg">
                  <Icon className={`h-4 w-4 ${m.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-black text-[#0D0D0D] tracking-tight font-mono">
                  {m.displayValue}
                </p>
                <p className="text-[10px] text-[#9A9A9A] font-medium">
                  {m.subtitle}
                </p>
              </div>

              {m.pct !== null && (
                <div className="w-full bg-[#EDEDED] h-1.5 rounded-full overflow-hidden">
                  <div className={`${m.barColor} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${m.pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

