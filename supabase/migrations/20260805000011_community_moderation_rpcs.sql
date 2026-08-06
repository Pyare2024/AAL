CREATE OR REPLACE FUNCTION public.pin_community_post(p_post_id UUID, p_is_pinned BOOLEAN)
RETURNS public.community_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_role TEXT;
  v_post public.community_posts;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_role != 'super_admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only super admins can pin posts';
  END IF;

  UPDATE public.community_posts
  SET is_pinned = p_is_pinned,
      updated_at = NOW()
  WHERE id = p_post_id
  RETURNING * INTO v_post;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  RETURN v_post;
END;
$$;

REVOKE ALL ON FUNCTION public.pin_community_post(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pin_community_post(UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.hide_community_post(p_post_id UUID, p_is_hidden BOOLEAN)
RETURNS public.community_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_role TEXT;
  v_post public.community_posts;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_role != 'super_admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only super admins can hide posts';
  END IF;

  UPDATE public.community_posts
  SET is_hidden = p_is_hidden,
      updated_at = NOW()
  WHERE id = p_post_id
  RETURNING * INTO v_post;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  RETURN v_post;
END;
$$;

REVOKE ALL ON FUNCTION public.hide_community_post(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hide_community_post(UUID, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
