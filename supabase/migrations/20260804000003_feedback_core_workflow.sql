-- ==============================================================================
-- FEEDBACK CORE WORKFLOW MIGRATION
-- ==============================================================================

-- 1. Create idempotency protection and ticket numbers
ALTER TABLE public.feedback_tickets 
  ADD COLUMN IF NOT EXISTS ticket_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS request_id UUID UNIQUE;

CREATE SEQUENCE IF NOT EXISTS public.feedback_ticket_number_seq START 1;

-- 2. Create unread state table
CREATE TABLE IF NOT EXISTS public.feedback_ticket_reads (
  ticket_id UUID NOT NULL REFERENCES public.feedback_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ticket_id, user_id)
);

-- Enable RLS on feedback_ticket_reads
ALTER TABLE public.feedback_ticket_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own read states" ON public.feedback_ticket_reads;
CREATE POLICY "Users can view own read states" ON public.feedback_ticket_reads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own read states" ON public.feedback_ticket_reads;
CREATE POLICY "Users can manage own read states" ON public.feedback_ticket_reads
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. get_feedback_tickets RPC
CREATE OR REPLACE FUNCTION public.get_feedback_tickets(
  p_search_text text default null,
  p_status text default null,
  p_priority text default null,
  p_type text default null,
  p_category text default null,
  p_problem_statement_id uuid default null,
  p_assigned_to_me boolean default null,
  p_date_from date default null,
  p_date_to date default null,
  p_page integer default 1,
  p_page_size integer default 20
)
RETURNS jsonb AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_offset INT;
  v_total INT;
  v_result JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  v_offset := (p_page - 1) * p_page_size;

  WITH filtered_tickets AS (
    SELECT t.*,
           p.full_name as author_name,
           r.role as author_role,
           a.full_name as assigned_admin_name
    FROM public.feedback_tickets t
    JOIN public.profiles p ON t.author_id = p.id
    JOIN public.user_roles r ON p.id = r.user_id
    LEFT JOIN public.profiles a ON t.assigned_admin_id = a.id
    WHERE public.can_access_feedback_ticket(t.id, v_uid)
      AND (p_search_text IS NULL OR t.title ILIKE '%' || p_search_text || '%' OR t.ticket_number ILIKE '%' || p_search_text || '%' OR p.full_name ILIKE '%' || p_search_text || '%')
      AND (p_status IS NULL OR t.status::text = p_status)
      AND (p_priority IS NULL OR t.priority::text = p_priority)
      AND (p_category IS NULL OR t.category::text = p_category)
      AND (p_assigned_to_me IS NULL OR NOT p_assigned_to_me OR t.assigned_admin_id = v_uid)
      AND (p_date_from IS NULL OR t.created_at >= p_date_from)
      AND (p_date_to IS NULL OR t.created_at <= (p_date_to + interval '1 day'))
  ),
  total_count AS (
    SELECT count(*) as total FROM filtered_tickets
  ),
  paginated_tickets AS (
    SELECT ft.*,
           (SELECT count(*) FROM public.feedback_messages m WHERE m.ticket_id = ft.id AND (NOT m.is_internal_note OR v_role IN ('admin', 'super_admin'))) as message_count,
           (SELECT max(created_at) FROM public.feedback_messages m WHERE m.ticket_id = ft.id AND (NOT m.is_internal_note OR v_role IN ('admin', 'super_admin'))) as last_reply_at,
           (SELECT count(*) FROM public.feedback_messages m 
            LEFT JOIN public.feedback_ticket_reads tr ON tr.ticket_id = m.ticket_id AND tr.user_id = v_uid
            WHERE m.ticket_id = ft.id 
              AND (NOT m.is_internal_note OR v_role IN ('admin', 'super_admin'))
              AND m.author_id != v_uid
              AND (tr.last_read_at IS NULL OR m.created_at > tr.last_read_at)
           ) as unread_reply_count
    FROM filtered_tickets ft
    ORDER BY COALESCE(ft.updated_at, ft.created_at) DESC
    LIMIT p_page_size OFFSET v_offset
  )
  SELECT jsonb_build_object(
    'rows', COALESCE((SELECT jsonb_agg(row_to_json(pt)) FROM paginated_tickets pt), '[]'::jsonb),
    'total_count', (SELECT total FROM total_count),
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', CEIL((SELECT total FROM total_count)::numeric / p_page_size)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_feedback_tickets FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_feedback_tickets TO authenticated;

-- 4. create_feedback_ticket RPC
CREATE OR REPLACE FUNCTION public.create_feedback_ticket(
  p_category text,
  p_priority text,
  p_title text,
  p_description text,
  p_is_complaint boolean default false,
  p_complaint_target_admin_id uuid default null,
  p_request_id uuid default null
)
RETURNS jsonb AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_ticket_id UUID;
  v_ticket_number TEXT;
  v_result JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  
  -- Idempotency check
  IF p_request_id IS NOT NULL THEN
    SELECT row_to_json(t)::jsonb INTO v_result 
    FROM public.feedback_tickets t 
    WHERE request_id = p_request_id AND author_id = v_uid;
    
    IF v_result IS NOT NULL THEN
      RETURN v_result;
    END IF;
  END IF;

  v_ticket_number := 'FB-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.feedback_ticket_number_seq')::text, 5, '0');

  INSERT INTO public.feedback_tickets (
    author_id, category, priority, status, title, description, 
    is_complaint, complaint_target_admin_id, ticket_number, request_id
  ) VALUES (
    v_uid, p_category::public.feedback_category, p_priority::public.feedback_priority, 'new', p_title, p_description,
    p_is_complaint, p_complaint_target_admin_id, v_ticket_number, p_request_id
  ) RETURNING id INTO v_ticket_id;

  -- Create initial message from description
  INSERT INTO public.feedback_messages (
    ticket_id, author_id, content, is_internal_note
  ) VALUES (
    v_ticket_id, v_uid, p_description, false
  );

  -- Set read state for author
  INSERT INTO public.feedback_ticket_reads (ticket_id, user_id, last_read_at)
  VALUES (v_ticket_id, v_uid, NOW())
  ON CONFLICT (ticket_id, user_id) DO UPDATE SET last_read_at = NOW();

  SELECT row_to_json(t)::jsonb INTO v_result FROM public.feedback_tickets t WHERE id = v_ticket_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.create_feedback_ticket FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_feedback_ticket TO authenticated;


-- 5. get_feedback_ticket_by_id RPC
CREATE OR REPLACE FUNCTION public.get_feedback_ticket_by_id(
  p_ticket_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_uid UUID;
  v_result JSONB;
BEGIN
  v_uid := auth.uid();
  IF NOT public.can_access_feedback_ticket(p_ticket_id, v_uid) THEN
    RAISE EXCEPTION 'Not authorized or not found';
  END IF;

  SELECT row_to_json(t)::jsonb INTO v_result
  FROM (
    SELECT ft.*,
           p.full_name as author_name,
           r.role as author_role,
           a.full_name as assigned_admin_name
    FROM public.feedback_tickets ft
    JOIN public.profiles p ON ft.author_id = p.id
    JOIN public.user_roles r ON p.id = r.user_id
    LEFT JOIN public.profiles a ON ft.assigned_admin_id = a.id
    WHERE ft.id = p_ticket_id
  ) t;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_feedback_ticket_by_id FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_feedback_ticket_by_id TO authenticated;

-- 6. get_feedback_messages RPC
CREATE OR REPLACE FUNCTION public.get_feedback_messages(
  p_ticket_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_result JSONB;
BEGIN
  v_uid := auth.uid();
  IF NOT public.can_access_feedback_ticket(p_ticket_id, v_uid) THEN
    RAISE EXCEPTION 'Not authorized or not found';
  END IF;

  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;

  -- Update read state
  INSERT INTO public.feedback_ticket_reads (ticket_id, user_id, last_read_at)
  VALUES (p_ticket_id, v_uid, NOW())
  ON CONFLICT (ticket_id, user_id) DO UPDATE SET last_read_at = NOW();

  SELECT COALESCE(jsonb_agg(row_to_json(m)), '[]'::jsonb) INTO v_result
  FROM (
    SELECT fm.*,
           p.full_name as author_name,
           r.role as author_role
    FROM public.feedback_messages fm
    JOIN public.profiles p ON fm.author_id = p.id
    JOIN public.user_roles r ON p.id = r.user_id
    WHERE fm.ticket_id = p_ticket_id
      AND (NOT fm.is_internal_note OR v_role IN ('admin', 'super_admin'))
    ORDER BY fm.created_at ASC
  ) m;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_feedback_messages FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_feedback_messages TO authenticated;

-- 7. add_feedback_reply RPC
CREATE OR REPLACE FUNCTION public.add_feedback_reply(
  p_ticket_id uuid,
  p_content text,
  p_is_internal boolean default false
)
RETURNS jsonb AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_msg_id UUID;
  v_result JSONB;
BEGIN
  v_uid := auth.uid();
  IF NOT public.can_access_feedback_ticket(p_ticket_id, v_uid) THEN
    RAISE EXCEPTION 'Not authorized or not found';
  END IF;

  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  
  IF p_is_internal AND v_role = 'intern' THEN
    RAISE EXCEPTION 'Interns cannot create internal notes';
  END IF;

  INSERT INTO public.feedback_messages (ticket_id, author_id, content, is_internal_note)
  VALUES (p_ticket_id, v_uid, p_content, p_is_internal)
  RETURNING id INTO v_msg_id;

  UPDATE public.feedback_tickets 
  SET updated_at = NOW(),
      status = CASE 
                 WHEN status = 'resolved' THEN 'resolved'
                 WHEN v_role = 'intern' THEN 'new'
                 ELSE 'awaiting_reply'
               END
  WHERE id = p_ticket_id;

  -- Update read state for sender
  INSERT INTO public.feedback_ticket_reads (ticket_id, user_id, last_read_at)
  VALUES (p_ticket_id, v_uid, NOW())
  ON CONFLICT (ticket_id, user_id) DO UPDATE SET last_read_at = NOW();

  SELECT row_to_json(m)::jsonb INTO v_result
  FROM (
    SELECT fm.*,
           p.full_name as author_name,
           r.role as author_role
    FROM public.feedback_messages fm
    JOIN public.profiles p ON fm.author_id = p.id
    JOIN public.user_roles r ON p.id = r.user_id
    WHERE fm.id = v_msg_id
  ) m;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.add_feedback_reply FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_feedback_reply TO authenticated;

NOTIFY pgrst, 'reload schema';
