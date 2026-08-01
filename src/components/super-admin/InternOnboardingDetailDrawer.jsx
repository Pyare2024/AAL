import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle 
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

import { DrawerHeader } from '../../features/super-admin/components/drawer/DrawerHeader';
import { StepActionsTab } from '../../features/super-admin/components/drawer/StepActionsTab';
import { InterviewManagementTab } from '../../features/super-admin/components/drawer/InterviewManagementTab';
import { ProblemStatementAllocationTab } from '../../features/super-admin/components/drawer/ProblemStatementAllocationTab';
import { AuditLogsTab } from '../../features/super-admin/components/drawer/AuditLogsTab';

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
      canAction: false,
    },
    {
      key: 'problem_statement_allocated',
      name: 'Problem Statement Allocation',
      isCompleted: !!candidate.problemStatementAllocated || !!candidate.progress?.problem_statement_allocated,
      isAllocationStep: true,
      canAction: false,
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

  // Standalone Email Dispatcher
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

  // Execute Interview Schedule
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
      await evaluateInterview({
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

  // Execute Problem Statement Allocation
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
        <DrawerHeader candidate={candidate} onClose={onClose} />

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

          {/* TAB 1: ONBOARDING STEPS */}
          {activeTab === 'steps' && (
            <StepActionsTab
              candidate={candidate}
              stepsList={stepsList}
              actionType={actionType}
              setActionType={setActionType}
              setTargetStepKey={setTargetStepKey}
              actionReason={actionReason}
              setActionReason={setActionReason}
              actionRemarks={actionRemarks}
              setActionRemarks={setActionRemarks}
              isSubmitting={isSubmitting}
              handleExecuteStepAction={handleExecuteStepAction}
            />
          )}

          {/* TAB 2: INTERVIEW MANAGEMENT */}
          {activeTab === 'interview' && (
            <InterviewManagementTab
              candidate={candidate}
              interviewForm={interviewForm}
              setInterviewForm={setInterviewForm}
              emailStatus={emailStatus}
              emailError={emailError}
              lastSavedInterviewId={lastSavedInterviewId}
              isSubmitting={isSubmitting}
              handleScheduleInterview={handleScheduleInterview}
              handleSendEmailNotification={handleSendEmailNotification}
              handleEvaluateResult={handleEvaluateResult}
            />
          )}

          {/* TAB 3: PROBLEM STATEMENT ALLOCATION */}
          {activeTab === 'allocation' && (
            <ProblemStatementAllocationTab
              candidate={candidate}
              problemStatements={problemStatements}
              admins={admins}
              allocationForm={allocationForm}
              setAllocationForm={setAllocationForm}
              showAllocationConfirm={showAllocationConfirm}
              setShowAllocationConfirm={setShowAllocationConfirm}
              isSubmitting={isSubmitting}
              handleAllocatePS={handleAllocatePS}
            />
          )}

          {/* TAB 4: AUDIT TRAIL LOGS */}
          {activeTab === 'audit' && (
            <AuditLogsTab auditLogs={auditLogs} loadingAudit={loadingAudit} />
          )}
        </div>
      </div>
    </div>
  );
}
