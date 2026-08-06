-- ==============================================================================
-- SHARED ANNOUNCEMENTS MODULE - BACKEND RPCs
-- ==============================================================================

-- Admin Target Validation
CREATE OR REPLACE FUNCTION public.validate_announcement_targets(
  p_author_id UUID,
  p_targets JSONB
)
RETURNS void AS $$
DECLARE
  v_role app_role;
  v_target RECORD;
  v_has_access boolean;
BEGIN
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = p_author_id;
  
  IF v_role = 'super_admin' THEN
    RETURN;
  END IF;

  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Only Admins or Super Admins can define targets.';
  END IF;

  -- Admin validation
  FOR v_target IN SELECT * FROM jsonb_array_elements(p_targets) LOOP
    IF v_target.value->>'target_type' = 'all_interns' THEN
      RAISE EXCEPTION 'Admin cannot target all_interns';
    END IF;

    IF v_target.value->>'target_type' = 'problem_statement' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.admin_problem_statements 
        WHERE admin_id = p_author_id AND problem_statement_id = (v_target.value->>'target_reference_id')::uuid
      ) INTO v_has_access;
      IF NOT v_has_access THEN
        RAISE EXCEPTION 'Unauthorized Problem Statement target';
      END IF;
    END IF;

    IF v_target.value->>'target_type' = 'selected_intern' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.admin_problem_statements aps ON aps.problem_statement_id = p.problem_statement_id
        WHERE aps.admin_id = p_author_id AND p.id = (v_target.value->>'target_reference_id')::uuid
      ) INTO v_has_access;
      IF NOT v_has_access THEN
        RAISE EXCEPTION 'Unauthorized Intern target';
      END IF;
    END IF;

    IF v_target.value->>'target_type' IN ('college', 'city', 'batch') THEN
      RAISE EXCEPTION 'Admin cannot target % directly without explicit scoped permissions.', v_target.value->>'target_type';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.validate_announcement_targets(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_announcement_targets(UUID, JSONB) TO authenticated;

-- Get Announcements Filter Options
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

-- Mark Read
CREATE OR REPLACE FUNCTION public.mark_announcement_read(p_announcement_id UUID)
RETURNS void AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_intern() THEN RAISE EXCEPTION 'Only Interns can mark read'; END IF;

  INSERT INTO public.announcement_reads (announcement_id, intern_id, read_at)
  VALUES (p_announcement_id, v_uid, NOW())
  ON CONFLICT (announcement_id, intern_id) DO UPDATE SET read_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.mark_announcement_read(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_announcement_read(UUID) TO authenticated;

-- Mark Unread
CREATE OR REPLACE FUNCTION public.mark_announcement_unread(p_announcement_id UUID)
RETURNS void AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_intern() THEN RAISE EXCEPTION 'Only Interns can mark unread'; END IF;

  DELETE FROM public.announcement_reads WHERE announcement_id = p_announcement_id AND intern_id = v_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.mark_announcement_unread(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_announcement_unread(UUID) TO authenticated;


-- GET ANNOUNCEMENTS (REAL AGGREGATION)
CREATE OR REPLACE FUNCTION public.get_announcements(
  p_search_text TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_read_filter TEXT DEFAULT NULL,
  p_is_pinned BOOLEAN DEFAULT NULL,
  p_problem_statement_id UUID DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
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
  v_query TEXT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;

  v_offset := (greatest(1, p_page) - 1) * greatest(1, p_page_size);

  -- We use a CTE to find accessible announcements first.
  -- For Interns: Only published announcements that target them, not deleted, not expired.
  -- For Admins/Super Admins: Full scope logic.
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
    AND (p_date_from IS NULL OR ba.created_at::date >= p_date_from)
    AND (p_date_to IS NULL OR ba.created_at::date <= p_date_to)
    AND (
      p_search_text IS NULL OR p_search_text = '' 
      OR lower(ba.title) LIKE '%' || lower(p_search_text) || '%'
      OR lower(ba.summary) LIKE '%' || lower(p_search_text) || '%'
      OR lower(ba.content) LIKE '%' || lower(p_search_text) || '%'
    )
    AND (
      p_problem_statement_id IS NULL OR EXISTS (
        SELECT 1 FROM public.announcement_targets at 
        WHERE at.announcement_id = ba.id AND at.target_type = 'problem_statement' AND at.target_reference_id = p_problem_statement_id::text
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
        CASE WHEN p_sort_by = 'published_at' AND p_sort_direction = 'desc' THEN
          CASE a.priority WHEN 'urgent' THEN 3 WHEN 'important' THEN 2 ELSE 1 END
        END DESC,
        CASE WHEN p_sort_by = 'published_at' AND p_sort_direction = 'desc' THEN a.published_at END DESC NULLS LAST,
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
REVOKE ALL ON FUNCTION public.get_announcements(TEXT, TEXT, TEXT, TEXT, BOOLEAN, UUID, DATE, DATE, INT, INT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcements(TEXT, TEXT, TEXT, TEXT, BOOLEAN, UUID, DATE, DATE, INT, INT, TEXT, TEXT) TO authenticated;

-- GET ANNOUNCEMENT BY ID
CREATE OR REPLACE FUNCTION public.get_announcement_by_id(p_announcement_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_row JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  
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
      'author', jsonb_build_object(
        'id', p.id,
        'name', p.full_name,
        'role', ur.role
      ),
      'read_state', jsonb_build_object(
        'is_read', ar.id IS NOT NULL,
        'read_at', ar.read_at
      ),
      'permissions', jsonb_build_object(
        'can_edit', (v_role = 'super_admin' OR (v_role = 'admin' AND a.author_id = v_uid)),
        'can_delete', (v_role = 'super_admin' OR (v_role = 'admin' AND a.author_id = v_uid)),
        'can_publish', (v_role = 'super_admin' OR (v_role = 'admin' AND a.author_id = v_uid)),
        'can_schedule', (v_role = 'super_admin' OR (v_role = 'admin' AND a.author_id = v_uid)),
        'can_archive', (v_role = 'super_admin' OR (v_role = 'admin' AND a.author_id = v_uid)),
        'can_manage_targets', (v_role = 'super_admin' OR (v_role = 'admin' AND a.author_id = v_uid))
      )
  ) INTO v_row
  FROM public.announcements a
  LEFT JOIN public.profiles p ON p.id = a.author_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.announcement_reads ar ON ar.announcement_id = a.id AND ar.intern_id = v_uid
  WHERE a.id = p_announcement_id AND a.deleted_at IS NULL
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
  );

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'Not Found or Forbidden';
  END IF;

  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.get_announcement_by_id(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcement_by_id(UUID) TO authenticated;

-- CREATE ANNOUNCEMENT (Unchanged base structure, handles validation)
CREATE OR REPLACE FUNCTION public.create_announcement(
  p_title text,
  p_summary text,
  p_content text,
  p_priority text,
  p_tags text[],
  p_targets jsonb,
  p_scheduled_at timestamptz default null,
  p_expires_at timestamptz default null
)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_id UUID;
  v_target RECORD;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  
  IF v_role = 'intern' THEN RAISE EXCEPTION 'Interns cannot create announcements'; END IF;

  PERFORM public.validate_announcement_targets(v_uid, p_targets);

  INSERT INTO public.announcements (
    title, summary, content, priority, tags, status, scheduled_at, expires_at, author_id
  ) VALUES (
    p_title, p_summary, p_content, p_priority, p_tags, 'draft', p_scheduled_at, p_expires_at, v_uid
  ) RETURNING id INTO v_id;

  FOR v_target IN SELECT * FROM jsonb_array_elements(p_targets) LOOP
    INSERT INTO public.announcement_targets (announcement_id, target_type, target_reference_id)
    VALUES (v_id, v_target.value->>'target_type', v_target.value->>'target_reference_id');
  END LOOP;

  INSERT INTO public.announcement_audit_logs (announcement_id, action, performed_by, reason)
  VALUES (v_id, 'create', v_uid, 'Announcement drafted');

  RETURN jsonb_build_object('id', v_id, 'status', 'draft', 'created_at', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.create_announcement(TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_announcement(TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- UPDATE ANNOUNCEMENT
CREATE OR REPLACE FUNCTION public.update_announcement(
  p_id uuid,
  p_title text,
  p_summary text,
  p_content text,
  p_priority text,
  p_tags text[],
  p_targets jsonb
)
RETURNS void AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_author_id UUID;
  v_target RECORD;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;

  SELECT author_id INTO v_author_id FROM public.announcements WHERE id = p_id AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;
  
  IF v_role != 'super_admin' AND (v_role != 'admin' OR v_author_id != v_uid) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM public.validate_announcement_targets(v_uid, p_targets);

  UPDATE public.announcements
  SET title = p_title, summary = p_summary, content = p_content, priority = p_priority, tags = p_tags
  WHERE id = p_id;

  DELETE FROM public.announcement_targets WHERE announcement_id = p_id;
  
  FOR v_target IN SELECT * FROM jsonb_array_elements(p_targets) LOOP
    INSERT INTO public.announcement_targets (announcement_id, target_type, target_reference_id)
    VALUES (p_id, v_target.value->>'target_type', v_target.value->>'target_reference_id');
  END LOOP;

  INSERT INTO public.announcement_audit_logs (announcement_id, action, performed_by, reason)
  VALUES (p_id, 'update', v_uid, 'Announcement updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.update_announcement(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_announcement(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB) TO authenticated;

-- SCHEDULE, ARCHIVE, DELETE
CREATE OR REPLACE FUNCTION public.schedule_announcement(p_id uuid) RETURNS void AS $$ 
BEGIN 
  UPDATE public.announcements SET status = 'scheduled' WHERE id = p_id AND status = 'draft';
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.schedule_announcement(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schedule_announcement(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.archive_announcement(p_id uuid) RETURNS void AS $$ 
BEGIN 
  UPDATE public.announcements SET status = 'archived' WHERE id = p_id;
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.archive_announcement(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_announcement(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_announcement(p_id uuid) RETURNS void AS $$ 
BEGIN 
  UPDATE public.announcements SET deleted_at = NOW() WHERE id = p_id;
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.delete_announcement(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_announcement(UUID) TO authenticated;

-- GET ATTACHMENT AUTHORIZATION
CREATE OR REPLACE FUNCTION public.get_announcement_attachment_url(p_attachment_id uuid) 
RETURNS JSONB AS $$ 
DECLARE
  v_uid UUID;
  v_role app_role;
  v_attachment RECORD;
  v_has_access BOOLEAN;
BEGIN 
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;

  SELECT * INTO v_attachment FROM public.announcement_attachments WHERE id = p_attachment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attachment not found'; END IF;

  -- Ensure visibility
  SELECT EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = v_attachment.announcement_id AND a.deleted_at IS NULL
    AND (
      (v_role = 'super_admin')
      OR (v_role = 'admin' AND (a.author_id = v_uid OR a.status IN ('published', 'archived')))
      OR (v_role = 'intern' AND a.status IN ('published', 'archived') AND public.intern_matches_announcement_target(a.id, v_uid))
    )
  ) INTO v_has_access;

  IF NOT v_has_access THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Returning path metadata (Signed URLs generated externally by Edge function using path)
  RETURN jsonb_build_object(
    'storage_path', v_attachment.storage_path,
    'file_name', v_attachment.file_name,
    'mime_type', v_attachment.mime_type,
    'file_size', v_attachment.file_size
  );
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.get_announcement_attachment_url(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcement_attachment_url(UUID) TO authenticated;
