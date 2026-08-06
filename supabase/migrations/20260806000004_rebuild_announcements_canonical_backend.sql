-- ==============================================================================
-- REBUILD ANNOUNCEMENTS CANONICAL BACKEND
-- ==============================================================================

-- 1. Drop ALL prior overloads to ensure a completely clean slate for exact signatures
DROP FUNCTION IF EXISTS public.create_announcement(text, text, text, text, text[], jsonb, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.create_announcement(text, text, text, text, timestamptz, timestamptz, text[], jsonb);
DROP FUNCTION IF EXISTS public.update_announcement(uuid, text, text, text, text, text[], jsonb);
DROP FUNCTION IF EXISTS public.publish_announcement(uuid);
DROP FUNCTION IF EXISTS public.archive_announcement(uuid);
DROP FUNCTION IF EXISTS public.schedule_announcement(uuid);
DROP FUNCTION IF EXISTS public.delete_announcement(uuid);
DROP FUNCTION IF EXISTS public.duplicate_announcement(uuid);

-- Important: dropping all get_announcements variations
DROP FUNCTION IF EXISTS public.get_announcements(text, text, text, text, boolean, uuid, date, date, integer, integer, text, text);
DROP FUNCTION IF EXISTS public.get_announcements(text, text, text, text, boolean, text, text, text, integer, integer, text, text);

-- ==============================================================================
-- 2. Validate Targets Helper (Secured)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.validate_announcement_targets(
  p_author_id UUID,
  p_targets JSONB
)
RETURNS void AS $$
DECLARE
  v_role text;
  v_target RECORD;
  v_has_access boolean;
BEGIN
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = p_author_id;
  
  IF v_role = 'super_admin' THEN
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
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;
REVOKE ALL ON FUNCTION public.validate_announcement_targets(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_announcement_targets(UUID, JSONB) TO authenticated;

-- ==============================================================================
-- 3. Canonical get_announcements
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

  -- Safe Sorting handled within CTE logic via simple string checks

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
          OR EXISTS (
            SELECT 1 FROM public.announcement_targets at2 
            JOIN public.admin_problem_statements aps ON aps.problem_statement_id::text = at2.target_reference_id
            WHERE at2.announcement_id = a.id AND aps.admin_id = v_uid AND at2.target_type = 'problem_statement'
          )
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


-- ==============================================================================
-- 4. Canonical create_announcement
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_announcement(
    p_title text,
    p_summary text,
    p_content text,
    p_priority text,
    p_tags text[],
    p_targets jsonb,
    p_scheduled_at timestamptz DEFAULT NULL,
    p_expires_at timestamptz DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_uid uuid;
  v_role text;
  v_id uuid;
  v_status text;
  v_priority text;
  v_target jsonb;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  IF v_role NOT IN ('admin', 'super_admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;

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

  PERFORM public.validate_announcement_targets(v_uid, p_targets);

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

  INSERT INTO public.announcement_audit_logs (announcement_id, actor_id, action, reason)
  VALUES (v_id, v_uid, 'create', 'Announcement drafted');

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;
REVOKE ALL ON FUNCTION public.create_announcement(text, text, text, text, text[], jsonb, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_announcement(text, text, text, text, text[], jsonb, timestamptz, timestamptz) TO authenticated;


-- ==============================================================================
-- 5. Canonical update_announcement
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.update_announcement(
  p_id uuid,
  p_title text,
  p_summary text,
  p_content text,
  p_priority text,
  p_tags text[],
  p_targets jsonb
) RETURNS void AS $$
DECLARE
  v_uid UUID;
  v_role text;
  v_author_id UUID;
  v_target RECORD;
  v_priority text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = v_uid;

  SELECT author_id INTO v_author_id FROM public.announcements WHERE id = p_id AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Announcement not found'; END IF;
  
  IF v_role != 'super_admin' AND (v_role != 'admin' OR v_author_id != v_uid) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM public.validate_announcement_targets(v_uid, p_targets);

  v_priority := COALESCE(p_priority, 'normal');
  IF v_priority NOT IN ('normal', 'important', 'urgent') THEN
    v_priority := 'normal';
  END IF;

  UPDATE public.announcements
  SET title = p_title, summary = p_summary, content = p_content, priority = v_priority, tags = COALESCE(p_tags, '{}'::text[]), updated_at = NOW()
  WHERE id = p_id;

  DELETE FROM public.announcement_targets WHERE announcement_id = p_id;
  
  IF p_targets IS NOT NULL AND jsonb_typeof(p_targets) = 'array' THEN
    FOR v_target IN SELECT * FROM jsonb_array_elements(p_targets) LOOP
      INSERT INTO public.announcement_targets (announcement_id, target_type, target_reference_id, created_by)
      VALUES (p_id, v_target.value->>'target_type', v_target.value->>'target_reference_id', v_uid);
    END LOOP;
  END IF;

  INSERT INTO public.announcement_audit_logs (announcement_id, actor_id, action, reason)
  VALUES (p_id, v_uid, 'update', 'Announcement updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;
REVOKE ALL ON FUNCTION public.update_announcement(uuid, text, text, text, text, text[], jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_announcement(uuid, text, text, text, text, text[], jsonb) TO authenticated;


-- ==============================================================================
-- 6. Status transition RPCs
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.publish_announcement(p_id UUID) RETURNS void AS $$
DECLARE
  v_uid UUID;
  v_role TEXT;
  v_announcement RECORD;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  
  SELECT * INTO v_announcement FROM public.announcements WHERE id = p_id AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Announcement not found'; END IF;

  IF v_role != 'super_admin' AND (v_role != 'admin' OR v_announcement.author_id != v_uid) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_announcement.status = 'published' THEN
    RETURN;
  END IF;
  
  IF v_announcement.status NOT IN ('draft', 'scheduled') THEN
    RAISE EXCEPTION 'Invalid status transition: cannot publish from %', v_announcement.status;
  END IF;

  UPDATE public.announcements
  SET status = 'published', published_at = NOW(), updated_at = NOW()
  WHERE id = p_id;

  INSERT INTO public.announcement_audit_logs (announcement_id, actor_id, action, reason)
  VALUES (p_id, v_uid, 'publish', 'Published manually');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;
REVOKE ALL ON FUNCTION public.publish_announcement(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_announcement(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.archive_announcement(p_id UUID) RETURNS void AS $$
DECLARE
  v_uid UUID;
  v_role TEXT;
  v_announcement RECORD;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  
  SELECT * INTO v_announcement FROM public.announcements WHERE id = p_id AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Announcement not found'; END IF;

  IF v_role != 'super_admin' AND (v_role != 'admin' OR v_announcement.author_id != v_uid) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_announcement.status = 'archived' THEN
    RETURN;
  END IF;

  UPDATE public.announcements
  SET status = 'archived', updated_at = NOW(), archived_at = NOW()
  WHERE id = p_id;

  INSERT INTO public.announcement_audit_logs (announcement_id, actor_id, action, reason)
  VALUES (p_id, v_uid, 'archive', 'Archived manually');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;
REVOKE ALL ON FUNCTION public.archive_announcement(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_announcement(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_announcement(p_id UUID) RETURNS void AS $$
DECLARE
  v_uid UUID;
  v_role TEXT;
  v_announcement RECORD;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  
  SELECT * INTO v_announcement FROM public.announcements WHERE id = p_id AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Announcement not found'; END IF;

  IF v_role != 'super_admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admins can delete announcements permanently.';
  END IF;

  UPDATE public.announcements
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_id;

  INSERT INTO public.announcement_audit_logs (announcement_id, actor_id, action, reason)
  VALUES (p_id, v_uid, 'delete', 'Deleted manually');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;
REVOKE ALL ON FUNCTION public.delete_announcement(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_announcement(uuid) TO authenticated;


-- ==============================================================================
-- 7. Reload Schema Notification
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
