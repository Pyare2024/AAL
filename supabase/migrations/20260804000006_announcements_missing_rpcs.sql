-- ==============================================================================
-- MISSING ANNOUNCEMENTS RPCs
-- ==============================================================================

-- 1. Helper function: intern_matches_announcement_target
CREATE OR REPLACE FUNCTION public.intern_matches_announcement_target(p_announcement_id UUID, p_intern_id UUID)
RETURNS boolean AS $$
DECLARE
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. Filter options RPC: get_announcement_filter_options
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


-- 3. List announcements RPC: get_announcements
CREATE OR REPLACE FUNCTION public.get_announcements(
  p_search_text TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_read_filter TEXT DEFAULT NULL,
  p_is_pinned BOOLEAN DEFAULT NULL,
  p_problem_statement_id TEXT DEFAULT NULL,
  p_date_from TEXT DEFAULT NULL,
  p_date_to TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20,
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
    AND (p_date_from IS NULL OR p_date_from = '' OR ba.created_at >= p_date_from::TIMESTAMPTZ)
    AND (p_date_to IS NULL OR p_date_to = '' OR ba.created_at <= p_date_to::TIMESTAMPTZ)
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
        CASE WHEN p_sort_by = 'published_at' AND p_sort_direction = 'desc' THEN
          CASE a.priority WHEN 'urgent' THEN 3 WHEN 'important' THEN 2 ELSE 1 END
        END DESC,
        CASE WHEN p_sort_by = 'published_at' AND p_sort_direction = 'desc' THEN a.published_at END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'published_at' AND p_sort_direction = 'asc' THEN a.published_at END ASC NULLS LAST,
        CASE WHEN p_sort_by = 'priority' AND p_sort_direction = 'desc' THEN
          CASE a.priority WHEN 'urgent' THEN 3 WHEN 'important' THEN 2 ELSE 1 END
        END DESC,
        CASE WHEN p_sort_by = 'priority' AND p_sort_direction = 'asc' THEN
          CASE a.priority WHEN 'urgent' THEN 3 WHEN 'important' THEN 2 ELSE 1 END
        END ASC,
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
REVOKE ALL ON FUNCTION public.get_announcements(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcements(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
