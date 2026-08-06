CREATE OR REPLACE FUNCTION public.get_community_author_profiles(p_user_ids UUID[])
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  profile_photo_url TEXT,
  role TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT 
    p.id, 
    p.full_name, 
    p.profile_photo_url,
    COALESCE(r.role, 'intern'::public.app_role)::text as role
  FROM public.profiles p
  LEFT JOIN public.user_roles r ON r.user_id = p.id
  WHERE p.id = ANY(p_user_ids);
$$;

REVOKE ALL ON FUNCTION public.get_community_author_profiles(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_community_author_profiles(UUID[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
