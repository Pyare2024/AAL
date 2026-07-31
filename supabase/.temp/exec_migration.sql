-- Temporary Migration runner wrapper function
CREATE OR REPLACE FUNCTION public.exec_migration_repair()
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID := 'dfb60f41-fa04-415c-8061-8f0513e9addd'::UUID;
  v_email TEXT := 'hemlatapatil267@gmail.com';
  v_has_submitted BOOLEAN := FALSE;
  v_onboarding_status onboarding_status := 'profile_pending'::onboarding_status;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- 1. Get created_at from auth.users
  SELECT created_at INTO v_created_at FROM auth.users WHERE id = v_user_id;
  IF v_created_at IS NULL THEN
    v_created_at := NOW();
  END IF;

  -- 2. Check questionnaire submission status
  SELECT EXISTS (
    SELECT 1 FROM public.questionnaire_submissions
    WHERE intern_id = v_user_id AND status = 'submitted'
  ) INTO v_has_submitted;

  IF v_has_submitted THEN
    v_onboarding_status := 'learning_pending'::onboarding_status;
  END IF;

  -- 3. Restore profiles row idempotently
  INSERT INTO public.profiles (
    id, full_name, email, mobile, profile_photo_url, college_name, city, degree_name, degree_year, date_of_birth, gender, blood_group, linkedin_url, github_url, account_status, onboarding_status, created_at, updated_at
  )
  VALUES (
    v_user_id, 'Hemlata Patil', v_email, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending'::account_status, v_onboarding_status, v_created_at, NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, onboarding_status = EXCLUDED.onboarding_status, updated_at = NOW();

  -- 4. Restore user_roles row idempotently
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (v_user_id, 'intern'::app_role, v_created_at, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- 5. Restore onboarding_progress row idempotently
  INSERT INTO public.onboarding_progress (
    intern_id, profile_completed, questionnaire_completed, learning_intro_completed, activities_completed, interview_completed, problem_statement_allocated, completion_percentage, updated_at
  )
  VALUES (
    v_user_id, FALSE, v_has_submitted, FALSE, FALSE, FALSE, FALSE, CASE WHEN v_has_submitted THEN 17 ELSE 0 END, NOW()
  )
  ON CONFLICT (intern_id) DO UPDATE
  SET questionnaire_completed = EXCLUDED.questionnaire_completed, completion_percentage = EXCLUDED.completion_percentage, updated_at = NOW();

  -- 6. Orphan Guard Check before FK
  IF EXISTS (
    SELECT 1 FROM public.questionnaire_submissions qs
    LEFT JOIN public.profiles p ON p.id = qs.intern_id
    WHERE p.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add FK: orphan intern IDs still exist in questionnaire_submissions';
  END IF;

  -- 7. Drop existing constraint names safely
  ALTER TABLE public.questionnaire_submissions
    DROP CONSTRAINT IF EXISTS fk_questionnaire_submissions_intern,
    DROP CONSTRAINT IF EXISTS questionnaire_submissions_intern_id_fkey;

  -- 8. Add Foreign Key
  ALTER TABLE public.questionnaire_submissions
    ADD CONSTRAINT fk_questionnaire_submissions_intern
    FOREIGN KEY (intern_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

  -- 9. Handle New User Trigger Setup
  EXECUTE '
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $trg$
    DECLARE
      v_full_name TEXT;
      v_mobile TEXT;
    BEGIN
      v_full_name := NULLIF(TRIM(NEW.raw_user_meta_data->>''full_name''), '''');
      v_mobile := NULLIF(TRIM(NEW.raw_user_meta_data->>''mobile''), '''');

      IF v_full_name IS NULL THEN
        v_full_name := SPLIT_PART(NEW.email, ''@'', 1);
      END IF;

      INSERT INTO public.profiles (id, full_name, email, mobile, account_status, onboarding_status, created_at, updated_at)
      VALUES (NEW.id, v_full_name, NEW.email, v_mobile, ''pending''::account_status, ''profile_pending''::onboarding_status, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
      VALUES (NEW.id, ''intern''::app_role, NOW(), NOW())
      ON CONFLICT (user_id) DO NOTHING;

      INSERT INTO public.onboarding_progress (intern_id, profile_completed, questionnaire_completed, learning_intro_completed, activities_completed, interview_completed, problem_statement_allocated, completion_percentage, updated_at)
      VALUES (NEW.id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, NOW())
      ON CONFLICT (intern_id) DO NOTHING;

      RETURN NEW;
    END;
    $trg$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
  ';

  EXECUTE '
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ';

  RETURN 'SUCCESS';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
