-- Migration: 20260803110000_refine_intern_dashboard_summary.sql
-- Description: Refines get_intern_dashboard_summary RPC for safe, canonical dashboard aggregates.

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
  v_present_days INT := 0;
  v_late_days INT := 0;
  v_absent_days INT := 0;
  v_leave_days INT := 0;
  v_today_status TEXT := 'not_marked';
  v_actionable_tasks JSONB;
  v_due_today INT := 0;
  v_overdue INT := 0;
  v_resubmission INT := 0;
  v_announcements JSONB;
  v_leaderboard_rank INT := 0;
  v_user_points INT := 0;
  v_top_interns JSONB;
  v_admin_names TEXT[];
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;

  -- 1. Profile & Joining Date
  SELECT created_at INTO v_joining_date FROM public.profiles WHERE id = v_uid;

  -- 2. Canonical Attendance Calculation (Scoped to active sessions >= joining date)
  SELECT COUNT(s.id) INTO v_total_sessions
  FROM public.attendance_sessions s
  WHERE s.attendance_date >= COALESCE(v_joining_date::date, CURRENT_DATE)
    AND COALESCE(s.is_active, true) = true
    AND LOWER(COALESCE(s.status, 'live')) != 'cancelled';

  SELECT 
    COUNT(CASE WHEN r.status IN ('present', 'manual_present') THEN 1 END),
    COUNT(CASE WHEN r.status = 'late' THEN 1 END),
    COUNT(CASE WHEN r.status = 'absent' THEN 1 END),
    COUNT(CASE WHEN r.status = 'leave' THEN 1 END)
  INTO v_present_days, v_late_days, v_absent_days, v_leave_days
  FROM public.attendance_records r
  JOIN public.attendance_sessions s ON r.session_id = s.id
  WHERE r.intern_id = v_uid 
    AND s.attendance_date >= COALESCE(v_joining_date::date, CURRENT_DATE)
    AND LOWER(COALESCE(s.status, 'live')) != 'cancelled';

  v_attended_sessions := v_present_days + v_late_days;

  SELECT COALESCE(r.status, 'not_marked') INTO v_today_status
  FROM public.attendance_sessions s
  LEFT JOIN public.attendance_records r ON r.session_id = s.id AND r.intern_id = v_uid
  WHERE s.attendance_date = CURRENT_DATE AND COALESCE(s.is_active, true) = true
  ORDER BY s.created_at DESC LIMIT 1;

  -- 3. Actionable Pending Work Summary
  SELECT 
    COUNT(CASE WHEN due_at::date = CURRENT_DATE THEN 1 END),
    COUNT(CASE WHEN due_at < NOW() THEN 1 END),
    COUNT(CASE WHEN status = 'resubmission_required' THEN 1 END)
  INTO v_due_today, v_overdue, v_resubmission
  FROM public.pending_work_items
  WHERE assigned_to = v_uid AND status IN ('draft', 'resubmission_required');

  SELECT jsonb_agg(to_jsonb(t)) INTO v_actionable_tasks
  FROM (
    SELECT id, title, description, due_at, status, priority
    FROM public.pending_work_items
    WHERE assigned_to = v_uid AND status IN ('draft', 'resubmission_required')
    ORDER BY due_at ASC LIMIT 3
  ) t;

  -- 4. Recent Announcements
  SELECT jsonb_agg(to_jsonb(a)) INTO v_announcements
  FROM (
    SELECT id, title, content, created_at
    FROM public.announcements
    WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC LIMIT 3
  ) a;

  -- 5. DB-Side Leaderboard (Bounded window query, PII protected)
  WITH aggregated_points AS (
    SELECT 
      p.id AS intern_id,
      p.full_name,
      p.profile_photo_url AS avatar_url,
      COALESCE(SUM(lp.points), 0) AS total_points,
      RANK() OVER (ORDER BY COALESCE(SUM(lp.points), 0) DESC) AS rank
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id AND ur.role = 'intern'
    LEFT JOIN public.leaderboard_points lp ON p.id = lp.intern_id
    GROUP BY p.id, p.full_name, p.profile_photo_url
  )
  SELECT rank, total_points INTO v_leaderboard_rank, v_user_points
  FROM aggregated_points WHERE intern_id = v_uid;

  SELECT jsonb_agg(to_jsonb(top)) INTO v_top_interns
  FROM (
    SELECT full_name, avatar_url, total_points, rank
    FROM (
      SELECT 
        p.full_name,
        p.profile_photo_url AS avatar_url,
        COALESCE(SUM(lp.points), 0) AS total_points,
        RANK() OVER (ORDER BY COALESCE(SUM(lp.points), 0) DESC) AS rank
      FROM public.profiles p
      JOIN public.user_roles ur ON p.id = ur.user_id AND ur.role = 'intern'
      LEFT JOIN public.leaderboard_points lp ON p.id = lp.intern_id
      GROUP BY p.id, p.full_name, p.profile_photo_url
    ) sub
    ORDER BY rank ASC LIMIT 3
  ) top;

  -- 6. Formatted Verified Admin Assignments
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
      'rate', CASE WHEN v_total_sessions > 0 THEN ROUND((v_attended_sessions::numeric / v_total_sessions::numeric) * 100) ELSE 0 END,
      'present_days', v_present_days,
      'late_days', v_late_days,
      'absent_days', v_absent_days,
      'leave_days', v_leave_days,
      'today_status', COALESCE(v_today_status, 'not_marked'),
      'attendance_not_started', (v_total_sessions = 0)
    ),
    'actionable_tasks_summary', jsonb_build_object(
      'total_actionable', COALESCE(jsonb_array_length(v_actionable_tasks), 0),
      'due_today_count', v_due_today,
      'overdue_count', v_overdue,
      'resubmission_count', v_resubmission,
      'top_3', COALESCE(v_actionable_tasks, '[]'::jsonb)
    ),
    'announcements', COALESCE(v_announcements, '[]'::jsonb),
    'leaderboard', jsonb_build_object(
      'user_rank', COALESCE(v_leaderboard_rank, 1),
      'user_points', COALESCE(v_user_points, 0),
      'is_tied', (v_user_points = 0),
      'has_points', (v_user_points > 0),
      'top_interns', COALESCE(v_top_interns, '[]'::jsonb)
    ),
    'assigned_admins', COALESCE(v_admin_names, ARRAY[]::TEXT[])
  );
END;
$$;
