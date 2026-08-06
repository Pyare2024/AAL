-- ==============================================================================
-- 9. SCHEDULED PUBLISHING & EXPIRY RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.process_scheduled_announcements()
RETURNS void AS $$
BEGIN
  -- Publish scheduled announcements
  UPDATE public.announcements
  SET status = 'published',
      published_at = NOW()
  WHERE status = 'scheduled'
    AND scheduled_at <= NOW()
    AND deleted_at IS NULL;

  -- Expire old announcements
  UPDATE public.announcements
  SET status = 'expired'
  WHERE status = 'published'
    AND expires_at <= NOW()
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
