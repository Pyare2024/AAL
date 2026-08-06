-- ==============================================================================
-- SHARED LEADERBOARD RPCs AND DB INTEGRATION
-- ==============================================================================

-- 1. Helper function to mask email in SQL
CREATE OR REPLACE FUNCTION public.mask_email(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
  v_local TEXT;
  v_domain TEXT;
BEGIN
  IF p_email IS NULL OR p_email NOT LIKE '%@%' THEN
    RETURN '***@***.***';
  END IF;
  v_local := split_part(p_email, '@', 1);
  v_domain := split_part(p_email, '@', 2);
  IF length(v_local) <= 3 THEN
    RETURN '***@' || v_domain;
  ELSE
    RETURN substring(v_local from 1 for 3) || '***@' || v_domain;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- 2. Helper function to mask mobile in SQL
CREATE OR REPLACE FUNCTION public.mask_mobile(p_mobile TEXT)
RETURNS TEXT AS $$
DECLARE
  v_digits TEXT;
BEGIN
  IF p_mobile IS NULL THEN
    RETURN '******';
  END IF;
  v_digits := regexp_replace(p_mobile, '\D', '', 'g');
  IF length(v_digits) < 4 THEN
    RETURN repeat('*', greatest(6, length(v_digits)));
  ELSE
    RETURN repeat('*', length(v_digits) - 4) || right(v_digits, 4);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- 3. Filter options RPC
CREATE OR REPLACE FUNCTION public.get_leaderboard_filter_options()
RETURNS JSONB AS $$
DECLARE
  v_cities JSONB;
  v_problem_statements JSONB;
BEGIN
  -- Unique active intern cities
  SELECT jsonb_agg(city ORDER BY city)
  INTO v_cities
  FROM (
    SELECT DISTINCT p.city
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'intern'::app_role
      AND p.account_status = 'active'::account_status
      AND p.onboarding_status = 'completed'::onboarding_status
      AND p.city IS NOT NULL
      AND trim(p.city) != ''
  ) sub;

  -- Active problem statements
  SELECT jsonb_agg(jsonb_build_object('id', id, 'title', title) ORDER BY title)
  INTO v_problem_statements
  FROM public.problem_statements
  WHERE status = 'active'::account_status;

  RETURN jsonb_build_object(
    'cities', COALESCE(v_cities, '[]'::jsonb),
    'problem_statements', COALESCE(v_problem_statements, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Main Shared Leaderboard RPC
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_search_text TEXT DEFAULT '',
  p_city TEXT DEFAULT '',
  p_problem_statement_id TEXT DEFAULT '',
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 25,
  p_sort_by TEXT DEFAULT 'rank',
  p_sort_direction TEXT DEFAULT 'asc'
)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID;
  v_viewer_role app_role;
  v_search TEXT;
  v_offset INT;
  v_total_ranked INT;
  v_avg_score INT;
  v_top_performer_name TEXT := '—';
  v_top_performer_score INT := 0;
  v_my_rank INT;
  v_my_points INT;
  v_top3 JSONB := '[]'::jsonb;
  v_rows JSONB := '[]'::jsonb;
  v_filtered_total INT := 0;
BEGIN
  -- Authenticate viewer
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Resolve viewer role
  SELECT role INTO v_viewer_role FROM public.user_roles WHERE user_id = v_uid;
  IF v_viewer_role IS NULL THEN
    v_viewer_role := 'intern'::app_role;
  END IF;

  v_search := lower(trim(COALESCE(p_search_text, '')));
  v_offset := (greatest(1, p_page) - 1) * greatest(1, p_page_size);

  -- Temporary table of ranked active interns
  CREATE TEMP TABLE temp_ranked_interns ON COMMIT DROP AS
  WITH intern_points AS (
    SELECT 
      p.id AS intern_id,
      p.full_name,
      p.email,
      p.mobile,
      p.profile_photo_url,
      p.city,
      p.college_name,
      p.problem_statement_id,
      ps.title AS problem_statement_name,
      COALESCE(SUM(lp.points), 0)::INT AS total_points
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'intern'::app_role
    LEFT JOIN public.problem_statements ps ON ps.id = p.problem_statement_id
    LEFT JOIN public.leaderboard_points lp ON lp.intern_id = p.id
    WHERE p.account_status = 'active'::account_status
      AND p.onboarding_status = 'completed'::onboarding_status
    GROUP BY p.id, p.full_name, p.email, p.mobile, p.profile_photo_url, p.city, p.college_name, p.problem_statement_id, ps.title
  )
  SELECT 
    *,
    LEAST(100, ROUND((total_points::NUMERIC / 500.0) * 100))::INT AS overall_score,
    DENSE_RANK() OVER (ORDER BY total_points DESC, full_name ASC)::INT AS rank,
    'AAL-' || UPPER(SUBSTRING(intern_id::text FROM 1 FOR 8)) AS intern_code
  FROM intern_points;

  -- Summary Stats
  SELECT COUNT(*)::INT INTO v_total_ranked FROM temp_ranked_interns;
  
  IF v_total_ranked > 0 THEN
    SELECT COALESCE(ROUND(AVG(overall_score)), 0)::INT INTO v_avg_score FROM temp_ranked_interns;
    
    SELECT full_name, overall_score 
    INTO v_top_performer_name, v_top_performer_score
    FROM temp_ranked_interns 
    WHERE rank = 1 
    LIMIT 1;

    SELECT rank, total_points INTO v_my_rank, v_my_points
    FROM temp_ranked_interns
    WHERE intern_id = v_uid;

    -- Top 3 podium items (privacy masked according to viewer role)
    SELECT jsonb_agg(
      jsonb_build_object(
        'internId', intern_id,
        'rank', rank,
        'rankMovement', 'same',
        'rankMovementDelta', 0,
        'fullName', full_name,
        'internCode', intern_code,
        'email', CASE 
          WHEN v_viewer_role = 'super_admin' THEN email
          WHEN v_viewer_role = 'admin' AND public.admin_can_access_intern(intern_id) THEN email
          WHEN intern_id = v_uid THEN email
          ELSE public.mask_email(email)
        END,
        'emailMasked', public.mask_email(email),
        'mobile', CASE 
          WHEN v_viewer_role = 'super_admin' THEN mobile
          WHEN v_viewer_role = 'admin' AND public.admin_can_access_intern(intern_id) THEN mobile
          WHEN intern_id = v_uid THEN mobile
          ELSE public.mask_mobile(mobile)
        END,
        'mobileMasked', public.mask_mobile(mobile),
        'profilePhotoUrl', profile_photo_url,
        'city', COALESCE(city, ''),
        'collegeName', COALESCE(college_name, ''),
        'problemStatement', COALESCE(problem_statement_name, ''),
        'problemStatementId', COALESCE(problem_statement_id::text, ''),
        'totalPoints', total_points,
        'overallScore', overall_score,
        'attendanceScore', 0,
        'dailyDiaryScore', 0,
        'workScore', 0,
        'learningScore', 0,
        'innovationScore', 0,
        'communityScore', 0,
        'aiPostScore', 0,
        'bonusPoints', 0,
        'penaltyPoints', 0,
        'isSelf', (intern_id = v_uid),
        'isAssigned', CASE WHEN v_viewer_role = 'admin' THEN public.admin_can_access_intern(intern_id) ELSE false END
      ) ORDER BY rank ASC
    ) INTO v_top3
    FROM temp_ranked_interns
    WHERE rank <= 3;
  END IF;

  -- Filtered subset
  CREATE TEMP TABLE temp_filtered_interns ON COMMIT DROP AS
  SELECT *
  FROM temp_ranked_interns tri
  WHERE (
    p_city IS NULL OR p_city = '' OR p_city = 'all' OR tri.city = p_city
  )
  AND (
    p_problem_statement_id IS NULL OR p_problem_statement_id = '' OR p_problem_statement_id = 'all' 
    OR tri.problem_statement_id::text = p_problem_statement_id
  )
  AND (
    v_search = '' OR (
      lower(tri.full_name) LIKE '%' || v_search || '%' OR
      lower(tri.intern_code) LIKE '%' || v_search || '%' OR
      (
        CASE 
          WHEN v_viewer_role = 'super_admin' OR (v_viewer_role = 'admin' AND public.admin_can_access_intern(tri.intern_id)) OR tri.intern_id = v_uid 
          THEN lower(COALESCE(tri.email, '')) LIKE '%' || v_search || '%' OR regexp_replace(COALESCE(tri.mobile, ''), '\D', '', 'g') LIKE '%' || v_search || '%'
          ELSE lower(public.mask_email(tri.email)) LIKE '%' || v_search || '%' OR public.mask_mobile(tri.mobile) LIKE '%' || v_search || '%'
        END
      )
    )
  );

  SELECT COUNT(*)::INT INTO v_filtered_total FROM temp_filtered_interns;

  -- Paginated JSON Rows
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'internId', intern_id,
      'rank', rank,
      'rankMovement', 'same',
      'rankMovementDelta', 0,
      'fullName', full_name,
      'internCode', intern_code,
      'email', CASE 
        WHEN v_viewer_role = 'super_admin' THEN email
        WHEN v_viewer_role = 'admin' AND public.admin_can_access_intern(intern_id) THEN email
        WHEN intern_id = v_uid THEN email
        ELSE public.mask_email(email)
      END,
      'emailMasked', public.mask_email(email),
      'mobile', CASE 
        WHEN v_viewer_role = 'super_admin' THEN mobile
        WHEN v_viewer_role = 'admin' AND public.admin_can_access_intern(intern_id) THEN mobile
        WHEN intern_id = v_uid THEN mobile
        ELSE public.mask_mobile(mobile)
      END,
      'mobileMasked', public.mask_mobile(mobile),
      'profilePhotoUrl', profile_photo_url,
      'city', COALESCE(city, ''),
      'problemStatement', COALESCE(problem_statement_name, ''),
      'problemStatementId', COALESCE(problem_statement_id::text, ''),
      'totalPoints', total_points,
      'overallScore', overall_score,
      'attendanceScore', 0,
      'dailyDiaryScore', 0,
      'workScore', 0,
      'learningScore', 0,
      'innovationScore', 0,
      'communityScore', 0,
      'aiPostScore', 0,
      'bonusPoints', 0,
      'penaltyPoints', 0,
      'isSelf', (intern_id = v_uid),
      'isAssigned', CASE WHEN v_viewer_role = 'admin' THEN public.admin_can_access_intern(intern_id) ELSE false END
    )
    ORDER BY 
      CASE WHEN p_sort_direction = 'asc' AND p_sort_by = 'rank' THEN rank END ASC,
      CASE WHEN p_sort_direction = 'desc' AND p_sort_by = 'rank' THEN rank END DESC,
      CASE WHEN p_sort_direction = 'asc' AND p_sort_by = 'fullName' THEN full_name END ASC,
      CASE WHEN p_sort_direction = 'desc' AND p_sort_by = 'fullName' THEN full_name END DESC,
      CASE WHEN p_sort_direction = 'asc' AND p_sort_by = 'totalPoints' THEN total_points END ASC,
      CASE WHEN p_sort_direction = 'desc' AND p_sort_by = 'totalPoints' THEN total_points END DESC,
      CASE WHEN p_sort_direction = 'asc' AND p_sort_by = 'overallScore' THEN overall_score END ASC,
      CASE WHEN p_sort_direction = 'desc' AND p_sort_by = 'overallScore' THEN overall_score END DESC,
      rank ASC
  ), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT * FROM temp_filtered_interns
    OFFSET v_offset
    LIMIT p_page_size
  ) sub;

  RETURN jsonb_build_object(
    'rows', v_rows,
    'total', v_filtered_total,
    'summary', jsonb_build_object(
      'totalRanked', v_total_ranked,
      'topPerformerName', v_top_performer_name,
      'topPerformerScore', v_top_performer_score,
      'averageScore', COALESCE(v_avg_score, 0),
      'myRank', v_my_rank,
      'myPoints', v_my_points,
      'myMovement', 'same',
      'top3', COALESCE(v_top3, '[]'::jsonb)
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Detail RPC
CREATE OR REPLACE FUNCTION public.get_intern_leaderboard_details(
  p_intern_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID;
  v_viewer_role app_role;
  v_can_see_details BOOLEAN := FALSE;
  v_intern_rec RECORD;
  v_points_breakdown JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_viewer_role FROM public.user_roles WHERE user_id = v_uid;

  -- Determine authorization
  IF v_viewer_role = 'super_admin' OR v_uid = p_intern_id OR (v_viewer_role = 'admin' AND public.admin_can_access_intern(p_intern_id)) THEN
    v_can_see_details := TRUE;
  END IF;

  -- Get intern info
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.mobile,
    p.city,
    ps.title AS problem_statement
  INTO v_intern_rec
  FROM public.profiles p
  LEFT JOIN public.problem_statements ps ON ps.id = p.problem_statement_id
  WHERE p.id = p_intern_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intern not found';
  END IF;

  IF v_can_see_details THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', id,
      'points', points,
      'reason', reason,
      'sourceType', source_type,
      'createdAt', created_at
    ) ORDER BY created_at DESC), '[]'::jsonb)
    INTO v_points_breakdown
    FROM public.leaderboard_points
    WHERE intern_id = p_intern_id;
  END IF;

  RETURN jsonb_build_object(
    'canViewDetails', v_can_see_details,
    'internId', v_intern_rec.id,
    'fullName', v_intern_rec.full_name,
    'city', COALESCE(v_intern_rec.city, ''),
    'problemStatement', COALESCE(v_intern_rec.problem_statement, ''),
    'email', CASE WHEN v_can_see_details THEN v_intern_rec.email ELSE public.mask_email(v_intern_rec.email) END,
    'mobile', CASE WHEN v_can_see_details THEN v_intern_rec.mobile ELSE public.mask_mobile(v_intern_rec.mobile) END,
    'pointsBreakdown', COALESCE(v_points_breakdown, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
