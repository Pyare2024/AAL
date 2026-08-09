import { supabase } from '../lib/supabase';

export const adminManagementService = {
  /**
   * Fetch all Admin KPIs and list of admins via secure RPC
   */
  async fetchAdminData() {
    const { data, error } = await supabase.rpc('get_admin_kpis_and_list');
    
    if (error) {
      console.error('[AdminManagementService] fetchAdminData error:', error);
      throw new Error(error.message || 'Failed to load Admin data.');
    }
    return data;
  },

  /**
   * Fetch available problem statements
   */
  async fetchProblemStatements() {
    const { data, error } = await supabase
      .from('problem_statements')
      .select('id, title, slug, status')
      .order('title', { ascending: true });

    if (error) {
      console.error('[AdminManagementService] fetchProblemStatements error:', error);
      throw new Error(error.message || 'Failed to load Problem Statements.');
    }
    return data || [];
  },

  /**
   * Securely update an Admin's profile and problem statement assignments
   */
  async updateAdmin(adminId, fullName, mobile, status, psIds) {
    const { data, error } = await supabase.rpc('update_admin_with_assignments', {
      p_admin_id: adminId,
      p_full_name: fullName.trim(),
      p_mobile: mobile.trim(),
      p_status: status,
      p_ps_ids: psIds
    });

    if (error) {
      console.error('[AdminManagementService] updateAdmin error:', error);
      throw new Error(error.message || 'Failed to update Admin account.');
    }
    return data;
  },

  /**
   * Update an Admin's status (Activate/Deactivate/Delete) without changing assignments
   */
  async updateAdminStatus(adminId, newStatus) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ account_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', adminId)
      .select()
      .single();

    if (error) {
      console.error('[AdminManagementService] updateAdminStatus error:', error);
      throw new Error(error.message || `Failed to change status to ${newStatus}`);
    }
    return data;
  },

  /**
   * Creates a new Admin user account securely using Edge Function.
   */
  async createAdminAccount({
    fullName,
    email,
    mobile,
    password,
    accountStatus = 'active',
    selectedProblemStatementIds = [],
  }) {
    // 1. Check for duplicate email in profiles before invoking edge function
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      throw new Error('An account with this email address already exists.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
       throw new Error('Your Super Admin session has expired. Please log in again.');
    }

    // 2. Invocation of Supabase Edge Function 'create-admin'
    console.log('Invoking create-admin Edge Function');
    const { data: edgeFunctionData, error: edgeErr } = await supabase.functions.invoke('create-admin', {
      body: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        password,
        accountStatus,
        problemStatementIds: selectedProblemStatementIds
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    console.log('Edge Function response:', { edgeFunctionData, edgeErr });

    if (edgeErr || !edgeFunctionData?.success) {
      throw new Error(
        edgeErr?.message || edgeFunctionData?.message || 'Failed to create admin account via secure service.'
      );
    }

    return edgeFunctionData;
  }
};
