-- ==============================================================================
-- SAFE ENUM CREATION
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'feedback_category'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.feedback_category AS ENUM (
      'platform_issue',
      'program_suggestion',
      'academic_query',
      'mentor_complaint',
      'other'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'feedback_priority'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.feedback_priority AS ENUM (
      'low',
      'normal',
      'high',
      'critical'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'feedback_status'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.feedback_status AS ENUM (
      'new',
      'in_progress',
      'awaiting_reply',
      'escalated',
      'resolved',
      'closed'
    );
  END IF;
END $$;

-- ==============================================================================
-- TABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.feedback_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category public.feedback_category NOT NULL DEFAULT 'other',
  priority public.feedback_priority NOT NULL DEFAULT 'normal',
  status public.feedback_status NOT NULL DEFAULT 'new',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_complaint BOOLEAN NOT NULL DEFAULT FALSE,
  complaint_target_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_rating INT CHECK (resolution_rating >= 1 AND resolution_rating <= 5)
);

CREATE TABLE IF NOT EXISTS public.feedback_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.feedback_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.feedback_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.feedback_tickets(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.feedback_messages(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feedback_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_attachments ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RPC: Backend Access Evaluation
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.can_access_feedback_ticket(p_ticket_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role app_role;
  v_ticket public.feedback_tickets;
  v_is_assigned_intern BOOLEAN;
BEGIN
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = p_user_id;
  IF v_role = 'super_admin' THEN RETURN TRUE; END IF;

  SELECT * INTO v_ticket FROM public.feedback_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF v_role = 'intern' THEN
    RETURN v_ticket.author_id = p_user_id;
  END IF;

  IF v_role = 'admin' THEN
    -- Complaint handling: admins cannot view complaints against themselves unless assigned by super admin explicitly
    IF v_ticket.is_complaint AND v_ticket.complaint_target_admin_id = p_user_id AND v_ticket.assigned_admin_id != p_user_id THEN
      RETURN FALSE;
    END IF;

    -- Directly assigned?
    IF v_ticket.assigned_admin_id = p_user_id THEN RETURN TRUE; END IF;
    
    -- Is author in the admin's problem statement?
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.admin_problem_statements aps ON aps.problem_statement_id = p.problem_statement_id
      WHERE p.id = v_ticket.author_id AND aps.admin_id = p_user_id
    ) INTO v_is_assigned_intern;
    
    RETURN v_is_assigned_intern;
  END IF;

  RETURN FALSE;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;
-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- feedback_tickets

DROP POLICY IF EXISTS "Users can view accessible tickets"
ON public.feedback_tickets;

CREATE POLICY "Users can view accessible tickets"
ON public.feedback_tickets
FOR SELECT
TO authenticated
USING (
    public.can_access_feedback_ticket(id, auth.uid())
);

DROP POLICY IF EXISTS "Interns can create tickets"
ON public.feedback_tickets;
CREATE POLICY "Interns can create tickets" ON public.feedback_tickets
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'intern');

-- feedback_messages
DROP POLICY IF EXISTS "Users can view accessible messages"
ON public.feedback_messages;
CREATE POLICY "Users can view accessible messages" ON public.feedback_messages
  FOR SELECT TO authenticated
  USING (
    public.can_access_feedback_ticket(ticket_id, auth.uid()) 
    AND (
      NOT is_internal_note 
      OR (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
    )
  );
DROP POLICY IF EXISTS "Users can create messages"
ON public.feedback_messages;
CREATE POLICY "Users can create messages" ON public.feedback_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_feedback_ticket(ticket_id, auth.uid())
    AND author_id = auth.uid()
  );

-- feedback_attachments
DROP POLICY IF EXISTS "Users can view accessible attachments"
ON public.feedback_attachments;
CREATE POLICY "Users can view accessible attachments" ON public.feedback_attachments
  FOR SELECT TO authenticated
  USING (public.can_access_feedback_ticket(ticket_id, auth.uid()));
DROP POLICY IF EXISTS "Users can upload attachments"
ON public.feedback_attachments;
CREATE POLICY "Users can upload attachments" ON public.feedback_attachments
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_feedback_ticket(ticket_id, auth.uid()));

-- ==============================================================================
-- RPC: Get Feedback Summary
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_feedback_summary()
RETURNS JSONB AS $$
DECLARE
  v_uid UUID;
  v_role app_role;
  v_total INT;
  v_pending INT;
  v_resolved INT;
  v_critical INT;
  v_escalated INT;
BEGIN
  v_uid := auth.uid();
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;

  IF v_role = 'intern' THEN
    SELECT COUNT(*) INTO v_total FROM public.feedback_tickets WHERE author_id = v_uid;
    SELECT COUNT(*) INTO v_pending FROM public.feedback_tickets WHERE author_id = v_uid AND status = 'awaiting_reply';
    SELECT COUNT(*) INTO v_resolved FROM public.feedback_tickets WHERE author_id = v_uid AND status = 'resolved';
    RETURN jsonb_build_object('total', v_total, 'pending', v_pending, 'resolved', v_resolved);
  ELSIF v_role = 'admin' THEN
    SELECT COUNT(*) INTO v_total FROM public.feedback_tickets t WHERE public.can_access_feedback_ticket(t.id, v_uid);
    SELECT COUNT(*) INTO v_pending FROM public.feedback_tickets t WHERE public.can_access_feedback_ticket(t.id, v_uid) AND t.status IN ('new', 'awaiting_reply');
    SELECT COUNT(*) INTO v_resolved FROM public.feedback_tickets t WHERE public.can_access_feedback_ticket(t.id, v_uid) AND t.status = 'resolved';
    SELECT COUNT(*) INTO v_critical FROM public.feedback_tickets t WHERE public.can_access_feedback_ticket(t.id, v_uid) AND t.priority = 'critical';
    RETURN jsonb_build_object('total', v_total, 'pending', v_pending, 'resolved', v_resolved, 'critical', v_critical);
  ELSE
    SELECT COUNT(*) INTO v_total FROM public.feedback_tickets;
    SELECT COUNT(*) INTO v_pending FROM public.feedback_tickets WHERE status IN ('new', 'awaiting_reply');
    SELECT COUNT(*) INTO v_resolved FROM public.feedback_tickets WHERE status = 'resolved';
    SELECT COUNT(*) INTO v_critical FROM public.feedback_tickets WHERE priority = 'critical';
    SELECT COUNT(*) INTO v_escalated FROM public.feedback_tickets WHERE status = 'escalated';
    RETURN jsonb_build_object('total', v_total, 'pending', v_pending, 'resolved', v_resolved, 'critical', v_critical, 'escalated', v_escalated);
    END IF;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;


REVOKE ALL ON FUNCTION public.can_access_feedback_ticket(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_feedback_ticket(UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.get_feedback_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_feedback_summary() TO authenticated;