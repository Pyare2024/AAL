-- Migration 2: Add FK questionnaire_submissions.intern_id -> public.profiles(id)
-- File: supabase/migrations/20260730121000_fk_questionnaire_submissions_profiles.sql

-- 1. Migration-Internal Orphan Guard
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.questionnaire_submissions qs
    LEFT JOIN public.profiles p ON p.id = qs.intern_id
    WHERE p.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add questionnaire submission FK: orphan intern IDs still exist in questionnaire_submissions';
  END IF;
END $$;

-- 2. Drop constraint names safely if they exist
ALTER TABLE public.questionnaire_submissions
  DROP CONSTRAINT IF EXISTS fk_questionnaire_submissions_intern,
  DROP CONSTRAINT IF EXISTS questionnaire_submissions_intern_id_fkey;

-- 3. Add foreign key pointing intern_id to public.profiles(id) ON DELETE CASCADE
ALTER TABLE public.questionnaire_submissions
  ADD CONSTRAINT fk_questionnaire_submissions_intern
  FOREIGN KEY (intern_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
