import React from 'react';
import { CheckCircle2, FastForward, Zap, RefreshCw } from 'lucide-react';

export function StepActionsTab({
  candidate,
  stepsList,
  actionType,
  setActionType,
  setTargetStepKey,
  actionReason,
  setActionReason,
  actionRemarks,
  setActionRemarks,
  isSubmitting,
  handleExecuteStepAction,
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">
          Sequential Onboarding Steps
        </h3>
        <span className="text-xs text-[#9A9A9A]">
          Current Step: <strong className="text-[#FF3D00]">{candidate.currentStep}</strong>
        </span>
      </div>

      <div className="space-y-3">
        {stepsList.map((st, idx) => (
          <div
            key={st.key}
            className={`p-4 rounded-xl border transition-all ${
              st.isCompleted
                ? 'bg-emerald-50/50 border-emerald-200'
                : st.canAction
                ? 'bg-white border-[#FF8A00] ring-1 ring-[#FF8A00]/20 shadow-xs'
                : 'bg-[#F7F7F7] border-[#EDEDED]'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#9A9A9A]">Step {idx + 1}</span>
                <h4 className="text-sm font-bold text-[#0D0D0D]">{st.name}</h4>
              </div>

              <div>
                {st.isCompleted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                  </span>
                ) : st.canAction ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FF8A00]/10 text-[#FF8A00] border border-[#FF8A00]/20 text-xs font-bold rounded-full">
                    Current Active Step
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                    Pending
                  </span>
                )}
              </div>
            </div>

            {/* Action Controls for Current Active Step */}
            {st.canAction && !st.isInterviewStep && !st.isAllocationStep && (
              <div className="mt-4 pt-3 border-t border-[#EDEDED] flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionType('approve');
                    setTargetStepKey(st.key);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve Step</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionType('skip');
                    setTargetStepKey(st.key);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FastForward className="h-3.5 w-3.5" />
                  <span>Skip Step</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionType('force');
                    setTargetStepKey(st.key);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] hover:opacity-95 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Force Complete</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Form Sub-card */}
      {actionType && (
        <form
          onSubmit={handleExecuteStepAction}
          className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-3 animate-fadeIn mt-4"
        >
          <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
            <h4 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">
              Confirm Action: {actionType.toUpperCase()} STEP
            </h4>
            <button
              type="button"
              onClick={() => setActionType(null)}
              className="text-xs text-[#9A9A9A] hover:text-[#0D0D0D]"
            >
              Cancel
            </button>
          </div>

          {(actionType === 'skip' || actionType === 'force') && (
            <div>
              <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                Mandatory Reason <span className="text-[#FF3D00]">*</span>
              </label>
              <textarea
                rows={2}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={`Enter reason for ${actionType}ing step...`}
                required
                className="w-full p-2.5 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
              />
            </div>
          )}

          {actionType === 'approve' && (
            <div>
              <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                Reviewer Remarks (Optional)
              </label>
              <input
                type="text"
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="e.g. Verified profile information"
                className="w-full px-3 py-2 bg-white border border-[#D4D4D4] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActionType(null)}
              className="px-3 py-1.5 bg-white border border-[#EDEDED] text-xs font-semibold text-[#0D0D0D] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <span>Confirm {actionType}</span>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
