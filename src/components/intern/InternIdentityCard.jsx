import React from 'react';
import { ShieldCheck, Calendar, FolderOpen } from 'lucide-react';

/**
 * Section 2 - Internship Identity
 * Answers: "What internship do I belong to & Who is guiding me?"
 */
export function InternIdentityCard({
  problemStatementName = 'Problem Statement Pending Allocation',
  assignedAdminName = 'No admin assigned',
  assignedAdminPhoto = null,
  startDate = 'Not configured',
  endDate = 'Not configured',
  currentWeek = null,
  status = 'Active' // Active / Completed / On Hold
}) {
  const getStatusBadge = (st) => {
    const s = (st || 'active').toLowerCase();
    if (s === 'active') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'completed') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const getAdminInitials = (name) => {
    if (!name || name === 'No admin assigned') return 'AD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isPendingAllocation = !problemStatementName || problemStatementName === 'Not Assigned' || problemStatementName === 'Problem Statement Pending Allocation';

  return (
    <section className="bg-white border border-[#EDEDED] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Top Bar: Problem Statement & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEDED] pb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider block flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5 text-[#FF8A00]" />
            <span>Assigned Track / Problem Statement</span>
          </span>
          <h2 className={`text-base sm:text-lg font-bold leading-snug ${isPendingAllocation ? 'text-[#737373] italic font-normal' : 'text-[#0D0D0D]'}`}>
            {isPendingAllocation ? 'Problem Statement Pending Allocation' : problemStatementName}
          </h2>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className={`px-3 py-1 text-xs font-bold border rounded-full ${getStatusBadge(status)}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Grid: Admin Guidance & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Admin Guidance */}
        <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-white border border-[#EDEDED] text-[#FF3D00] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
            {assignedAdminPhoto ? (
              <img src={assignedAdminPhoto} alt={assignedAdminName} className="w-full h-full object-cover" />
            ) : (
              <span>{getAdminInitials(assignedAdminName)}</span>
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#FF8A00]" />
              Assigned Guide / Admin
            </span>
            <p className="text-sm font-bold text-[#0D0D0D] truncate mt-0.5">
              {assignedAdminName}
            </p>
          </div>
        </div>

        {/* Timeline & Week */}
        <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#0D0D0D]" />
              Internship Period
            </span>
            <p className="text-xs font-bold text-[#0D0D0D]">
              {startDate} — {endDate}
            </p>
          </div>
          <div className="text-right shrink-0 bg-white px-3 py-1.5 border border-[#EDEDED] rounded-lg shadow-2xs">
            <span className="text-[9px] font-extrabold text-[#9A9A9A] uppercase block">Timeline</span>
            <span className="text-xs font-black text-[#0D0D0D]">
              {currentWeek ? `Week ${currentWeek}` : 'Not Configured'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

