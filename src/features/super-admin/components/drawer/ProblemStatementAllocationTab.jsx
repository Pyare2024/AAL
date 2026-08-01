import React from 'react';
import { UserCheck, ShieldAlert, RefreshCw } from 'lucide-react';

export function ProblemStatementAllocationTab({
  candidate,
  problemStatements,
  admins,
  allocationForm,
  setAllocationForm,
  showAllocationConfirm,
  setShowAllocationConfirm,
  isSubmitting,
  handleAllocatePS,
}) {
  return (
    <div className="space-y-5">
      <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Allocation Status</span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            candidate.problemStatementAllocated
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {candidate.problemStatementAllocated ? 'Already Allocated' : 'Pending Allocation'}
          </span>
        </div>
        <p className="text-xs text-[#0D0D0D]">
          Current Step: <strong>{candidate.currentStep}</strong> ({candidate.completionPercentage}% Complete)
        </p>
      </div>

      {/* Allocation Form Card */}
      <div className="p-4 bg-white border border-[#EDEDED] rounded-xl space-y-4 shadow-xs">
        <h4 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider border-b border-[#EDEDED] pb-2">
          Allocate Problem Statement & Assigned Admin
        </h4>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
              Problem Statement <span className="text-[#FF3D00]">*</span>
            </label>
            <select
              value={allocationForm.problemStatementId}
              onChange={(e) => setAllocationForm({ ...allocationForm, problemStatementId: e.target.value })}
              required
              className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="">Select Problem Statement...</option>
              {problemStatements.map((ps) => (
                <option key={ps.id} value={ps.id}>
                  {ps.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
              Assigned Admin <span className="text-[#FF3D00]">*</span>
            </label>
            <select
              value={allocationForm.assignedAdminId}
              onChange={(e) => setAllocationForm({ ...allocationForm, assignedAdminId: e.target.value })}
              required
              className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="">Select Primary Admin...</option>
              {admins.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.full_name || adm.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Allocation Remarks (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Recommended based on tech questionnaire score"
              value={allocationForm.remarks}
              onChange={(e) => setAllocationForm({ ...allocationForm, remarks: e.target.value })}
              className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#EDEDED] flex justify-end">
          <button
            type="button"
            disabled={isSubmitting || !allocationForm.problemStatementId || !allocationForm.assignedAdminId}
            onClick={() => setShowAllocationConfirm(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <UserCheck className="h-4 w-4" />
            <span>Complete Allocation & Activate Intern</span>
          </button>
        </div>
      </div>

      {/* Allocation Confirmation Modal */}
      {showAllocationConfirm && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-800">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Confirm Final Allocation</h4>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            This action will mark onboarding as 100% completed, set intern account status to <strong>ACTIVE</strong>, and grant immediate dashboard access to the candidate.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAllocationConfirm(false)}
              className="px-3 py-1.5 bg-white border border-amber-200 text-xs font-semibold text-amber-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAllocatePS}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <span>Confirm & Activate</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
