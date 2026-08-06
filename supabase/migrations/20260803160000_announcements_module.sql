-- ==============================================================================
-- SHARED ANNOUNCEMENTS MODULE
-- ==============================================================================

DO $$
BEGIN
  -- A. created_by exists and author_id does not: rename
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'created_by') AND 
     NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'author_id') THEN
    ALTER TABLE public.announcements RENAME COLUMN created_by TO author_id;
  
  -- C. both exist: reconcile data (simple copy if author_id is null) and drop created_by later if safe, or just keep both for now and ensure author_id is populated. 
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'created_by') AND 
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'author_id') THEN
    -- Try to sync data if needed, but do not blindly drop.
    UPDATE public.announcements SET author_id = created_by::uuid WHERE author_id IS NULL AND created_by IS NOT NULL;
    
  -- D. neither exists: add author_id
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'created_by') AND 
        NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'author_id') THEN
    ALTER TABLE public.announcements ADD COLUMN author_id UUID REFERENCES public.profiles(id);
  END IF;
END $$;

DO $$
BEGIN
  -- Add columns idempotently
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS summary TEXT;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'priority') THEN
    ALTER TABLE public.announcements ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'status') THEN
    ALTER TABLE public.announcements ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'expired', 'archived'));
  END IF;

  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
END $$;

ALTER TABLE public.announcements DROP COLUMN IF EXISTS visibility;
ALTER TABLE public.announcements DROP COLUMN IF EXISTS problem_statement_id;
ALTER TABLE public.announcements DROP COLUMN IF EXISTS is_active;

-- 2. Create Target tables
CREATE TABLE IF NOT EXISTS public.announcement_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('all_interns', 'problem_statement', 'college', 'city', 'batch', 'selected_intern')),
  target_reference_id TEXT, -- Can be UUID or string (like city name)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announcement_targets_announcement_id ON public.announcement_targets(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_targets_target_type ON public.announcement_targets(target_type);

-- 3. Create Attachments table
CREATE TABLE IF NOT EXISTS public.announcement_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('image', 'document')),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announcement_attachments_announcement_id ON public.announcement_attachments(announcement_id);

-- 4. Create Read Status table
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, intern_id)
);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_intern_id ON public.announcement_reads(intern_id);

-- 5. Create Audit Log table
CREATE TABLE IF NOT EXISTS public.announcement_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  previous_values JSONB,
  new_values JSONB,
  reason TEXT,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. PRIVATE STORAGE BUCKET
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('announcement-assets', 'announcement-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Authenticated users can read announcement-assets" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'announcement-assets');

CREATE POLICY "Admin/SuperAdmin can upload announcement-assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'announcement-assets' 
    AND (public.is_admin() OR public.is_super_admin())
  );

CREATE POLICY "Admin/SuperAdmin can delete announcement-assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'announcement-assets' 
    AND (public.is_admin() OR public.is_super_admin())
  );

-- ==============================================================================
-- 7. RLS POLICIES
-- ==============================================================================
ALTER TABLE public.announcement_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_audit_logs ENABLE ROW LEVEL SECURITY;

-- We already have a policy for announcements in schema.sql: "Authenticated users read announcements" USING (is_active = true)
-- We must drop it and replace it.
DROP POLICY IF EXISTS "Authenticated users read announcements" ON public.announcements;

-- Base Announcements Read Policy
CREATE POLICY "Users can read permitted announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND
    (
      public.is_super_admin() OR
      (public.is_admin() AND author_id = auth.uid()) OR
      (public.is_admin() AND status IN ('published', 'expired', 'archived')) OR
      (public.is_intern() AND status IN ('published', 'expired', 'archived') AND public.intern_matches_announcement_target(id, auth.uid()))
    )
  );

-- Base Announcements Write Policies
CREATE POLICY "Admins/SuperAdmins can create announcements" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    (public.is_super_admin()) OR
    (public.is_admin() AND author_id = auth.uid())
  );

CREATE POLICY "Admins/SuperAdmins can update own announcements" ON public.announcements
  FOR UPDATE TO authenticated
  USING (
    (public.is_super_admin()) OR
    (public.is_admin() AND author_id = auth.uid())
  );

CREATE POLICY "SuperAdmins can delete announcements" ON public.announcements
  FOR DELETE TO authenticated
  USING (public.is_super_admin());


-- Targets Read
CREATE POLICY "Users can read targets" ON public.announcement_targets
  FOR SELECT TO authenticated USING (true);

-- Targets Write
CREATE POLICY "Admins/SuperAdmins can manage targets" ON public.announcement_targets
  FOR ALL TO authenticated USING (public.is_super_admin() OR public.is_admin());


-- Attachments Read
CREATE POLICY "Users can read attachments" ON public.announcement_attachments
  FOR SELECT TO authenticated USING (true);

-- Attachments Write
CREATE POLICY "Admins/SuperAdmins can manage attachments" ON public.announcement_attachments
  FOR ALL TO authenticated USING (public.is_super_admin() OR public.is_admin());


-- Reads (Read/Write)
CREATE POLICY "Interns can manage own read status" ON public.announcement_reads
  FOR ALL TO authenticated USING (
    (public.is_intern() AND intern_id = auth.uid()) OR
    public.is_super_admin() OR
    public.is_admin()
  ) WITH CHECK (
    (public.is_intern() AND intern_id = auth.uid()) OR
    public.is_super_admin() OR
    public.is_admin()
  );


-- Audit Logs Read
CREATE POLICY "SuperAdmins can read audit logs" ON public.announcement_audit_logs
  FOR SELECT TO authenticated USING (public.is_super_admin());

-- ==============================================================================
-- 8. RPC FUNCTIONS for Summary and Target Matching
-- ==============================================================================

-- Function to check if an intern is in the target scope of an announcement
CREATE OR REPLACE FUNCTION public.intern_matches_announcement_target(p_announcement_id UUID, p_intern_id UUID)
RETURNS boolean AS $$
DECLARE
  v_matches boolean;
  v_profile public.profiles;
BEGIN
  -- Get intern profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_intern_id;
  
  -- If there's an 'all_interns' target, it matches
  IF EXISTS (SELECT 1 FROM public.announcement_targets WHERE announcement_id = p_announcement_id AND target_type = 'all_interns') THEN
    RETURN true;
  END IF;

  -- Check specific targets
  IF EXISTS (
    SELECT 1 FROM public.announcement_targets 
    WHERE announcement_id = p_announcement_id 
    AND (
      (target_type = 'problem_statement' AND target_reference_id = v_profile.problem_statement_id::text) OR
      (target_type = 'college' AND target_reference_id = v_profile.college_name) OR
      (target_type = 'city' AND target_reference_id = v_profile.city) OR
      (target_type = 'selected_intern' AND target_reference_id = p_intern_id::text)
    )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC: get_my_announcement_summary
CREATE OR REPLACE FUNCTION public.get_my_announcement_summary(p_intern_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_total int := 0;
  v_unread int := 0;
  v_read int := 0;
  v_important int := 0;
BEGIN
  -- We only count 'published' announcements for interns
  WITH matching_announcements AS (
    SELECT a.id, a.priority,
           EXISTS(SELECT 1 FROM public.announcement_reads ar WHERE ar.announcement_id = a.id AND ar.intern_id = p_intern_id) as is_read
    FROM public.announcements a
    WHERE a.status = 'published'
      AND a.deleted_at IS NULL
      AND public.intern_matches_announcement_target(a.id, p_intern_id)
  )
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE NOT is_read) as unread,
    COUNT(*) FILTER (WHERE is_read) as read,
    COUNT(*) FILTER (WHERE priority IN ('important', 'urgent')) as important
  INTO v_total, v_unread, v_read, v_important
  FROM matching_announcements;

  RETURN json_build_object(
    'total', v_total,
    'unread', v_unread,
    'read', v_read,
    'important', v_important
  )::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
