import React from 'react';

export function AttendanceStatusCard({ date, status = 'not_marked', checkIn, checkOut, durationMinutes, attendanceRate }) {
  const formatDuration = (mins) => {
    if (!mins) return '0h 0m';
    const hrs = Math.floor(mins / 60);
    const remainder = mins % 60;
    return `${hrs}h ${remainder}m`;
  };

  const getStatusBadge = (st) => {
    const s = (st || 'not_marked').toLowerCase();
    if (s === 'present') return { text: 'Present Today', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700' };
    if (s === 'late') return { text: 'Late Today', bg: 'bg-amber-50 border-amber-200 text-amber-700' };
    if (s === 'absent') return { text: 'Absent', bg: 'bg-red-50 border-red-200 text-red-700' };
    return { text: 'Not Marked Yet', bg: 'bg-orange-50 border-orange-200 text-orange-700' };
  };

  const badge = getStatusBadge(status);

  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDEDED] pb-3">
        <div>
          <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">Today's Date</span>
          <h2 className="text-base font-bold text-[#171717]">{date}</h2>
        </div>
        <span className={`px-3 py-1 text-xs font-bold border rounded-full self-start sm:self-auto ${badge.bg}`}>
          {badge.text}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl">
          <span className="text-[10px] font-bold text-[#737373] uppercase block">Check-in</span>
          <span className="text-sm font-bold text-[#171717] mt-0.5 block">{checkIn || '--:--'}</span>
        </div>
        <div className="p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl">
          <span className="text-[10px] font-bold text-[#737373] uppercase block">Check-out</span>
          <span className="text-sm font-bold text-[#171717] mt-0.5 block">{checkOut || '--:--'}</span>
        </div>
        <div className="p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl">
          <span className="text-[10px] font-bold text-[#737373] uppercase block">Working Duration</span>
          <span className="text-sm font-bold text-[#171717] mt-0.5 block">{formatDuration(durationMinutes)}</span>
        </div>
        <div className="p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl">
          <span className="text-[10px] font-bold text-[#737373] uppercase block">Attendance Rate</span>
          <span className="text-sm font-black text-[#FF8A00] mt-0.5 block">{attendanceRate}%</span>
        </div>
      </div>
    </div>
  );
}

export function AttendanceActionPanel({ hasCheckedIn, hasCheckedOut, onCheckIn, onCheckOut, loading }) {
  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-[#171717]">Attendance Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onCheckIn}
          disabled={hasCheckedIn || loading}
          className={`py-3 px-4 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 ${
            hasCheckedIn
              ? 'bg-[#E5E5E5] text-[#A3A3A3] cursor-not-allowed'
              : 'bg-[#FF8A00] hover:bg-[#FF3D00] text-white shadow-sm'
          }`}
        >
          {hasCheckedIn ? '✓ Check-in Completed' : 'Mark Check-in'}
        </button>

        <button
          onClick={onCheckOut}
          disabled={!hasCheckedIn || hasCheckedOut || loading}
          className={`py-3 px-4 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 ${
            !hasCheckedIn || hasCheckedOut
              ? 'bg-[#E5E5E5] text-[#A3A3A3] cursor-not-allowed'
              : 'bg-[#171717] hover:bg-[#404040] text-white shadow-sm'
          }`}
        >
          {hasCheckedOut ? '✓ Check-out Completed' : 'Mark Check-out'}
        </button>
      </div>
    </div>
  );
}

export function AttendanceHistoryTable({ records = [] }) {
  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-[#171717]">Attendance Log & History</h3>
      {records.length === 0 ? (
        <p className="text-xs text-[#737373] text-center py-4">No attendance records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EDEDED] text-[#737373] font-bold uppercase text-[10px]">
                <th className="pb-2.5">Date</th>
                <th className="pb-2.5">Check-in</th>
                <th className="pb-2.5">Check-out</th>
                <th className="pb-2.5">Duration</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEDED]">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#FAFAFA]">
                  <td className="py-3 font-semibold text-[#171717]">{rec.attendance_date}</td>
                  <td className="py-3 text-[#404040] font-mono">{rec.check_in_time || '--:--'}</td>
                  <td className="py-3 text-[#404040] font-mono">{rec.check_out_time || '--:--'}</td>
                  <td className="py-3 text-[#404040]">{rec.working_minutes ? `${Math.floor(rec.working_minutes / 60)}h ${rec.working_minutes % 60}m` : '--'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rec.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3 text-[#737373]">{rec.remarks || 'Verified'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
