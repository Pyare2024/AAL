-- Migration: 20260808130000_problem_statement_delete_rpc.sql
-- Description: Creates a secure RPC to delete problem statements safely.

CREATE OR REPLACE FUNCTION public.delete_problem_statement_safe(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_intern_count INT;
    v_admin_count INT;
    v_history_count INT;
    v_exists BOOLEAN;
BEGIN
    -- 1. Check Super Admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Access denied. Super Admin privileges required.';
    END IF;

    -- 2. Check if Problem Statement exists
    SELECT EXISTS(SELECT 1 FROM public.problem_statements WHERE id = p_id) INTO v_exists;
    IF NOT v_exists THEN
        RAISE EXCEPTION 'NOT_FOUND: Problem Statement not found.';
    END IF;

    -- 3. Check current intern allocations
    SELECT COUNT(*) INTO v_intern_count FROM public.profiles WHERE problem_statement_id = p_id;
    IF v_intern_count > 0 THEN
        RAISE EXCEPTION 'DEPENDENCY: Cannot delete this Problem Statement because it has % current intern allocations. Deactivate it instead.', v_intern_count;
    END IF;

    -- 4. Check current admin allocations
    SELECT COUNT(*) INTO v_admin_count FROM public.admin_problem_statements WHERE problem_statement_id = p_id;
    IF v_admin_count > 0 THEN
        RAISE EXCEPTION 'DEPENDENCY: Cannot delete this Problem Statement because it has % current admin allocations. Deactivate it instead.', v_admin_count;
    END IF;

    -- 5. Check historical allocations
    SELECT COUNT(*) INTO v_history_count FROM public.intern_problem_statement_history WHERE problem_statement_id = p_id;
    IF v_history_count > 0 THEN
        RAISE EXCEPTION 'DEPENDENCY: Cannot delete this Problem Statement because it has % historical allocation records. Deactivate it instead to preserve platform audit history.', v_history_count;
    END IF;

    -- 6. Safe to delete
    DELETE FROM public.problem_statements WHERE id = p_id;

    RETURN TRUE;
END;
$$;

-- Revoke execute from public and grant to authenticated
REVOKE ALL ON FUNCTION public.delete_problem_statement_safe(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_problem_statement_safe(UUID) TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
