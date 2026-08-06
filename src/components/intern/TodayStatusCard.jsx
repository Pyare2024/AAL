import React from 'react';

/**
 * Section 3 — Today's Status
 * Displays today's urgent actions and status using exact color indicators:
 * Green = Completed
 * Orange = Pending
 * Red = Missing / Overdue
 */
export function TodayStatusCard({
  attendanceStatus = 'not_marked', // 'present' | 'late' | 'not_marked' | 'absent'
  checkInTime = null,
  checkOutTime = null,
  diaryStatus = 'pending', // 'submitted' | 'pending' | 'missing'
  pendingWorkCount = 0,
  todayTodoCount = 0
}) {
  // Color Indicator Resolvers
  const getAttendanceIndicator = (st) => {
    const status = (st || 'not_marked').toLowerCase();
    if (status === 'present') return { label: 'Present', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    if (status === 'late') return { label: 'Late', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
    if (status === 'absent') return { label: 'Absent', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200' };
    return { label: 'Not Marked', color: 'bg-[#FF8A00]', text: 'text-[#FF8A00]', bg: 'bg-orange-50 border-orange-200' };
  };

  const getDiaryIndicator = (st) => {
    const status = (st || 'pending').toLowerCase();
    if (status === 'submitted' || status === 'approved') return { label: 'Completed', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    if (status === 'missing') return { label: 'Missing', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200' };
    return { label: 'Pending Today', color: 'bg-[#FF8A00]', text: 'text-[#FF8A00]', bg: 'bg-orange-50 border-orange-200' };
  };

  const att = getAttendanceIndicator(attendanceStatus);
  const diary = getDiaryIndicator(diaryStatus);

  return (
    <section className="bg-white border border-[#EDEDED] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#EDEDED] pb-3">
        <h2 className="text-sm font-bold text-[#171717] tracking-tight">
          Today's Status
        </h2>
        <span className="text-[11px] font-semibold text-[#737373]">
          Live Daily Signals
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Attendance Status */}
        <div className={`p-3.5 border rounded-xl flex items-center justify-between ${att.bg}`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">Attendance</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${att.color}`} />
              <span className={`text-xs font-bold ${att.text}`}>{att.label}</span>
            </div>
            {(checkInTime || checkOutTime) && (
              <p className="text-[10px] text-[#737373] font-mono">
                {checkInTime ? `In: ${checkInTime}` : ''} {checkOutTime ? `| Out: ${checkOutTime}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Daily Diary Status */}
        <div className={`p-3.5 border rounded-xl flex items-center justify-between ${diary.bg}`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">Daily Diary</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${diary.color}`} />
              <span className={`text-xs font-bold ${diary.text}`}>{diary.label}</span>
            </div>
          </div>
        </div>

        {/* Pending Work Count */}
        <div className={`p-3.5 border rounded-xl flex items-center justify-between ${
          pendingWorkCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">Pending Work</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${pendingWorkCount > 0 ? 'bg-[#FF8A00]' : 'bg-emerald-500'}`} />
              <span className={`text-xs font-bold ${pendingWorkCount > 0 ? 'text-[#FF8A00]' : 'text-emerald-700'}`}>
                {pendingWorkCount} {pendingWorkCount === 1 ? 'Task' : 'Tasks'}
              </span>
            </div>
          </div>
        </div>

        {/* Today's To-do Count */}
        <div className={`p-3.5 border rounded-xl flex items-center justify-between ${
          todayTodoCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">Today's To-Dos</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${todayTodoCount > 0 ? 'bg-[#FF8A00]' : 'bg-emerald-500'}`} />
              <span className={`text-xs font-bold ${todayTodoCount > 0 ? 'text-[#FF8A00]' : 'text-emerald-700'}`}>
                {todayTodoCount} Items
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
