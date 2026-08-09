-- Migration: 20260809000000_delete_intern_safe.sql
-- Description: RPC for safely and atomically deleting an intern and all related records.

CREATE OR REPLACE FUNCTION public.delete_intern_safe(p_intern_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    -- 1. Verify Super Admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Access denied. Super Admin privileges required.';
    END IF;

    -- 2. Verify Intern Role
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_intern_id AND role = 'intern') THEN
        RAISE EXCEPTION 'UNAUTHORIZED: User is not an intern or does not exist.';
    END IF;

    -- 3. Delete dependent records manually to prevent FK constraint violations
    DELETE FROM public.daily_diary_entries WHERE intern_id = p_intern_id;
    DELETE FROM public.attendance_records WHERE intern_id = p_intern_id;
    DELETE FROM public.leaderboard_points WHERE intern_id = p_intern_id;
    DELETE FROM public.intern_problem_statement_history WHERE intern_id = p_intern_id;
    DELETE FROM public.onboarding_progress WHERE intern_id = p_intern_id;
    DELETE FROM public.questionnaire_submissions WHERE intern_id = p_intern_id;
    
    -- Delete core profile and role
    DELETE FROM public.user_roles WHERE user_id = p_intern_id;
    DELETE FROM public.profiles WHERE id = p_intern_id;
    
    -- Finally delete auth user
    DELETE FROM auth.users WHERE id = p_intern_id;

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_intern_safe(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_intern_safe(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
