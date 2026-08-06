-- Phase 1 & 2 & 3: Secure Backend RPCs & pg_cron

-- Drop insecure function
DROP FUNCTION IF EXISTS public.get_my_announcement_summary(uuid);

-- Secure version
CREATE OR REPLACE FUNCTION public.get_my_announcement_summary()
RETURNS jsonb AS $$
DECLARE
  v_uid uuid;
  v_total int := 0;
  v_unread int := 0;
  v_read int := 0;
  v_important int := 0;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  WITH matching_announcements AS (
    SELECT a.id, a.priority,
           EXISTS(SELECT 1 FROM public.announcement_reads ar WHERE ar.announcement_id = a.id AND ar.intern_id = v_uid) as is_read
    FROM public.announcements a
    WHERE a.status = 'published'
      AND a.deleted_at IS NULL
      AND public.intern_matches_announcement_target(a.id, v_uid)
  )
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE NOT is_read) as unread,
    COUNT(*) FILTER (WHERE is_read) as read,
    COUNT(*) FILTER (WHERE priority IN ('important', 'urgent')) as important
  INTO v_total, v_unread, v_read, v_important
  FROM matching_announcements;

  RETURN json_build_object(
    'total', v_total,
    'unread', v_unread,
    'read', v_read,
    'important', v_important
  )::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Notification Table (since it didn't exist)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Internal function to fan out notifications
CREATE OR REPLACE FUNCTION public.notify_announcement_targets(p_announcement_id UUID, p_title TEXT, p_type TEXT)
RETURNS void AS $$
DECLARE
  v_intern_id UUID;
BEGIN
  -- We simply insert for any active intern that matches
  FOR v_intern_id IN 
    SELECT p.id FROM public.profiles p 
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'intern'
    WHERE p.account_status = 'active' AND p.onboarding_status = 'completed'
      AND public.intern_matches_announcement_target(p_announcement_id, p.id)
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, reference_id)
    VALUES (v_intern_id, p_title, 'A new announcement has been published.', p_type, p_announcement_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- publish_announcement
CREATE OR REPLACE FUNCTION public.publish_announcement(p_id UUID)
RETURNS void AS $$
DECLARE
  v_uid UUID;
  v_role TEXT;
  v_announcement RECORD;
BEGIN
  v_uid := auth.uid();
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = v_uid;
  
  SELECT * INTO v_announcement FROM public.announcements WHERE id = p_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Announcement not found';
  END IF;

  IF v_role = 'admin' AND v_announcement.author_id != v_uid THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_announcement.status = 'published' THEN
    RETURN;
  END IF;

  UPDATE public.announcements
  SET status = 'published', published_at = NOW()
  WHERE id = p_id;

  INSERT INTO public.announcement_audit_logs (announcement_id, action, performed_by, reason)
  VALUES (p_id, 'publish', v_uid, 'Published manually');

  PERFORM public.notify_announcement_targets(p_id, v_announcement.title, 'announcement_published');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- scheduler
CREATE OR REPLACE FUNCTION public.process_scheduled_announcements()
RETURNS void AS $$
DECLARE
  v_rec RECORD;
BEGIN
  -- Publish scheduled announcements
  FOR v_rec IN 
    SELECT id, title FROM public.announcements 
    WHERE status = 'scheduled' AND scheduled_at <= NOW() AND deleted_at IS NULL
  LOOP
    UPDATE public.announcements
    SET status = 'published', published_at = NOW()
    WHERE id = v_rec.id;
    
    INSERT INTO public.announcement_audit_logs (announcement_id, action, reason)
    VALUES (v_rec.id, 'publish', 'Scheduled trigger');
    
    PERFORM public.notify_announcement_targets(v_rec.id, v_rec.title, 'announcement_published_scheduled');
  END LOOP;

  -- Expire old announcements
  UPDATE public.announcements
  SET status = 'expired'
  WHERE status = 'published'
    AND expires_at <= NOW()
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Set up pg_cron (will error if extension is not available but that is fine for reporting)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule('process_scheduled_announcements', '*/5 * * * *', 'SELECT public.process_scheduled_announcements()');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available';
END
$$;
