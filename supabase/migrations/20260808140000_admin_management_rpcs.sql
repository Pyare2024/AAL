-- Migration: 20260808140000_admin_management_rpcs.sql
-- Description: RPCs for Admin KPI fetching and transactional Admin update.

-- 1. update_admin_with_assignments (Transactional Update)
CREATE OR REPLACE FUNCTION public.update_admin_with_assignments(
    p_admin_id UUID,
    p_full_name TEXT,
    p_mobile TEXT,
    p_status TEXT,
    p_ps_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_ps_id UUID;
BEGIN
    -- 1. Check Super Admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Access denied. Super Admin privileges required.';
    END IF;

    -- 2. Update profile
    UPDATE public.profiles
    SET full_name = p_full_name,
        mobile = p_mobile,
        account_status = p_status,
        updated_at = NOW()
    WHERE id = p_admin_id;

    -- 3. Delete old assignments
    DELETE FROM public.admin_problem_statements
    WHERE admin_id = p_admin_id;

    -- 4. Insert new assignments
    IF array_length(p_ps_ids, 1) > 0 THEN
        FOREACH v_ps_id IN ARRAY p_ps_ids
        LOOP
            INSERT INTO public.admin_problem_statements (admin_id, problem_statement_id)
            VALUES (p_admin_id, v_ps_id);
        END LOOP;
    END IF;

    -- 5. Create Audit Log
    BEGIN
        INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data, created_at)
        VALUES (auth.uid(), 'UPDATE_ADMIN_ACCOUNT', 'profiles', p_admin_id, 
                jsonb_build_object('full_name', p_full_name, 'status', p_status, 'allocations', p_ps_ids), 
                NOW());
    EXCEPTION WHEN OTHERS THEN
        -- Ignore audit log errors silently
    END;

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.update_admin_with_assignments(UUID, TEXT, TEXT, TEXT, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_admin_with_assignments(UUID, TEXT, TEXT, TEXT, UUID[]) TO authenticated;


-- 2. get_admin_kpis_and_list (Secure Aggregation)
CREATE OR REPLACE FUNCTION public.get_admin_kpis_and_list()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_total_admins INT;
    v_active_admins INT;
    v_inactive_admins INT;
    v_unassigned_admins INT;
    v_managed_interns INT;
    v_coverage_count INT;
    v_total_active_ps INT;
    v_admins_list JSON;
BEGIN
    -- 1. Check Super Admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Access denied. Super Admin privileges required.';
    END IF;

    -- Count Basic KPIs
    SELECT COUNT(*) INTO v_total_admins FROM public.user_roles WHERE role = 'admin';
    
    SELECT COUNT(*) INTO v_active_admins 
    FROM public.user_roles ur 
    JOIN public.profiles p ON ur.user_id = p.id 
    WHERE ur.role = 'admin' AND p.account_status = 'active';

    SELECT COUNT(*) INTO v_inactive_admins 
    FROM public.user_roles ur 
    JOIN public.profiles p ON ur.user_id = p.id 
    WHERE ur.role = 'admin' AND p.account_status != 'active' AND p.account_status != 'deleted';

    -- Count Unassigned
    SELECT COUNT(*) INTO v_unassigned_admins
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE ur.role = 'admin' AND p.account_status != 'deleted' 
      AND NOT EXISTS (SELECT 1 FROM public.admin_problem_statements aps WHERE aps.admin_id = p.id);

    -- Count Managed Interns (Unique interns assigned to problem statements managed by admins)
    SELECT COUNT(DISTINCT pr.id) INTO v_managed_interns
    FROM public.profiles pr
    JOIN public.admin_problem_statements aps ON pr.problem_statement_id = aps.problem_statement_id;

    -- Problem Statement Coverage (Unique PS assigned to admins)
    SELECT COUNT(DISTINCT problem_statement_id) INTO v_coverage_count
    FROM public.admin_problem_statements;

    -- Total Active PS
    SELECT COUNT(*) INTO v_total_active_ps
    FROM public.problem_statements WHERE status = 'active';

    -- Build Admins List JSON
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'email', p.email,
            'mobile', p.mobile,
            'account_status', p.account_status,
            'created_at', p.created_at,
            'updated_at', p.updated_at,
            'allocated_statements', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'id', ps.id,
                        'title', ps.title,
                        'status', ps.status
                    )
                ), '[]'::json)
                FROM public.admin_problem_statements aps
                JOIN public.problem_statements ps ON aps.problem_statement_id = ps.id
                WHERE aps.admin_id = p.id
            ),
            'allocated_interns_count', (
                SELECT COUNT(DISTINCT ip.id)
                FROM public.admin_problem_statements aps
                JOIN public.profiles ip ON aps.problem_statement_id = ip.problem_statement_id
                WHERE aps.admin_id = p.id
            )
        ) ORDER BY p.created_at DESC
    ), '[]'::json) INTO v_admins_list
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE ur.role = 'admin' AND p.account_status != 'deleted';

    RETURN json_build_object(
        'total_admins', v_total_admins,
        'active_admins', v_active_admins,
        'inactive_admins', v_inactive_admins,
        'unassigned_admins', v_unassigned_admins,
        'managed_interns', v_managed_interns,
        'coverage_count', v_coverage_count,
        'total_active_ps', v_total_active_ps,
        'admins', v_admins_list
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_kpis_and_list() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_kpis_and_list() TO authenticated;

NOTIFY pgrst, 'reload schema';
