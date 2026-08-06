-- ==============================================================================
-- ANNOUNCEMENTS VISIBILITY RULES
-- ==============================================================================

-- 1. Helper: user_matches_announcement_target
CREATE OR REPLACE FUNCTION public.user_matches_announcement_target(p_announcement_id UUID, p_user_id UUID)
RETURNS boolean AS $$
DECLARE
  v_role TEXT;
  v_profile public.profiles;
BEGIN
  -- Get user role
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = p_user_id;
  
  IF v_role = 'super_admin' THEN
    RETURN true;
  END IF;

  -- If there's an 'all_interns' target, it matches for Admins and Interns
  IF EXISTS (SELECT 1 FROM public.announcement_targets WHERE announcement_id = p_announcement_id AND target_type = 'all_interns') THEN
    RETURN true;
  END IF;

  IF v_role = 'admin' THEN
    IF EXISTS (
      SELECT 1 FROM public.announcement_targets at2
      JOIN public.admin_problem_statements aps ON aps.problem_statement_id::text = at2.target_reference_id
      WHERE at2.announcement_id = p_announcement_id 
        AND at2.target_type = 'problem_statement' 
        AND aps.admin_id = p_user_id
    ) THEN
      RETURN true;
    END IF;
  ELSIF v_role = 'intern' THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    IF EXISTS (
      SELECT 1 FROM public.announcement_targets at2
      WHERE at2.announcement_id = p_announcement_id 
        AND at2.target_type = 'problem_statement' 
        AND at2.target_reference_id = v_profile.problem_statement_id::text
    ) THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.user_matches_announcement_target(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_matches_announcement_target(UUID, UUID) TO authenticated;

-- 2. Legacy wrapper
CREATE OR REPLACE FUNCTION public.intern_matches_announcement_target(p_announcement_id UUID, p_intern_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN public.user_matches_announcement_target(p_announcement_id, p_intern_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.intern_matches_announcement_target(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intern_matches_announcement_target(UUID, UUID) TO authenticated;


-- 3. Strict Validation Helper
CREATE OR REPLACE FUNCTION public.validate_announcement_targets(
  p_author_id UUID,
  p_targets JSONB
)
RETURNS void AS $$
DECLARE
  v_role text;
  v_target RECORD;
  v_has_access boolean;
  v_target_ref_uuid UUID;
BEGIN
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = p_author_id;
  
  IF v_role = 'super_admin' THEN
    -- Super Admin can target all_interns and any problem statement, but let's ensure problem statements exist if passed.
    IF p_targets IS NOT NULL AND jsonb_typeof(p_targets) = 'array' THEN
      FOR v_target IN SELECT * FROM jsonb_array_elements(p_targets) LOOP
        IF v_target.value->>'target_type' = 'problem_statement' THEN
          BEGIN
            v_target_ref_uuid := (v_target.value->>'target_reference_id')::uuid;
          EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'target_reference_id must be a valid UUID for problem_statement';
          END;
          
          SELECT EXISTS (SELECT 1 FROM public.problem_statements WHERE id = v_target_ref_uuid) INTO v_has_access;
          IF NOT v_has_access THEN
            RAISE EXCEPTION 'Referenced problem statement does not exist';
          END IF;
        END IF;
      END LOOP;
    END IF;
    RETURN;
  END IF;

  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Only Admins or Super Admins can define targets.';
  END IF;

  -- Admin validation
  IF p_targets IS NOT NULL AND jsonb_typeof(p_targets) = 'array' THEN
    FOR v_target IN SELECT * FROM jsonb_array_elements(p_targets) LOOP
      IF v_target.value->>'target_type' = 'all_interns' THEN
        RAISE EXCEPTION 'Admin cannot target all_interns';
      END IF;

      IF v_target.value->>'target_type' = 'problem_statement' THEN
        BEGIN
          v_target_ref_uuid := (v_target.value->>'target_reference_id')::uuid;
        EXCEPTION WHEN OTHERS THEN
          RAISE EXCEPTION 'target_reference_id must be a valid UUID for problem_statement';
        END;

        -- Verify problem statement exists AND admin is assigned
        SELECT EXISTS (
          SELECT 1 FROM public.admin_problem_statements aps
          JOIN public.problem_statements ps ON ps.id = aps.problem_statement_id
          WHERE aps.admin_id = p_author_id AND aps.problem_statement_id = v_target_ref_uuid
        ) INTO v_has_access;
        IF NOT v_has_access THEN
          RAISE EXCEPTION 'Unauthorized or invalid Problem Statement target';
        END IF;
      END IF;

      IF v_target.value->>'target_type' IN ('selected_intern', 'college', 'city', 'batch') THEN
        RAISE EXCEPTION 'Admin cannot target % directly without explicit scoped permissions.', v_target.value->>'target_type';
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

REVOKE ALL ON FUNCTION public.validate_announcement_targets(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_announcement_targets(UUID, JSONB) TO authenticated;


-- 4. Shared Visibility Condition (Used as a WHERE clause macro in get_announcements and summary)
-- Instead of a dynamic SQL or string, we will embed the identical logic in both functions to ensure they match exactly.
-- The exact visibility condition for a given announcement row "a" and user "v_uid" with role "v_role" is:
-- 
-- (v_role = 'super_admin')
-- OR (v_role = 'admin' AND (
--      a.author_id = v_uid 
--      OR (a.status = 'published' AND a.deleted_at IS NULL AND a.archived_at IS NULL AND (a.published_at IS NULL OR a.published_at <= NOW()) AND (a.scheduled_at IS NULL OR a.scheduled_at <= NOW()) AND (a.expires_at IS NULL OR a.expires_at > NOW()) AND public.user_matches_announcement_target(a.id, v_uid))
-- ))
-- OR (v_role = 'intern' AND (
--      a.status = 'published' AND a.deleted_at IS NULL AND a.archived_at IS NULL AND (a.published_at IS NULL OR a.published_at <= NOW()) AND (a.scheduled_at IS NULL OR a.scheduled_at <= NOW()) AND (a.expires_at IS NULL OR a.expires_at > NOW()) AND public.user_matches_announcement_target(a.id, v_uid)
-- ))


-- 5. Canonical get_announcements
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
) RETURNS jsonb AS $$
DECLARE
  v_uid uuid;
  v_role text;
  v_offset integer;
  v_result jsonb;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = v_uid;

  -- Validation
  IF p_page < 1 THEN p_page := 1; END IF;
  IF p_page_size < 1 THEN p_page_size := 20; END IF;
  IF p_page_size > 100 THEN p_page_size := 100; END IF;
  v_offset := (p_page - 1) * p_page_size;

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
      AND (
        (v_role = 'super_admin')
        OR
        (v_role = 'admin' AND (
          a.author_id = v_uid 
          OR (
            a.status = 'published' 
            AND a.archived_at IS NULL 
            AND (a.published_at IS NULL OR a.published_at <= NOW()) 
            AND (a.scheduled_at IS NULL OR a.scheduled_at <= NOW()) 
            AND (a.expires_at IS NULL OR a.expires_at > NOW()) 
            AND public.user_matches_announcement_target(a.id, v_uid)
          )
        ))
        OR
        (v_role = 'intern' AND (
          a.status = 'published' 
          AND a.archived_at IS NULL 
          AND (a.published_at IS NULL OR a.published_at <= NOW()) 
          AND (a.scheduled_at IS NULL OR a.scheduled_at <= NOW()) 
          AND (a.expires_at IS NULL OR a.expires_at > NOW()) 
          AND public.user_matches_announcement_target(a.id, v_uid)
        ))
      )
      AND (p_search_text IS NULL OR p_search_text = '' OR a.title ILIKE '%' || p_search_text || '%' OR a.content ILIKE '%' || p_search_text || '%')
      AND (p_status IS NULL OR p_status = '' OR a.status = p_status)
      AND (p_priority IS NULL OR p_priority = '' OR a.priority = p_priority)
      AND (p_is_pinned IS NULL OR a.is_pinned = p_is_pinned)
      AND (p_problem_statement_id IS NULL OR p_problem_statement_id = '' OR p_problem_statement_id = 'all' OR EXISTS(SELECT 1 FROM public.announcement_targets at2 WHERE at2.announcement_id = a.id AND at2.target_type = 'problem_statement' AND at2.target_reference_id = p_problem_statement_id))
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
      CASE WHEN COALESCE(lower(p_sort_by), 'published_at') = 'priority' AND lower(p_sort_direction) = 'asc' THEN priority END ASC,
      CASE WHEN COALESCE(lower(p_sort_by), 'published_at') = 'priority' AND lower(p_sort_direction) = 'desc' THEN priority END DESC,
      CASE WHEN COALESCE(lower(p_sort_by), 'published_at') = 'status' AND lower(p_sort_direction) = 'asc' THEN status END ASC,
      CASE WHEN COALESCE(lower(p_sort_by), 'published_at') = 'status' AND lower(p_sort_direction) = 'desc' THEN status END DESC,
      CASE WHEN COALESCE(lower(p_sort_by), 'published_at') = 'title' AND lower(p_sort_direction) = 'asc' THEN title END ASC,
      CASE WHEN COALESCE(lower(p_sort_by), 'published_at') = 'title' AND lower(p_sort_direction) = 'desc' THEN title END DESC,
      CASE WHEN COALESCE(lower(p_sort_by), 'published_at') = 'published_at' AND lower(p_sort_direction) = 'asc' THEN published_at END ASC,
      CASE WHEN COALESCE(lower(p_sort_by), 'published_at') = 'published_at' AND (lower(p_sort_direction) = 'desc' OR lower(p_sort_direction) IS NULL) THEN published_at END DESC NULLS LAST,
      CASE WHEN COALESCE(lower(p_sort_by), 'published_at') = 'created_at' AND lower(p_sort_direction) = 'asc' THEN created_at END ASC,
      CASE WHEN COALESCE(lower(p_sort_by), 'published_at') = 'created_at' AND lower(p_sort_direction) = 'desc' THEN created_at END DESC,
      CASE WHEN COALESCE(lower(p_sort_by), 'published_at') = 'updated_at' AND lower(p_sort_direction) = 'asc' THEN updated_at END ASC,
      CASE WHEN COALESCE(lower(p_sort_by), 'published_at') = 'updated_at' AND lower(p_sort_direction) = 'desc' THEN updated_at END DESC
    LIMIT p_page_size
    OFFSET v_offset
  )
  SELECT jsonb_build_object(
    'rows', COALESCE((
      SELECT jsonb_agg(
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
      ) FROM paged p
    ), '[]'::jsonb),
    'total_count', COALESCE((SELECT total FROM counted), 0),
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', CASE WHEN COALESCE((SELECT total FROM counted), 0) > 0 THEN ceil(COALESCE((SELECT total FROM counted), 0)::numeric / p_page_size::numeric) ELSE 0 END,
    'summary', '{}'::jsonb
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

REVOKE ALL ON FUNCTION public.get_announcements(text, text, text, text, boolean, text, text, text, integer, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcements(text, text, text, text, boolean, text, text, text, integer, integer, text, text) TO authenticated;


-- 6. Canonical get_announcement_summary
CREATE OR REPLACE FUNCTION public.get_announcement_summary()
RETURNS jsonb AS $$
DECLARE
  v_uid uuid;
  v_role text;
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
  
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = v_uid;

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
      AND (
        (v_role = 'super_admin')
        OR
        (v_role = 'admin' AND (
          a.author_id = v_uid 
          OR (
            a.status = 'published' 
            AND a.archived_at IS NULL 
            AND (a.published_at IS NULL OR a.published_at <= NOW()) 
            AND (a.scheduled_at IS NULL OR a.scheduled_at <= NOW()) 
            AND (a.expires_at IS NULL OR a.expires_at > NOW()) 
            AND public.user_matches_announcement_target(a.id, v_uid)
          )
        ))
      );
      
    RETURN jsonb_build_object('total', v_total, 'important', v_important, 'pinned', v_pinned, 'published', v_published, 'scheduled', v_scheduled, 'drafts', v_drafts, 'archived', v_archived, 'expired', v_expired);
  ELSE
    WITH matching AS (
      SELECT 
        a.id, 
        a.priority, 
        EXISTS(SELECT 1 FROM public.announcement_reads ar WHERE ar.announcement_id = a.id AND ar.intern_id = v_uid) as is_read
      FROM public.announcements a
      WHERE a.deleted_at IS NULL
        AND a.status = 'published' 
        AND a.archived_at IS NULL 
        AND (a.published_at IS NULL OR a.published_at <= NOW()) 
        AND (a.scheduled_at IS NULL OR a.scheduled_at <= NOW()) 
        AND (a.expires_at IS NULL OR a.expires_at > NOW()) 
        AND public.user_matches_announcement_target(a.id, v_uid)
    )
    SELECT 
      COUNT(*), 
      COUNT(*) FILTER (WHERE NOT is_read), 
      COUNT(*) FILTER (WHERE is_read), 
      COUNT(*) FILTER (WHERE priority IN ('important', 'urgent'))
    INTO v_total, v_unread, v_read, v_important
    FROM matching;

    RETURN jsonb_build_object('total', v_total, 'unread', v_unread, 'read', v_read, 'important', v_important);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

REVOKE ALL ON FUNCTION public.get_announcement_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcement_summary() TO authenticated;

NOTIFY pgrst, 'reload schema';
