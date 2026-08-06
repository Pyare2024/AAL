-- ==============================================================================
-- MIGRATION: Daily Diary Deletion Rule & Audit Trail (Asia/Kolkata Server Time)
-- ==============================================================================

-- 1. Create audit log table for daily diary deletion
CREATE TABLE IF NOT EXISTS public.daily_diary_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID,
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT NOT NULL DEFAULT 'User deleted today''s diary'
);

ALTER TABLE public.daily_diary_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access daily_diary_audit_logs"
  ON public.daily_diary_audit_logs FOR ALL TO authenticated
  USING (public.is_super_admin());

-- 2. SECURE RPC: delete_daily_diary (Strictly allows deletion only when entry_date is today in Asia/Kolkata)
CREATE OR REPLACE FUNCTION public.delete_daily_diary(
  p_diary_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_today_ist DATE := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;
  v_rec public.daily_diary_entries%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Authentication required.');
  END IF;

  SELECT * INTO v_rec FROM public.daily_diary_entries WHERE id = p_diary_id AND intern_id = v_uid;

  IF v_rec.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Diary entry not found.');
  END IF;

  -- Server Date Comparison Rule (Asia/Kolkata)
  IF v_rec.entry_date <> v_today_ist THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'DELETE_NOT_ALLOWED',
      'message', 'Only today''s diary can be deleted. Previous-day entries are permanent records.'
    );
  END IF;

  -- Store Audit Trail
  INSERT INTO public.daily_diary_audit_logs (
    diary_id,
    intern_id,
    entry_date,
    deleted_by,
    deleted_at,
    reason
  ) VALUES (
    v_rec.id,
    v_uid,
    v_rec.entry_date,
    v_uid,
    v_now,
    'User deleted today''s diary'
  );

  -- Perform Delete
  DELETE FROM public.daily_diary_entries WHERE id = v_rec.id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'DELETED',
    'diary_id', v_rec.id,
    'message', 'Today''s daily diary has been deleted.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
