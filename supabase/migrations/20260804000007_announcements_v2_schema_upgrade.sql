-- ==============================================================================
-- PHASE 2: ANNOUNCEMENTS V1-to-V2 SCHEMA UPGRADE
-- ==============================================================================

DO $$
BEGIN
  -- ==============================================================================
  -- STEP 2 — UPGRADE announcements TABLE
  -- ==============================================================================

  -- Add required columns safely
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS summary text;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS category text;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS author_id uuid;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS published_at timestamptz;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS archived_at timestamptz;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

  -- Map legacy fields where possible
  -- Assuming created_by exists, mapping to author_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'created_by') THEN
    EXECUTE 'UPDATE public.announcements SET author_id = created_by::uuid WHERE author_id IS NULL AND created_by IS NOT NULL';
  END IF;

  -- Assuming is_active exists, map to published status
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'is_active') THEN
    EXECUTE 'UPDATE public.announcements SET status = ''published'', published_at = created_at WHERE is_active = true AND status = ''draft''';
  END IF;

  -- Add constraints safely
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_priority_check') THEN
    ALTER TABLE public.announcements ADD CONSTRAINT announcements_priority_check CHECK (priority IN ('normal','important','urgent'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_status_check') THEN
    ALTER TABLE public.announcements ADD CONSTRAINT announcements_status_check CHECK (status IN ('draft','scheduled','published','expired','archived'));
  END IF;

  -- Add indexes safely
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_status') THEN
    CREATE INDEX idx_announcements_status ON public.announcements(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_priority') THEN
    CREATE INDEX idx_announcements_priority ON public.announcements(priority);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_published_at') THEN
    CREATE INDEX idx_announcements_published_at ON public.announcements(published_at);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_scheduled_at') THEN
    CREATE INDEX idx_announcements_scheduled_at ON public.announcements(scheduled_at);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_author_id') THEN
    CREATE INDEX idx_announcements_author_id ON public.announcements(author_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcements_deleted_at') THEN
    CREATE INDEX idx_announcements_deleted_at ON public.announcements(deleted_at);
  END IF;

END $$;

-- ==============================================================================
-- STEP 3 — CREATE REQUIRED TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.announcement_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('all_interns','problem_statement','college','city','batch','selected_intern')),
  target_reference_id text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, target_type, target_reference_id)
);

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  intern_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, intern_id)
);

CREATE TABLE IF NOT EXISTS public.announcement_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  attachment_type text NOT NULL CHECK (attachment_type IN ('image','document')),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcement_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE SET NULL,
  actor_id uuid,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- STEP 4 — MIGRATE LEGACY DATA
-- ==============================================================================

DO $$
DECLARE
  v_rec record;
BEGIN
  -- Convert problem_statement_id if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'problem_statement_id') THEN
    FOR v_rec IN EXECUTE 'SELECT id, problem_statement_id FROM public.announcements WHERE problem_statement_id IS NOT NULL' LOOP
      INSERT INTO public.announcement_targets (announcement_id, target_type, target_reference_id)
      VALUES (v_rec.id, 'problem_statement', v_rec.problem_statement_id::text)
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- If visibility is global and no problem statement, make 'all_interns'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'visibility') THEN
      FOR v_rec IN EXECUTE 'SELECT id FROM public.announcements WHERE visibility = ''global'' AND problem_statement_id IS NULL' LOOP
        INSERT INTO public.announcement_targets (announcement_id, target_type, target_reference_id)
        VALUES (v_rec.id, 'all_interns', NULL)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END IF;
END $$;


-- ==============================================================================
-- STEP 5 — RLS
-- ==============================================================================

ALTER TABLE public.announcement_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_audit_logs ENABLE ROW LEVEL SECURITY;

-- Targets RLS
DROP POLICY IF EXISTS "Targets read access" ON public.announcement_targets;
CREATE POLICY "Targets read access" ON public.announcement_targets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Targets write access" ON public.announcement_targets;
CREATE POLICY "Targets write access" ON public.announcement_targets FOR ALL TO authenticated 
USING (
  public.is_super_admin() OR 
  (public.is_admin() AND EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_id AND a.author_id = auth.uid()))
);

-- Reads RLS
DROP POLICY IF EXISTS "Reads read access" ON public.announcement_reads;
CREATE POLICY "Reads read access" ON public.announcement_reads FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Reads write access" ON public.announcement_reads;
CREATE POLICY "Reads write access" ON public.announcement_reads FOR ALL TO authenticated 
USING (intern_id = auth.uid() OR public.is_super_admin() OR public.is_admin());

-- Attachments RLS
DROP POLICY IF EXISTS "Attachments read access" ON public.announcement_attachments;
CREATE POLICY "Attachments read access" ON public.announcement_attachments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Attachments write access" ON public.announcement_attachments;
CREATE POLICY "Attachments write access" ON public.announcement_attachments FOR ALL TO authenticated 
USING (
  public.is_super_admin() OR 
  (public.is_admin() AND EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_id AND a.author_id = auth.uid()))
);

-- Audit Logs RLS
DROP POLICY IF EXISTS "Audit logs read access" ON public.announcement_audit_logs;
CREATE POLICY "Audit logs read access" ON public.announcement_audit_logs FOR SELECT TO authenticated USING (public.is_super_admin());


-- ==============================================================================
-- STEP 6 — STORAGE
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('announcement-assets', 'announcement-assets', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can read announcement-assets" ON storage.objects;
CREATE POLICY "Authenticated users can read announcement-assets" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'announcement-assets');

DROP POLICY IF EXISTS "Admin/SuperAdmin can manage announcement-assets" ON storage.objects;
CREATE POLICY "Admin/SuperAdmin can manage announcement-assets" ON storage.objects
  FOR ALL TO authenticated USING (
    bucket_id = 'announcement-assets' AND (public.is_admin() OR public.is_super_admin())
  );


-- ==============================================================================
-- STEP 7 — REPAIR RPCS
-- ==============================================================================

-- 1. Helper function
CREATE OR REPLACE FUNCTION public.intern_matches_announcement_target(p_announcement_id UUID, p_intern_id UUID)
RETURNS boolean AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_intern_id;
  IF EXISTS (SELECT 1 FROM public.announcement_targets WHERE announcement_id = p_announcement_id AND target_type = 'all_interns') THEN
    RETURN true;
  END IF;
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. Filter options RPC
CREATE OR REPLACE FUNCTION public.get_announcement_filter_options()
RETURNS jsonb AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_problem_statements JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  
  IF v_role = 'super_admin' THEN
    SELECT jsonb_agg(jsonb_build_object('id', id, 'title', title)) INTO v_problem_statements FROM public.problem_statements WHERE status = 'active';
  ELSIF v_role = 'admin' THEN
    SELECT jsonb_agg(jsonb_build_object('id', ps.id, 'title', ps.title)) INTO v_problem_statements
    FROM public.problem_statements ps
    JOIN public.admin_problem_statements aps ON aps.problem_statement_id = ps.id
    WHERE aps.admin_id = v_uid AND ps.status = 'active';
  ELSE
    SELECT jsonb_agg(jsonb_build_object('id', ps.id, 'title', ps.title)) INTO v_problem_statements
    FROM public.problem_statements ps
    JOIN public.profiles p ON p.problem_statement_id = ps.id
    WHERE p.id = v_uid;
  END IF;

  RETURN jsonb_build_object(
    'problemStatements', COALESCE(v_problem_statements, '[]'::jsonb),
    'statuses', '["draft", "scheduled", "published", "expired", "archived"]'::jsonb,
    'priorities', '["normal", "important", "urgent"]'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.get_announcement_filter_options() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcement_filter_options() TO authenticated;


-- 3. get_announcements
CREATE OR REPLACE FUNCTION public.get_announcements(
  p_search_text TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_read_filter TEXT DEFAULT NULL,
  p_is_pinned BOOLEAN DEFAULT NULL,
  p_problem_statement_id TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 20,
  p_sort_by TEXT DEFAULT 'published_at',
  p_sort_direction TEXT DEFAULT 'desc'
)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_rows JSONB := '[]'::jsonb;
  v_total INT := 0;
  v_offset INT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;

  v_offset := (greatest(1, p_page) - 1) * greatest(1, p_page_size);

  CREATE TEMP TABLE temp_filtered_announcements ON COMMIT DROP AS
  WITH base_access AS (
    SELECT a.*
    FROM public.announcements a
    WHERE a.deleted_at IS NULL
    AND (
      (v_role = 'super_admin')
      OR
      (v_role = 'admin' AND (
         a.author_id = v_uid 
         OR EXISTS (
           SELECT 1 FROM public.announcement_targets at2 
           JOIN public.admin_problem_statements aps ON aps.problem_statement_id::text = at2.target_reference_id
           WHERE at2.announcement_id = a.id AND aps.admin_id = v_uid AND at2.target_type = 'problem_statement'
         )
         OR a.status IN ('published', 'archived')
      ))
      OR
      (v_role = 'intern' AND a.status IN ('published', 'archived') AND public.intern_matches_announcement_target(a.id, v_uid))
    )
  )
  SELECT ba.*
  FROM base_access ba
  WHERE 
    (p_status IS NULL OR p_status = '' OR ba.status = p_status)
    AND (p_priority IS NULL OR p_priority = '' OR ba.priority = p_priority)
    AND (p_is_pinned IS NULL OR ba.is_pinned = p_is_pinned)
    AND (p_date_from IS NULL OR ba.created_at >= p_date_from)
    AND (p_date_to IS NULL OR ba.created_at <= p_date_to)
    AND (
      p_search_text IS NULL OR p_search_text = '' 
      OR lower(ba.title) LIKE '%' || lower(p_search_text) || '%'
      OR lower(ba.summary) LIKE '%' || lower(p_search_text) || '%'
      OR lower(ba.content) LIKE '%' || lower(p_search_text) || '%'
    )
    AND (
      p_problem_statement_id IS NULL OR p_problem_statement_id = '' OR EXISTS (
        SELECT 1 FROM public.announcement_targets at 
        WHERE at.announcement_id = ba.id AND at.target_type = 'problem_statement' AND at.target_reference_id = p_problem_statement_id
      )
    )
    AND (
      p_read_filter IS NULL OR p_read_filter = '' OR
      (p_read_filter = 'read' AND EXISTS (SELECT 1 FROM public.announcement_reads ar WHERE ar.announcement_id = ba.id AND ar.intern_id = v_uid)) OR
      (p_read_filter = 'unread' AND NOT EXISTS (SELECT 1 FROM public.announcement_reads ar WHERE ar.announcement_id = ba.id AND ar.intern_id = v_uid))
    );

  SELECT COUNT(*)::INT INTO v_total FROM temp_filtered_announcements;

  IF v_total > 0 THEN
    SELECT jsonb_agg(row_data) INTO v_rows
    FROM (
      SELECT 
        jsonb_build_object(
          'id', a.id,
          'title', a.title,
          'summary', a.summary,
          'content', a.content,
          'priority', a.priority,
          'status', a.status,
          'is_pinned', a.is_pinned,
          'published_at', a.published_at,
          'expires_at', a.expires_at,
          'created_at', a.created_at,
          'tags', a.tags,
          'author', jsonb_build_object(
            'id', p.id,
            'name', p.full_name,
            'role', ur.role
          ),
          'read_state', jsonb_build_object(
            'is_read', ar.id IS NOT NULL,
            'read_at', ar.read_at
          ),
          'attachments', jsonb_build_object(
            'count', (SELECT COUNT(*) FROM public.announcement_attachments aa WHERE aa.announcement_id = a.id),
            'image_count', (SELECT COUNT(*) FROM public.announcement_attachments aa WHERE aa.announcement_id = a.id AND aa.attachment_type = 'image'),
            'document_count', (SELECT COUNT(*) FROM public.announcement_attachments aa WHERE aa.announcement_id = a.id AND aa.attachment_type = 'document')
          ),
          'permissions', jsonb_build_object(
            'can_edit', (v_role = 'super_admin' OR (v_role = 'admin' AND a.author_id = v_uid)),
            'can_delete', (v_role = 'super_admin' OR (v_role = 'admin' AND a.author_id = v_uid)),
            'can_publish', (v_role = 'super_admin' OR (v_role = 'admin' AND a.author_id = v_uid)),
            'can_schedule', (v_role = 'super_admin' OR (v_role = 'admin' AND a.author_id = v_uid)),
            'can_archive', (v_role = 'super_admin' OR (v_role = 'admin' AND a.author_id = v_uid)),
            'can_manage_targets', (v_role = 'super_admin' OR (v_role = 'admin' AND a.author_id = v_uid))
          )
        ) as row_data
      FROM temp_filtered_announcements a
      LEFT JOIN public.profiles p ON p.id = a.author_id
      LEFT JOIN public.user_roles ur ON ur.user_id = p.id
      LEFT JOIN public.announcement_reads ar ON ar.announcement_id = a.id AND ar.intern_id = v_uid
      ORDER BY
        CASE WHEN p_sort_by = 'published_at' AND p_sort_direction = 'desc' THEN (a.is_pinned) END DESC,
        CASE WHEN p_sort_by = 'published_at' AND p_sort_direction = 'desc' THEN CASE a.priority WHEN 'urgent' THEN 3 WHEN 'important' THEN 2 ELSE 1 END END DESC,
        CASE WHEN p_sort_by = 'published_at' AND p_sort_direction = 'desc' THEN a.published_at END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'published_at' AND p_sort_direction = 'asc' THEN a.published_at END ASC NULLS LAST,
        a.created_at DESC
      OFFSET v_offset LIMIT p_page_size
    ) sub;
  END IF;

  RETURN jsonb_build_object(
    'rows', COALESCE(v_rows, '[]'::jsonb),
    'total_count', v_total,
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', CEIL(v_total::NUMERIC / greatest(1, p_page_size)),
    'summary', '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.get_announcements(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcements(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, TEXT, TEXT) TO authenticated;


-- 4. get_announcement_summary
CREATE OR REPLACE FUNCTION public.get_announcement_summary()
RETURNS jsonb AS $$
DECLARE
  v_uid uuid;
  v_role app_role;
  v_total int := 0;
  v_unread int := 0;
  v_read int := 0;
  v_important int := 0;
  v_pinned int := 0;
  v_published int := 0;
  v_scheduled int := 0;
  v_drafts int := 0;
  v_archived int := 0;
  v_expired int := 0;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;

  IF v_role IN ('admin', 'super_admin') THEN
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE priority IN ('important', 'urgent')),
      COUNT(*) FILTER (WHERE is_pinned = true),
      COUNT(*) FILTER (WHERE status = 'published'),
      COUNT(*) FILTER (WHERE status = 'scheduled'),
      COUNT(*) FILTER (WHERE status = 'draft'),
      COUNT(*) FILTER (WHERE status = 'archived'),
      COUNT(*) FILTER (WHERE status = 'expired')
    INTO v_total, v_important, v_pinned, v_published, v_scheduled, v_drafts, v_archived, v_expired
    FROM public.announcements a
    WHERE a.deleted_at IS NULL
      AND (v_role = 'super_admin' OR a.author_id = v_uid OR a.status IN ('published','archived') OR EXISTS(
        SELECT 1 FROM public.announcement_targets at2 
        JOIN public.admin_problem_statements aps ON aps.problem_statement_id::text = at2.target_reference_id
        WHERE at2.announcement_id = a.id AND aps.admin_id = v_uid AND at2.target_type = 'problem_statement'
      ));
      
    RETURN jsonb_build_object('total', v_total, 'important', v_important, 'pinned', v_pinned, 'published', v_published, 'scheduled', v_scheduled, 'drafts', v_drafts, 'archived', v_archived, 'expired', v_expired);
  ELSE
    WITH matching AS (
      SELECT a.id, a.priority, EXISTS(SELECT 1 FROM public.announcement_reads ar WHERE ar.announcement_id = a.id AND ar.intern_id = v_uid) as is_read
      FROM public.announcements a
      WHERE a.status = 'published' AND a.deleted_at IS NULL AND public.intern_matches_announcement_target(a.id, v_uid)
    )
    SELECT COUNT(*), COUNT(*) FILTER (WHERE NOT is_read), COUNT(*) FILTER (WHERE is_read), COUNT(*) FILTER (WHERE priority IN ('important', 'urgent'))
    INTO v_total, v_unread, v_read, v_important
    FROM matching;

    RETURN jsonb_build_object('total', v_total, 'unread', v_unread, 'read', v_read, 'important', v_important);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.get_announcement_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcement_summary() TO authenticated;


-- 5. Read/Unread
CREATE OR REPLACE FUNCTION public.mark_announcement_read(p_announcement_id UUID)
RETURNS void AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.announcement_reads (announcement_id, intern_id, read_at) VALUES (p_announcement_id, auth.uid(), NOW())
  ON CONFLICT (announcement_id, intern_id) DO UPDATE SET read_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.mark_announcement_read(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_announcement_unread(p_announcement_id UUID)
RETURNS void AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM public.announcement_reads WHERE announcement_id = p_announcement_id AND intern_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.mark_announcement_unread(UUID) TO authenticated;


-- 6. Attachments
CREATE OR REPLACE FUNCTION public.create_announcement_attachment(p_announcement_id uuid, p_attachment_type text, p_storage_path text, p_file_name text, p_mime_type text, p_file_size bigint)
RETURNS JSONB AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.announcement_attachments (announcement_id, attachment_type, storage_path, file_name, mime_type, file_size)
  VALUES (p_announcement_id, p_attachment_type, p_storage_path, p_file_name, p_mime_type, p_file_size)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id, 'storage_path', p_storage_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.create_announcement_attachment(UUID, TEXT, TEXT, TEXT, TEXT, BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_announcement_attachment(p_attachment_id uuid)
RETURNS void AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM public.announcement_attachments WHERE id = p_attachment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.delete_announcement_attachment(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_announcement_attachment_url(p_attachment_id uuid)
RETURNS JSONB AS $$
DECLARE
  v_attachment RECORD;
BEGIN
  SELECT * INTO v_attachment FROM public.announcement_attachments WHERE id = p_attachment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attachment not found'; END IF;
  RETURN jsonb_build_object('storage_path', v_attachment.storage_path, 'file_name', v_attachment.file_name, 'mime_type', v_attachment.mime_type, 'file_size', v_attachment.file_size);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.get_announcement_attachment_url(UUID) TO authenticated;


NOTIFY pgrst, 'reload schema';
