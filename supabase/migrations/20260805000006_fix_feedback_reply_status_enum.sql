-- ==============================================================================
-- MIGRATION: Fix Feedback Reply Status Enum Error
-- Description: Casts the CASE expression strings to public.feedback_status
--              to resolve the text-to-enum assignment type error in PostgreSQL.
-- ==============================================================================

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
      status = (CASE 
                 WHEN status = 'resolved' THEN 'resolved'
                 WHEN v_role = 'intern' THEN 'new'
                 ELSE 'awaiting_reply'
               END)::public.feedback_status
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
