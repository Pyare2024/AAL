import React from 'react';
import { Mail, Send, CheckCircle2, Clock, X } from 'lucide-react';

export function InterviewManagementTab({
  candidate,
  interviewForm,
  setInterviewForm,
  emailStatus,
  emailError,
  lastSavedInterviewId,
  isSubmitting,
  handleScheduleInterview,
  handleSendEmailNotification,
  handleEvaluateResult,
}) {
  return (
    <div className="space-y-5">
      {/* Interview Status Overview Card */}
      <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Interview Status</span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            candidate.interviewStatus === 'Completed' || candidate.interviewStatus === 'Selected'
              ? 'bg-emerald-100 text-emerald-700'
              : candidate.interviewStatus === 'Rejected'
              ? 'bg-red-100 text-red-700'
              : candidate.interviewStatus === 'On Hold'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {candidate.interviewStatus}
          </span>
        </div>
        {candidate.interviewDate && (
          <p className="text-xs text-[#0D0D0D]">Scheduled At: <strong>{candidate.interviewDate}</strong></p>
        )}
        {candidate.interview?.link && (
          <p className="text-xs text-[#9A9A9A]">
            Meeting Link: <a href={candidate.interview.link} target="_blank" rel="noreferrer" className="text-[#FF3D00] underline font-mono">{candidate.interview.link}</a>
          </p>
        )}
      </div>

      {/* Form 1: Schedule Interview */}
      <form onSubmit={(e) => handleScheduleInterview(e, false)} className="p-4 bg-white border border-[#EDEDED] rounded-xl space-y-3 shadow-xs">
        <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
          <h4 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">
            Schedule / Update Interview Details
          </h4>
          
          {/* Email Status Indicator Badge */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            emailStatus === 'Sent'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : emailStatus === 'Sending'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : emailStatus === 'Failed'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}>
            Email: {emailStatus}
          </span>
        </div>

        {emailError && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex justify-between items-center">
            <span>Interview saved, but email could not be sent: {emailError}</span>
            <button
              type="button"
              onClick={() => handleSendEmailNotification()}
              className="text-xs font-bold underline text-red-700 hover:text-red-950 ml-2 cursor-pointer shrink-0"
            >
              Retry Email
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Date & Time <span className="text-[#FF3D00]">*</span></label>
            <input
              type="datetime-local"
              value={interviewForm.scheduledAt}
              onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
              required
              className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Interviewer Name</label>
            <input
              type="text"
              value={interviewForm.interviewerName}
              onChange={(e) => setInterviewForm({ ...interviewForm, interviewerName: e.target.value })}
              className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Meeting Link <span className="text-[#FF3D00]">*</span></label>
          <input
            type="url"
            placeholder="https://meet.google.com/xyz-abc"
            value={interviewForm.meetingLink}
            onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
            required
            className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-mono text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button
            type="submit"
            disabled={isSubmitting || emailStatus === 'Sending'}
            className="px-4 py-2 bg-[#EDEDED] hover:bg-[#D4D4D4] text-[#0D0D0D] text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Save Interview Schedule
          </button>

          <button
            type="button"
            disabled={isSubmitting || emailStatus === 'Sending'}
            onClick={(e) => handleScheduleInterview(e, true)}
            className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>{emailStatus === 'Sending' ? 'Sending Email...' : 'Save & Send Email'}</span>
          </button>

          {lastSavedInterviewId && emailStatus !== 'Sent' && emailStatus !== 'Sending' && (
            <button
              type="button"
              disabled={emailStatus === 'Sending'}
              onClick={() => handleSendEmailNotification()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{emailStatus === 'Failed' ? 'Retry Email' : 'Send Interview Email'}</span>
            </button>
          )}
        </div>
      </form>

      {/* Form 2: Evaluate Interview */}
      <div className="p-4 bg-white border border-[#EDEDED] rounded-xl space-y-3 shadow-xs">
        <h4 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider border-b border-[#EDEDED] pb-2">
          Record Interview Evaluation Result
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Score (out of 100)</label>
            <input
              type="number"
              placeholder="85"
              value={interviewForm.score}
              onChange={(e) => setInterviewForm({ ...interviewForm, score: e.target.value })}
              className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Evaluation Feedback / Remarks</label>
            <input
              type="text"
              placeholder="Enter feedback..."
              value={interviewForm.feedback}
              onChange={(e) => setInterviewForm({ ...interviewForm, feedback: e.target.value })}
              className="w-full px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#EDEDED]">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleEvaluateResult('Selected')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Mark Interview Completed</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleEvaluateResult('On Hold')}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Put On Hold</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleEvaluateResult('Rejected')}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reject Candidate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
