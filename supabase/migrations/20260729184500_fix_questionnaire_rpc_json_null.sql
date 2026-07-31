-- Migration: Fix Questionnaire RPC JSON NULL Normalization
-- File: supabase/migrations/20260729184500_fix_questionnaire_rpc_json_null.sql

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
  v_q_type TEXT;
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

  -- Process answers array with SQL NULL normalization
  IF p_answers IS NOT NULL AND jsonb_typeof(p_answers) = 'array' THEN
    FOR v_item IN SELECT jsonb_array_elements(p_answers) LOOP
      v_q_id := (v_item->>'question_id')::UUID;
      
      -- Fetch question type
      SELECT question_type INTO v_q_type
      FROM public.questionnaire_questions
      WHERE id = v_q_id;

      -- Question-type specific normalized extraction
      v_ans_text := CASE
        WHEN v_q_type = 'text' THEN NULLIF(BTRIM(v_item ->> 'answer_text'), '')
        ELSE NULL
      END;

      v_ans_opts := CASE
        WHEN v_q_type = 'text' THEN NULL
        ELSE NULLIF(v_item -> 'answer_options', 'null'::jsonb)
      END;

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
