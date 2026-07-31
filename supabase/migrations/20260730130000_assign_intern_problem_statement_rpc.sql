-- Migration: Create atomic assignment RPC for intern problem statement allocation
-- File: supabase/migrations/20260730130000_assign_intern_problem_statement_rpc.sql

CREATE OR REPLACE FUNCTION public.assign_intern_problem_statement(
  p_intern_id UUID,
  p_problem_statement_id UUID,
  p_allocated_by UUID,
  p_allocation_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_caller_role app_role;
  v_target_role app_role;
  v_ps_exists BOOLEAN;
  v_fresh_profile JSONB;
BEGIN
  -- 1. Verify caller is Super Admin (or Security Definer context with valid Super Admin auth user)
  SELECT role INTO v_caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_caller_role IS NULL OR (v_caller_role != 'super_admin' AND v_caller_role != 'admin') THEN
    RAISE EXCEPTION 'Forbidden: Only Admins and Super Admins can assign problem statements.';
  END IF;

  -- 2. Verify target user has intern role
  SELECT role INTO v_target_role
  FROM public.user_roles
  WHERE user_id = p_intern_id;

  IF v_target_role IS NULL OR v_target_role != 'intern' THEN
    RAISE EXCEPTION 'Invalid target: Target user must have the intern role.';
  END IF;

  -- 3. Verify problem statement exists (if not null)
  IF p_problem_statement_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.problem_statements WHERE id = p_problem_statement_id
    ) INTO v_ps_exists;

    IF NOT v_ps_exists THEN
      RAISE EXCEPTION 'Target problem statement does not exist.';
    END IF;
  END IF;

  -- 4. Mark previous history records as removed if reallocating
  UPDATE public.intern_problem_statement_history
  SET removed_at = NOW()
  WHERE intern_id = p_intern_id AND removed_at IS NULL;

  -- 5. Insert new history record if problem statement is assigned
  IF p_problem_statement_id IS NOT NULL THEN
    INSERT INTO public.intern_problem_statement_history (
      intern_id,
      problem_statement_id,
      allocated_by,
      allocated_at,
      allocation_note
    )
    VALUES (
      p_intern_id,
      p_problem_statement_id,
      COALESCE(p_allocated_by, auth.uid()),
      NOW(),
      p_allocation_note
    );
  END IF;

  -- 6. Update profiles table
  UPDATE public.profiles
  SET 
    problem_statement_id = p_problem_statement_id,
    updated_at = NOW()
  WHERE id = p_intern_id;

  -- 7. Update onboarding_progress
  INSERT INTO public.onboarding_progress (
    intern_id,
    problem_statement_allocated,
    updated_at
  )
  VALUES (
    p_intern_id,
    (p_problem_statement_id IS NOT NULL),
    NOW()
  )
  ON CONFLICT (intern_id) DO UPDATE
  SET
    problem_statement_allocated = (p_problem_statement_id IS NOT NULL),
    updated_at = NOW();

  -- 8. Return fresh profile record
  SELECT to_jsonb(p.*) INTO v_fresh_profile
  FROM public.profiles p
  WHERE p.id = p_intern_id;

  RETURN v_fresh_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
