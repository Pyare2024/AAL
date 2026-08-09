import React from 'react';
import { BarChart3 } from 'lucide-react';

export function AdminReportsPage() {
  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <span>Role Access: Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Reports & Analytics</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            View performance metrics and generate detailed reports.
          </p>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-16 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="p-5 bg-[#F7F7F7] rounded-full mb-4 text-[#9A9A9A]">
          <BarChart3 className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-[#0D0D0D] mb-2">No analytics data available</h3>
        <p className="text-sm text-[#9A9A9A] max-w-sm">
          Analytics and reporting features for the Admin module are currently under development. Detailed statistics will appear here soon.
        </p>
      </div>
    </div>
  );
}
