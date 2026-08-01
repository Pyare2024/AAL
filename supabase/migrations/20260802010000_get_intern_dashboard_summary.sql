-- Migration: Create get_intern_dashboard_summary RPC for Phase 5 Module 1
CREATE OR REPLACE FUNCTION public.get_intern_dashboard_summary()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_joining_date TIMESTAMPTZ;
  v_total_sessions INT := 0;
  v_attended_sessions INT := 0;
  v_actionable_tasks JSONB;
  v_announcements JSONB;
  v_leaderboard_rank INT := 0;
  v_user_points INT := 0;
  v_top_interns JSONB;
  v_admin_names TEXT[];
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;

  -- 1. Fetch Joining Date
  SELECT created_at INTO v_joining_date FROM public.profiles WHERE id = v_uid;

  -- 2. Compute Canonical Attendance Stats (Excluding inactive sessions)
  SELECT COUNT(s.id) INTO v_total_sessions
  FROM public.attendance_sessions s
  WHERE s.attendance_date >= COALESCE(v_joining_date::date, CURRENT_DATE) AND s.is_active = true;

  SELECT COUNT(r.id) INTO v_attended_sessions
  FROM public.attendance_records r
  JOIN public.attendance_sessions s ON r.session_id = s.id
  WHERE r.intern_id = v_uid AND r.status IN ('present', 'late');

  -- 3. Actionable Pending Work Items (draft / resubmission_required)
  SELECT jsonb_agg(to_jsonb(t)) INTO v_actionable_tasks
  FROM (
    SELECT id, title, description, due_at, status
    FROM public.pending_work_items
    WHERE assigned_to = v_uid AND status IN ('draft', 'resubmission_required')
    ORDER BY due_at ASC LIMIT 3
  ) t;

  -- 4. Recent Announcements (Recent Alerts)
  SELECT jsonb_agg(to_jsonb(a)) INTO v_announcements
  FROM (
    SELECT id, title, content, created_at
    FROM public.announcements
    WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC LIMIT 3
  ) a;

  -- 5. DB-Side Leaderboard Ranking (Window Function)
  WITH aggregated_points AS (
    SELECT 
      p.id AS intern_id,
      p.full_name,
      COALESCE(SUM(lp.points), 0) AS total_points,
      RANK() OVER (ORDER BY COALESCE(SUM(lp.points), 0) DESC) AS rank
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id AND ur.role = 'intern'
    LEFT JOIN public.leaderboard_points lp ON p.id = lp.intern_id
    GROUP BY p.id, p.full_name
  )
  SELECT rank, total_points INTO v_leaderboard_rank, v_user_points
  FROM aggregated_points WHERE intern_id = v_uid;

  SELECT jsonb_agg(to_jsonb(top)) INTO v_top_interns
  FROM (
    SELECT full_name, total_points, rank
    FROM (
      SELECT 
        p.full_name,
        COALESCE(SUM(lp.points), 0) AS total_points,
        RANK() OVER (ORDER BY COALESCE(SUM(lp.points), 0) DESC) AS rank
      FROM public.profiles p
      JOIN public.user_roles ur ON p.id = ur.user_id AND ur.role = 'intern'
      LEFT JOIN public.leaderboard_points lp ON p.id = lp.intern_id
      GROUP BY p.id, p.full_name
    ) sub
    ORDER BY rank ASC LIMIT 3
  ) top;

  -- 6. Formatted Assigned Admin Names
  SELECT ARRAY_AGG(p.full_name) INTO v_admin_names
  FROM public.admin_problem_statements aps
  JOIN public.profiles p ON aps.admin_id = p.id
  JOIN public.profiles intern_prof ON aps.problem_statement_id = intern_prof.problem_statement_id
  WHERE intern_prof.id = v_uid;

  RETURN jsonb_build_object(
    'authenticated', true,
    'attendance', jsonb_build_object(
      'attended', v_attended_sessions,
      'total', v_total_sessions,
      'rate', CASE WHEN v_total_sessions > 0 THEN ROUND((v_attended_sessions::numeric / v_total_sessions::numeric) * 100) ELSE 100 END
    ),
    'actionable_tasks', COALESCE(v_actionable_tasks, '[]'::jsonb),
    'announcements', COALESCE(v_announcements, '[]'::jsonb),
    'leaderboard', jsonb_build_object(
      'user_rank', COALESCE(v_leaderboard_rank, 1),
      'user_points', COALESCE(v_user_points, 0),
      'top_interns', COALESCE(v_top_interns, '[]'::jsonb)
    ),
    'assigned_admins', COALESCE(v_admin_names, ARRAY[]::TEXT[])
  );
END;
$$;
