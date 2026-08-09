-- Migration: 20260808120000_problem_statement_counts_rpc.sql
-- Description: Creates a secure RPC to fetch problem statements with admin and intern allocation counts without exposing raw profiles.

CREATE OR REPLACE FUNCTION public.get_problem_statements_with_counts()
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    description TEXT,
    status account_status,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    allocated_admins BIGINT,
    allocated_interns BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    -- Verify Super Admin authorization
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access denied. Super Admin privileges required.';
    END IF;

    RETURN QUERY
    SELECT 
        ps.id,
        ps.title,
        ps.slug,
        ps.description,
        ps.status,
        ps.created_by,
        ps.created_at,
        ps.updated_at,
        (SELECT COUNT(DISTINCT aps.admin_id) FROM public.admin_problem_statements aps WHERE aps.problem_statement_id = ps.id) as allocated_admins,
        (SELECT COUNT(DISTINCT p.id) FROM public.profiles p WHERE p.problem_statement_id = ps.id) as allocated_interns
    FROM 
        public.problem_statements ps
    ORDER BY 
        ps.created_at DESC;
END;
$$;

-- Revoke execute from public and grant to authenticated
REVOKE ALL ON FUNCTION public.get_problem_statements_with_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_problem_statements_with_counts() TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
