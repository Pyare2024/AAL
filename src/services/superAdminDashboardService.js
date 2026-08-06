import { supabase } from '../lib/supabase';

/**
 * Super Admin Dashboard Service
 * Fetches real-time, normalized metrics and lists from Supabase DB tables:
 * - user_roles
 * - profiles
 * - problem_statements
 * - admin_problem_statements
 * - onboarding_progress
 */
export async function fetchSuperAdminDashboardStats() {
  // 1. Fetch Admin Roles & Profiles
  const { data: adminRoles, error: adminRolesErr } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  if (adminRolesErr) throw adminRolesErr;

  const adminIds = (adminRoles || []).map((r) => r.user_id);
  let totalAdmins = 0;
  let activeAdmins = 0;
  let inactiveAdmins = 0;
  let adminProfilesList = [];

  if (adminIds.length > 0) {
    const { data: adminProfiles, error: adminProfErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, account_status')
      .in('id', adminIds);

    if (adminProfErr) throw adminProfErr;

    // Fetch Allocated Problem Statements for Admins
    const { data: adminPsData } = await supabase
      .from('admin_problem_statements')
      .select('admin_id, problem_statements!problem_statement_id (title)')
      .in('admin_id', adminIds);

    const adminPsMap = {};
    (adminPsData || []).forEach((row) => {
      if (!adminPsMap[row.admin_id]) adminPsMap[row.admin_id] = [];
      if (row.problem_statements?.title) {
        adminPsMap[row.admin_id].push(row.problem_statements.title);
      }
    });

    totalAdmins = (adminProfiles || []).length;
    adminProfilesList = (adminProfiles || []).map((p) => {
      const status = (p.account_status || 'pending').toLowerCase();
      if (status === 'active') {
        activeAdmins++;
      } else {
        inactiveAdmins++;
      }
      return {
        id: p.id,
        name: p.full_name || 'Admin User',
        email: p.email,
        status: status === 'active' ? 'Active' : 'Inactive',
        problemStatements: adminPsMap[p.id] || [],
      };
    });
  }

  // 2. Fetch Problem Statements & Admin Allocation Metrics
  const { data: psRows, error: psErr } = await supabase
    .from('problem_statements')
    .select('id, title, slug, status');

  if (psErr) throw psErr;

  const totalProblemStatements = (psRows || []).length;
  const activeProjects = (psRows || []).filter((p) => (p.status || '').toLowerCase() === 'active').length;

  // Distinct allocated problem statements assigned to Admins
  const { data: allocatedPsRows, error: allocErr } = await supabase
    .from('admin_problem_statements')
    .select('problem_statement_id');

  if (allocErr) console.warn('Note on fetching admin_problem_statements:', allocErr);

  const allocatedProblemStatements = Array.from(
    new Set((allocatedPsRows || []).map((r) => r.problem_statement_id).filter(Boolean))
  ).length;

  // Fetch Intern Count per Problem Statement
  const { data: internProfilesWithPs } = await supabase
    .from('profiles')
    .select('problem_statement_id');

  const psInternCountMap = {};
  (internProfilesWithPs || []).forEach((p) => {
    if (p.problem_statement_id) {
      psInternCountMap[p.problem_statement_id] = (psInternCountMap[p.problem_statement_id] || 0) + 1;
    }
  });

  const problemStatementsList = (psRows || []).map((ps) => ({
    id: ps.id,
    title: ps.title,
    slug: ps.slug || 'n-a',
    status: (ps.status || 'active').toLowerCase() === 'active' ? 'Active' : 'Inactive',
    internsCount: psInternCountMap[ps.id] || 0,
  }));

  // 3. Fetch Intern Roles & Profiles
  const { data: internRoles, error: internRolesErr } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'intern');

  if (internRolesErr) throw internRolesErr;

  const internIds = (internRoles || []).map((r) => r.user_id);

  let onboardingInternsCount = 0;
  let waitingInterviewCount = 0;
  let totalPlatformActiveInterns = 0;
  let onboardingInternsList = [];

  if (internIds.length > 0) {
    const { data: internProfiles, error: internProfErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, account_status, onboarding_status')
      .in('id', internIds);

    if (internProfErr) throw internProfErr;

    // Fetch Onboarding Progress for interview waiting calculation
    const { data: progressRows } = await supabase
      .from('onboarding_progress')
      .select('intern_id, profile_completed, questionnaire_completed, learning_intro_completed, activities_completed, interview_completed, completion_percentage')
      .in('intern_id', internIds);

    const progressMap = {};
    (progressRows || []).forEach((r) => {
      progressMap[r.intern_id] = r;
    });

    (internProfiles || []).forEach((p) => {
      const onbStatus = (p.onboarding_status || 'profile_pending').toLowerCase();
      const accStatus = (p.account_status || 'pending').toLowerCase();

      // Onboarding intern count (not fully completed onboarding)
      if (onbStatus !== 'completed') {
        onboardingInternsCount++;
        const prog = progressMap[p.id];
        let currentStep = 'Profile Completion';
        if (prog?.profile_completed) currentStep = 'Technical Questionnaire';
        if (prog?.questionnaire_completed) currentStep = 'Simple LMS Learning';
        if (prog?.learning_intro_completed) currentStep = 'Seven Mandatory Activities';
        if (prog?.activities_completed) currentStep = 'Interview Evaluation';

        onboardingInternsList.push({
          id: p.id,
          name: p.full_name || 'Onboarding Candidate',
          email: p.email,
          currentStep,
          progressPct: prog?.completion_percentage || 0,
          profileCompleted: !!prog?.profile_completed,
          questionnaireCompleted: !!prog?.questionnaire_completed,
          learningCompleted: !!prog?.learning_intro_completed,
          activitiesCompleted: !!prog?.activities_completed,
          interviewCompleted: !!prog?.interview_completed,
          allocatedPS: null,
          skippedSteps: [],
        });
      }

      // Waiting interview condition
      const prog = progressMap[p.id];
      const isWaitingInterview =
        onbStatus === 'interview_pending' ||
        (prog &&
          prog.profile_completed &&
          prog.questionnaire_completed &&
          prog.learning_intro_completed &&
          prog.activities_completed &&
          !prog.interview_completed);

      if (isWaitingInterview) {
        waitingInterviewCount++;
      }

      // Total platform active interns: role=intern and account_status in (active, on_leave)
      if (accStatus === 'active' || accStatus === 'on_leave' || accStatus === 'leave') {
        totalPlatformActiveInterns++;
      }
    });
  }

  // 4. Fetch Announcement Summary
  const { data: announcementSummary, error: announcementErr } = await supabase.rpc('get_announcement_summary');
  if (announcementErr) console.warn('Note on fetching announcement_summary:', announcementErr);

  return {
    admins: {
      total: totalAdmins,
      active: activeAdmins,
      inactive: inactiveAdmins,
      list: adminProfilesList,
    },
    problemStatements: {
      total: totalProblemStatements,
      allocated: allocatedProblemStatements || totalProblemStatements,
      active: activeProjects,
      list: problemStatementsList,
    },
    onboardingInterns: {
      total: onboardingInternsCount,
      waitingInterview: waitingInterviewCount,
      list: onboardingInternsList,
    },
    platformInterns: {
      total: totalPlatformActiveInterns,
      active: totalPlatformActiveInterns,
    },
    announcements: {
      published: announcementSummary?.published || 0,
      scheduled: announcementSummary?.scheduled || 0,
    }
  };
}

/**
 * Subscribes to real-time changes for Super Admin Dashboard tables
 */
export function subscribeToSuperAdminDashboardChanges(onPayloadCallback) {
  const channel = supabase
    .channel('realtime_super_admin_dashboard_v2')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, onPayloadCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onPayloadCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_statements' }, onPayloadCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_problem_statements' }, onPayloadCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'onboarding_progress' }, onPayloadCallback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
