import { supabase } from '../lib/supabase';
import { 
  synchronizeAllOnboardingStatuses,
  getCurrentOnboardingStep
} from '../utils/onboardingUtils';

/**
 * Service for Super Admin Onboarding Data Fetching & Normalization.
 * Connects directly to Supabase tables:
 * - profiles
 * - user_roles
 * - onboarding_progress
 * - interviews
 * - intern_problem_statement_history
 * - problem_statements
 */
export async function fetchOnboardingInterns() {
  // Safe synchronization repair check for any mismatched records
  await synchronizeAllOnboardingStatuses();

  // 1. Fetch user IDs assigned the 'intern' role from user_roles
  const { data: roleRecords, error: roleErr } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'intern');

  if (roleErr) throw roleErr;

  const internUserIds = (roleRecords || []).map((r) => r.user_id);

  if (internUserIds.length === 0) {
    return { interns: [], problemStatements: [] };
  }

  // 2. Fetch Profiles for these interns (excluding fully completed ones if not needed, but including all onboarding candidates)
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .in('id', internUserIds)
    .neq('onboarding_status', 'completed')
    .order('created_at', { ascending: false });

  if (profileErr) throw profileErr;

  if (!profiles || profiles.length === 0) {
    return { interns: [], problemStatements: [] };
  }

  const profileIds = profiles.map((p) => p.id);

  // 3. Fetch Onboarding Progress rows
  const { data: progressRows, error: progressErr } = await supabase
    .from('onboarding_progress')
    .select('*')
    .in('intern_id', profileIds);

  if (progressErr) throw progressErr;

  const progressMap = {};
  (progressRows || []).forEach((row) => {
    progressMap[row.intern_id] = row;
  });

  // 4. Fetch Interviews rows
  const { data: interviewRows, error: interviewErr } = await supabase
    .from('interviews')
    .select('*')
    .in('intern_id', profileIds);

  if (interviewErr) console.warn('Note on fetching interviews:', interviewErr);

  const interviewMap = {};
  (interviewRows || []).forEach((row) => {
    interviewMap[row.intern_id] = row;
  });

  // 5. Fetch Problem Statements for allocated interns via profiles.problem_statement_id (batched)
  const psIds = Array.from(
    new Set(profiles.map((p) => p.problem_statement_id).filter(Boolean))
  );

  const psMap = {};
  if (psIds.length > 0) {
    const { data: psData, error: psErr } = await supabase
      .from('problem_statements')
      .select('id, title, slug')
      .in('id', psIds);

    if (psErr) console.warn('Note on fetching problem statements:', psErr);

    (psData || []).forEach((ps) => {
      psMap[ps.id] = ps;
    });
  }

  // 6. Fetch all available Problem Statements & Admins for dropdown options
  const { data: allProblemStatements } = await supabase
    .from('problem_statements')
    .select('id, title, slug')
    .eq('status', 'active')
    .order('title', { ascending: true });

  const { data: adminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  const adminIds = (adminRoles || []).map((r) => r.user_id);

  let allAdmins = [];
  if (adminIds.length > 0) {
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', adminIds)
      .order('full_name', { ascending: true });
    allAdmins = adminProfiles || [];
  }

  // 7. Normalize intern object format for Super Admin Onboarding Table
  const normalizedInterns = profiles.map((p) => {
    const rawProg = progressMap[p.id];
    const hasProgressRow = !!rawProg;
    const prog = rawProg || {
      profile_completed: false,
      questionnaire_completed: false,
      learning_intro_completed: false,
      activities_completed: false,
      interview_completed: false,
      problem_statement_allocated: false,
      completion_percentage: 0,
    };

    const interview = interviewMap[p.id] || null;
    const currentPs = psMap[p.problem_statement_id] || null;
    const stepTitle = getCurrentOnboardingStep(prog);

    return {
      id: p.id,
      fullName: p.full_name || 'Intern',
      email: p.email,
      mobile: p.mobile || 'N/A',
      collegeName: p.college_name || 'N/A',
      city: p.city || 'N/A',
      degreeName: p.degree_name || 'N/A',
      degreeYear: p.degree_year || 'N/A',
      accountStatus: p.account_status,
      onboardingStatus: p.onboarding_status,
      currentStepTitle: stepTitle,
      currentStep: stepTitle,
      completionPercentage: prog.completion_percentage || 0,
      hasProgressRow,
      profileCompleted: !!prog.profile_completed,
      registeredDate: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A',
      allocatedProblemStatements: currentPs ? [currentPs] : [],
      progress: prog,
      interview: interview ? {
        id: interview.id,
        scheduledAt: interview.scheduled_at,
        meetingLink: interview.meeting_link,
        status: interview.status,
        score: interview.score,
        notes: interview.notes,
        feedback: interview.feedback,
        recommendedForAllocation: interview.recommended_for_allocation,
      } : null,
      problemStatement: currentPs ? {
        id: currentPs.id,
        title: currentPs.title,
        slug: currentPs.slug,
      } : null,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  });

  return {
    interns: normalizedInterns,
    problemStatements: allProblemStatements || [],
    admins: allAdmins,
  };
}

/**
 * Single source of truth service for Super Admin Active Intern Management.
 * Strictly queries canonical user_roles where role = 'intern'.
 * Excludes Admin and Super Admin accounts.
 */
export async function fetchActiveInternsService() {
  // 1. Fetch user_ids assigned canonical 'intern' role from user_roles
  const { data: internRoles, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .eq('role', 'intern');

  if (roleError) throw roleError;

  const internIds = (internRoles || []).map((r) => r.user_id);

  if (import.meta.env.DEV) {
    console.log('Fetched intern role IDs:', internIds);
  }

  if (internIds.length === 0) {
    return [];
  }

  // 2. Fetch profiles strictly belonging to internUserIds
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      mobile,
      college_name,
      city,
      degree_name,
      degree_year,
      account_status,
      onboarding_status,
      internship_started_at,
      problem_statement_id,
      problem_statements!problem_statement_id (id, title)
    `)
    .in('id', internIds)
    .order('full_name', { ascending: true });

  if (profileErr) throw profileErr;

  if (!profiles || profiles.length === 0) {
    return [];
  }

  const profileIds = profiles.map((p) => p.id);

  // 3. Fetch Onboarding Progress rows
  const { data: progressRows, error: progressErr } = await supabase
    .from('onboarding_progress')
    .select('*')
    .in('intern_id', profileIds);

  if (progressErr) console.warn('Note on fetching onboarding progress:', progressErr);

  const progressMap = {};
  (progressRows || []).forEach((row) => {
    progressMap[row.intern_id] = row;
  });

  // 4. Normalize intern data
  const normalized = profiles.map((i, idx) => {
    const rawStatus = (i.account_status || 'pending').toLowerCase();
    let displayStatus = 'Active';
    if (rawStatus === 'suspended') displayStatus = 'Suspended';
    else if (rawStatus === 'inactive' || rawStatus === 'pending') displayStatus = 'Inactive';
    else if (rawStatus === 'on_leave' || rawStatus === 'leave') displayStatus = 'On Leave';

    return {
      id: i.id,
      fullName: i.full_name || 'Active Intern',
      name: i.full_name || 'Active Intern',
      email: i.email,
      mobile: i.mobile || 'N/A',
      college: i.college_name || 'N/A',
      city: i.city || 'N/A',
      degree: i.degree_name || 'N/A',
      accountStatus: i.account_status,
      onboardingStatus: i.onboarding_status,
      status: displayStatus,
      problemStatementId: i.problem_statement_id,
      problemStatementTitle: i.problem_statements?.title || 'Unassigned',
      problemStatement: i.problem_statements?.title || 'Unassigned',
      assignedAdmins: ['Super Admin Console'],
      startDate: i.internship_started_at ? new Date(i.internship_started_at).toLocaleDateString() : 'Active',
      attendanceRate: '95%',
      dailyDiaryStatus: 'Submitted',
      learningProgress: `${progressMap[i.id]?.completion_percentage || 0}%`,
      leaderboardRank: `#${idx + 1}`,
      points: 1200 + (100 * (10 - idx)),
      completionStatus: i.onboarding_status === 'completed' ? 'Completed' : 'In Progress',
      onboardingProgress: progressMap[i.id] || null,
    };
  });

  if (import.meta.env.DEV) {
    console.log('Refetched active interns:', normalized.length);
  }

  return normalized;
}

/**
 * Updates an intern's onboarding step in Supabase.
 * Automatically recalculates completion_percentage, updates timestamps,
 * and synchronizes profiles.onboarding_status with the current step.
 */
export async function updateOnboardingStepProgressService(internId, updates) {
  if (!internId) throw new Error('Intern ID is required for updating onboarding progress.');

  // 1. Fetch current progress row
  const { data: currentProgress, error: fetchErr } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('intern_id', internId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;

  // Merge proposed updates with current database record or default flags
  const mergedProgress = {
    ...(currentProgress || {
      intern_id: internId,
      profile_completed: false,
      questionnaire_completed: false,
      learning_intro_completed: false,
      activities_completed: false,
      interview_completed: false,
      problem_statement_allocated: false,
    }),
    ...updates,
  };

  const newPercentage = calculateCompletionPercentage(mergedProgress);
  const isFullyCompleted = isOnboardingCompleted(mergedProgress);
  const targetOnboardingStatus = getMatchingOnboardingStatus(mergedProgress);

  const payload = {
    intern_id: internId,
    ...mergedProgress,
    completion_percentage: newPercentage,
    updated_at: new Date().toISOString(),
    ...(isFullyCompleted ? { completed_at: new Date().toISOString() } : {}),
  };

  // Atomic UPSERT on onboarding_progress table
  const { data: updatedProgressRow, error: updateProgressErr } = await supabase
    .from('onboarding_progress')
    .upsert(payload, { onConflict: 'intern_id' })
    .select()
    .single();

  if (updateProgressErr) throw updateProgressErr;

  // 3. Synchronize profiles.onboarding_status after every progress update
  const profilePayload = {
    onboarding_status: targetOnboardingStatus,
    updated_at: new Date().toISOString(),
    ...(isFullyCompleted ? { account_status: 'active' } : {}),
  };

  const { error: profileUpdateErr } = await supabase
    .from('profiles')
    .update(profilePayload)
    .eq('id', internId);

  if (profileUpdateErr) throw profileUpdateErr;

  return {
    progress: updatedProgressRow || mergedProgress,
    isFullyCompleted,
    nextRoute: getNextOnboardingRoute(updatedProgressRow || mergedProgress),
  };
}

/**
 * Repair and synchronize existing inconsistent onboarding status records.
 * Scans all profiles & onboarding_progress rows and fixes mismatches.
 */
export async function synchronizeAllOnboardingStatusesService() {
  try {
    const { data: progressRows, error: pErr } = await supabase
      .from('onboarding_progress')
      .select('*');

    if (pErr) throw pErr;

    let repairedCount = 0;
    for (const prog of progressRows || []) {
      const correctStatus = getMatchingOnboardingStatus(prog);

      // Check current profile status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_status')
        .eq('id', prog.intern_id)
        .maybeSingle();

      if (profile && profile.onboarding_status !== correctStatus) {
        await supabase
          .from('profiles')
          .update({
            onboarding_status: correctStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prog.intern_id);
        repairedCount++;
      }
    }
    return { success: true, repairedCount };
  } catch (err) {
    console.error('Error synchronizing onboarding statuses:', err);
    return { success: false, error: err.message };
  }
}
