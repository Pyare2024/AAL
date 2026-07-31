-- Migration: Enable Realtime publication for key intern management tables
-- File: supabase/migrations/20260730123000_enable_realtime_publications.sql

DO $$
BEGIN
  -- Add profiles to supabase_realtime publication if not present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  -- Add user_roles to supabase_realtime publication if not present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_roles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  END IF;

  -- Add onboarding_progress to supabase_realtime publication if not present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'onboarding_progress'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.onboarding_progress;
  END IF;

  -- Add problem_statements to supabase_realtime publication if not present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'problem_statements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.problem_statements;
  END IF;
END $$;
