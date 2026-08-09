// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validate Caller JWT and retrieve auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, message: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ success: false, message: 'Server configuration error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Client to verify the caller
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser(token);
    
    if (authError || !caller) {
      console.error('Caller verification failed:', authError);
      return new Response(JSON.stringify({ success: false, message: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify caller is Super Admin
    const { data: isSuperAdmin, error: rpcError } = await callerClient.rpc('is_super_admin');
    if (rpcError || !isSuperAdmin) {
      console.error('Super Admin check failed:', rpcError);
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized: Super Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Parse request body
    const { fullName, email, mobile, password, accountStatus, problemStatementIds, createdBy } = await req.json();

    if (!fullName || !email || !password) {
      return new Response(JSON.stringify({ success: false, message: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Admin Client for Service Role operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Create Auth User
    const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm for internally provisioned admins
      user_metadata: { full_name: fullName.trim() }
    });

    if (createAuthError || !authData?.user) {
      console.error('Auth User creation failed:', createAuthError);
      return new Response(JSON.stringify({ success: false, message: 'Failed to provision authentication record' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const newUserId = authData.user.id;

    // 5. Database RPC Transaction
    try {
      // Update Profile (Trigger already inserted default pending/intern row)
      const { error: profileError } = await adminClient.from('profiles').update({
        full_name: fullName.trim(),
        mobile: mobile?.trim() || null,
        account_status: accountStatus || 'active'
      }).eq('id', newUserId);
      
      if (profileError) {
        console.error('[create-admin] Profile update failed:', profileError);
        throw { step: 'profile_creation', message: profileError.message || JSON.stringify(profileError) };
      }

      // Update Role to Admin
      const { error: roleError } = await adminClient.from('user_roles').update({
        role: 'admin'
      }).eq('user_id', newUserId);
      
      if (roleError) {
        console.error('[create-admin] Role update failed:', roleError);
        throw { step: 'role_creation', message: roleError.message || JSON.stringify(roleError) };
      }

      // Create Assignments
      if (Array.isArray(problemStatementIds) && problemStatementIds.length > 0) {
        const assignments = problemStatementIds.map(psId => ({
          admin_id: newUserId,
          problem_statement_id: psId
        }));
        const { error: assignError } = await adminClient.from('admin_problem_statements').insert(assignments);
        if (assignError) {
          console.error('[create-admin] Assignment creation failed:', assignError);
          throw { step: 'assignment_creation', message: assignError.message || JSON.stringify(assignError) };
        }
      }

      // Success
      return new Response(JSON.stringify({ 
        success: true, 
        userId: newUserId,
        message: 'Admin account created successfully' 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });

    } catch (dbError) {
      console.error('Database transaction failed:', dbError);
      
      // Rollback Auth User
      const { error: cleanupError } = await adminClient.auth.admin.deleteUser(newUserId);
      if (cleanupError) {
         console.error(`CRITICAL: Failed to clean up auth user ${newUserId} after db failure:`, cleanupError);
      }

      return new Response(JSON.stringify({ 
        success: false, 
        step: dbError.step || 'unknown_db_transaction',
        message: dbError.message || 'Failed to complete admin provisioning. Changes rolled back.' 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Internal Server Error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
