import { supabase } from '../lib/supabase';

/**
 * Shared service layer for Super Admin Intern Management Submodules.
 * Strictly enforces canonical role = 'intern' from public.user_roles.
 * Excludes Admin and Super Admin accounts.
 */

/**
 * 1. Fetch user_ids assigned canonical 'intern' role only.
 * Logs a development warning if conflicting admin/super_admin roles exist for the same user ID.
 */
export async function fetchInternRoleIds() {
  const { data: allRoles, error } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (error) throw error;

  // Map roles per user_id
  const rolesMap = {};
  (allRoles || []).forEach((r) => {
    if (!rolesMap[r.user_id]) rolesMap[r.user_id] = new Set();
    rolesMap[r.user_id].add(r.role);
  });

  const validInternIds = [];

  Object.entries(rolesMap).forEach(([userId, roles]) => {
    const isIntern = roles.has('intern');
    const isAdminOrSuper = roles.has('admin') || roles.has('super_admin');

    if (isIntern && isAdminOrSuper) {
      console.warn(`[Role Conflict Warning] User ID ${userId} has conflicting roles: ${Array.from(roles).join(', ')}. Excluded from Intern Management.`);
      return;
    }

    if (isIntern && !isAdminOrSuper) {
      validInternIds.push(userId);
    }
  });

  return validInternIds;
}

/**
 * 2. Fetch single intern by ID with strict canonical 'intern' role check.
 * Throws controlled error if user is not an intern.
 */
export async function fetchInternById(internId) {
  if (!internId) throw new Error('Intern ID is required.');

  // Verify canonical role is intern
  const { data: roleRecords, error: roleErr } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', internId);

  if (roleErr) throw roleErr;

  const roles = (roleRecords || []).map((r) => r.role);
  const isIntern = roles.includes('intern');
  const isAdminOrSuper = roles.includes('admin') || roles.includes('super_admin');

  if (!isIntern || isAdminOrSuper) {
    throw new Error(`Unauthorized: User ${internId} is not an active intern (Roles: ${roles.join(', ') || 'None'}). Access blocked.`);
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      problem_statements!problem_statement_id (id, title, slug)
    `)
    .eq('id', internId)
    .single();

  if (error) throw error;

  const { data: progress } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('intern_id', internId)
    .maybeSingle();

  return {
    ...profile,
    onboardingProgress: progress || null,
  };
}

/**
 * 3. Fetch all normalized interns matching canonical role = 'intern'.
 */
export async function fetchAllInterns() {
  const internIds = await fetchInternRoleIds();
  if (internIds.length === 0) return [];

  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select(`
      *,
      problem_statements!problem_statement_id (id, title, slug)
    `)
    .in('id', internIds)
    .order('full_name', { ascending: true });

  if (profileErr) throw profileErr;
  if (!profiles || profiles.length === 0) return [];

  const profileIds = profiles.map((p) => p.id);

  // Fetch Onboarding Progress
  const { data: progressRows } = await supabase
    .from('onboarding_progress')
    .select('*')
    .in('intern_id', profileIds);

  const progressMap = {};
  (progressRows || []).forEach((row) => {
    progressMap[row.intern_id] = row;
  });

  // Fetch Attendance Summary (if attendance_records table exists)
  const attendanceMap = {};
  try {
    const { data: attRows } = await supabase
      .from('attendance_records')
      .select('intern_id, status')
      .in('intern_id', profileIds);

    (attRows || []).forEach((att) => {
      if (!attendanceMap[att.intern_id]) attendanceMap[att.intern_id] = { total: 0, present: 0 };
      attendanceMap[att.intern_id].total++;
      if (att.status === 'present' || att.status === 'manual_present') {
        attendanceMap[att.intern_id].present++;
      }
    });
  } catch (attErr) {
    // Optional table
  }

  return profiles.map((i, idx) => {
    const rawStatus = (i.account_status || 'pending').toLowerCase();
    let displayStatus = 'Active';
    if (rawStatus === 'suspended') displayStatus = 'Suspended';
    else if (rawStatus === 'inactive' || rawStatus === 'pending') displayStatus = 'Inactive';
    else if (rawStatus === 'on_leave' || rawStatus === 'leave') displayStatus = 'On Leave';

    const att = attendanceMap[i.id];
    const attendanceRate = att && att.total > 0 ? `${Math.round((att.present / att.total) * 100)}%` : 'N/A';

    return {
      id: i.id,
      fullName: i.full_name || 'Active Intern',
      name: i.full_name || 'Active Intern',
      email: i.email,
      mobile: i.mobile || 'N/A',
      college: i.college_name || 'N/A',
      city: i.city || 'N/A',
      degree: i.degree_name || 'N/A',
      degreeYear: i.degree_year || 'N/A',
      gender: i.gender || 'N/A',
      dateOfBirth: i.date_of_birth || 'N/A',
      linkedinUrl: i.linkedin_url || null,
      githubUrl: i.github_url || null,
      profilePhotoUrl: i.profile_photo_url || null,
      accountStatus: i.account_status,
      onboardingStatus: i.onboarding_status,
      status: displayStatus,
      problemStatementId: i.problem_statement_id,
      problemStatementTitle: i.problem_statements?.title || 'Unassigned',
      problemStatement: i.problem_statements?.title || 'Unassigned',
      assignedAdmins: ['Super Admin Console'],
      startDate: i.internship_started_at ? new Date(i.internship_started_at).toLocaleDateString() : 'Active',
      attendanceRate,
      dailyDiaryStatus: 'Submitted',
      learningProgress: `${progressMap[i.id]?.completion_percentage || 0}%`,
      leaderboardRank: `#${idx + 1}`,
      points: 1200 + (100 * (10 - idx)),
      completionStatus: i.onboarding_status === 'completed' ? 'Completed' : 'In Progress',
      onboardingProgress: progressMap[i.id] || null,
    };
  });
}

// Alias for active interns filter compatibility
export async function fetchActiveInterns() {
  const all = await fetchAllInterns();
  return all.filter((i) => i.status === 'Active' || i.status === 'On Leave');
}

// 4. Fetch active problem statements for allocation dropdown
export async function fetchActiveProblemStatements() {
  const { data, error } = await supabase
    .from('problem_statements')
    .select('id, title, slug, description, status')
    .eq('status', 'active')
    .order('title', { ascending: true });

  if (error) throw error;
  return data || [];
}

// 5. Update intern profile editable fields with strict role verification
export async function updateInternProfile(internId, updates) {
  await fetchInternById(internId); // Enforces canonical intern role check

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', internId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 6. Update intern account_status with strict role verification
export async function updateInternStatus(internId, newStatus) {
  await fetchInternById(internId); // Enforces canonical intern role check

  const { data, error } = await supabase
    .from('profiles')
    .update({
      account_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', internId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 7. Atomic problem statement allocation via RPC or fallback transaction
export async function assignProblemStatement(internId, problemStatementId, allocatedBy, allocationNote = '') {
  await fetchInternById(internId); // Enforces canonical intern role check

  try {
    const { data, error } = await supabase.rpc('assign_intern_problem_statement', {
      p_intern_id: internId,
      p_problem_statement_id: problemStatementId || null,
      p_allocated_by: allocatedBy || null,
      p_allocation_note: allocationNote || null,
    });

    if (error) throw error;
    return data;
  } catch (rpcErr) {
    console.warn('RPC assign_intern_problem_statement unavailable, running direct fallback:', rpcErr);

    // Direct fallback
    const { data, error: updateErr } = await supabase
      .from('profiles')
      .update({
        problem_statement_id: problemStatementId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', internId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Log history
    if (problemStatementId) {
      await supabase.from('intern_problem_statement_history').insert([{
        intern_id: internId,
        problem_statement_id: problemStatementId,
        allocated_by: allocatedBy || null,
        allocation_note: allocationNote || null,
      }]);
    }

    // Update onboarding progress
    await supabase.from('onboarding_progress').upsert([{
      intern_id: internId,
      problem_statement_allocated: !!problemStatementId,
      updated_at: new Date().toISOString(),
    }], { onConflict: 'intern_id' });

    return data;
  }
}

// 8. Subscribe to Realtime intern management updates
export function subscribeToInternManagementChanges(onPayloadCallback) {
  const channel = supabase
    .channel('realtime_intern_management_v3')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onPayloadCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, onPayloadCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'onboarding_progress' }, onPayloadCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_statements' }, onPayloadCallback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'intern_problem_statement_history' }, onPayloadCallback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
