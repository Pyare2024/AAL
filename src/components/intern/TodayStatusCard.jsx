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
    if (status === 'present') return { label: 'Present', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50/60 border-emerald-200' };
    if (status === 'late') return { label: 'Late', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50/60 border-amber-200' };
    if (status === 'absent') return { label: 'Absent', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50/60 border-red-200' };
    return { label: 'Not Marked', color: 'bg-[#FF8A00]', text: 'text-[#FF8A00]', bg: 'bg-orange-50/60 border-orange-200' };
  };

  const getDiaryIndicator = (st) => {
    const status = (st || 'pending').toLowerCase();
    if (status === 'submitted' || status === 'approved') return { label: 'Completed Today', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50/60 border-emerald-200' };
    if (status === 'missing') return { label: 'Missing Entry', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50/60 border-red-200' };
    return { label: 'Pending Today', color: 'bg-[#FF8A00]', text: 'text-[#FF8A00]', bg: 'bg-orange-50/60 border-orange-200' };
  };

  const att = getAttendanceIndicator(attendanceStatus);
  const diary = getDiaryIndicator(diaryStatus);

  return (
    <section className="bg-white border border-[#EDEDED] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#EDEDED] pb-3">
        <h2 className="text-xs font-extrabold text-[#0D0D0D] uppercase tracking-wider">
          Today's Operations & Signals
        </h2>
        <span className="text-[11px] font-semibold text-[#9A9A9A]">
          Realtime Database Status
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Attendance Status */}
        <div className={`p-4 border rounded-xl flex flex-col justify-between space-y-2 transition-all ${att.bg}`}>
          <span className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider">Attendance</span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${att.color}`} />
            <span className={`text-sm font-bold ${att.text}`}>{att.label}</span>
          </div>
          {(checkInTime || checkOutTime) ? (
            <p className="text-[10px] text-[#737373] font-mono pt-1 border-t border-[#EDEDED]">
              {checkInTime ? `In: ${checkInTime}` : ''} {checkOutTime ? `| Out: ${checkOutTime}` : ''}
            </p>
          ) : (
            <p className="text-[10px] text-[#9A9A9A] font-medium">Daily check-in required</p>
          )}
        </div>

        {/* Daily Diary Status */}
        <div className={`p-4 border rounded-xl flex flex-col justify-between space-y-2 transition-all ${diary.bg}`}>
          <span className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider">Daily Diary</span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${diary.color}`} />
            <span className={`text-sm font-bold ${diary.text}`}>{diary.label}</span>
          </div>
          <p className="text-[10px] text-[#9A9A9A] font-medium">Daily log & summary</p>
        </div>

        {/* Pending Work Count */}
        <div className={`p-4 border rounded-xl flex flex-col justify-between space-y-2 transition-all ${
          pendingWorkCount > 0 ? 'bg-orange-50/60 border-orange-200' : 'bg-emerald-50/60 border-emerald-200'
        }`}>
          <span className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider">Pending Work</span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${pendingWorkCount > 0 ? 'bg-[#FF8A00]' : 'bg-emerald-500'}`} />
            <span className={`text-sm font-bold ${pendingWorkCount > 0 ? 'text-[#FF8A00]' : 'text-emerald-700'}`}>
              {pendingWorkCount} {pendingWorkCount === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>
          <p className="text-[10px] text-[#9A9A9A] font-medium">Assigned action items</p>
        </div>

        {/* Today's To-do Count */}
        <div className={`p-4 border rounded-xl flex flex-col justify-between space-y-2 transition-all ${
          todayTodoCount > 0 ? 'bg-orange-50/60 border-orange-200' : 'bg-emerald-50/60 border-emerald-200'
        }`}>
          <span className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider">Today's To-Dos</span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${todayTodoCount > 0 ? 'bg-[#FF8A00]' : 'bg-emerald-500'}`} />
            <span className={`text-sm font-bold ${todayTodoCount > 0 ? 'text-[#FF8A00]' : 'text-emerald-700'}`}>
              {todayTodoCount} Items
            </span>
          </div>
          <p className="text-[10px] text-[#9A9A9A] font-medium">Personal list items</p>
        </div>
      </div>
    </section>
  );
}

