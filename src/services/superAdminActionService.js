import { supabase } from '../lib/supabase';
import { 
  updateOnboardingStepProgress 
} from '../utils/onboardingUtils';

/**
 * Super Admin Action Control Service (Phase 4)
 * Handles:
 * - Approve Step
 * - Skip Step
 * - Force Complete Step
 * - Schedule & Complete Interview Workflow
 * - Audit Trail logging in audit_logs table
 */

/**
 * 1. Approve Current Step for an Intern
 */
export async function approveOnboardingStep({ internId, stepKey, remarks }) {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Unauthorized: Must be logged in as Super Admin.');

  // Update step status flag in onboarding_progress
  const updates = { [stepKey]: true };
  const { progress, nextRoute } = await updateOnboardingStepProgress(internId, updates);

  // Write to audit_logs
  try {
    await supabase.from('audit_logs').insert([
      {
        actor_id: currentUser.id,
        action: 'onboarding_step_approved',
        entity_type: 'onboarding_progress',
        entity_id: internId,
        new_data: { stepKey, remarks, nextRoute },
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (auditErr) {
    console.warn('Audit log write note:', auditErr);
  }

  return { success: true, progress, nextRoute };
}

/**
 * 2. Skip Current Step for an Intern (Mandatory Reason required)
 */
export async function skipOnboardingStep({ internId, stepKey, reason }) {
  if (!reason || !reason.trim()) {
    throw new Error('A valid reason is required to skip an onboarding step.');
  }

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Unauthorized: Must be logged in as Super Admin.');

  // Treat step as complete for progression
  const updates = { [stepKey]: true };
  const { progress, nextRoute } = await updateOnboardingStepProgress(internId, updates);

  // Write to audit_logs
  try {
    await supabase.from('audit_logs').insert([
      {
        actor_id: currentUser.id,
        action: 'onboarding_step_skipped',
        entity_type: 'onboarding_progress',
        entity_id: internId,
        new_data: { stepKey, reason: reason.trim(), skipped_by: currentUser.id, display: 'Skipped by Super Admin' },
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (auditErr) {
    console.warn('Audit log write note:', auditErr);
  }

  return { success: true, progress, nextRoute };
}

/**
 * 3. Force Complete Step for an Intern (Mandatory Reason required)
 */
export async function forceCompleteOnboardingStep({ internId, stepKey, reason }) {
  if (!reason || !reason.trim()) {
    throw new Error('A valid reason is required to force complete an onboarding step.');
  }

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Unauthorized: Must be logged in as Super Admin.');

  // Treat step as force completed
  const updates = { [stepKey]: true };
  const { progress, nextRoute } = await updateOnboardingStepProgress(internId, updates);

  // Write to audit_logs
  try {
    await supabase.from('audit_logs').insert([
      {
        actor_id: currentUser.id,
        action: 'onboarding_step_force_completed',
        entity_type: 'onboarding_progress',
        entity_id: internId,
        new_data: { stepKey, reason: reason.trim(), force_completed_by: currentUser.id, display: 'Force Completed by Super Admin' },
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (auditErr) {
    console.warn('Audit log write note:', auditErr);
  }

  return { success: true, progress, nextRoute };
}

/**
 * 4. Schedule or Update Interview Details (Always saves database record first)
 */
export async function scheduleOrUpdateInterview({
  internId,
  scheduledAt,
  meetingLink,
  platform = 'Google Meet',
  interviewerName = 'Super Admin Evaluator',
  instructions = 'Please review your 7 activities submission before joining.',
}) {
  if (!scheduledAt) throw new Error('Interview Date and Time are required.');
  if (!meetingLink || !meetingLink.trim()) throw new Error('Meeting Link is required.');

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Unauthorized: Must be logged in as Super Admin.');

  // Check if interview record exists
  const { data: existingItv } = await supabase
    .from('interviews')
    .select('id')
    .eq('intern_id', internId)
    .maybeSingle();

  const payload = {
    intern_id: internId,
    scheduled_by: currentUser.id,
    scheduled_at: new Date(scheduledAt).toISOString(),
    meeting_link: meetingLink.trim(),
    status: 'Scheduled',
    feedback: instructions || null,
  };

  let itvId = existingItv?.id;

  if (existingItv) {
    const { error: updateErr } = await supabase
      .from('interviews')
      .update(payload)
      .eq('id', existingItv.id);
    if (updateErr) throw updateErr;
  } else {
    const { data: newItv, error: insertErr } = await supabase
      .from('interviews')
      .insert([payload])
      .select()
      .single();
    if (insertErr) throw insertErr;
    itvId = newItv.id;
  }

  // Update profile status
  await supabase
    .from('profiles')
    .update({ onboarding_status: 'interview_pending', updated_at: new Date().toISOString() })
    .eq('id', internId);

  // Write Audit Log
  try {
    await supabase.from('audit_logs').insert([
      {
        actor_id: currentUser.id,
        action: existingItv ? 'interview_updated' : 'interview_scheduled',
        entity_type: 'interviews',
        entity_id: itvId,
        new_data: { ...payload, interviewerName, platform },
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (auditErr) {
    console.warn('Audit log write note:', auditErr);
  }

  return { success: true, interviewId: itvId, message: 'Interview schedule saved successfully.' };
}

/**
 * 5. Complete / Evaluate Interview
 * Results: 'Selected' | 'Rejected' | 'On Hold'
 */
export async function evaluateInterview({ internId, result, score, feedback }) {
  if (!result) throw new Error('Interview Result selection is required.');

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Unauthorized: Must be logged in as Super Admin.');

  // Fetch interview record
  const { data: existingItv } = await supabase
    .from('interviews')
    .select('id')
    .eq('intern_id', internId)
    .maybeSingle();

  const isSelected = result === 'Selected';
  const isRejected = result === 'Rejected';

  const itvStatus = isSelected ? 'Completed' : isRejected ? 'Rejected' : 'On Hold';

  const itvPayload = {
    intern_id: internId,
    scheduled_by: currentUser.id,
    status: itvStatus,
    score: score ? parseFloat(score) : null,
    feedback: feedback || null,
    completed_at: isSelected ? new Date().toISOString() : null,
  };

  if (existingItv) {
    await supabase.from('interviews').update(itvPayload).eq('id', existingItv.id);
  } else {
    await supabase.from('interviews').insert([itvPayload]);
  }

  // Handle Progression if Selected
  if (isSelected) {
    await updateOnboardingStepProgress(internId, { interview_completed: true });
    await supabase
      .from('profiles')
      .update({ onboarding_status: 'allocation_pending', updated_at: new Date().toISOString() })
      .eq('id', internId);
  }

  // Audit Action Key
  const actionKey = isSelected
    ? 'interview_completed'
    : isRejected
    ? 'interview_rejected'
    : 'interview_put_on_hold';

  try {
    await supabase.from('audit_logs').insert([
      {
        actor_id: currentUser.id,
        action: actionKey,
        entity_type: 'interviews',
        entity_id: existingItv?.id || internId,
        new_data: { result, score, feedback },
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (auditErr) {
    console.warn('Audit log write note:', auditErr);
  }

  return { success: true, result, status: itvStatus };
}


/**
 * 7. Allocate Problem Statement & Admin to Intern (Phase 5)
 * Performs database updates across:
 * - profiles (problem_statement_id, assigned_admin_id, onboarding_status = 'problem_statement_allocated', account_status = 'active')
 * - onboarding_progress (problem_statement_allocated = true, completion_percentage = 100)
 * - audit_logs (insert "Problem Statement Allocated" event)
 */
export async function allocateProblemStatement({
  internId,
  problemStatementId,
  assignedAdminId,
  remarks,
}) {
  if (!internId) throw new Error('Intern ID is required.');
  if (!problemStatementId) throw new Error('Problem Statement selection is required.');
  if (!assignedAdminId) throw new Error('Assigned Admin selection is required.');

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Unauthorized: Must be logged in as Super Admin.');

  // 1. Update onboarding_progress row
  const { progress, isFullyCompleted } = await updateOnboardingStepProgress(internId, {
    problem_statement_allocated: true,
  });

  // 2. Update profiles table with allocated PS & Assigned Admin
  const profileUpdates = {
    problem_statement_id: problemStatementId,
    onboarding_status: 'completed',
    account_status: 'active',
    updated_at: new Date().toISOString(),
  };

  const { error: profileErr } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', internId);

  if (profileErr) throw profileErr;

  // 3. Record allocation in intern_problem_statement_history
  try {
    await supabase.from('intern_problem_statement_history').insert([
      {
        intern_id: internId,
        problem_statement_id: problemStatementId,
        allocated_by: currentUser.id,
        allocation_note: remarks || 'Allocated by Super Admin',
        allocated_at: new Date().toISOString(),
      },
    ]);
  } catch (histErr) {
    console.warn('Note on problem statement history record:', histErr);
  }

  // 4. Insert Audit Log
  try {
    await supabase.from('audit_logs').insert([
      {
        actor_id: currentUser.id,
        action: 'Problem Statement Allocated',
        entity_type: 'profiles',
        entity_id: internId,
        new_data: {
          intern_id: internId,
          problem_statement_id: problemStatementId,
          assigned_admin_id: assignedAdminId,
          allocated_by: currentUser.id,
          remarks: remarks || null,
        },
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (auditErr) {
    console.warn('Audit log write note:', auditErr);
  }

  return { success: true, progress, isFullyCompleted };
}

/**
 * 6. Fetch Audit Logs for a specific Intern
 */
export async function fetchInternAuditLogs(internId) {
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_id', internId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Note fetching audit logs:', error);
    return [];
  }

  return logs || [];
}
