-- ==============================================================================
-- PHASE 2: ANNOUNCEMENT BACKEND INTEGRATION
-- ==============================================================================

-- 1. SUMMARY RPC
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

  IF v_role = 'super_admin' THEN
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'published') as published,
      COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
      COUNT(*) FILTER (WHERE status = 'expired') as expired,
      COUNT(*) FILTER (WHERE status = 'archived') as archived
    INTO v_total, v_published, v_scheduled, v_expired, v_archived
    FROM public.announcements
    WHERE deleted_at IS NULL;

    RETURN json_build_object(
      'total', v_total,
      'published', v_published,
      'scheduled', v_scheduled,
      'expired', v_expired,
      'archived', v_archived
    )::jsonb;

  ELSIF v_role = 'admin' THEN
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'published') as published,
      COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
      COUNT(*) FILTER (WHERE status = 'draft') as drafts,
      COUNT(*) FILTER (WHERE status = 'archived') as archived
    INTO v_total, v_published, v_scheduled, v_drafts, v_archived
    FROM public.announcements a
    WHERE deleted_at IS NULL 
    AND (
      a.author_id = v_uid 
      OR EXISTS (
        SELECT 1 FROM public.announcement_targets at2 
        JOIN public.admin_problem_statements aps ON aps.problem_statement_id::text = at2.target_reference_id
        WHERE at2.announcement_id = a.id AND aps.admin_id = v_uid AND at2.target_type = 'problem_statement'
      )
      OR a.status IN ('published', 'archived')
    );

    RETURN json_build_object(
      'total', v_total,
      'published', v_published,
      'scheduled', v_scheduled,
      'drafts', v_drafts,
      'archived', v_archived
    )::jsonb;

  ELSE
    -- Intern Role
    WITH matching_announcements AS (
      SELECT a.id, a.priority, a.is_pinned,
             EXISTS(SELECT 1 FROM public.announcement_reads ar WHERE ar.announcement_id = a.id AND ar.intern_id = v_uid) as is_read
      FROM public.announcements a
      WHERE a.status = 'published'
        AND a.deleted_at IS NULL
        AND public.intern_matches_announcement_target(a.id, v_uid)
    )
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE NOT is_read) as unread,
      COUNT(*) FILTER (WHERE is_read) as read,
      COUNT(*) FILTER (WHERE priority IN ('important', 'urgent')) as important,
      COUNT(*) FILTER (WHERE is_pinned) as pinned
    INTO v_total, v_unread, v_read, v_important, v_pinned
    FROM matching_announcements;

    RETURN json_build_object(
      'total', v_total,
      'unread', v_unread,
      'read', v_read,
      'important', v_important,
      'pinned', v_pinned
    )::jsonb;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.get_announcement_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcement_summary() TO authenticated;

-- 2. CREATE ATTACHMENT
CREATE OR REPLACE FUNCTION public.create_announcement_attachment(
  p_announcement_id uuid,
  p_attachment_type text,
  p_storage_path text,
  p_file_name text,
  p_mime_type text,
  p_file_size bigint
)
RETURNS jsonb AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_author_id UUID;
  v_attachment_id UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;

  SELECT author_id INTO v_author_id FROM public.announcements WHERE id = p_announcement_id AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Announcement not found'; END IF;
  
  -- Must be super admin or the authoring admin
  IF v_role != 'super_admin' AND (v_role != 'admin' OR v_author_id != v_uid) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Ensure storage path is scoped to this announcement to prevent path traversal
  IF p_storage_path NOT LIKE p_announcement_id::text || '/%' THEN
    RAISE EXCEPTION 'Invalid storage path';
  END IF;

  INSERT INTO public.announcement_attachments (
    announcement_id, attachment_type, storage_path, file_name, mime_type, file_size
  ) VALUES (
    p_announcement_id, p_attachment_type, p_storage_path, p_file_name, p_mime_type, p_file_size
  ) RETURNING id INTO v_attachment_id;

  RETURN jsonb_build_object('id', v_attachment_id, 'storage_path', p_storage_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.create_announcement_attachment(UUID, TEXT, TEXT, TEXT, TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_announcement_attachment(UUID, TEXT, TEXT, TEXT, TEXT, BIGINT) TO authenticated;

-- 3. DELETE ATTACHMENT
CREATE OR REPLACE FUNCTION public.delete_announcement_attachment(p_attachment_id uuid)
RETURNS void AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_author_id UUID;
  v_announcement_id UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;

  SELECT announcement_id INTO v_announcement_id FROM public.announcement_attachments WHERE id = p_attachment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attachment not found'; END IF;

  SELECT author_id INTO v_author_id FROM public.announcements WHERE id = v_announcement_id;
  
  IF v_role != 'super_admin' AND (v_role != 'admin' OR v_author_id != v_uid) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.announcement_attachments WHERE id = p_attachment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.delete_announcement_attachment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_announcement_attachment(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
