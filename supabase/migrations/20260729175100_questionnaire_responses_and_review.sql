-- Migration: Questionnaire Phase 3 Submissions, Answers, Triggers, RLS, and RPCs
-- File: supabase/migrations/20260729_questionnaire_responses_and_review.sql

-- 1. Create questionnaire_submissions table if not exists
CREATE TABLE IF NOT EXISTS public.questionnaire_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'correction_required')),
  submitted_at TIMESTAMPTZ NULL,
  reviewed_at TIMESTAMPTZ NULL,
  reviewed_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  review_comment TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_questionnaire_submissions_intern_questionnaire UNIQUE(intern_id, questionnaire_id)
);

-- 2. Create questionnaire_answers table if not exists
CREATE TABLE IF NOT EXISTS public.questionnaire_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.questionnaire_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questionnaire_questions(id) ON DELETE RESTRICT,
  answer_text TEXT NULL,
  answer_options JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_questionnaire_answers_submission_question UNIQUE(submission_id, question_id)
);

-- 3. Automatic updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_questionnaire_submissions_updated_at'
  ) THEN
    CREATE TRIGGER trg_questionnaire_submissions_updated_at
      BEFORE UPDATE ON public.questionnaire_submissions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_questionnaire_answers_updated_at'
  ) THEN
    CREATE TRIGGER trg_questionnaire_answers_updated_at
      BEFORE UPDATE ON public.questionnaire_answers
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 4. Database Validation Function and Trigger for questionnaire_answers
CREATE OR REPLACE FUNCTION validate_questionnaire_answer()
RETURNS TRIGGER AS $$
DECLARE
  v_question RECORD;
  v_option_text TEXT;
  v_arr text[];
  v_uniq_count INT;
  v_opt_count INT;
  v_elem text;
BEGIN
  -- Read question from questionnaire_questions
  SELECT * INTO v_question 
  FROM public.questionnaire_questions 
  WHERE id = NEW.question_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced question does not exist (ID: %)', NEW.question_id;
  END IF;

  -- Validation for text questions
  IF v_question.question_type = 'text' THEN
    IF NEW.answer_options IS NOT NULL THEN
      RAISE EXCEPTION 'For text questions, answer_options must be NULL';
    END IF;
    IF v_question.is_required AND (NEW.answer_text IS NULL OR length(trim(NEW.answer_text)) = 0) THEN
      RAISE EXCEPTION 'Answer text is required for question: %', v_question.question_text;
    END IF;
    RETURN NEW;
  END IF;

  -- Validation for single_choice questions
  IF v_question.question_type = 'single_choice' THEN
    IF NEW.answer_text IS NOT NULL THEN
      RAISE EXCEPTION 'For single_choice questions, answer_text must be NULL';
    END IF;

    IF v_question.is_required AND (NEW.answer_options IS NULL OR jsonb_typeof(NEW.answer_options) <> 'array' OR jsonb_array_length(NEW.answer_options) = 0) THEN
      RAISE EXCEPTION 'Selected option is required for question: %', v_question.question_text;
    END IF;

    IF NEW.answer_options IS NOT NULL AND jsonb_typeof(NEW.answer_options) = 'array' AND jsonb_array_length(NEW.answer_options) > 0 THEN
      IF jsonb_array_length(NEW.answer_options) <> 1 THEN
        RAISE EXCEPTION 'single_choice question must have exactly one selected option';
      END IF;

      v_option_text := NEW.answer_options->>0;

      -- Check if selected option exists in question.options JSONB array
      IF NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(v_question.options) opt WHERE opt = v_option_text
      ) THEN
        RAISE EXCEPTION 'Selected option "%" does not exist in question options', v_option_text;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Validation for multiple_choice questions
  IF v_question.question_type = 'multiple_choice' THEN
    IF NEW.answer_text IS NOT NULL THEN
      RAISE EXCEPTION 'For multiple_choice questions, answer_text must be NULL';
    END IF;

    IF v_question.is_required AND (NEW.answer_options IS NULL OR jsonb_typeof(NEW.answer_options) <> 'array' OR jsonb_array_length(NEW.answer_options) = 0) THEN
      RAISE EXCEPTION 'At least one selected option is required for question: %', v_question.question_text;
    END IF;

    IF NEW.answer_options IS NOT NULL AND jsonb_typeof(NEW.answer_options) = 'array' AND jsonb_array_length(NEW.answer_options) > 0 THEN
      v_opt_count := jsonb_array_length(NEW.answer_options);

      -- Check every selected option exists in question.options
      FOR v_elem IN SELECT jsonb_array_elements_text(NEW.answer_options) LOOP
        IF NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(v_question.options) opt WHERE opt = v_elem
        ) THEN
          RAISE EXCEPTION 'Selected option "%" does not exist in question options', v_elem;
        END IF;
      END LOOP;

      -- Check duplicates
      SELECT ARRAY(SELECT jsonb_array_elements_text(NEW.answer_options)) INTO v_arr;
      SELECT count(DISTINCT elem) INTO v_uniq_count FROM unnest(v_arr) elem;

      IF v_uniq_count < v_opt_count THEN
        RAISE EXCEPTION 'Duplicate selected options are not allowed';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_questionnaire_answer'
  ) THEN
    CREATE TRIGGER trg_validate_questionnaire_answer
      BEFORE INSERT OR UPDATE ON public.questionnaire_answers
      FOR EACH ROW EXECUTE FUNCTION validate_questionnaire_answer();
  END IF;
END $$;

-- 5. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_questionnaire_submissions_intern ON public.questionnaire_submissions(intern_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_submissions_questionnaire ON public.questionnaire_submissions(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_submissions_status ON public.questionnaire_submissions(status);
CREATE INDEX IF NOT EXISTS idx_questionnaire_submissions_review_status ON public.questionnaire_submissions(review_status);

CREATE INDEX IF NOT EXISTS idx_questionnaire_answers_submission ON public.questionnaire_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_answers_question ON public.questionnaire_answers(question_id);

-- 6. Row Level Security (RLS) setup
ALTER TABLE public.questionnaire_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_answers ENABLE ROW LEVEL SECURITY;

-- Helper role checker function
CREATE OR REPLACE FUNCTION public.is_intern()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'intern'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Interns view own submissions" ON public.questionnaire_submissions;
DROP POLICY IF EXISTS "Interns insert own submissions" ON public.questionnaire_submissions;
DROP POLICY IF EXISTS "Interns update draft or correction submissions" ON public.questionnaire_submissions;
DROP POLICY IF EXISTS "Super admins manage submissions" ON public.questionnaire_submissions;

DROP POLICY IF EXISTS "Interns view own answers" ON public.questionnaire_answers;
DROP POLICY IF EXISTS "Interns insert own answers" ON public.questionnaire_answers;
DROP POLICY IF EXISTS "Interns update own answers" ON public.questionnaire_answers;
DROP POLICY IF EXISTS "Super admins manage answers" ON public.questionnaire_answers;

-- Intern Policies for Submissions
CREATE POLICY "Interns view own submissions"
  ON public.questionnaire_submissions FOR SELECT TO authenticated
  USING (intern_id = auth.uid());

CREATE POLICY "Interns insert own submissions"
  ON public.questionnaire_submissions FOR INSERT TO authenticated
  WITH CHECK (intern_id = auth.uid() AND public.is_intern());

CREATE POLICY "Interns update draft or correction submissions"
  ON public.questionnaire_submissions FOR UPDATE TO authenticated
  USING (
    intern_id = auth.uid() 
    AND (status = 'draft' OR review_status = 'correction_required')
    AND review_status IS DISTINCT FROM 'approved'
  );

CREATE POLICY "Super admins manage submissions"
  ON public.questionnaire_submissions FOR ALL TO authenticated
  USING (public.is_super_admin());

-- Intern Policies for Answers
CREATE POLICY "Interns view own answers"
  ON public.questionnaire_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.questionnaire_submissions s
      WHERE s.id = questionnaire_answers.submission_id AND s.intern_id = auth.uid()
    )
  );

CREATE POLICY "Interns insert own answers"
  ON public.questionnaire_answers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questionnaire_submissions s
      WHERE s.id = questionnaire_answers.submission_id AND s.intern_id = auth.uid()
    )
  );

CREATE POLICY "Interns update own answers"
  ON public.questionnaire_answers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.questionnaire_submissions s
      WHERE s.id = questionnaire_answers.submission_id 
        AND s.intern_id = auth.uid()
        AND (s.status = 'draft' OR s.review_status = 'correction_required')
        AND s.review_status IS DISTINCT FROM 'approved'
    )
  );

CREATE POLICY "Super admins manage answers"
  ON public.questionnaire_answers FOR ALL TO authenticated
  USING (public.is_super_admin());


-- 7. RPC Function for Intern Final Submission (Atomic)
CREATE OR REPLACE FUNCTION public.submit_intern_questionnaire(
  p_questionnaire_id UUID,
  p_answers JSONB
)
RETURNS UUID AS $$
DECLARE
  v_intern_id UUID;
  v_submission_id UUID;
  v_item JSONB;
  v_q_id UUID;
  v_ans_text TEXT;
  v_ans_opts JSONB;
  v_is_active BOOLEAN;
BEGIN
  v_intern_id := auth.uid();
  IF v_intern_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify role is intern
  IF NOT public.is_intern() THEN
    RAISE EXCEPTION 'Only users with intern role can submit questionnaires';
  END IF;

  -- Verify questionnaire is active
  SELECT is_active INTO v_is_active FROM public.questionnaires WHERE id = p_questionnaire_id;
  IF NOT FOUND OR NOT v_is_active THEN
    RAISE EXCEPTION 'Questionnaire is not active or does not exist';
  END IF;

  -- Upsert submission
  INSERT INTO public.questionnaire_submissions (
    intern_id,
    questionnaire_id,
    status,
    review_status,
    submitted_at,
    reviewed_by,
    reviewed_at,
    review_comment
  )
  VALUES (
    v_intern_id,
    p_questionnaire_id,
    'submitted',
    'pending',
    NOW(),
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (intern_id, questionnaire_id) DO UPDATE
  SET
    status = 'submitted',
    review_status = 'pending',
    submitted_at = NOW(),
    reviewed_by = NULL,
    reviewed_at = NULL,
    review_comment = NULL,
    updated_at = NOW()
  RETURNING id INTO v_submission_id;

  -- Process answers array
  IF p_answers IS NOT NULL AND jsonb_typeof(p_answers) = 'array' THEN
    FOR v_item IN SELECT jsonb_array_elements(p_answers) LOOP
      v_q_id := (v_item->>'question_id')::UUID;
      v_ans_text := v_item->>'answer_text';
      v_ans_opts := v_item->'answer_options';

      INSERT INTO public.questionnaire_answers (
        submission_id,
        question_id,
        answer_text,
        answer_options
      )
      VALUES (
        v_submission_id,
        v_q_id,
        v_ans_text,
        v_ans_opts
      )
      ON CONFLICT (submission_id, question_id) DO UPDATE
      SET
        answer_text = EXCLUDED.answer_text,
        answer_options = EXCLUDED.answer_options,
        updated_at = NOW();
    END LOOP;
  END IF;

  RETURN v_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 8. RPC Function for Super Admin Review (Atomic)
CREATE OR REPLACE FUNCTION public.review_questionnaire_submission(
  p_submission_id UUID,
  p_decision TEXT,
  p_comment TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_submission RECORD;
  v_intern_id UUID;
BEGIN
  -- Verify Super Admin
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only Super Admins can review questionnaire submissions';
  END IF;

  -- Validate decision
  IF p_decision NOT IN ('approved', 'correction_required') THEN
    RAISE EXCEPTION 'Invalid review decision. Must be approved or correction_required';
  END IF;

  IF p_decision = 'correction_required' AND (p_comment IS NULL OR length(trim(p_comment)) = 0) THEN
    RAISE EXCEPTION 'A review comment is required when requesting corrections';
  END IF;

  -- Fetch submission
  SELECT * INTO v_submission 
  FROM public.questionnaire_submissions 
  WHERE id = p_submission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  v_intern_id := v_submission.intern_id;

  -- Update submission review state
  UPDATE public.questionnaire_submissions
  SET
    review_status = p_decision,
    review_comment = p_comment,
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;

  -- Atomic onboarding update on approval
  IF p_decision = 'approved' THEN
    -- Update profiles.onboarding_status -> 'learning_pending'
    UPDATE public.profiles
    SET 
      onboarding_status = 'learning_pending',
      updated_at = NOW()
    WHERE id = v_intern_id;

    -- Update onboarding_progress row: set questionnaire_completed = true, recalculate completion_percentage
    INSERT INTO public.onboarding_progress (
      intern_id,
      profile_completed,
      questionnaire_completed,
      learning_intro_completed,
      activities_completed,
      interview_completed,
      problem_statement_allocated,
      completion_percentage
    )
    VALUES (
      v_intern_id,
      true,
      true,
      false,
      false,
      false,
      false,
      33
    )
    ON CONFLICT (intern_id) DO UPDATE
    SET
      questionnaire_completed = true,
      completion_percentage = 33,
      updated_at = NOW();
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
