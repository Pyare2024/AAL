import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  FastForward, 
  Zap, 
  Calendar, 
  Clock, 
  Video, 
  UserCheck, 
  AlertCircle, 
  RefreshCw, 
  ShieldAlert, 
  History,
  ExternalLink,
  FileText,
  Lock,
  Mail,
  Send
} from 'lucide-react';
import { 
  approveOnboardingStep, 
  skipOnboardingStep, 
  forceCompleteOnboardingStep, 
  scheduleOrUpdateInterview, 
  evaluateInterview, 
  allocateProblemStatement,
  fetchInternAuditLogs 
} from '../../services/superAdminActionService';
import { sendInterviewEmailNotification } from '../../services/emailService';
import { getCurrentOnboardingStep } from '../../utils/onboardingUtils';

export function InternOnboardingDetailDrawer({ candidate, problemStatements = [], admins = [], onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState('steps'); // 'steps' | 'interview' | 'allocation' | 'audit'

  // Diagnostic logging for selected candidate
  useEffect(() => {
    if (candidate && process.env.NODE_ENV !== 'production') {
      console.log('Selected intern ID:', candidate.id);
      console.log('Selected intern onboarding_progress:', candidate.progress);
      console.log('questionnaire_completed:', candidate.questionnaireCompleted);
      console.log('learning_intro_completed:', candidate.learningCompleted);
      console.log('result of getCurrentOnboardingStep(progress):', getCurrentOnboardingStep(candidate.progress));
      console.log('currentStep rendered in the drawer:', candidate.currentStep);
    }
  }, [candidate]);

  // Action Form States
  const [actionType, setActionType] = useState(null); // null | 'approve' | 'skip' | 'force'
  const [targetStepKey, setTargetStepKey] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionRemarks, setActionRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Interview Form & Email States
  const [lastSavedInterviewId, setLastSavedInterviewId] = useState(candidate.interview?.id || null);
  const [emailStatus, setEmailStatus] = useState('Not Sent'); // 'Not Sent' | 'Sending' | 'Sent' | 'Failed'
  const [emailError, setEmailError] = useState(null);

  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: candidate.interviewDate ? new Date(candidate.interviewDate).toISOString().slice(0, 16) : '',
    meetingLink: candidate.interview?.link || '',
    interviewerName: 'Super Admin Evaluator',
    instructions: 'Please be prepared to present your 7 activities folder and code architecture.',
    result: candidate.interviewStatus === 'Completed' ? 'Selected' : candidate.interviewStatus || 'Selected',
    score: '85',
    feedback: '',
  });

  // Allocation Form State
  const [allocationForm, setAllocationForm] = useState({
    problemStatementId: candidate.problemStatementId || (problemStatements[0]?.id || ''),
    assignedAdminId: admins[0]?.id || '',
    remarks: '',
  });
  const [showAllocationConfirm, setShowAllocationConfirm] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (activeTab === 'audit' && candidate) {
      loadAuditLogs();
    }
  }, [activeTab, candidate]);

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const logs = await fetchInternAuditLogs(candidate.id);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Step definitions mapping
  const stepsList = [
    {
      key: 'profile_completed',
      name: 'Profile Completion',
      isCompleted: !!candidate.profileCompleted || !!candidate.progress?.profile_completed,
      canAction: (!candidate.profileCompleted && !candidate.progress?.profile_completed) && (candidate.currentStep === 'Profile Completion' || candidate.currentStepTitle === 'Profile Completion'),
    },
    {
      key: 'questionnaire_completed',
      name: 'Questionnaire',
      isCompleted: !!candidate.questionnaireCompleted || !!candidate.progress?.questionnaire_completed,
      canAction: (!candidate.questionnaireCompleted && !candidate.progress?.questionnaire_completed) && (candidate.currentStep === 'Questionnaire' || candidate.currentStepTitle === 'Questionnaire'),
    },
    {
      key: 'learning_intro_completed',
      name: 'Simple LMS Learning',
      isCompleted: !!candidate.learningCompleted || !!candidate.progress?.learning_intro_completed,
      canAction: (!candidate.learningCompleted && !candidate.progress?.learning_intro_completed) && (candidate.currentStep === 'Simple LMS Learning' || candidate.currentStepTitle === 'Simple LMS Learning'),
    },
    {
      key: 'activities_completed',
      name: 'Seven Mandatory Activities',
      isCompleted: !!candidate.activitiesCompleted || !!candidate.progress?.activities_completed,
      canAction: (!candidate.activitiesCompleted && !candidate.progress?.activities_completed) && (candidate.currentStep === 'Seven Activities' || candidate.currentStepTitle === 'Seven Activities'),
    },
    {
      key: 'interview_completed',
      name: 'Interview',
      isCompleted: !!candidate.interviewCompleted || !!candidate.progress?.interview_completed,
      isInterviewStep: true,
      canAction: false, // Handled in dedicated Interview tab
    },
    {
      key: 'problem_statement_allocated',
      name: 'Problem Statement Allocation',
      isCompleted: !!candidate.problemStatementAllocated || !!candidate.progress?.problem_statement_allocated,
      isAllocationStep: true,
      canAction: false, // Read only / pending later phase
    },
  ];

  // Execute Step Action
  const handleExecuteStepAction = async (e) => {
    e.preventDefault();
    if (!targetStepKey || isSubmitting) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (actionType === 'approve') {
        await approveOnboardingStep({
          internId: candidate.id,
          stepKey: targetStepKey,
          remarks: actionRemarks,
        });
        setSuccessMsg('Step approved successfully!');
      } else if (actionType === 'skip') {
        await skipOnboardingStep({
          internId: candidate.id,
          stepKey: targetStepKey,
          reason: actionReason,
        });
        setSuccessMsg('Step skipped successfully!');
      } else if (actionType === 'force') {
        await forceCompleteOnboardingStep({
          internId: candidate.id,
          stepKey: targetStepKey,
          reason: actionReason,
        });
        setSuccessMsg('Step force completed successfully!');
      }

      setActionType(null);
      setActionReason('');
      setActionRemarks('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to execute step action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Standalone Email Dispatcher with Failure Isolation
  const handleSendEmailNotification = async (interviewIdToUse) => {
    const targetItvId = interviewIdToUse || lastSavedInterviewId;
    if (!targetItvId) {
      setEmailError('Please save the interview schedule first before sending email.');
      return;
    }

    setEmailStatus('Sending');
    setEmailError(null);

    const emailRes = await sendInterviewEmailNotification({
      internId: candidate.id,
      interviewId: targetItvId,
    });

    if (emailRes.success) {
      setEmailStatus('Sent');
    } else {
      setEmailStatus('Failed');
      setEmailError(emailRes.error || 'Failed to dispatch email.');
    }
  };

  // Execute Interview Schedule (Always saves DB record first)
  const handleScheduleInterview = async (e, shouldSendEmail = false) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await scheduleOrUpdateInterview({
        internId: candidate.id,
        scheduledAt: interviewForm.scheduledAt,
        meetingLink: interviewForm.meetingLink,
        platform: 'Google Meet',
        interviewerName: interviewForm.interviewerName,
        instructions: interviewForm.instructions,
      });

      if (res.interviewId) {
        setLastSavedInterviewId(res.interviewId);
      }

      setSuccessMsg('Interview schedule saved successfully!');
      if (onRefresh) onRefresh();

      // Optionally dispatch email if requested
      if (shouldSendEmail && res.interviewId) {
        await handleSendEmailNotification(res.interviewId);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to schedule interview.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Interview Evaluation
  const handleEvaluateResult = async (resultChoice) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await evaluateInterview({
        internId: candidate.id,
        result: resultChoice,
        score: interviewForm.score,
        feedback: interviewForm.feedback,
      });

      setSuccessMsg(`Interview evaluation recorded: ${resultChoice}!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to record interview evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Problem Statement Allocation (Phase 5)
  const handleAllocatePS = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    setShowAllocationConfirm(false);

    try {
      await allocateProblemStatement({
        internId: candidate.id,
        problemStatementId: allocationForm.problemStatementId,
        assignedAdminId: allocationForm.assignedAdminId,
        remarks: allocationForm.remarks,
      });

      setSuccessMsg('Problem Statement Allocated Successfully! Student dashboard unlocked.');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Problem Statement Allocation Failed. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border-l border-[#EDEDED] shadow-2xl w-full max-w-2xl h-full flex flex-col text-left overflow-hidden">
        {/* Drawer Header */}
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

        {/* Drawer Tabs */}
        <div className="flex border-b border-[#EDEDED] bg-white px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'steps'
                ? 'border-[#FF3D00] text-[#FF3D00]'
                : 'border-transparent text-[#9A9A9A] hover:text-[#0D0D0D]'
            }`}
          >
            Onboarding Steps & Actions
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'interview'
                ? 'border-[#FF3D00] text-[#FF3D00]'
                : 'border-transparent text-[#9A9A9A] hover:text-[#0D0D0D]'
            }`}
          >
            Interview Management
          </button>
          <button
            onClick={() => setActiveTab('allocation')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'allocation'
                ? 'border-[#FF3D00] text-[#FF3D00]'
                : 'border-transparent text-[#9A9A9A] hover:text-[#0D0D0D]'
            }`}
          >
            PS Allocation
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'audit'
                ? 'border-[#FF3D00] text-[#FF3D00]'
                : 'border-transparent text-[#9A9A9A] hover:text-[#0D0D0D]'
            }`}
          >
            Audit Trail Logs
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Notifications */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)}>✕</button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)}>✕</button>
            </div>
          )}

          {/* TAB 1: ONBOARDING STEPS & ACTION CONTROLS */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">
                  Sequential Onboarding Steps
                </h3>
                <span className="text-xs text-[#9A9A9A]">Current Step: <strong className="text-[#FF3D00]">{candidate.currentStep}</strong></span>
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

              {/* Action Form Modal / Sub-card */}
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
          )}

          {/* TAB 2: INTERVIEW MANAGEMENT */}
          {activeTab === 'interview' && (
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
          )}

          {/* TAB 3: PROBLEM STATEMENT ALLOCATION */}
          {activeTab === 'allocation' && (
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
                      <option value="">Select Assigned Admin...</option>
                      {admins.map((adm) => (
                        <option key={adm.id} value={adm.id}>
                          {adm.full_name} ({adm.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0D0D0D] mb-1">
                      Allocation Remarks (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Enter optional allocation notes or domain guidelines..."
                      value={allocationForm.remarks}
                      onChange={(e) => setAllocationForm({ ...allocationForm, remarks: e.target.value })}
                      className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-2.5 bg-[#F7F7F7] rounded-lg">
                      <span className="text-[#9A9A9A] block font-semibold">Allocation Date</span>
                      <strong className="text-[#0D0D0D]">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                    </div>
                    <div className="p-2.5 bg-[#F7F7F7] rounded-lg">
                      <span className="text-[#9A9A9A] block font-semibold">Allocated By</span>
                      <strong className="text-[#0D0D0D]">Current Super Admin</strong>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[#EDEDED]">
                    <button
                      type="button"
                      disabled={isSubmitting || !allocationForm.problemStatementId || !allocationForm.assignedAdminId}
                      onClick={() => setShowAllocationConfirm(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {candidate.problemStatementAllocated ? 'Reassign Problem Statement' : 'Allocate Problem Statement'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirmation Modal overlay */}
              {showAllocationConfirm && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Confirm Problem Statement Allocation</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Are you sure you want to allocate this problem statement to <strong>{candidate.fullName}</strong>? This will complete onboarding, set status to 100%, and unlock their Internship Dashboard.
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAllocationConfirm(false)}
                      className="px-3 py-1.5 bg-white border border-amber-300 text-xs font-bold text-amber-900 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleAllocatePS}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Allocating...' : 'Confirm Allocation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
                <h3 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">
                  Audit Trail History
                </h3>
                <button
                  onClick={loadAuditLogs}
                  className="text-xs font-bold text-[#FF8A00] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingAudit ? 'animate-spin' : ''}`} />
                  <span>Refresh Logs</span>
                </button>
              </div>

              {loadingAudit ? (
                <div className="p-8 text-center text-xs text-[#9A9A9A]">Loading audit logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#9A9A9A]">No action audit logs recorded yet for this candidate.</div>
              ) : (
                <div className="space-y-2.5">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between items-center font-bold text-[#0D0D0D]">
                        <span className="text-[#FF3D00] uppercase tracking-wider">{log.action}</span>
                        <span className="text-[10px] text-[#9A9A9A] font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      {log.new_data && (
                        <div className="text-[#9A9A9A] text-[11px] font-mono overflow-x-auto bg-white p-2 rounded border border-[#EDEDED]">
                          {JSON.stringify(log.new_data)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
