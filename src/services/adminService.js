import { supabase } from '../lib/supabase';

/**
 * Creates a new Admin user account securely.
 * Handles the full workflow:
 * 1. Verification of Super Admin caller
 * 2. Invocation of Edge Function (create-admin) or Supabase client fallback
 * 3. Synchronization across profiles, user_roles, admin_problem_statements, and audit_logs.
 */
export async function createAdminAccount({
  fullName,
  email,
  mobile,
  password,
  accountStatus = 'active',
  selectedProblemStatementIds = [],
}) {
  // 1. Check current logged-in user and verify role
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    throw new Error('Unauthorized: You must be logged in as Super Admin to perform this action.');
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (roleData?.role !== 'super_admin') {
    throw new Error('Forbidden: Only Super Admin can create Admin accounts.');
  }

  // 2. Check for duplicate email in profiles
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (existingProfile) {
    throw new Error('An account with this email address already exists.');
  }

  // 3. Invocation of Supabase Edge Function 'create-admin'
  const { data: edgeFunctionData, error: edgeErr } = await supabase.functions.invoke('create-admin', {
    body: {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      password,
      accountStatus,
      problemStatementIds: selectedProblemStatementIds,
      createdBy: currentUser.id,
    },
  });

  if (edgeErr || !edgeFunctionData?.success) {
    throw new Error(
      `Failed to create admin account via Edge Function: ${
        edgeErr?.message || edgeFunctionData?.message || 'Service unavailable'
      }`
    );
  }

  // 4. Record Audit Log for successful creation
  try {
    await supabase.from('audit_logs').insert([
      {
        actor_id: currentUser.id,
        action: 'CREATE_ADMIN_ACCOUNT',
        entity_type: 'profiles',
        entity_id: edgeFunctionData.userId,
        new_data: {
          admin_name: fullName,
          admin_email: email,
          allocated_statements: selectedProblemStatementIds,
        },
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (auditErr) {
    console.warn('Audit log write note:', auditErr);
  }

  return edgeFunctionData;
}

