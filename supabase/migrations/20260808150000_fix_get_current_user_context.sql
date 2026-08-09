-- Fix get_current_user_context to include account_status
CREATE OR REPLACE FUNCTION public.get_current_user_context()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_role TEXT;
  v_profile RECORD;
  v_progress RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('contract_version', '1.0', 'authenticated', false);
  END IF;

  -- Fetch User Role (Explicit ROLE_MISSING if null)
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  
  -- Fetch Profile Fields
  SELECT id, full_name, account_status::text, onboarding_status::text INTO v_profile 
  FROM public.profiles 
  WHERE id = v_uid;

  -- Fetch Onboarding Progress Flags
  SELECT profile_completed, questionnaire_completed, learning_intro_completed, 
         activities_completed, interview_completed, problem_statement_allocated, completion_percentage 
  INTO v_progress 
  FROM public.onboarding_progress 
  WHERE intern_id = v_uid;

  RETURN jsonb_build_object(
    'contract_version', '1.0',
    'authenticated', true,
    'user', jsonb_build_object(
      'id', v_uid,
      'email', auth.email(),
      'role', COALESCE(v_role, 'ROLE_MISSING')
    ),
    'profile', CASE 
      WHEN v_profile.id IS NOT NULL THEN jsonb_build_object(
        'id', v_profile.id,
        'full_name', v_profile.full_name,
        'account_status', v_profile.account_status,
        'onboarding_status', v_profile.onboarding_status
      )
      ELSE NULL
    END,
    'onboarding_progress', CASE 
      WHEN v_progress.profile_completed IS NOT NULL THEN to_jsonb(v_progress)
      ELSE NULL
    END
  );
END;
$$;
