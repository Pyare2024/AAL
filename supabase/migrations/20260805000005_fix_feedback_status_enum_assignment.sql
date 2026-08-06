-- ==============================================================================
-- MIGRATION: Fix Feedback Status Enum Assignment Error
-- Description: Explicitly casts the status assignment to public.feedback_status
--              to resolve the text-to-enum assignment type error in PostgreSQL.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_feedback_status(
  p_ticket_id UUID,
  p_new_status public.feedback_status
)
RETURNS jsonb AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_ticket public.feedback_tickets%ROWTYPE;
  v_can_access BOOLEAN;
  v_result jsonb;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated';
  END IF;

  -- 1. Get User Role
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'User role not found';
  END IF;

  -- 2. Verify Access
  v_can_access := public.can_access_feedback_ticket(p_ticket_id, v_uid);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Access denied to this ticket';
  END IF;

  -- 3. Get Current Ticket
  SELECT * INTO v_ticket FROM public.feedback_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  -- 4. Validate Transitions
  IF v_role = 'intern' THEN
    RAISE EXCEPTION 'Interns cannot modify ticket status directly';
  END IF;

  -- Admins & Super Admins
  IF v_role IN ('admin', 'super_admin') THEN
    IF v_ticket.status = 'new' AND p_new_status NOT IN ('in_progress', 'escalated', 'resolved', 'closed') THEN
      RAISE EXCEPTION 'Invalid transition from new to %', p_new_status;
    END IF;
    
    IF v_ticket.status = 'in_progress' AND p_new_status NOT IN ('awaiting_reply', 'resolved', 'escalated', 'closed') THEN
      RAISE EXCEPTION 'Invalid transition from in_progress to %', p_new_status;
    END IF;

    IF v_ticket.status = 'awaiting_reply' AND p_new_status NOT IN ('in_progress', 'resolved', 'escalated', 'closed') THEN
      RAISE EXCEPTION 'Invalid transition from awaiting_reply to %', p_new_status;
    END IF;

    IF v_ticket.status = 'escalated' AND p_new_status NOT IN ('in_progress', 'resolved', 'closed') THEN
      RAISE EXCEPTION 'Invalid transition from escalated to %', p_new_status;
    END IF;

    IF v_ticket.status = 'resolved' AND p_new_status NOT IN ('closed', 'in_progress') THEN
      RAISE EXCEPTION 'Invalid transition from resolved to %', p_new_status;
    END IF;
    
    IF v_ticket.status = 'closed' THEN
      RAISE EXCEPTION 'Cannot change status of a closed ticket';
    END IF;
  END IF;

  -- 5. Perform Update
  UPDATE public.feedback_tickets
  SET 
    status = p_new_status::public.feedback_status,
    updated_at = NOW(),
    resolved_at = CASE WHEN p_new_status = 'resolved' THEN NOW() ELSE resolved_at END
  WHERE id = p_ticket_id
  RETURNING * INTO v_ticket;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Update failed: no row affected';
  END IF;

  -- Return updated row as JSON
  SELECT row_to_json(v_ticket)::jsonb INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

REVOKE ALL ON FUNCTION public.update_feedback_status(UUID, public.feedback_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_feedback_status(UUID, public.feedback_status) TO authenticated;
NOTIFY pgrst, 'reload schema';
