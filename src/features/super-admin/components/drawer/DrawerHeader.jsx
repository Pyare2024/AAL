import React from 'react';
import { X } from 'lucide-react';

export function DrawerHeader({ candidate, onClose }) {
  return (
    <div className="px-6 py-4 border-b border-[#EDEDED] bg-[#F7F7F7] flex justify-between items-center">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#0D0D0D]">{candidate.fullName}</h2>
          <span className="px-2.5 py-0.5 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 text-[#FF3D00] text-xs font-bold rounded-full">
            {candidate.completionPercentage}% Complete
          </span>
        </div>
        <p className="text-xs text-[#9A9A9A] mt-0.5">
          {candidate.email} | {candidate.mobile} | Reg: {candidate.registeredDate}
        </p>
      </div>

      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-[#9A9A9A] hover:text-[#0D0D0D] hover:bg-white transition-colors cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
