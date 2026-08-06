import React from 'react';
import { ShieldCheck, Calendar } from 'lucide-react';

/**
 * Section 2 - Internship Identity
 * Answers: "What internship do I belong to & Who is guiding me?"
 */
export function InternIdentityCard({
  problemStatementName = 'AI Automated Workflow & Intelligent Data Pipeline Engine',
  assignedAdminName = 'Support Team',
  assignedAdminPhoto = null,
  startDate = 'N/A',
  endDate = 'N/A',
  currentWeek = 1,
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
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section className="bg-white border border-[#EDEDED] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Top Bar: Problem Statement & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEDED] pb-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
            Assigned Track / Problem Statement
          </span>
          <h2 className="text-base sm:text-lg font-bold text-[#171717] leading-snug">
            {problemStatementName}
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
        <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#E5E5E5] border border-[#D4D4D4] text-[#171717] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
            {assignedAdminPhoto ? (
              <img src={assignedAdminPhoto} alt={assignedAdminName} className="w-full h-full object-cover" />
            ) : (
              <span>{getAdminInitials(assignedAdminName)}</span>
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-[#FF8A00]" />
              Assigned Guide / Admin
            </span>
            <p className="text-sm font-bold text-[#171717] truncate mt-0.5">
              {assignedAdminName}
            </p>
          </div>
        </div>

        {/* Timeline & Week */}
        <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-[#171717]" />
              Internship Period
            </span>
            <p className="text-xs font-semibold text-[#171717]">
              {startDate} — {endDate}
            </p>
          </div>
          <div className="text-right shrink-0 bg-white px-3 py-1.5 border border-[#EDEDED] rounded-lg">
            <span className="text-[10px] font-bold text-[#737373] uppercase block">Timeline</span>
            <span className="text-xs font-extrabold text-[#171717]">
              {currentWeek ? `Week ${currentWeek}` : 'Not Configured'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
