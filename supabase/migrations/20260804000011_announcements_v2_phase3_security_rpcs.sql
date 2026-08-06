-- ==============================================================================
-- PHASE 3: SECURITY, STORAGE, AND RPC INTEGRATION
-- ==============================================================================

-- ==============================================================================
-- STEP 2 — CREATE SECURE ROLE HELPERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  SELECT ur.role::text INTO v_role FROM public.user_roles ur WHERE ur.user_id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_intern()
RETURNS boolean AS $$
BEGIN
  RETURN public.current_user_role() = 'intern';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.is_intern() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_intern() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.current_user_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;


-- ==============================================================================
-- STEP 3 — TARGET MATCHING HELPER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.intern_matches_announcement_target(
  p_announcement_id uuid,
  p_intern_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = p_announcement_id AND a.deleted_at IS NULL) THEN
    RETURN false;
  END IF;

  SELECT * INTO v_profile FROM public.profiles p WHERE p.id = p_intern_id;
  IF NOT FOUND THEN RETURN false; END IF;
  
  IF EXISTS (SELECT 1 FROM public.announcement_targets t WHERE t.announcement_id = p_announcement_id AND t.target_type = 'all_interns') THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.announcement_targets t
    WHERE t.announcement_id = p_announcement_id 
    AND (
      (t.target_type = 'problem_statement' AND t.target_reference_id = v_profile.problem_statement_id::text) OR
      (target_type = 'college' AND target_reference_id = v_profile.college_name) OR
      (target_type = 'city' AND target_reference_id = v_profile.city) OR
      (target_type = 'selected_intern' AND target_reference_id = p_intern_id::text)
      -- batch target type safely ignored if batch column doesn't exist on profile
    )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.intern_matches_announcement_target(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intern_matches_announcement_target(uuid, uuid) TO authenticated;


-- ==============================================================================
-- STEP 4 — RLS FOR announcements
-- ==============================================================================
DROP POLICY IF EXISTS "Announcements SELECT" ON public.announcements;
CREATE POLICY "Announcements SELECT" ON public.announcements FOR SELECT TO authenticated USING (
  deleted_at IS NULL AND (
    public.is_super_admin() OR
    (public.is_admin() AND (
      author_id = auth.uid() OR
      status IN ('published', 'archived') OR
      EXISTS (
        SELECT 1 FROM public.announcement_targets t
        JOIN public.admin_problem_statements aps ON aps.problem_statement_id::text = t.target_reference_id
        WHERE t.announcement_id = announcements.id AND aps.admin_id = auth.uid() AND t.target_type = 'problem_statement'
      )
    )) OR
    (public.is_intern() AND status = 'published' AND (expires_at IS NULL OR expires_at > NOW()) AND public.intern_matches_announcement_target(announcements.id, auth.uid()))
  )
);

DROP POLICY IF EXISTS "Announcements INSERT" ON public.announcements;
CREATE POLICY "Announcements INSERT" ON public.announcements FOR INSERT TO authenticated WITH CHECK (
  public.is_super_admin() OR (public.is_admin() AND author_id = auth.uid())
);

DROP POLICY IF EXISTS "Announcements UPDATE" ON public.announcements;
CREATE POLICY "Announcements UPDATE" ON public.announcements FOR UPDATE TO authenticated USING (
  public.is_super_admin() OR (public.is_admin() AND author_id = auth.uid())
);

DROP POLICY IF EXISTS "Announcements DELETE" ON public.announcements;
CREATE POLICY "Announcements DELETE" ON public.announcements FOR DELETE TO authenticated USING (
  public.is_super_admin()
);


-- ==============================================================================
-- STEP 5 — RLS FOR announcement_targets
-- ==============================================================================
DROP POLICY IF EXISTS "Targets SELECT" ON public.announcement_targets;
CREATE POLICY "Targets SELECT" ON public.announcement_targets FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_targets.announcement_id)
);

DROP POLICY IF EXISTS "Targets INSERT" ON public.announcement_targets;
CREATE POLICY "Targets INSERT" ON public.announcement_targets FOR INSERT TO authenticated WITH CHECK (
  public.is_super_admin() OR (public.is_admin() AND EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_targets.announcement_id AND a.author_id = auth.uid()))
);

DROP POLICY IF EXISTS "Targets UPDATE" ON public.announcement_targets;
CREATE POLICY "Targets UPDATE" ON public.announcement_targets FOR UPDATE TO authenticated USING (
  public.is_super_admin() OR (public.is_admin() AND EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_targets.announcement_id AND a.author_id = auth.uid()))
);

DROP POLICY IF EXISTS "Targets DELETE" ON public.announcement_targets;
CREATE POLICY "Targets DELETE" ON public.announcement_targets FOR DELETE TO authenticated USING (
  public.is_super_admin() OR (public.is_admin() AND EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_targets.announcement_id AND a.author_id = auth.uid()))
);


-- ==============================================================================
-- STEP 6 — RLS FOR announcement_reads
-- ==============================================================================
DROP POLICY IF EXISTS "Reads SELECT" ON public.announcement_reads;
CREATE POLICY "Reads SELECT" ON public.announcement_reads FOR SELECT TO authenticated USING (
  intern_id = auth.uid() OR public.is_super_admin() OR public.is_admin()
);

DROP POLICY IF EXISTS "Reads INSERT" ON public.announcement_reads;
CREATE POLICY "Reads INSERT" ON public.announcement_reads FOR INSERT TO authenticated WITH CHECK (
  intern_id = auth.uid()
);

DROP POLICY IF EXISTS "Reads UPDATE" ON public.announcement_reads;
CREATE POLICY "Reads UPDATE" ON public.announcement_reads FOR UPDATE TO authenticated USING (
  intern_id = auth.uid()
);

DROP POLICY IF EXISTS "Reads DELETE" ON public.announcement_reads;
CREATE POLICY "Reads DELETE" ON public.announcement_reads FOR DELETE TO authenticated USING (
  intern_id = auth.uid()
);


-- ==============================================================================
-- STEP 7 — RLS FOR announcement_attachments
-- ==============================================================================
DROP POLICY IF EXISTS "Attachments SELECT" ON public.announcement_attachments;
CREATE POLICY "Attachments SELECT" ON public.announcement_attachments FOR SELECT TO authenticated USING (
  deleted_at IS NULL AND EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_attachments.announcement_id)
);

DROP POLICY IF EXISTS "Attachments INSERT" ON public.announcement_attachments;
CREATE POLICY "Attachments INSERT" ON public.announcement_attachments FOR INSERT TO authenticated WITH CHECK (
  public.is_super_admin() OR (public.is_admin() AND EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_attachments.announcement_id AND a.author_id = auth.uid()))
);

DROP POLICY IF EXISTS "Attachments UPDATE" ON public.announcement_attachments;
CREATE POLICY "Attachments UPDATE" ON public.announcement_attachments FOR UPDATE TO authenticated USING (
  public.is_super_admin() OR (public.is_admin() AND EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_attachments.announcement_id AND a.author_id = auth.uid()))
);

DROP POLICY IF EXISTS "Attachments DELETE" ON public.announcement_attachments;
CREATE POLICY "Attachments DELETE" ON public.announcement_attachments FOR DELETE TO authenticated USING (
  public.is_super_admin() OR (public.is_admin() AND EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_attachments.announcement_id AND a.author_id = auth.uid()))
);


-- ==============================================================================
-- STEP 8 — RLS FOR announcement_audit_logs
-- ==============================================================================
DROP POLICY IF EXISTS "Audit SELECT" ON public.announcement_audit_logs;
CREATE POLICY "Audit SELECT" ON public.announcement_audit_logs FOR SELECT TO authenticated USING (
  public.is_super_admin() OR (public.is_admin() AND EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_audit_logs.announcement_id AND a.author_id = auth.uid()))
);
-- No INSERT/UPDATE/DELETE allowed from the frontend, only via RPC.


-- ==============================================================================
-- STEP 9 — PRIVATE STORAGE BUCKET
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('announcement-assets', 'announcement-assets', false) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Admin Upload Attachments" ON storage.objects;
CREATE POLICY "Admin Upload Attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'announcement-assets' AND (public.is_super_admin() OR public.is_admin())
);

DROP POLICY IF EXISTS "Admin Delete Attachments" ON storage.objects;
CREATE POLICY "Admin Delete Attachments" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'announcement-assets' AND (public.is_super_admin() OR public.is_admin())
);

-- Note: Read policies are kept restrictive. Interns must get signed URLs via RPC.


-- ==============================================================================
-- STEP 10 — FILTER OPTIONS RPC
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_announcement_filter_options()
RETURNS jsonb AS $$
DECLARE
  v_uid uuid;
  v_problem_statements jsonb;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF public.is_super_admin() THEN
    SELECT jsonb_agg(jsonb_build_object('id', ps.id, 'title', ps.title)) INTO v_problem_statements FROM public.problem_statements ps WHERE ps.status = 'active';
  ELSIF public.is_admin() THEN
    SELECT jsonb_agg(jsonb_build_object('id', ps.id, 'title', ps.title)) INTO v_problem_statements
    FROM public.problem_statements ps
    JOIN public.admin_problem_statements aps ON aps.problem_statement_id = ps.id
    WHERE aps.admin_id = v_uid AND ps.status = 'active';
  ELSIF public.is_intern() THEN
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


-- ==============================================================================
-- STEP 11 — SUMMARY RPC
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_announcement_summary()
RETURNS jsonb AS $$
DECLARE
  v_uid uuid;
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

  IF public.is_super_admin() OR public.is_admin() THEN
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE status = 'published'),
      COUNT(*) FILTER (WHERE status = 'scheduled'),
      COUNT(*) FILTER (WHERE status = 'draft'),
      COUNT(*) FILTER (WHERE status = 'archived'),
      COUNT(*) FILTER (WHERE status = 'expired')
    INTO v_total, v_published, v_scheduled, v_drafts, v_archived, v_expired
    FROM public.announcements a
    WHERE a.deleted_at IS NULL
      AND (public.is_super_admin() OR a.author_id = v_uid OR a.status IN ('published','archived') OR EXISTS(
        SELECT 1 FROM public.announcement_targets at2 
        JOIN public.admin_problem_statements aps ON aps.problem_statement_id::text = at2.target_reference_id
        WHERE at2.announcement_id = a.id AND aps.admin_id = v_uid AND at2.target_type = 'problem_statement'
      ));
      
    RETURN jsonb_build_object('total', v_total, 'published', v_published, 'scheduled', v_scheduled, 'drafts', v_drafts, 'archived', v_archived, 'expired', v_expired);
  
  ELSIF public.is_intern() THEN
    WITH matching AS (
      SELECT a.id, a.priority, a.is_pinned, EXISTS(SELECT 1 FROM public.announcement_reads ar WHERE ar.announcement_id = a.id AND ar.intern_id = v_uid) as is_read
      FROM public.announcements a
      WHERE a.status = 'published' AND a.deleted_at IS NULL AND (a.expires_at IS NULL OR a.expires_at > NOW()) AND public.intern_matches_announcement_target(a.id, v_uid)
    )
    SELECT COUNT(*), COUNT(*) FILTER (WHERE NOT is_read), COUNT(*) FILTER (WHERE is_read), COUNT(*) FILTER (WHERE priority IN ('important', 'urgent')), COUNT(*) FILTER (WHERE is_pinned = true)
    INTO v_total, v_unread, v_read, v_important, v_pinned
    FROM matching;

    RETURN jsonb_build_object('total', v_total, 'unread', v_unread, 'read', v_read, 'important', v_important, 'pinned', v_pinned);
  END IF;
  
  RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.get_announcement_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcement_summary() TO authenticated;


-- ==============================================================================
-- STEP 12 — LIST RPC
-- ==============================================================================
DROP FUNCTION IF EXISTS public.get_announcements(text,text,text,text,boolean,text,text,text,integer,integer,text,text);
CREATE OR REPLACE FUNCTION public.get_announcements(
  p_search_text text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_read_filter text DEFAULT NULL,
  p_is_pinned boolean DEFAULT NULL,
  p_problem_statement_id text DEFAULT NULL,
  p_date_from text DEFAULT NULL,
  p_date_to text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20,
  p_sort_by text DEFAULT 'published_at',
  p_sort_direction text DEFAULT 'desc'
)
RETURNS jsonb AS $$
DECLARE
  v_uid uuid;
  v_rows jsonb := '[]'::jsonb;
  v_total int := 0;
  v_offset int;
  v_is_intern boolean;
  v_is_admin boolean;
  v_is_super_admin boolean;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  v_is_intern := public.is_intern();
  v_is_admin := public.is_admin();
  v_is_super_admin := public.is_super_admin();

  v_offset := (greatest(1, p_page) - 1) * greatest(1, p_page_size);

  IF p_sort_by NOT IN ('published_at', 'created_at', 'updated_at', 'priority', 'status', 'title') THEN
    p_sort_by := 'published_at';
  END IF;
  IF p_sort_direction NOT IN ('asc', 'desc') THEN
    p_sort_direction := 'desc';
  END IF;

  CREATE TEMP TABLE temp_filtered_announcements ON COMMIT DROP AS
  WITH base_access AS (
    SELECT a.*
    FROM public.announcements a
    WHERE a.deleted_at IS NULL
    AND (
      (v_is_super_admin)
      OR
      (v_is_admin AND (
         a.author_id = v_uid 
         OR EXISTS (
           SELECT 1 FROM public.announcement_targets at2 
           JOIN public.admin_problem_statements aps ON aps.problem_statement_id::text = at2.target_reference_id
           WHERE at2.announcement_id = a.id AND aps.admin_id = v_uid AND at2.target_type = 'problem_statement'
         )
         OR a.status IN ('published', 'archived')
      ))
      OR
      (v_is_intern AND a.status = 'published' AND (a.expires_at IS NULL OR a.expires_at > NOW()) AND public.intern_matches_announcement_target(a.id, v_uid))
    )
  )
  SELECT ba.*
  FROM base_access ba
  WHERE 
    (p_status IS NULL OR p_status = '' OR ba.status = p_status)
    AND (p_priority IS NULL OR p_priority = '' OR ba.priority = p_priority)
    AND (p_is_pinned IS NULL OR ba.is_pinned = p_is_pinned)
    AND (p_date_from IS NULL OR p_date_from = '' OR ba.created_at >= p_date_from::timestamptz)
    AND (p_date_to IS NULL OR p_date_to = '' OR ba.created_at <= p_date_to::timestamptz)
    AND (
      p_search_text IS NULL OR p_search_text = '' 
      OR lower(ba.title) LIKE '%' || lower(p_search_text) || '%'
      OR lower(ba.summary) LIKE '%' || lower(p_search_text) || '%'
    )
    AND (
      p_problem_statement_id IS NULL OR p_problem_statement_id = '' OR EXISTS (
        SELECT 1 FROM public.announcement_targets at 
        WHERE at.announcement_id = ba.id AND at.target_type = 'problem_statement' AND at.target_reference_id = p_problem_statement_id
      )
    )
    AND (
      p_read_filter IS NULL OR p_read_filter = '' OR p_read_filter = 'all' OR
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
          'scheduled_at', a.scheduled_at,
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
            'count', (SELECT COUNT(*) FROM public.announcement_attachments aa WHERE aa.announcement_id = a.id AND aa.deleted_at IS NULL),
            'image_count', (SELECT COUNT(*) FROM public.announcement_attachments aa WHERE aa.announcement_id = a.id AND aa.attachment_type = 'image' AND aa.deleted_at IS NULL),
            'document_count', (SELECT COUNT(*) FROM public.announcement_attachments aa WHERE aa.announcement_id = a.id AND aa.attachment_type = 'document' AND aa.deleted_at IS NULL)
          ),
          'permissions', jsonb_build_object(
            'can_edit', (v_is_super_admin OR (v_is_admin AND a.author_id = v_uid)),
            'can_delete', (v_is_super_admin),
            'can_publish', (v_is_super_admin OR (v_is_admin AND a.author_id = v_uid)),
            'can_schedule', (v_is_super_admin OR (v_is_admin AND a.author_id = v_uid)),
            'can_archive', (v_is_super_admin OR (v_is_admin AND a.author_id = v_uid)),
            'can_manage_targets', (v_is_super_admin OR (v_is_admin AND a.author_id = v_uid))
          )
        ) as row_data
      FROM temp_filtered_announcements a
      LEFT JOIN public.profiles p ON p.id = a.author_id
      LEFT JOIN public.user_roles ur ON ur.user_id = p.id
      LEFT JOIN public.announcement_reads ar ON ar.announcement_id = a.id AND ar.intern_id = v_uid
      ORDER BY
        CASE WHEN p_sort_direction = 'desc' THEN (a.is_pinned) END DESC,
        CASE WHEN p_sort_direction = 'desc' THEN CASE a.priority WHEN 'urgent' THEN 3 WHEN 'important' THEN 2 ELSE 1 END END DESC,
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
REVOKE ALL ON FUNCTION public.get_announcements(text,text,text,text,boolean,text,text,text,integer,integer,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcements(text,text,text,text,boolean,text,text,text,integer,integer,text,text) TO authenticated;


-- ==============================================================================
-- STEP 13 — DETAIL RPC
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_announcement_by_id(p_announcement_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_uid uuid;
  v_row jsonb;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT jsonb_build_object(
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
      'author', jsonb_build_object('id', p.id, 'name', p.full_name, 'role', ur.role),
      'read_state', jsonb_build_object('is_read', ar.id IS NOT NULL, 'read_at', ar.read_at),
      'permissions', jsonb_build_object('can_edit', (public.is_super_admin() OR (public.is_admin() AND a.author_id = v_uid)), 'can_delete', public.is_super_admin())
  ) INTO v_row
  FROM public.announcements a
  LEFT JOIN public.profiles p ON p.id = a.author_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.announcement_reads ar ON ar.announcement_id = a.id AND ar.intern_id = v_uid
  WHERE a.id = p_announcement_id AND a.deleted_at IS NULL
  AND (
      (public.is_super_admin()) OR
      (public.is_admin() AND (a.author_id = v_uid OR EXISTS (SELECT 1 FROM public.announcement_targets t JOIN public.admin_problem_statements aps ON aps.problem_statement_id::text = t.target_reference_id WHERE t.announcement_id = a.id AND aps.admin_id = v_uid AND t.target_type = 'problem_statement') OR a.status IN ('published', 'archived'))) OR
      (public.is_intern() AND a.status = 'published' AND (a.expires_at IS NULL OR a.expires_at > NOW()) AND public.intern_matches_announcement_target(a.id, v_uid))
  );

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'Not Found or Forbidden';
  END IF;

  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.get_announcement_by_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcement_by_id(uuid) TO authenticated;


-- ==============================================================================
-- STEP 14 — READ/UNREAD RPCs
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.mark_announcement_read(p_announcement_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT public.is_intern() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF NOT public.intern_matches_announcement_target(p_announcement_id, auth.uid()) THEN RAISE EXCEPTION 'Not Found or Forbidden'; END IF;

  INSERT INTO public.announcement_reads (announcement_id, intern_id, read_at) 
  VALUES (p_announcement_id, auth.uid(), NOW())
  ON CONFLICT (announcement_id, intern_id) DO UPDATE SET read_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.mark_announcement_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_announcement_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_announcement_unread(p_announcement_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT public.is_intern() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.announcement_reads WHERE announcement_id = p_announcement_id AND intern_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.mark_announcement_unread(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_announcement_unread(uuid) TO authenticated;


-- ==============================================================================
-- STEP 15 — ATTACHMENT RPCs
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_announcement_attachment(
  p_announcement_id uuid, p_attachment_type text, p_storage_path text, p_file_name text, p_mime_type text, p_file_size bigint
)
RETURNS jsonb AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT (public.is_super_admin() OR (public.is_admin() AND EXISTS(SELECT 1 FROM public.announcements a WHERE a.id = p_announcement_id AND a.author_id = auth.uid()))) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.announcement_attachments (announcement_id, attachment_type, storage_path, file_name, mime_type, file_size, created_by)
  VALUES (p_announcement_id, p_attachment_type, p_storage_path, p_file_name, p_mime_type, p_file_size, auth.uid())
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'storage_path', p_storage_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.create_announcement_attachment(uuid,text,text,text,text,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_announcement_attachment(uuid,text,text,text,text,bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_announcement_attachment(p_attachment_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT (public.is_super_admin() OR public.is_admin()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  
  UPDATE public.announcement_attachments SET deleted_at = NOW() 
  WHERE id = p_attachment_id AND (public.is_super_admin() OR EXISTS(SELECT 1 FROM public.announcements a WHERE a.id = announcement_attachments.announcement_id AND a.author_id = auth.uid()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.delete_announcement_attachment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_announcement_attachment(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_announcement_attachment_url(p_attachment_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_attachment record;
  v_announcement record;
BEGIN
  SELECT * INTO v_attachment FROM public.announcement_attachments WHERE id = p_attachment_id AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not Found'; END IF;

  SELECT * INTO v_announcement FROM public.announcements WHERE id = v_attachment.announcement_id AND deleted_at IS NULL;
  
  IF NOT (
    public.is_super_admin() OR 
    (public.is_admin() AND (v_announcement.author_id = auth.uid() OR v_announcement.status IN ('published','archived'))) OR 
    (public.is_intern() AND v_announcement.status = 'published' AND (v_announcement.expires_at IS NULL OR v_announcement.expires_at > NOW()) AND public.intern_matches_announcement_target(v_announcement.id, auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN jsonb_build_object('storage_path', v_attachment.storage_path, 'file_name', v_attachment.file_name, 'mime_type', v_attachment.mime_type, 'file_size', v_attachment.file_size);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.get_announcement_attachment_url(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcement_attachment_url(uuid) TO authenticated;

-- ==============================================================================
-- STEP 16 — CREATE ANNOUNCEMENT RPC
-- ==============================================================================
DROP FUNCTION IF EXISTS public.create_announcement(text, text, text, text, timestamptz, timestamptz, text[], jsonb);
CREATE OR REPLACE FUNCTION public.create_announcement(
    p_title text,
    p_summary text,
    p_content text,
    p_priority text,
    p_scheduled_at timestamptz,
    p_expires_at timestamptz,
    p_tags text[],
    p_targets jsonb
) RETURNS uuid AS $$
DECLARE
  v_uid uuid;
  v_id uuid;
  v_status text;
  v_priority text;
  v_target jsonb;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (public.is_admin() OR public.is_super_admin()) THEN RAISE EXCEPTION 'Forbidden'; END IF;

  v_priority := COALESCE(p_priority, 'normal');
  IF v_priority NOT IN ('normal', 'important', 'urgent') THEN
    v_priority := 'normal';
  END IF;

  IF p_scheduled_at IS NOT NULL THEN
    IF p_scheduled_at > NOW() THEN
      v_status := 'scheduled';
    ELSE
      v_status := 'published';
    END IF;
  ELSE
    v_status := 'draft';
  END IF;

  INSERT INTO public.announcements (
    title, summary, content, priority, status, 
    author_id, scheduled_at, published_at, expires_at, tags
  ) VALUES (
    p_title, p_summary, p_content, v_priority, v_status, 
    v_uid, 
    p_scheduled_at, 
    CASE WHEN v_status = 'published' THEN NOW() ELSE NULL END, 
    p_expires_at, 
    COALESCE(p_tags, '{}'::text[])
  ) RETURNING id INTO v_id;

  IF p_targets IS NOT NULL AND jsonb_typeof(p_targets) = 'array' THEN
    FOR v_target IN SELECT * FROM jsonb_array_elements(p_targets)
    LOOP
      IF public.is_admin() AND NOT public.is_super_admin() THEN
        IF v_target->>'target_type' = 'all_interns' THEN
          RAISE EXCEPTION 'Admin cannot target all_interns';
        ELSIF v_target->>'target_type' = 'problem_statement' THEN
          IF NOT EXISTS (
            SELECT 1 FROM public.admin_problem_statements aps 
            WHERE aps.admin_id = v_uid AND aps.problem_statement_id::text = v_target->>'target_reference_id'
          ) THEN
            RAISE EXCEPTION 'Unauthorized problem_statement target';
          END IF;
        END IF;
      END IF;

      INSERT INTO public.announcement_targets (
        announcement_id, target_type, target_reference_id, created_by
      ) VALUES (
        v_id, 
        v_target->>'target_type', 
        v_target->>'target_reference_id',
        v_uid
      );
    END LOOP;
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.create_announcement(text, text, text, text, timestamptz, timestamptz, text[], jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_announcement(text, text, text, text, timestamptz, timestamptz, text[], jsonb) TO authenticated;

-- ==============================================================================
-- SCHEMA RELOAD
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
