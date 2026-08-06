-- ==============================================================================
-- FIX GET ANNOUNCEMENTS RPC COLUMN REFERENCES (ROLE)
-- ==============================================================================

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
  v_role text;
  v_total_count integer := 0;
  v_total_pages integer := 0;
  v_offset integer;
  v_rows jsonb := '[]'::jsonb;
  v_sort_by text;
  v_sort_direction text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = v_uid;

  -- Validation
  IF p_page < 1 THEN p_page := 1; END IF;
  IF p_page_size < 1 THEN p_page_size := 20; END IF;
  IF p_page_size > 100 THEN p_page_size := 100; END IF;
  v_offset := (p_page - 1) * p_page_size;

  -- Safe Sorting
  v_sort_by := lower(p_sort_by);
  v_sort_direction := lower(p_sort_direction);
  IF v_sort_by NOT IN ('published_at', 'created_at', 'updated_at', 'priority', 'status', 'title') THEN
    v_sort_by := 'published_at';
  END IF;
  IF v_sort_direction NOT IN ('asc', 'desc') THEN
    v_sort_direction := 'desc';
  END IF;

  WITH filtered_announcements AS (
    SELECT 
      a.id,
      a.title,
      a.summary,
      a.content,
      a.priority,
      a.status,
      a.is_pinned,
      a.author_id,
      p.full_name as author_name,
      ur.role as author_role,
      a.published_at,
      a.scheduled_at,
      a.expires_at,
      a.created_at,
      a.updated_at,
      a.tags,
      EXISTS(SELECT 1 FROM public.announcement_reads ar WHERE ar.announcement_id = a.id AND ar.intern_id = v_uid) as is_read,
      (SELECT read_at FROM public.announcement_reads ar WHERE ar.announcement_id = a.id AND ar.intern_id = v_uid LIMIT 1) as read_at,
      (SELECT count(*) FROM public.announcement_attachments aa WHERE aa.announcement_id = a.id AND aa.deleted_at IS NULL) as attachment_count
    FROM public.announcements a
    LEFT JOIN public.profiles p ON a.author_id = p.id
    LEFT JOIN public.user_roles ur ON a.author_id = ur.user_id
    WHERE a.deleted_at IS NULL
      -- Role based filtering
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
        (v_role = 'intern' 
          AND a.status = 'published' 
          AND a.archived_at IS NULL
          AND (a.published_at IS NULL OR a.published_at <= NOW())
          AND (a.scheduled_at IS NULL OR a.scheduled_at <= NOW())
          AND (a.expires_at IS NULL OR a.expires_at > NOW()) 
          AND public.intern_matches_announcement_target(a.id, v_uid)
        )
      )
      -- Search Filter
      AND (p_search_text IS NULL OR p_search_text = '' OR a.title ILIKE '%' || p_search_text || '%' OR a.content ILIKE '%' || p_search_text || '%')
      -- Status Filter
      AND (p_status IS NULL OR p_status = '' OR a.status = p_status)
      -- Priority Filter
      AND (p_priority IS NULL OR p_priority = '' OR a.priority = p_priority)
      -- Pinned Filter
      AND (p_is_pinned IS NULL OR a.is_pinned = p_is_pinned)
      -- Problem Statement Filter
      AND (p_problem_statement_id IS NULL OR p_problem_statement_id = '' OR p_problem_statement_id = 'all' OR EXISTS(SELECT 1 FROM public.announcement_targets at2 WHERE at2.announcement_id = a.id AND at2.target_type = 'problem_statement' AND at2.target_reference_id = p_problem_statement_id))
      -- Date Filters
      AND (p_date_from IS NULL OR p_date_from = '' OR a.published_at >= p_date_from::timestamptz OR a.created_at >= p_date_from::timestamptz)
      AND (p_date_to IS NULL OR p_date_to = '' OR a.published_at <= p_date_to::timestamptz OR a.created_at <= p_date_to::timestamptz)
  ),
  read_filtered AS (
    SELECT * FROM filtered_announcements
    WHERE (p_read_filter IS NULL OR p_read_filter = '' OR p_read_filter = 'all' OR (p_read_filter = 'read' AND is_read = true) OR (p_read_filter = 'unread' AND is_read = false))
  ),
  counted AS (
    SELECT count(*) as total FROM read_filtered
  ),
  paged AS (
    SELECT * FROM read_filtered
    ORDER BY 
      CASE WHEN p_sort_by = 'priority' AND v_sort_direction = 'asc' THEN priority END ASC,
      CASE WHEN p_sort_by = 'priority' AND v_sort_direction = 'desc' THEN priority END DESC,
      CASE WHEN p_sort_by = 'status' AND v_sort_direction = 'asc' THEN status END ASC,
      CASE WHEN p_sort_by = 'status' AND v_sort_direction = 'desc' THEN status END DESC,
      CASE WHEN p_sort_by = 'title' AND v_sort_direction = 'asc' THEN title END ASC,
      CASE WHEN p_sort_by = 'title' AND v_sort_direction = 'desc' THEN title END DESC,
      CASE WHEN p_sort_by = 'published_at' AND v_sort_direction = 'asc' THEN published_at END ASC,
      CASE WHEN p_sort_by = 'published_at' AND v_sort_direction = 'desc' THEN published_at END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'created_at' AND v_sort_direction = 'asc' THEN created_at END ASC,
      CASE WHEN p_sort_by = 'created_at' AND v_sort_direction = 'desc' THEN created_at END DESC,
      CASE WHEN p_sort_by = 'updated_at' AND v_sort_direction = 'asc' THEN updated_at END ASC,
      CASE WHEN p_sort_by = 'updated_at' AND v_sort_direction = 'desc' THEN updated_at END DESC
    LIMIT p_page_size
    OFFSET v_offset
  )
  SELECT 
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'title', p.title,
          'summary', p.summary,
          'content', p.content,
          'priority', p.priority,
          'status', p.status,
          'is_pinned', p.is_pinned,
          'published_at', p.published_at,
          'scheduled_at', p.scheduled_at,
          'expires_at', p.expires_at,
          'created_at', p.created_at,
          'updated_at', p.updated_at,
          'tags', p.tags,
          'author', jsonb_build_object(
            'id', p.author_id,
            'name', p.author_name,
            'role', p.author_role
          ),
          'read_state', jsonb_build_object(
            'is_read', p.is_read,
            'read_at', p.read_at
          ),
          'attachments', jsonb_build_object(
            'count', p.attachment_count,
            'image_count', 0,
            'document_count', 0
          ),
          'permissions', jsonb_build_object(
            'can_edit', (v_role = 'super_admin' OR (v_role = 'admin' AND p.author_id = v_uid)),
            'can_delete', (v_role = 'super_admin'),
            'can_publish', (v_role = 'super_admin' OR (v_role = 'admin' AND p.author_id = v_uid)),
            'can_schedule', (v_role = 'super_admin' OR (v_role = 'admin' AND p.author_id = v_uid)),
            'can_archive', (v_role = 'super_admin' OR (v_role = 'admin' AND p.author_id = v_uid)),
            'can_manage_targets', (v_role = 'super_admin' OR (v_role = 'admin' AND p.author_id = v_uid))
          )
        )
      ), 
      '[]'::jsonb
    )
  INTO v_rows
  FROM paged p;

  SELECT total INTO v_total_count FROM counted;
  IF v_total_count IS NULL THEN v_total_count := 0; END IF;
  
  IF v_total_count > 0 THEN
    v_total_pages := ceil(v_total_count::numeric / p_page_size::numeric);
  END IF;

  RETURN jsonb_build_object(
    'rows', v_rows,
    'total_count', v_total_count,
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', v_total_pages,
    'summary', '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

REVOKE ALL ON FUNCTION public.get_announcements(text, text, text, text, boolean, text, text, text, integer, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcements(text, text, text, text, boolean, text, text, text, integer, integer, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
