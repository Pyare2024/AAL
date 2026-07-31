-- Migration: Questionnaire Phase 1 Database Foundation
-- Description: Extends public.questionnaires and public.questionnaire_questions without creating duplicate tables,
-- enforces category and question_type/options validation, adds performance indexes, triggers, and safe idempotent parent seeds.

-- 1. Extend public.questionnaires table
ALTER TABLE public.questionnaires
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Populate existing rows (if any) with default category before setting NOT NULL
UPDATE public.questionnaires 
SET category = 'tech' 
WHERE category IS NULL;

-- Enforce NOT NULL on category
ALTER TABLE public.questionnaires
  ALTER COLUMN category SET NOT NULL;

-- Add CHECK constraint for category allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_questionnaires_category'
  ) THEN
    ALTER TABLE public.questionnaires
      ADD CONSTRAINT chk_questionnaires_category
      CHECK (category IN ('tech', 'non_tech', 'ai_tools'));
  END IF;
END $$;

-- 2. Extend public.questionnaire_questions table
ALTER TABLE public.questionnaire_questions
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Trigger for updated_at on public.questionnaires and public.questionnaire_questions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_questionnaires_updated_at'
  ) THEN
    CREATE TRIGGER trg_questionnaires_updated_at
      BEFORE UPDATE ON public.questionnaires
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_questionnaire_questions_updated_at'
  ) THEN
    CREATE TRIGGER trg_questionnaire_questions_updated_at
      BEFORE UPDATE ON public.questionnaire_questions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 4. Question Type & Options Validation Function and Trigger
CREATE OR REPLACE FUNCTION validate_questionnaire_question_options()
RETURNS TRIGGER AS $$
DECLARE
  opt_count INT;
  arr text[];
  trimmed_lower_arr text[];
  uniq_count INT;
BEGIN
  -- Validate question_type
  IF NEW.question_type NOT IN ('text', 'single_choice', 'multiple_choice') THEN
    RAISE EXCEPTION 'Invalid question_type: %. Allowed values are text, single_choice, multiple_choice', NEW.question_type;
  END IF;

  -- Validation for text questions
  IF NEW.question_type = 'text' THEN
    IF NEW.options IS NOT NULL AND NEW.options IS DISTINCT FROM '[]'::jsonb THEN
      RAISE EXCEPTION 'text questions must have NULL or empty JSON array options';
    END IF;
    RETURN NEW;
  END IF;

  -- Validation for single_choice and multiple_choice questions
  IF NEW.question_type IN ('single_choice', 'multiple_choice') THEN
    IF NEW.options IS NULL OR jsonb_typeof(NEW.options) <> 'array' THEN
      RAISE EXCEPTION '% questions require a valid JSON array for options', NEW.question_type;
    END IF;

    opt_count := jsonb_array_length(NEW.options);
    IF opt_count < 2 THEN
      RAISE EXCEPTION '% questions require at least two options', NEW.question_type;
    END IF;

    -- Extract text array elements
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(NEW.options)
    ) INTO arr;

    -- Check for empty or whitespace-only elements
    IF EXISTS (
      SELECT 1 FROM unnest(arr) elem WHERE length(trim(elem)) = 0
    ) THEN
      RAISE EXCEPTION 'Options must contain non-empty strings';
    END IF;

    -- Case-insensitive duplicate check after trimming
    SELECT ARRAY(
      SELECT lower(trim(elem)) FROM unnest(arr) elem
    ) INTO trimmed_lower_arr;

    SELECT count(DISTINCT elem) INTO uniq_count FROM unnest(trimmed_lower_arr) elem;

    IF uniq_count < opt_count THEN
      RAISE EXCEPTION 'Options cannot contain duplicate values (case-insensitive)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_questionnaire_question_options'
  ) THEN
    CREATE TRIGGER trg_validate_questionnaire_question_options
      BEFORE INSERT OR UPDATE ON public.questionnaire_questions
      FOR EACH ROW EXECUTE FUNCTION validate_questionnaire_question_options();
  END IF;
END $$;

-- 5. Indexes for query patterns
CREATE INDEX IF NOT EXISTS idx_questionnaires_category ON public.questionnaires(category);
CREATE INDEX IF NOT EXISTS idx_questionnaires_is_active ON public.questionnaires(is_active);
CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_questionnaire_id ON public.questionnaire_questions(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_is_active ON public.questionnaire_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_display_order ON public.questionnaire_questions(display_order);

-- 6. Add unique constraint on questionnaires category to prevent duplicate active parent records per category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_questionnaires_category'
  ) THEN
    ALTER TABLE public.questionnaires
      ADD CONSTRAINT uq_questionnaires_category UNIQUE (category);
  END IF;
END $$;

-- 7. Seed Initial Parent Questionnaires idempotently
INSERT INTO public.questionnaires (title, description, category, is_active)
VALUES 
  ('Technical Questionnaire', 'Assessment questionnaire for technical skills and background.', 'tech', true),
  ('Non-Technical Questionnaire', 'Assessment questionnaire for non-technical soft skills and career background.', 'non_tech', true),
  ('AI Tools Questionnaire', 'Assessment questionnaire for experience and proficiency with AI tools.', 'ai_tools', true)
ON CONFLICT (category) DO NOTHING;
