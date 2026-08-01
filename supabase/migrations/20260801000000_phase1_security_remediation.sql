-- Migration: Phase 1 Production Security & Data Protection Remediation
-- File: supabase/migrations/20260801000000_phase1_security_remediation.sql

-- ==============================================================================
-- 1. HARDEN SECURITY DEFINER FUNCTIONS WITH EXPLICIT SEARCH_PATH
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.is_intern()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'intern'::app_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.admin_has_problem_statement(target_problem_statement_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_problem_statements
    WHERE admin_id = auth.uid() AND problem_statement_id = target_problem_statement_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.admin_can_access_intern(target_intern_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admin_problem_statements aps ON p.problem_statement_id = aps.problem_statement_id
    WHERE p.id = target_intern_id AND aps.admin_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.is_onboarding_intern(target_intern_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = target_intern_id AND onboarding_status != 'completed'::onboarding_status
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- ==============================================================================
-- 2. PRIVILEGE ESCALATION REMEDIATION ON public.user_roles
-- ==============================================================================

-- Revoke dangerous client-side role insertion policy
DROP POLICY IF EXISTS "Users can insert own role during registration" ON public.user_roles;

-- Note: Role assignment is strictly handled by auth trigger handle_new_user() or service_role Edge Functions.
-- Authenticated users retain SELECT access on user_roles via "Authenticated users can read user_roles".

-- ==============================================================================
-- 3. PII ISOLATION REMEDIATION ON public.profiles
-- ==============================================================================

-- Drop broad SELECT policy
DROP POLICY IF EXISTS "Authenticated users can select profiles" ON public.profiles;

-- Apply fine-grained scoped SELECT policies
CREATE POLICY "Users view self profile" 
  ON public.profiles FOR SELECT TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Admin view allocated or onboarding profiles" 
  ON public.profiles FOR SELECT TO authenticated 
  USING (
    public.is_admin() AND (
      onboarding_status != 'completed'::onboarding_status OR public.admin_can_access_intern(id)
    )
  );

-- ==============================================================================
-- 4. STORAGE OBJECT ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Profile Photos Bucket Policies
DROP POLICY IF EXISTS "Authenticated select profile photos" ON storage.objects;
CREATE POLICY "Authenticated select profile photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Users upload own profile photo" ON storage.objects;
CREATE POLICY "Users upload own profile photo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own profile photo" ON storage.objects;
CREATE POLICY "Users update own profile photo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Activity Submissions & Pending Work Policies
DROP POLICY IF EXISTS "Interns upload own activity submissions" ON storage.objects;
CREATE POLICY "Interns upload own activity submissions"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('activity-submissions', 'pending-work') AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Interns select own activity submissions" ON storage.objects;
CREATE POLICY "Interns select own activity submissions"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('activity-submissions', 'pending-work') AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins manage activity submissions" ON storage.objects;
CREATE POLICY "Admins manage activity submissions"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id IN ('activity-submissions', 'pending-work') AND (public.is_admin() OR public.is_super_admin())
  );

-- Onboarding Documents & Community Attachments
DROP POLICY IF EXISTS "Authenticated view community attachments" ON storage.objects;
CREATE POLICY "Authenticated view community attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'community-attachments');

DROP POLICY IF EXISTS "Users upload community attachments" ON storage.objects;
CREATE POLICY "Users upload community attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'community-attachments');

DROP POLICY IF EXISTS "Super admins full access storage objects" ON storage.objects;
CREATE POLICY "Super admins full access storage objects"
  ON storage.objects FOR ALL TO authenticated
  USING (public.is_super_admin());
