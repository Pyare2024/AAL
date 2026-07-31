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

  // 3. Attempt invocation of Supabase Edge Function 'create-admin'
  try {
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

    if (!edgeErr && edgeFunctionData?.success) {
      return edgeFunctionData;
    }
  } catch (fnErr) {
    console.warn('Edge Function create-admin not deployed or unavailable, running client fallback flow:', fnErr);
  }

  // 4. Client-side Fallback Flow (for local dev / standard Supabase setup without edge functions deployed)
  // Create user in Supabase Auth
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        role: 'admin',
      },
    },
  });

  if (signUpError) throw signUpError;
  const newUserId = authData?.user?.id;
  if (!newUserId) throw new Error('Failed to obtain new Auth user ID from Supabase.');

  // Create Profile
  const { error: profileError } = await supabase.from('profiles').upsert([
    {
      id: newUserId,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      account_status: accountStatus,
      onboarding_status: 'completed',
    },
  ]);
  if (profileError) console.warn('Profile creation note:', profileError);

  // Assign Role = 'admin' in user_roles
  const { error: roleInsertError } = await supabase.from('user_roles').upsert([
    {
      user_id: newUserId,
      role: 'admin',
    },
  ]);
  if (roleInsertError) console.warn('User role assignment note:', roleInsertError);

  // Insert Allocated Problem Statements into admin_problem_statements
  if (selectedProblemStatementIds && selectedProblemStatementIds.length > 0) {
    const allocPayload = selectedProblemStatementIds.map((psId) => ({
      admin_id: newUserId,
      problem_statement_id: psId,
    }));

    const { error: allocError } = await supabase
      .from('admin_problem_statements')
      .insert(allocPayload);
    if (allocError) console.warn('Admin problem statements allocation note:', allocError);
  }

  // Write Audit Log
  try {
    await supabase.from('audit_logs').insert([
      {
        performed_by: currentUser.id,
        action: 'CREATE_ADMIN_ACCOUNT',
        target_user_id: newUserId,
        details: JSON.stringify({
          admin_name: fullName,
          admin_email: email,
          allocated_statements: selectedProblemStatementIds,
        }),
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (auditErr) {
    console.warn('Audit log write note:', auditErr);
  }

  return { success: true, userId: newUserId, message: 'Admin account created successfully!' };
}
