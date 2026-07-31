-- Migration 3: Atomic Auth User Bootstrap Trigger
-- File: supabase/migrations/20260730122000_atomic_auth_user_bootstrap.sql

-- 1. Create or replace security-safe handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_mobile TEXT;
BEGIN
  -- Extract full_name and mobile from auth.users metadata if available
  v_full_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), '');
  v_mobile := NULLIF(TRIM(NEW.raw_user_meta_data->>'mobile'), '');

  IF v_full_name IS NULL THEN
    v_full_name := SPLIT_PART(NEW.email, '@', 1);
  END IF;

  -- Insert profile row
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    mobile,
    account_status,
    onboarding_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    v_mobile,
    'pending'::account_status,
    'profile_pending'::onboarding_status,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Force intern role for public registration (prevent metadata role tampering)
  INSERT INTO public.user_roles (
    user_id,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'intern'::app_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create initial onboarding_progress record
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
    NEW.id,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    0,
    NOW()
  )
  ON CONFLICT (intern_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 2. Bind trigger to auth.users AFTER INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
