-- Phase 3 Performance Remediation Migration
-- 1. get_current_user_context RPC
-- 2. sync_onboarding_status_trigger on public.onboarding_progress

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
  SELECT id, full_name, onboarding_status::text INTO v_profile 
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

-- 2. Single-Ownership Trigger Function (Profiles onboarding_status ONLY)
CREATE OR REPLACE FUNCTION public.sync_onboarding_status_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_target_status onboarding_status;
BEGIN
  -- Workflow Flag Guard: Execute ONLY if a boolean onboarding flag has changed
  IF TG_OP = 'UPDATE' AND NOT (
    OLD.profile_completed IS DISTINCT FROM NEW.profile_completed OR
    OLD.questionnaire_completed IS DISTINCT FROM NEW.questionnaire_completed OR
    OLD.learning_intro_completed IS DISTINCT FROM NEW.learning_intro_completed OR
    OLD.activities_completed IS DISTINCT FROM NEW.activities_completed OR
    OLD.interview_completed IS DISTINCT FROM NEW.interview_completed OR
    OLD.problem_statement_allocated IS DISTINCT FROM NEW.problem_statement_allocated
  ) THEN
    RETURN NEW;
  END IF;

  -- Compute matching onboarding_status enum value
  IF NOT NEW.profile_completed THEN v_target_status := 'profile_pending'::onboarding_status;
  ELSIF NOT NEW.questionnaire_completed THEN v_target_status := 'questionnaire_pending'::onboarding_status;
  ELSIF NOT NEW.learning_intro_completed THEN v_target_status := 'learning_pending'::onboarding_status;
  ELSIF NOT NEW.activities_completed THEN v_target_status := 'activities_pending'::onboarding_status;
  ELSIF NOT NEW.interview_completed THEN v_target_status := 'interview_pending'::onboarding_status;
  ELSIF NOT NEW.problem_statement_allocated THEN v_target_status := 'allocation_pending'::onboarding_status;
  ELSE v_target_status := 'completed'::onboarding_status;
  END IF;

  -- Synchronize profiles table (onboarding_status ONLY; account_status untouched)
  UPDATE public.profiles
  SET onboarding_status = v_target_status,
      updated_at = NOW()
  WHERE id = NEW.intern_id AND onboarding_status IS DISTINCT FROM v_target_status;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_onboarding_status ON public.onboarding_progress;
CREATE TRIGGER trg_sync_onboarding_status
AFTER INSERT OR UPDATE ON public.onboarding_progress
FOR EACH ROW EXECUTE FUNCTION public.sync_onboarding_status_trigger();
