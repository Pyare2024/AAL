-- Migration 1: Repair missing profile & onboarding_progress for existing authenticated intern
-- File: supabase/migrations/20260730120000_repair_missing_profile_and_progress.sql

DO $$
DECLARE
  v_user_id UUID := 'dfb60f41-fa04-415c-8061-8f0513e9addd'::UUID;
  v_email TEXT := 'hemlatapatil267@gmail.com';
  v_has_submitted BOOLEAN := FALSE;
  v_onboarding_status onboarding_status := 'profile_pending'::onboarding_status;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- 1. Get created_at from auth.users if available, otherwise default to NOW()
  SELECT created_at INTO v_created_at FROM auth.users WHERE id = v_user_id;
  IF v_created_at IS NULL THEN
    v_created_at := NOW();
  END IF;

  -- 2. Check if user has submitted questionnaires across required categories
  SELECT EXISTS (
    SELECT 1 FROM public.questionnaire_submissions
    WHERE intern_id = v_user_id AND status = 'submitted'
  ) INTO v_has_submitted;

  IF v_has_submitted THEN
    v_onboarding_status := 'learning_pending'::onboarding_status;
  END IF;

  -- 3. Restore profiles row idempotently
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    mobile,
    profile_photo_url,
    college_name,
    city,
    degree_name,
    degree_year,
    date_of_birth,
    gender,
    blood_group,
    linkedin_url,
    github_url,
    account_status,
    onboarding_status,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    'Hemlata Patil',
    v_email,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'pending'::account_status,
    v_onboarding_status,
    v_created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    onboarding_status = EXCLUDED.onboarding_status,
    updated_at = NOW();

  -- 4. Restore user_roles row idempotently
  INSERT INTO public.user_roles (
    user_id,
    role,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    'intern'::app_role,
    v_created_at,
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 5. Restore onboarding_progress row idempotently
  INSERT INTO public.onboarding_progress (
    intern_id,
    profile_completed,
    questionnaire_completed,
    learning_intro_completed,
    activities_completed,
    interview_completed,
    problem_statement_allocated,
    completion_percentage,
    updated_at
  )
  VALUES (
    v_user_id,
    FALSE,
    v_has_submitted,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    CASE WHEN v_has_submitted THEN 17 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (intern_id) DO UPDATE
  SET
    questionnaire_completed = EXCLUDED.questionnaire_completed,
    completion_percentage = EXCLUDED.completion_percentage,
    updated_at = NOW();

END $$;
