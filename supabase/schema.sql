-- ==============================================================================
-- AI APEX LAUNCHPAD - SUPABASE DATABASE SCHEMA MIGRATION
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ENUMERATIONS
-- ==============================================================================
CREATE TYPE app_role AS ENUM ('intern', 'admin', 'super_admin');

CREATE TYPE account_status AS ENUM (
  'pending',
  'active',
  'inactive',
  'suspended'
);

CREATE TYPE onboarding_status AS ENUM (
  'registered',
  'profile_pending',
  'questionnaire_pending',
  'learning_pending',
  'activities_pending',
  'interview_pending',
  'allocation_pending',
  'completed'
);

CREATE TYPE submission_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'resubmission_required'
);

CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'late',
  'leave'
);

CREATE TYPE visibility_scope AS ENUM (
  'all',
  'interns',
  'admins',
  'problem_statement'
);

-- ==============================================================================
-- 2. CORE IDENTITY & PROBLEM STATEMENT TABLES (Created first for SQL execution order)
-- ==============================================================================

CREATE TABLE public.problem_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status account_status NOT NULL DEFAULT 'active',
  created_by UUID, -- Foreign key added later to allow table creation order
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  mobile TEXT,
  profile_photo_url TEXT,
  college_name TEXT,
  city TEXT,
  degree_name TEXT,
  degree_year TEXT,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  account_status account_status NOT NULL DEFAULT 'pending',
  onboarding_status onboarding_status NOT NULL DEFAULT 'registered',
  problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL,
  internship_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.problem_statements
  ADD CONSTRAINT fk_problem_statements_created_by
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.admin_problem_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_statement_id UUID NOT NULL REFERENCES public.problem_statements(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_admin_problem_statement UNIQUE (admin_id, problem_statement_id)
);

CREATE TABLE public.intern_problem_statement_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_statement_id UUID NOT NULL REFERENCES public.problem_statements(id) ON DELETE CASCADE,
  allocated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  allocation_note TEXT
);

-- ==============================================================================
-- 3. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Trigger function to automatically update `updated_at` timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper functions for RLS (Defined after user_roles & profiles exist)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_intern()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'intern'::app_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_has_problem_statement(target_problem_statement_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_problem_statements
    WHERE admin_id = auth.uid() AND problem_statement_id = target_problem_statement_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_can_access_intern(target_intern_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admin_problem_statements aps ON p.problem_statement_id = aps.problem_statement_id
    WHERE p.id = target_intern_id AND aps.admin_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_onboarding_intern(target_intern_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = target_intern_id AND onboarding_status != 'completed'::onboarding_status
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 4. ONBOARDING TABLES
-- ==============================================================================

CREATE TABLE public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  questionnaire_completed BOOLEAN NOT NULL DEFAULT FALSE,
  learning_intro_completed BOOLEAN NOT NULL DEFAULT FALSE,
  activities_completed BOOLEAN NOT NULL DEFAULT FALSE,
  interview_completed BOOLEAN NOT NULL DEFAULT FALSE,
  problem_statement_allocated BOOLEAN NOT NULL DEFAULT FALSE,
  completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('tech', 'non_tech', 'ai_tools')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_questionnaires_category UNIQUE (category)
);

CREATE TABLE public.questionnaire_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'single_choice', 'multiple_choice')),
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questionnaire_questions(id) ON DELETE CASCADE,
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_text TEXT,
  response_json JSONB,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.onboarding_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  activity_order INTEGER NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.onboarding_activity_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.onboarding_activities(id) ON DELETE CASCADE,
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_text TEXT,
  submission_url TEXT,
  status submission_status NOT NULL DEFAULT 'submitted',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  meeting_link TEXT,
  status TEXT NOT NULL,
  score NUMERIC(5,2),
  feedback TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. ATTENDANCE TABLES
-- ==============================================================================

CREATE TABLE public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  attendance_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL,
  attendance_password_hash TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  radius_meters INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status attendance_status NOT NULL,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  remarks TEXT,
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_manual BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT unique_session_intern UNIQUE (session_id, intern_id)
);

-- ==============================================================================
-- 6. PRODUCTIVITY TABLES
-- ==============================================================================

CREATE TABLE public.daily_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  work_summary TEXT NOT NULL,
  learning_summary TEXT,
  challenges TEXT,
  next_plan TEXT,
  hours_worked NUMERIC(4,2),
  status submission_status NOT NULL DEFAULT 'submitted',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_intern_entry_date UNIQUE (intern_id, entry_date)
);

CREATE TABLE public.todo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.pending_work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  status submission_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.pending_work_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pending_work_id UUID NOT NULL REFERENCES public.pending_work_items(id) ON DELETE CASCADE,
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_text TEXT,
  submission_url TEXT,
  file_path TEXT,
  status submission_status NOT NULL DEFAULT 'submitted',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ==============================================================================
-- 7. LEARNING TABLES
-- ==============================================================================

CREATE TABLE public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL,
  resource_url TEXT,
  problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.learning_resources(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.external_learning_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  base_url TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.external_learning_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  action TEXT NOT NULL,
  external_reference TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_status TEXT
);

-- ==============================================================================
-- 8. ENGAGEMENT TABLES
-- ==============================================================================

CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  attachment_path TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ai_post_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  generated_content TEXT NOT NULL,
  provider_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility visibility_scope NOT NULL DEFAULT 'all',
  problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL,
  assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  response TEXT,
  responded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. LEADERBOARD TABLES
-- ==============================================================================

CREATE TABLE public.leaderboard_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  awarded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.points_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_point_id UUID REFERENCES public.leaderboard_points(id) ON DELETE SET NULL,
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_points INTEGER,
  new_points INTEGER NOT NULL,
  action TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. SETTINGS AND AUDIT TABLES
-- ==============================================================================

CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  announcement_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  language TEXT NOT NULL DEFAULT 'en',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 11. INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX idx_profiles_problem_statement ON public.profiles(problem_statement_id);
CREATE INDEX idx_profiles_onboarding_status ON public.profiles(onboarding_status);
CREATE INDEX idx_admin_ps_admin ON public.admin_problem_statements(admin_id);
CREATE INDEX idx_admin_ps_problem_statement ON public.admin_problem_statements(problem_statement_id);
CREATE INDEX idx_attendance_records_intern ON public.attendance_records(intern_id);
CREATE INDEX idx_daily_diary_intern_date ON public.daily_diary_entries(intern_id, entry_date);
CREATE INDEX idx_pending_work_assigned_to ON public.pending_work_items(assigned_to);
CREATE INDEX idx_learning_progress_intern ON public.learning_progress(intern_id);

CREATE INDEX idx_questionnaires_category ON public.questionnaires(category);
CREATE INDEX idx_questionnaires_is_active ON public.questionnaires(is_active);
CREATE INDEX idx_questionnaire_questions_questionnaire_id ON public.questionnaire_questions(questionnaire_id);
CREATE INDEX idx_questionnaire_questions_is_active ON public.questionnaire_questions(is_active);
CREATE INDEX idx_questionnaire_questions_display_order ON public.questionnaire_questions(display_order);

-- ==============================================================================
-- 12. AUTOMATIC UPDATED_AT TRIGGERS ON EDITABLE TABLES
-- ==============================================================================

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_problem_statements_updated_at BEFORE UPDATE ON public.problem_statements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_onboarding_progress_updated_at BEFORE UPDATE ON public.onboarding_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_questionnaires_updated_at BEFORE UPDATE ON public.questionnaires FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_questionnaire_questions_updated_at BEFORE UPDATE ON public.questionnaire_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_daily_diary_entries_updated_at BEFORE UPDATE ON public.daily_diary_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_todo_items_updated_at BEFORE UPDATE ON public.todo_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_pending_work_items_updated_at BEFORE UPDATE ON public.pending_work_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_learning_progress_updated_at BEFORE UPDATE ON public.learning_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_external_learning_integrations_updated_at BEFORE UPDATE ON public.external_learning_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_community_posts_updated_at BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_community_comments_updated_at BEFORE UPDATE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) & POLICIES
-- ==============================================================================

ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_problem_statement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_activity_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_work_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_learning_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_learning_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_post_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Baseline Policies
CREATE POLICY "Authenticated users can select profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_super_admin());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User Roles
CREATE POLICY "Authenticated users can read user_roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_admin());
CREATE POLICY "Users can insert own role during registration" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Authenticated users can read problem_statements" ON public.problem_statements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read admin_problem_statements" ON public.admin_problem_statements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Interns read update own onboarding_progress" ON public.onboarding_progress FOR ALL TO authenticated USING (auth.uid() = intern_id);

CREATE POLICY "Authenticated users read questionnaires" ON public.questionnaires FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users read questionnaire_questions" ON public.questionnaire_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Interns manage own questionnaire_responses" ON public.questionnaire_responses FOR ALL TO authenticated USING (auth.uid() = intern_id);

CREATE POLICY "Authenticated users read onboarding_activities" ON public.onboarding_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Interns manage own onboarding_activity_submissions" ON public.onboarding_activity_submissions FOR ALL TO authenticated USING (auth.uid() = intern_id);

-- RLS Policies for onboarding_final_submissions
ALTER TABLE public.onboarding_final_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Interns manage own final submissions" ON public.onboarding_final_submissions FOR ALL TO authenticated USING (auth.uid() = intern_id) WITH CHECK (auth.uid() = intern_id);
CREATE POLICY "Super admins full access onboarding_final_submissions" ON public.onboarding_final_submissions FOR ALL TO authenticated USING (public.is_super_admin());


CREATE POLICY "Authenticated users read attendance_sessions" ON public.attendance_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Interns manage own attendance_records" ON public.attendance_records FOR ALL TO authenticated USING (auth.uid() = intern_id);

CREATE POLICY "Interns manage own daily_diary_entries" ON public.daily_diary_entries FOR ALL TO authenticated USING (auth.uid() = intern_id);
CREATE POLICY "Interns manage own todo_items" ON public.todo_items FOR ALL TO authenticated USING (auth.uid() = intern_id);

CREATE POLICY "Interns read assigned pending_work_items" ON public.pending_work_items FOR SELECT TO authenticated USING (auth.uid() = assigned_to);
CREATE POLICY "Interns manage pending_work_submissions" ON public.pending_work_submissions FOR ALL TO authenticated USING (auth.uid() = intern_id);

CREATE POLICY "Authenticated users read learning_resources" ON public.learning_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Interns manage own learning_progress" ON public.learning_progress FOR ALL TO authenticated USING (auth.uid() = intern_id);

CREATE POLICY "Authenticated users read community_posts" ON public.community_posts FOR SELECT TO authenticated USING (is_hidden = false);
CREATE POLICY "Users insert own community_posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users update own community_posts" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Authenticated users read community_comments" ON public.community_comments FOR SELECT TO authenticated USING (is_hidden = false);
CREATE POLICY "Users insert own community_comments" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authenticated users read announcements" ON public.announcements FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Interns create feedback" ON public.feedback_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Interns view own feedback" ON public.feedback_submissions FOR SELECT TO authenticated USING (auth.uid() = submitted_by);

CREATE POLICY "Authenticated users read leaderboard_points" ON public.leaderboard_points FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own user_settings" ON public.user_settings FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Super Admin Full Override Policies
CREATE POLICY "Super admins full access profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access user_roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access problem_statements" ON public.problem_statements FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access admin_problem_statements" ON public.admin_problem_statements FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access intern_problem_statement_history" ON public.intern_problem_statement_history FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access onboarding_progress" ON public.onboarding_progress FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access questionnaires" ON public.questionnaires FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access questionnaire_questions" ON public.questionnaire_questions FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access questionnaire_responses" ON public.questionnaire_responses FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access onboarding_activities" ON public.onboarding_activities FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access onboarding_activity_submissions" ON public.onboarding_activity_submissions FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access interviews" ON public.interviews FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access attendance_sessions" ON public.attendance_sessions FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access attendance_records" ON public.attendance_records FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access daily_diary_entries" ON public.daily_diary_entries FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access todo_items" ON public.todo_items FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access pending_work_items" ON public.pending_work_items FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access pending_work_submissions" ON public.pending_work_submissions FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access learning_resources" ON public.learning_resources FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access learning_progress" ON public.learning_progress FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access external_learning_integrations" ON public.external_learning_integrations FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access external_learning_access_logs" ON public.external_learning_access_logs FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access community_posts" ON public.community_posts FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access community_comments" ON public.community_comments FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access ai_post_generations" ON public.ai_post_generations FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access announcements" ON public.announcements FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access feedback_submissions" ON public.feedback_submissions FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access leaderboard_points" ON public.leaderboard_points FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access points_audit_logs" ON public.points_audit_logs FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access system_settings" ON public.system_settings FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins full access audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (public.is_super_admin());

-- Admin Visibility Policies
CREATE POLICY "Admin view onboarding interns" ON public.profiles FOR SELECT TO authenticated USING (
  public.is_admin() AND onboarding_status != 'completed'::onboarding_status
);

CREATE POLICY "Admin view allocated active interns" ON public.profiles FOR SELECT TO authenticated USING (
  public.is_admin() AND public.admin_can_access_intern(id)
);

CREATE POLICY "Admin manage allocated intern daily_diary" ON public.daily_diary_entries FOR ALL TO authenticated USING (
  public.is_admin() AND public.admin_can_access_intern(intern_id)
);

CREATE POLICY "Admin manage allocated intern pending_work" ON public.pending_work_items FOR ALL TO authenticated USING (
  public.is_admin() AND public.admin_can_access_intern(assigned_to)
);

CREATE POLICY "Admin manage allocated intern pending_work_submissions" ON public.pending_work_submissions FOR ALL TO authenticated USING (
  public.is_admin() AND public.admin_can_access_intern(intern_id)
);

-- ==============================================================================
-- 14. STORAGE BUCKET INITIALIZATION
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('profile-photos', 'profile-photos', false),
  ('pending-work', 'pending-work', false),
  ('activity-submissions', 'activity-submissions', false),
  ('community-attachments', 'community-attachments', false),
  ('onboarding-documents', 'onboarding-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 15. PROBLEM STATEMENT COUNTS RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_problem_statements_with_counts()
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    description TEXT,
    status account_status,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    allocated_admins BIGINT,
    allocated_interns BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    -- Verify Super Admin authorization
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access denied. Super Admin privileges required.';
    END IF;

    RETURN QUERY
    SELECT 
        ps.id,
        ps.title,
        ps.slug,
        ps.description,
        ps.status,
        ps.created_by,
        ps.created_at,
        ps.updated_at,
        (SELECT COUNT(DISTINCT aps.admin_id) FROM public.admin_problem_statements aps WHERE aps.problem_statement_id = ps.id) as allocated_admins,
        (SELECT COUNT(DISTINCT p.id) FROM public.profiles p WHERE p.problem_statement_id = ps.id) as allocated_interns
    FROM 
        public.problem_statements ps
    ORDER BY 
        ps.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_problem_statements_with_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_problem_statements_with_counts() TO authenticated;

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- 16. PROBLEM STATEMENT SAFE DELETE RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.delete_problem_statement_safe(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_intern_count INT;
    v_admin_count INT;
    v_history_count INT;
    v_exists BOOLEAN;
BEGIN
    -- 1. Check Super Admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Access denied. Super Admin privileges required.';
    END IF;

    -- 2. Check if Problem Statement exists
    SELECT EXISTS(SELECT 1 FROM public.problem_statements WHERE id = p_id) INTO v_exists;
    IF NOT v_exists THEN
        RAISE EXCEPTION 'NOT_FOUND: Problem Statement not found.';
    END IF;

    -- 3. Check current intern allocations
    SELECT COUNT(*) INTO v_intern_count FROM public.profiles WHERE problem_statement_id = p_id;
    IF v_intern_count > 0 THEN
        RAISE EXCEPTION 'DEPENDENCY: Cannot delete this Problem Statement because it has % current intern allocations. Deactivate it instead.', v_intern_count;
    END IF;

    -- 4. Check current admin allocations
    SELECT COUNT(*) INTO v_admin_count FROM public.admin_problem_statements WHERE problem_statement_id = p_id;
    IF v_admin_count > 0 THEN
        RAISE EXCEPTION 'DEPENDENCY: Cannot delete this Problem Statement because it has % current admin allocations. Deactivate it instead.', v_admin_count;
    END IF;

    -- 5. Check historical allocations
    SELECT COUNT(*) INTO v_history_count FROM public.intern_problem_statement_history WHERE problem_statement_id = p_id;
    IF v_history_count > 0 THEN
        RAISE EXCEPTION 'DEPENDENCY: Cannot delete this Problem Statement because it has % historical allocation records. Deactivate it instead to preserve platform audit history.', v_history_count;
    END IF;

    -- 6. Safe to delete
    DELETE FROM public.problem_statements WHERE id = p_id;

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_problem_statement_safe(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_problem_statement_safe(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- 17. ADMIN MANAGEMENT RPCS
-- ==============================================================================

-- 1. update_admin_with_assignments (Transactional Update)
CREATE OR REPLACE FUNCTION public.update_admin_with_assignments(
    p_admin_id UUID,
    p_full_name TEXT,
    p_mobile TEXT,
    p_status TEXT,
    p_ps_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_ps_id UUID;
BEGIN
    -- 1. Check Super Admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Access denied. Super Admin privileges required.';
    END IF;

    -- 2. Update profile
    UPDATE public.profiles
    SET full_name = p_full_name,
        mobile = p_mobile,
        account_status = p_status,
        updated_at = NOW()
    WHERE id = p_admin_id;

    -- 3. Delete old assignments
    DELETE FROM public.admin_problem_statements
    WHERE admin_id = p_admin_id;

    -- 4. Insert new assignments
    IF array_length(p_ps_ids, 1) > 0 THEN
        FOREACH v_ps_id IN ARRAY p_ps_ids
        LOOP
            INSERT INTO public.admin_problem_statements (admin_id, problem_statement_id)
            VALUES (p_admin_id, v_ps_id);
        END LOOP;
    END IF;

    -- 5. Create Audit Log
    BEGIN
        INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_data, created_at)
        VALUES (auth.uid(), 'UPDATE_ADMIN_ACCOUNT', 'profiles', p_admin_id, 
                jsonb_build_object('full_name', p_full_name, 'status', p_status, 'allocations', p_ps_ids), 
                NOW());
    EXCEPTION WHEN OTHERS THEN
        -- Ignore audit log errors silently
    END;

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.update_admin_with_assignments(UUID, TEXT, TEXT, TEXT, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_admin_with_assignments(UUID, TEXT, TEXT, TEXT, UUID[]) TO authenticated;

-- 2. get_admin_kpis_and_list (Secure Aggregation)
CREATE OR REPLACE FUNCTION public.get_admin_kpis_and_list()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_total_admins INT;
    v_active_admins INT;
    v_inactive_admins INT;
    v_unassigned_admins INT;
    v_managed_interns INT;
    v_coverage_count INT;
    v_total_active_ps INT;
    v_admins_list JSON;
BEGIN
    -- 1. Check Super Admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Access denied. Super Admin privileges required.';
    END IF;

    -- Count Basic KPIs
    SELECT COUNT(*) INTO v_total_admins FROM public.user_roles WHERE role = 'admin';
    
    SELECT COUNT(*) INTO v_active_admins 
    FROM public.user_roles ur 
    JOIN public.profiles p ON ur.user_id = p.id 
    WHERE ur.role = 'admin' AND p.account_status = 'active';

    SELECT COUNT(*) INTO v_inactive_admins 
    FROM public.user_roles ur 
    JOIN public.profiles p ON ur.user_id = p.id 
    WHERE ur.role = 'admin' AND p.account_status != 'active' AND p.account_status != 'deleted';

    -- Count Unassigned
    SELECT COUNT(*) INTO v_unassigned_admins
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE ur.role = 'admin' AND p.account_status != 'deleted' 
      AND NOT EXISTS (SELECT 1 FROM public.admin_problem_statements aps WHERE aps.admin_id = p.id);

    -- Count Managed Interns (Unique interns assigned to problem statements managed by admins)
    SELECT COUNT(DISTINCT pr.id) INTO v_managed_interns
    FROM public.profiles pr
    JOIN public.admin_problem_statements aps ON pr.problem_statement_id = aps.problem_statement_id;

    -- Problem Statement Coverage (Unique PS assigned to admins)
    SELECT COUNT(DISTINCT problem_statement_id) INTO v_coverage_count
    FROM public.admin_problem_statements;

    -- Total Active PS
    SELECT COUNT(*) INTO v_total_active_ps
    FROM public.problem_statements WHERE status = 'active';

    -- Build Admins List JSON
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'email', p.email,
            'mobile', p.mobile,
            'account_status', p.account_status,
            'created_at', p.created_at,
            'updated_at', p.updated_at,
            'allocated_statements', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'id', ps.id,
                        'title', ps.title,
                        'status', ps.status
                    )
                ), '[]'::json)
                FROM public.admin_problem_statements aps
                JOIN public.problem_statements ps ON aps.problem_statement_id = ps.id
                WHERE aps.admin_id = p.id
            ),
            'allocated_interns_count', (
                SELECT COUNT(DISTINCT ip.id)
                FROM public.admin_problem_statements aps
                JOIN public.profiles ip ON aps.problem_statement_id = ip.problem_statement_id
                WHERE aps.admin_id = p.id
            )
        ) ORDER BY p.created_at DESC
    ), '[]'::json) INTO v_admins_list
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE ur.role = 'admin' AND p.account_status != 'deleted';

    RETURN json_build_object(
        'total_admins', v_total_admins,
        'active_admins', v_active_admins,
        'inactive_admins', v_inactive_admins,
        'unassigned_admins', v_unassigned_admins,
        'managed_interns', v_managed_interns,
        'coverage_count', v_coverage_count,
        'total_active_ps', v_total_active_ps,
        'admins', v_admins_list
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_kpis_and_list() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_kpis_and_list() TO authenticated;

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- UPDATE get_current_user_context (Fix: Include account_status)
-- ==============================================================================
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
  
  -- Fetch Profile Fields (including account_status)
  SELECT id, full_name, account_status::text, onboarding_status::text INTO v_profile 
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
        'account_status', v_profile.account_status,
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
