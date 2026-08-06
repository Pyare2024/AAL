import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function ProductivityModuleCard({ title, icon: Icon, status, statusColor = 'text-[#737373]', statusBg = 'bg-gray-50 border-gray-200', countText, actionLabel, actionTo, onClickAction }) {
  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#D4D4D4] transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-[#171717]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#171717]">{title}</h3>
            <p className="text-xs text-[#737373] mt-0.5">{countText}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-[11px] font-bold border rounded-full ${statusBg} ${statusColor}`}>
          {status}
        </span>
      </div>

      <div>
        {actionTo ? (
          <Link
            to={actionTo}
            className="w-full py-2.5 px-4 bg-[#FF8A00] hover:bg-[#FF3D00] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm group"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <button
            onClick={onClickAction}
            className="w-full py-2.5 px-4 bg-[#FF8A00] hover:bg-[#FF3D00] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm group"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}

export function TodayProgressChecklist({ progress = {} }) {
  const steps = [
    { label: 'Attendance Marked', completed: !!progress.attendanceCompleted },
    { label: `Tasks Planned (${progress.tasksPlanned || 0})`, completed: (progress.tasksPlanned || 0) > 0 },
    { label: `Tasks Completed (${progress.tasksCompleted || 0})`, completed: (progress.tasksCompleted || 0) > 0 },
    { label: 'Daily Diary Submitted', completed: !!progress.diarySubmitted },
    { label: `Formal Work Submitted (${progress.workSubmitted || 0})`, completed: (progress.workSubmitted || 0) > 0 }
  ];

  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#EDEDED] pb-3">
        <h3 className="text-sm font-bold text-[#171717]">Today's Sequence Progress</h3>
        <span className="text-xs font-semibold text-[#737373]">
          {steps.filter(s => s.completed).length} of {steps.length} Steps Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {steps.map((st, idx) => (
          <div key={idx} className={`p-3 border rounded-xl flex items-center gap-2.5 ${
            st.completed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-[#FAFAFA] border-[#EDEDED] text-[#737373]'
          }`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              st.completed ? 'bg-emerald-600 text-white' : 'bg-[#D4D4D4] text-white'
            }`}>
              {st.completed ? '✓' : idx + 1}
            </span>
            <span className="text-xs font-semibold">{st.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
