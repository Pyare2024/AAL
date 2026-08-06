-- ==============================================================================
-- FIX PROCESS SCHEDULED ANNOUNCEMENTS AUDIT
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.process_scheduled_announcements()
RETURNS void AS $$
DECLARE
  v_rec RECORD;
BEGIN
  -- Publish scheduled announcements
  FOR v_rec IN 
    SELECT id, title, author_id, scheduled_at 
    FROM public.announcements 
    WHERE status = 'scheduled' 
      AND scheduled_at IS NOT NULL
      AND scheduled_at <= NOW() 
      AND deleted_at IS NULL
      AND archived_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
  LOOP
    UPDATE public.announcements
    SET status = 'published', 
        published_at = COALESCE(published_at, NOW()),
        updated_at = NOW()
    WHERE id = v_rec.id;
    
    INSERT INTO public.announcement_audit_logs (
      announcement_id,
      actor_id,
      action,
      metadata
    )
    VALUES (
      v_rec.id,
      v_rec.author_id,
      'publish',
      jsonb_build_object(
        'reason', 'Scheduled trigger',
        'trigger', 'pg_cron',
        'scheduled_at', v_rec.scheduled_at,
        'published_at', NOW()
      )
    );
    
    PERFORM public.notify_announcement_targets(v_rec.id, v_rec.title, 'announcement_published_scheduled');
  END LOOP;

  -- Expire old announcements
  UPDATE public.announcements
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'published'
    AND expires_at <= NOW()
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.process_scheduled_announcements() FROM PUBLIC;
-- Cannot grant to authenticated as this is typically run by cron, but we will leave grants alone or grant to postgres
-- The user didn't specify the exact GRANT for this, but we'll include it just in case if it's meant to be executable by authenticated or admin
GRANT EXECUTE ON FUNCTION public.process_scheduled_announcements() TO authenticated;

NOTIFY pgrst, 'reload schema';
