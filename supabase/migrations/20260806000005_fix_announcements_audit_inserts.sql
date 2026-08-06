-- ==============================================================================
-- FIX ANNOUNCEMENT AUDIT LOG INSERTS
-- ==============================================================================

-- 1. Canonical create_announcement
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

  INSERT INTO public.announcement_audit_logs (announcement_id, actor_id, action, metadata)
  VALUES (
    v_id, 
    v_uid, 
    'create', 
    jsonb_build_object('reason', 'Announcement drafted')
  );

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;
REVOKE ALL ON FUNCTION public.create_announcement(text, text, text, text, text[], jsonb, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_announcement(text, text, text, text, text[], jsonb, timestamptz, timestamptz) TO authenticated;


-- ==============================================================================
-- 2. Canonical update_announcement
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

  INSERT INTO public.announcement_audit_logs (announcement_id, actor_id, action, metadata)
  VALUES (
    p_id, 
    v_uid, 
    'update', 
    jsonb_build_object('reason', 'Announcement updated')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;
REVOKE ALL ON FUNCTION public.update_announcement(uuid, text, text, text, text, text[], jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_announcement(uuid, text, text, text, text, text[], jsonb) TO authenticated;


-- ==============================================================================
-- 3. Status transition RPCs
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.publish_announcement(p_id UUID) RETURNS void AS $$
DECLARE
  v_uid UUID;
  v_role TEXT;
  v_announcement RECORD;
  v_previous_status TEXT;
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
  
  v_previous_status := v_announcement.status;

  UPDATE public.announcements
  SET status = 'published', published_at = NOW(), updated_at = NOW()
  WHERE id = p_id;

  INSERT INTO public.announcement_audit_logs (announcement_id, actor_id, action, metadata)
  VALUES (
    p_id, 
    v_uid, 
    'publish', 
    jsonb_build_object(
      'reason', 'Announcement published',
      'previous_status', v_previous_status,
      'new_status', 'published'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;
REVOKE ALL ON FUNCTION public.publish_announcement(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_announcement(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.archive_announcement(p_id UUID) RETURNS void AS $$
DECLARE
  v_uid UUID;
  v_role TEXT;
  v_announcement RECORD;
  v_previous_status TEXT;
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
  
  v_previous_status := v_announcement.status;

  UPDATE public.announcements
  SET status = 'archived', updated_at = NOW(), archived_at = NOW()
  WHERE id = p_id;

  INSERT INTO public.announcement_audit_logs (announcement_id, actor_id, action, metadata)
  VALUES (
    p_id, 
    v_uid, 
    'archive', 
    jsonb_build_object(
      'reason', 'Announcement archived',
      'previous_status', v_previous_status,
      'new_status', 'archived'
    )
  );
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

  INSERT INTO public.announcement_audit_logs (announcement_id, actor_id, action, metadata)
  VALUES (
    p_id, 
    v_uid, 
    'delete', 
    jsonb_build_object('reason', 'Announcement deleted')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;
REVOKE ALL ON FUNCTION public.delete_announcement(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_announcement(uuid) TO authenticated;

-- ==============================================================================
-- 4. Reload Schema Notification
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
