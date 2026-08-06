-- ==========================================
-- Phase 3 Admin Management RPCs
-- ==========================================

-- 1. get_announcement_read_analytics
CREATE OR REPLACE FUNCTION public.get_announcement_read_analytics(p_announcement_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_uid uuid;
  v_role text;
  v_has_access boolean;
  v_targeted_count integer := 0;
  v_read_count integer := 0;
  v_unread_count integer := 0;
  v_read_percentage numeric := 0;
  v_last_read_at timestamptz;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  
  -- Verify management access
  IF v_role = 'super_admin' THEN
    v_has_access := true;
  ELSIF v_role = 'admin' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = p_announcement_id AND a.author_id = v_uid
    ) OR EXISTS (
      SELECT 1 FROM public.announcement_targets t 
      JOIN public.admin_problem_statements aps ON aps.problem_statement_id::text = t.target_reference_id 
      WHERE t.announcement_id = p_announcement_id AND aps.admin_id = v_uid AND t.target_type = 'problem_statement'
    ) INTO v_has_access;
  ELSE
    v_has_access := false;
  END IF;

  IF NOT v_has_access THEN
    RAISE EXCEPTION 'Unauthorized to view analytics for this announcement';
  END IF;

  -- Calculate targeted intern count using deduplication
  SELECT count(distinct p.id) INTO v_targeted_count
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'intern' AND public.intern_matches_announcement_target(p_announcement_id, p.id);

  -- Read count & last read time
  SELECT count(distinct intern_id), max(read_at) INTO v_read_count, v_last_read_at
  FROM public.announcement_reads
  WHERE announcement_id = p_announcement_id;
  
  -- Prevent read count from exceeding targeted count due to targeting changes
  IF v_read_count > v_targeted_count THEN
    v_read_count := v_targeted_count;
  END IF;

  v_unread_count := GREATEST(0, v_targeted_count - v_read_count);
  
  IF v_targeted_count > 0 THEN
    v_read_percentage := ROUND((v_read_count::numeric / v_targeted_count::numeric) * 100, 2);
  ELSE
    v_read_percentage := 0;
  END IF;

  RETURN jsonb_build_object(
    'targeted_count', v_targeted_count,
    'read_count', v_read_count,
    'unread_count', v_unread_count,
    'read_percentage', v_read_percentage,
    'last_read_at', v_last_read_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_announcement_read_analytics(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcement_read_analytics(uuid) TO authenticated;

-- 2. duplicate_announcement
CREATE OR REPLACE FUNCTION public.duplicate_announcement(p_announcement_id uuid)
RETURNS uuid AS $$
DECLARE
  v_uid uuid;
  v_new_id uuid;
  v_original public.announcements%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_original FROM public.announcements WHERE id = p_announcement_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Announcement not found'; END IF;

  INSERT INTO public.announcements (
    title, summary, content, priority, tags, status, is_pinned, author_id
  ) VALUES (
    v_original.title || ' (Copy)', v_original.summary, v_original.content, 
    v_original.priority, v_original.tags, 'draft', false, v_uid
  ) RETURNING id INTO v_new_id;

  INSERT INTO public.announcement_targets (announcement_id, target_type, target_reference_id)
  SELECT v_new_id, target_type, target_reference_id
  FROM public.announcement_targets
  WHERE announcement_id = p_announcement_id;

  INSERT INTO public.announcement_audit_logs (announcement_id, actor_id, action, metadata)
  VALUES (v_new_id, v_uid, 'duplicated', jsonb_build_object('original_id', p_announcement_id));

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.duplicate_announcement(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.duplicate_announcement(uuid) TO authenticated;
