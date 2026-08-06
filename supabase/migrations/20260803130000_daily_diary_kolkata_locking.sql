-- ==============================================================================
-- MIGRATION: Refine Daily Diary RPCs for Single Plain-Text Summary
-- Description: Updates save_daily_diary and update_daily_diary to accept a single
--              plain-text summary (p_diary_text / work_summary) and enforce Asia/Kolkata date locking.
-- ==============================================================================

-- Ensure UNIQUE constraint on (intern_id, entry_date)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_intern_entry_date'
  ) THEN
    ALTER TABLE public.daily_diary_entries
      ADD CONSTRAINT unique_intern_entry_date UNIQUE (intern_id, entry_date);
  END IF;
END $$;

-- 1. SECURE RPC: save_daily_diary (Single plain-text diary_text input)
CREATE OR REPLACE FUNCTION public.save_daily_diary(
  p_diary_text TEXT,
  p_save_type TEXT DEFAULT 'submitted'
) RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_today_ist DATE := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;
  v_existing public.daily_diary_entries%ROWTYPE;
  v_id UUID;
  v_now TIMESTAMPTZ := NOW();
  v_status public.submission_status := 'submitted';
  v_trimmed_text TEXT := TRIM(p_diary_text);
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Authentication required.');
  END IF;

  -- Validate length
  IF LENGTH(v_trimmed_text) < 20 THEN
    RETURN jsonb_build_object('success', false, 'code', 'TOO_SHORT', 'message', 'Daily diary summary must be at least 20 characters.');
  END IF;

  IF LENGTH(v_trimmed_text) > 3000 THEN
    RETURN jsonb_build_object('success', false, 'code', 'TOO_LONG', 'message', 'Daily diary summary cannot exceed 3000 characters.');
  END IF;

  IF p_save_type = 'draft' THEN
    v_status := 'draft';
  END IF;

  -- Check existing entry for today in Asia/Kolkata
  SELECT * INTO v_existing FROM public.daily_diary_entries WHERE intern_id = v_uid AND entry_date = v_today_ist;

  IF v_existing.id IS NOT NULL THEN
    -- Verify entry is from today
    IF v_existing.entry_date <> v_today_ist THEN
      RETURN jsonb_build_object(
        'success', false, 
        'code', 'DIARY_LOCKED', 
        'message', 'Previous-day diary entries cannot be edited.'
      );
    END IF;

    -- Update single plain-text summary
    UPDATE public.daily_diary_entries
    SET
      work_summary = v_trimmed_text,
      status = v_status,
      updated_at = v_now
    WHERE id = v_existing.id;

    RETURN jsonb_build_object(
      'success', true,
      'code', 'UPDATED',
      'diary_id', v_existing.id,
      'status', v_status,
      'diary_date', v_today_ist,
      'message', CASE WHEN v_status = 'draft' THEN 'Today''s diary draft has been saved.' ELSE 'Today''s diary has been submitted successfully.' END
    );
  ELSE
    -- Insert single plain-text summary for today
    INSERT INTO public.daily_diary_entries (
      intern_id,
      entry_date,
      work_summary,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_uid,
      v_today_ist,
      v_trimmed_text,
      v_status,
      v_now,
      v_now
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object(
      'success', true,
      'code', 'CREATED',
      'diary_id', v_id,
      'status', v_status,
      'diary_date', v_today_ist,
      'message', CASE WHEN v_status = 'draft' THEN 'Today''s diary draft has been saved.' ELSE 'Today''s diary has been submitted successfully.' END
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
